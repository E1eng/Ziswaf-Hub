#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "=== TypeScript check ==="
npx -y tsc --noEmit --pretty false 2>&1 | tail -200 || true

echo ""
echo "=== ESLint check ==="
npx -y eslint . --max-warnings=0 --ext .ts,.tsx 2>&1 | tail -200 || true

rm -- "$0"
