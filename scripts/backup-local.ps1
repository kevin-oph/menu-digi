param([string]$Destination = '')
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
if (!$Destination) { $Destination = Join-Path $project '.backups' }
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (!$docker) {
    $bin = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin'
    if (!(Test-Path (Join-Path $bin 'docker.exe'))) { throw 'Abre Docker Desktop e incluye docker en PATH.' }
    $env:PATH = "$bin;$env:PATH"
}
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$id = [guid]::NewGuid().ToString('N')
$target = Join-Path $Destination "$stamp-$id"
New-Item -ItemType Directory -Path $target -Force | Out-Null
Push-Location $project
try {
    # Detener escrituras permite que base y fotos pertenezcan al mismo momento.
    docker compose stop backend
    if ($LASTEXITCODE) { throw 'No se pudo detener la API.' }
    docker compose exec -T database pg_dump -U pizzetas -d pizzetas -Fc -f "/tmp/$id.dump"
    if ($LASTEXITCODE) { throw 'Falló pg_dump.' }
    docker compose cp "database:/tmp/$id.dump" (Join-Path $target 'database.dump')
    if ($LASTEXITCODE) { throw 'Falló la copia de la base.' }
    docker compose run --rm --no-deps --entrypoint tar backend -czf "/app/media/.backup-$id.tgz" --exclude=".backup-*.tgz" -C /app/media .
    if ($LASTEXITCODE) { throw 'Falló el respaldo de fotografías.' }
    # El contenedor detenido sigue vinculado al mismo volumen de fotos.
    docker compose cp "backend:/app/media/.backup-$id.tgz" (Join-Path $target 'media.tgz')
    if ($LASTEXITCODE) { throw 'Falló la copia de fotografías.' }
    docker compose run --rm --no-deps --entrypoint rm backend "/app/media/.backup-$id.tgz"
    docker compose exec -T database rm "/tmp/$id.dump"
    Copy-Item -LiteralPath (Join-Path $project '.env') -Destination (Join-Path $target '.env')
    Get-FileHash (Join-Path $target 'database.dump'),(Join-Path $target 'media.tgz') | Select-Object Algorithm,Hash,Path | ConvertTo-Json | Set-Content (Join-Path $target 'checksums.json')
    Write-Output "Respaldo completo: $target"
    Write-Output 'Contiene claves y datos privados. Consérvalo fuera del repositorio y con acceso restringido.'
} finally {
    docker compose up -d --wait backend
    Pop-Location
}
