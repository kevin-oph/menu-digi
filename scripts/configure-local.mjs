import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const path = fileURLToPath(new URL('../.env',import.meta.url));
if(existsSync(path)) console.log('Ya existe .env; se conserva sin reemplazar claves.');
else {
  const secret=()=>randomBytes(36).toString('base64url');
  writeFileSync(path,`# Configuración privada local. No compartir ni incluir en capturas.\nAPP_SECRET=${secret()}\nADMIN_TOKEN=${secret()}\nPOSTGRES_PASSWORD=${secret()}\nLOCAL_PORT=8080\n`,{flag:'wx',mode:0o600});
  console.log('Configuración privada creada en .env. La clave del panel es ADMIN_TOKEN.');
}
