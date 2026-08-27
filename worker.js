/**
 * Module: Cloudflare R2 presign Worker
 * Purpose: Authorize owner uploads and issue short-lived R2 PUT URLs
 * Used by: Dashboard slide and portfolio upload flows via VITE_R2_UPLOAD_ENDPOINT
 * Dependencies: Cloudflare Workers runtime, Supabase Auth user endpoint, R2 S3 signing secrets
 * Public functions: fetch(), createPresignedUrl()
 * Side effects: Reads Supabase Auth, signs upload URLs, and handles CORS preflight responses
 */
const ALLOWED_TYPES = new Set([
  'text/html',
  'application/pdf',
]);

function getAllowedOrigins(env) {
  const configuredOrigins = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const defaultOrigins = [
    'https://www.raydiansyah.com',
    'https://raydiansyah.com',
    'http://localhost:5173',
  ];
  return [...new Set([...defaultOrigins, ...configuredOrigins])];
}

function corsHeaders(request, env) {
  const requestOrigin = request.headers.get('Origin') || '';
  const allowedOrigins = getAllowedOrigins(env);

  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };

  if (allowedOrigins.includes(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
  }

  return headers;
}

function json(data, env, request, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request, env),
    },
  });
}

function encode(value) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

async function hmac(key, value) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );

  return new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      new TextEncoder().encode(value),
    ),
  );
}

async function createSigningKey(secret, date, region, service) {
  const dateKey = await hmac(
    new TextEncoder().encode(`AWS4${secret}`),
    date,
  );

  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, service);

  return hmac(serviceKey, 'aws4_request');
}

async function createPresignedUrl(env, objectKey, contentType) {
  const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  const canonicalUri = `/${env.R2_BUCKET_NAME}/${objectKey
    .split('/')
    .map(encode)
    .join('/')}`;

  const now = new Date();
  const amzDate = now
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, '');

  const shortDate = amzDate.slice(0, 8);
  const credentialScope = `${shortDate}/auto/s3/aws4_request`;

  const queryParameters = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${env.R2_ACCESS_KEY_ID}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': '900',
    'X-Amz-SignedHeaders': 'content-type;host',
  };

  const canonicalQueryString = Object.keys(queryParameters)
    .sort()
    .map(
      (name) =>
        `${encode(name)}=${encode(queryParameters[name])}`,
    )
    .join('&');

  const canonicalHeaders =
    `content-type:${contentType.trim()}\n` +
    `host:${host}\n`;

  const signedHeaders = 'content-type;host';

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join('\n');

  const derivedSigningKey = await createSigningKey(
    env.R2_SECRET_ACCESS_KEY,
    shortDate,
    'auto',
    's3',
  );

  const signingCryptoKey = await crypto.subtle.importKey(
    'raw',
    derivedSigningKey,
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );

  const signature = toHex(
    await crypto.subtle.sign(
      'HMAC',
      signingCryptoKey,
      new TextEncoder().encode(stringToSign),
    ),
  );

  return [
    `https://${host}${canonicalUri}`,
    `${canonicalQueryString}&X-Amz-Signature=${signature}`,
  ].join('?');
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(request, env),
        });
      }

      const requestUrl = new URL(request.url);

      if (
        requestUrl.pathname !== '/presign' ||
        request.method !== 'POST'
      ) {
        return json(
          { error: 'Not found' },
          env,
          request,
          404,
        );
      }

      const authorization = request.headers.get('Authorization');

      if (!authorization?.startsWith('Bearer ')) {
        return json(
          { error: 'Missing authorization' },
          env,
          request,
          401,
        );
      }

      const userResponse = await fetch(
        `${env.SUPABASE_URL}/auth/v1/user`,
        {
          headers: {
            apikey: env.SUPABASE_PUBLISHABLE_KEY,
            Authorization: authorization,
          },
        },
      );

      if (!userResponse.ok) {
        return json(
          { error: 'Invalid Supabase session' },
          env,
          request,
          401,
        );
      }

      const user = await userResponse.json();
      const role = user?.app_metadata?.role;

      if (role !== 'admin' && role !== 'owner') {
        return json(
          { error: 'Admin access required' },
          env,
          request,
          403,
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json(
          { error: 'Invalid JSON body' },
          env,
          request,
          400,
        );
      }

      const contentType = String(body?.contentType || '');
      const slug = String(body?.slug || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 80);

      if (!ALLOWED_TYPES.has(contentType)) {
        return json(
          { error: 'File type harus HTML atau PDF' },
          env,
          request,
          400,
        );
      }

      if (!slug) {
        return json(
          { error: 'Slug tidak valid' },
          env,
          request,
          400,
        );
      }

      const extension =
        contentType === 'application/pdf'
          ? 'pdf'
          : 'html';

      const objectKey = `slides/${slug}.${extension}`;

      const signedUrl = await createPresignedUrl(
        env,
        objectKey,
        contentType,
      );

      return json(
        {
          url: signedUrl,
          key: objectKey,
        },
        env,
        request,
        200,
      );
    } catch (error) {
      console.error('Worker error:', error);

      return json(
        {
          error: 'Internal Worker error',
        },
        env,
        request,
        500,
      );
    }
  },
};
