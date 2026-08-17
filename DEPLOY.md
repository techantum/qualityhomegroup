# Deploying to production

Production runs on the server via **PM2** (`ecosystem.config.js`), not auto-deploy from GitHub.

After you push changes to `main`, SSH into the server and deploy:

```bash
cd /var/www/qualityhomegroup
bash scripts/deploy.sh
```

Or manually:

```bash
cd /var/www/qualityhomegroup
git pull origin main
npm ci
npm run build
pm2 restart qualityhomegroup
```

## Verify deployment

1. Open https://qualityhomegroup.com — header should be **white**, logo **92.5px** on the left.
2. Health check: https://qualityhomegroup.com/api/v1/health/db → `"connected": true`
3. CMS saves require these env vars on the server (in `.env` or PM2 env):
   - `DATABASE_URL` / `DIRECT_URL`
   - `SUPABASE_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://qualityhomegroup.com`
   - `UPLOAD_PROVIDER=supabase`

## If the site still looks old

- Hard refresh the browser (Ctrl+Shift+R).
- Confirm the build finished: `pm2 logs qualityhomegroup --lines 50`
- Confirm git is current: `git log -1 --oneline` should match latest commit on GitHub.
