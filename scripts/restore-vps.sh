#!/usr/bin/env bash
# Restore only into a new deployment: never overwrite an existing database or photo volume.
set -Eeuo pipefail
umask 077
cd "$(dirname "$0")/.."
source_dir="${1:?Indica la carpeta del respaldo privado}"
[[ -f "$source_dir/database.dump" && -f "$source_dir/media.tgz" && -f .env ]] || { echo 'Falta base, medios o .env'; exit 1; }
compose=(docker compose -f docker-compose.vps.yml)
"${compose[@]}" config --quiet
"${compose[@]}" up -d --wait database
running=$("${compose[@]}" ps --status running --services)
if grep -qx backend <<< "$running"; then echo 'Detén el backend antes de restaurar.'; exit 1; fi
tables=$("${compose[@]}" exec -T database psql -U pizzetas -d pizzetas -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
[[ "$tables" == '0' ]] || { echo 'La base ya tiene tablas. Se rechaza sobrescribirla: usa una instalación nueva.'; exit 1; }
"${compose[@]}" run --rm --no-deps --entrypoint python backend -c "from pathlib import Path; assert not any(Path('/app/media').iterdir()), 'El volumen de fotos no está vacío'"
"${compose[@]}" exec -T database pg_restore --exit-on-error --no-owner --no-privileges -U pizzetas -d pizzetas < "$source_dir/database.dump"
"${compose[@]}" run --rm -T --no-deps --entrypoint tar backend -xzf - -C /app/media < "$source_dir/media.tgz"
echo 'Base y fotos restauradas. Mantén pedidos pausados y comprueba la carta antes de abrir el piloto.'
