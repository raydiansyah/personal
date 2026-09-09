# Local engineering rules

- Keep public form protection server-verified; never trust CAPTCHA state from the browser.
- Keep Cloudflare Turnstile secrets in Supabase Edge Function secrets only.
- Use the existing React and Supabase Edge Function boundaries; avoid introducing a second form transport.
- Validate Turnstile success, action, and hostname before persisting contact data or sending email.
