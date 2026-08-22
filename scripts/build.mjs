/**
 * Module: Git-derived production build
 * Purpose: Inject an automatic major.minor application version into the Vite build
 * Used by: npm run build and Vercel deployment build
 * Dependencies: Node.js child_process, Git, Vite
 * Public functions: None; executable build entrypoint
 * Side effects: Reads Git metadata and starts the Vite production build
 */
import { execFileSync, spawnSync } from 'node:child_process';

function git(args) {
  try { return execFileSync('git', args, { encoding: 'utf8' }).trim(); } catch { return ''; }
}

const commitCount = Number.parseInt(git(['rev-list', '--count', 'HEAD']), 10);
const version = Number.isFinite(commitCount) ? `1.${commitCount}` : '1.0';
const result = spawnSync('vite', ['build'], { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, VITE_APP_VERSION: version } });
process.exit(result.status ?? 1);
