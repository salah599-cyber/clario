#!/usr/bin/env bash
set -euo pipefail

if [ -n "${DATABASE_URL:-}" ]; then
  npx prisma migrate deploy
else
  echo "Skipping prisma migrate deploy (DATABASE_URL is not set)."
fi

npx next build
