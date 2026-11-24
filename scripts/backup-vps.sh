#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
cd "$(dirname "$0")/.."
target="${1:-.backups}/$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -p "$target"
compose=(docker compose -f docker-compose.vps.yml)
resume() { "${compose[@]}" up -d --wait backend; }
trap resume EXIT
"${compose[@]}" stop backend
"${compose[@]}" exec -T database pg_dump -U pizzetas -d pizzetas -Fc > "$target/database.dump"
"${compose[@]}" run --rm --no-deps --entrypoint tar backend -czf - -C /app/media . > "$target/media.tgz"
cp .env "$target/.env"
(cd "$target" && sha256sum database.dump media.tgz > checksums.sha256)
printf 'Respaldo privado completo: %s\n' "$target"
