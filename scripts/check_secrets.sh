#!/usr/bin/env bash
set -euo pipefail

if git grep -I -n -E 'sam-[A-Za-z0-9_-]{20,}' -- .; then
  echo
  echo "Potential SAM API key detected. Remove the secret before committing."
  exit 1
fi
