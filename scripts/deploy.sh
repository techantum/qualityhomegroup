#!/usr/bin/env bash
# Run on the production server (e.g. /var/www/qualityhomegroup) after pushing to GitHub.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/qualityhomegroup}"
PM2_NAME="${PM2_NAME:-qualityhomegroup}"

echo "==> Deploying from ${APP_DIR}"
cd "$APP_DIR"

echo "==> Pulling latest code"
git pull origin main

echo "==> Installing dependencies"
npm ci

echo "==> Building Next.js app"
npm run build

echo "==> Restarting PM2 process: ${PM2_NAME}"
pm2 restart "$PM2_NAME" || pm2 start ecosystem.config.js

echo "==> Done. Check: pm2 logs ${PM2_NAME} --lines 30"
