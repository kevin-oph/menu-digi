# Pizzetas — Menú digital y demo

Estado vigente: 23 de noviembre de 2026. Consolidación de V1 exclusiva de Pizzetas. Carta y backend completos se ejecutan localmente en Docker; la demo de GitHub Pages es una presentación independiente con pedidos simulados.

## Demo pública

- Demo visual: https://kevin-oph.github.io/menu-digi/
- Código: https://github.com/kevin-oph/menu-digi

La demo gratuita permite explorar la carta y preparar un resumen simulado. No procesa pagos, no registra pedidos en el servidor y no permite administrar el negocio. La versión completa con API y PostgreSQL se ejecuta localmente con Docker.

## Abrir y revisar

- Cliente: http://127.0.0.1:8080/
- Encargado: http://127.0.0.1:8080/admin
- Simulación independiente: http://127.0.0.1:8080/b/pizzetas-docker-qa
- Panel de simulación: http://127.0.0.1:8080/admin?negocio=pizzetas-docker-qa
- API: http://127.0.0.1:8080/api/docs

El puerto 8080 utiliza PostgreSQL de Docker. El desarrollo anterior en 5173 utiliza SQLite y tiene datos independientes: no se migraron automáticamente. El negocio real permanece pausado y sin información bancaria inventada. Las pruebas se realizaron en un negocio separado con datos ficticios: no transferir.

El panel solicita ADMIN_TOKEN del archivo privado .env. No se guarda persistentemente en el navegador ni se publica en documentación. Conservar .env: sus claves están ligadas al acceso y a los pedidos. No regenerarlo para recuperar una base existente.

## Implementado

| Parte | Resultado |
| --- | --- |
| Carta conectada | API proporciona identidad, color, categorías, productos, precios, disponibilidad, versiones y fotografías. Búsqueda y carrito por negocio. |
| Selección | Cantidades, variantes, pizzas de dos mitades al precio mayor del tamaño, extras de $30 en toda la pizza y opciones existentes. |
| Registro | Servidor recalcula importes en centavos y genera folio e instantánea antes de mostrar datos de transferencia. Reintentos con la misma referencia no duplican pedidos. |
| Cierre | Copia, descarga, consulta de estado y regreso al menú. Registro pendiente se distingue de pago confirmado. |
| Encargado | Validar abono mínimo de 50%, acordar recolección, confirmar, preparar, marcar listo y entregar. Liquidar saldo en efectivo, transferencia o tarjeta; no permite entregar con saldo pendiente. |
| Plantilla | Nombre, descripción, WhatsApp, dirección, horario, tiempos orientativos, color, banco, titular y CLABE/cuenta/tarjeta receptora. Pausa y modo de simulación. |
| Catálogo | Crear, editar y retirar productos/presentaciones/categorías; disponibilidad y fotos. Retirar conserva pedidos históricos. Categoría base de pizzas protegida. |
| Resumen operativo | Pedidos, abonos validados, saldos y productos más pedidos; excluye simulaciones. |
| Infraestructura | Nginx, FastAPI y PostgreSQL 16 con healthchecks. Volúmenes persistentes para base y fotos. Solo frontend expuesto a loopback. |

WhatsApp prepara texto para envío manual: el cliente adjunta su comprobante en el chat y el encargado verifica el abono. Abrir el chat no acredita envío ni pago. La confirmación también es una respuesta preparada que envía el encargado. No hay WhatsApp Business API ni recepción de comprobantes dentro de la app. Registrar una liquidación con tarjeta no procesa un cobro electrónico.

Solo recoger. Transferencia mínima del 50% antes de preparar. Referencia habitual de 25–35 minutos desde confirmación; con cocina ocupada, 45–50 minutos u otro acuerdo. Se permite solicitar hora de hoy; no hay reserva automática de capacidad. Personalizaciones fuera del catálogo se consultan con una persona. Incluye postres y únicamente cervezas en la sección de alcohol; excluye paquetes de pedida y cenas románticas.

## Errores, concurrencia y conservación

Cada producto tiene versión. Un producto agotado o cambiado permanece señalado en el carrito y bloquea continuar hasta revisarlo. La API rechaza selecciones antiguas aunque el precio siga igual. Si falla la carga inicial, se ofrece reintento y se conserva el carrito.

Antes de enviar se guarda un intento en sessionStorage. Una respuesta perdida se recupera con la misma referencia; no se cambia su contenido mientras el resultado sea desconocido. Restricción única y transacciones protegen el registro. Confirmaciones y ediciones exigen versión esperada para evitar sobrescrituras entre pestañas.

Carrito en localStorage por negocio. Datos del comprador, token privado del pedido e intento en la sesión del navegador. La copia descargada excluye el token. Si no se puede guardar la referencia recuperable se impide registrar. Cambiar de dispositivo o borrar datos del navegador no conserva automáticamente el acceso privado del cliente.

## Fotografías

Cámara o galería, previsualización y guardado explícito. JPEG, PNG y WebP; máximo 10 MB, 40 megapíxeles y mínimo 32 píxeles por lado. El servidor corrige orientación, retira metadatos y genera WebP de hasta 1600 px y miniatura de 480 px. HEIC y SVG no admitidos. Cámara real de teléfono pendiente de ensayo físico y permisos del navegador.

Conflictos/fallos conservan la asociación anterior. Cada reemplazo tiene URL nueva. Retirar o sustituir la foto no elimina todavía archivos históricos del volumen; limpieza automática y recorte manual pendientes. Las fotos del menú son públicas: no subir comprobantes ni documentos privados como productos.

## Arrancar y detener Docker

Con Docker Desktop abierto, desde esta carpeta:

```powershell
node scripts/configure-local.mjs
docker compose up -d --build --wait
docker compose ps
```

El configurador conserva un .env existente. Si la terminal no reconoce docker tras instalarlo, abrir una nueva. La instalación por usuario de este equipo está en %LOCALAPPDATA%\Programs\DockerDesktop\resources\bin; esa carpeta incluye el gestor de credenciales necesario para descargar imágenes.

```powershell
docker compose stop
docker compose up -d --wait
```

Datos en volúmenes postgres_data y media_data. No usar `docker compose down -v` para reiniciar: elimina volúmenes. Solo escucha en 127.0.0.1:8080; acceso desde teléfono físico requiere preparar red por separado.

## Respaldo y recuperación

```powershell
./scripts/backup-local.ps1
```

Pausa brevemente la API para copiar base y fotos del mismo momento. Guarda database.dump, media.tgz, checksums y .env en .backups y vuelve a arrancar la API. Comprobar el mensaje «Respaldo completo». Carpeta excluida de Git y del contexto Docker; contiene datos y claves privadas. Conservar una copia segura fuera del equipo.

Se ensayó pg_restore en una base desechable: recuperó 14 pedidos, incluido uno entregado y liquidado. El archivo de fotos recuperó la misma imagen por SHA-256. No se reemplazó la base operativa. Una recuperación real debe detener escrituras, conservar primero el estado actual, restaurar base y fotos del mismo respaldo en volúmenes nuevos y recuperar las mismas claves .env; verificar antes de cambiar el servicio. No hay restauración automática que sobrescriba datos.

## Desarrollo sin contenedores

Node.js 20.18+ y Python 3.12:

```powershell
npm ci
node scripts/configure-local.mjs
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r backend/requirements.lock
./.venv/Scripts/python.exe backend/run_local.py --state backend/.local
```

En otra terminal: `npm run dev -- --port 5173 --strictPort`. Vite reenvía /api y /media a 127.0.0.1:8000. Este modo usa SQLite independiente de Docker. En Linux usar .venv/bin/python.

## Verificaciones realizadas

- 30 pruebas frontend y compilación de producción aprobadas.
- 31 pruebas API aisladas con SQLite: precios, mitades, disponibilidad, autenticación, aislamiento, versiones, concurrencia, pagos, fotografías, catálogo y métricas.
- Construcción y arranque real de tres contenedores saludables. API y carta accesibles mediante Nginx.
- PostgreSQL real: 12 compradores paralelos con folios distintos; 12 reintentos con un único pedido; doble confirmación paralela con una aplicada y otra rechazada. Ciclo de preparación, saldo y entrega.
- Pedido liquidado y foto intactos después de recrear los tres contenedores.
- Respaldo real, restauración de PostgreSQL en base aislada y foto recuperada con SHA-256 idéntico.
- Navegador: tres unidades sin cerrar selección, registro conectado con folio y cierre móvil de 390 px. Evidencia: ../PEDIDO_DOCKER_MOVIL.png.

Estos escenarios no miden capacidad del futuro VPS. El service worker de producción conserva estructura visual y archivos estáticos; API, pedidos y fotos no se cachean. Sin conexión no se registran pedidos. Instalación en pantalla inicial de teléfono físico pendiente de verificar.

## Pendientes y V2

Antes del piloto: datos reales, revisión comercial de precios/carta, fotos propias, logo, ensayo físico móvil/WhatsApp, detalles de impresora y política para cancelaciones, devoluciones y pedidos abandonados. Confirmar todavía no imprime: integración de cocina pendiente de equipo.

Antes de VPS: dominio, HTTPS, sesiones/cuentas de operador y límites de acceso, migraciones, respaldo externo y monitoreo. Clave por negocio adecuada para ensayo local; no declarar listo para exposición pública.

V2: automatización de WhatsApp si se configura, inventario/capacidad, roles, recorte y limpieza segura de fotos, paginación e historial y retención de datos. La skill reutilizable se creará después de estabilizar y validar esta plantilla. Historial en docs/BITACORA_PROYECTO.md y plan en docs/PLAN_MEJORAS_V1.md.

## Demo visual gratuita y GitHub

Se añadió una compilación independiente para presentación: `npm run build:demo`. No consulta la API ni registra pedidos, no ofrece datos bancarios reales ni abre WhatsApp y no carga el panel administrativo. Precarga datos ficticios y conserva únicamente un borrador en el navegador. La aplicación Docker completa mantiene su funcionamiento habitual con `npm run build`.

La demo usa la ruta /menu-digi/ para GitHub Pages. `DEMO_BASE` permite otra ruta al compilar. Fotos y recursos respetan esa base; no se registra service worker en la demo. Para previsualizar con Vite, usar VITE_PUBLIC_DEMO=true y DEMO_BASE=/menu-digi/ en el entorno y ejecutar `npm run preview -- --port 4174` después de compilar la demo.

El workflow .github/workflows/pages.yml ejecuta pruebas, compila la demo y publica solo dist. En GitHub, Settings → Pages debe usar GitHub Actions. No subir dist, .env, bases, respaldos, dependencias ni fotos privadas de operación. GitHub Pages gratuito requiere repositorio público en GitHub Free; no cambiar la privacidad de un repositorio sin autorización. Esta demo de presentación no debe usarse para transacciones reales.

El repositorio completo incluye frontend, backend, Docker, pruebas y documentación en docs. La subida y URL pública deben verificarse antes de compartirlas como disponibles. La autenticación de GitHub es independiente de la clave local del panel.

## Catálogo público actualizado — 10 de noviembre de 2026

La demo publica una instantánea revisada de la carta local: 80 productos disponibles, 39 fotos aprobadas y sección «Cervezas y mojitos». Mantiene selección de variantes, mitades, extras, carrito y resumen simulado. No incluye acceso administrativo, pagos ni registro real en servidor.

La instantánea pública está en src/demo-menu.json y las fotos optimizadas en public/images/catalogo. Contiene solo campos públicos de catálogo y configuración visual; excluye datos bancarios, contactos privados, claves y pedidos. backend/seed.json conserva el catálogo completo de 119 productos con los artículos no ofrecidos desactivados, para instalaciones nuevas. Actualizar el seed no sobrescribe una base existente.

Los archivos omitidos por el negocio (BURGER.jpg, PIZZA.jpg, CLERICOT.jpg, TARDES.jpg y cenas románticas) no se incorporaron. Tampoco se exportaron fotografías personales usadas para probar el administrador. Las fotos específicas sustituyen las asignaciones orientativas anteriores; las restantes conservan su advertencia provisional.

Editar el administrador local no publica automáticamente en GitHub Pages: hay que revisar y exportar otra instantánea y sus recursos. La publicación incluye documentación acumulada del proyecto y mantiene separados los datos privados de operación.

## Actualización visual — 11 de noviembre de 2026

La instantánea pública conserva 80 productos e incluye 78 imágenes: las 50 imágenes incorporadas localmente (39 ilustraciones y 11 fotos retocadas), junto con 28 fotografías anteriores. Las ilustraciones se identifican en la carta y el detalle del producto. Las fotos personales de pruebas siguen excluidas. La demo mantiene pedidos simulados, sin pagos, acceso administrativo ni datos privados de operación.

La actualización incluye fotos ampliadas en el detalle, procedencia de imágenes y documentación del procedimiento. Se comprobaron 30 pruebas frontend y la compilación de la demo antes de publicar. Las 32 pruebas API habían pasado durante la implementación del cambio de procedencia.

## Consolidación exclusiva de Pizzetas — 23 de noviembre de 2026

Esta instalación es la carta de presentación comercial de Pizzetas. El objetivo es que el encargado mantenga productos, categorías, fotos, precios y opciones desde su móvil. Plan y criterios de aceptación en [docs/PLAN_BACKEND_PIZZETAS.md](docs/PLAN_BACKEND_PIZZETAS.md).

Primer incremento aplicado localmente: Carta → elegir producto → «Opciones que el cliente debe elegir». Permite crear, editar y quitar grupos como Salsa, Marca o Sabor, con una alternativa por línea y guardado explícito. Cada grupo exige una elección; no cambia precios. Para precios distintos se usan presentaciones. Se rechazan grupos/valores duplicados y vacíos; los pedidos anteriores conservan sus elecciones.

Validación: 34 pruebas API aisladas con SQLite, 30 frontend, compilación de producción y Docker saludables. Revisado en navegador el grupo Marca y agregar/quitar grupos sin guardar cambios en productos reales. El control de versiones protege ediciones simultáneas; omitir opciones desde una integración anterior no las elimina.

Pendientes inmediatos: organización de la carta, acceso del encargado con sesión y recuperación, revisión de operación diaria y ensayo integral de WhatsApp. API/base/fotos requieren alojamiento para el piloto público. Impresora pendiente de especificaciones. Estos cambios del panel no se han publicado ni subido al repositorio en esta etapa.

## Preparación del VPS — 23 de noviembre de 2026

Guía paso a paso: [docs/DESPLIEGUE_IONOS.md](docs/DESPLIEGUE_IONOS.md). Configuración de servidor en docker-compose.vps.yml y deploy/Caddyfile. Scripts Linux: scripts/backup-vps.sh y scripts/restore-vps.sh; restauración solo en base/volumen vacíos. El Compose local sigue escuchando únicamente en 127.0.0.1:8080.

El panel inicia una sesión aleatoria de hasta 8 horas; guarda únicamente su hash en PostgreSQL y revoca al salir. La clave se usa solo al entrar y no se conserva en almacenamiento del navegador. En producción ADMIN_REQUIRE_SESSION=true impide administrar con la clave directa. En local se conserva compatibilidad para herramientas de importación existentes. Limitación de acceso: cinco claves incorrectas por origen/negocio en 15 minutos y límite adicional Nginx. El contador de API es local al proceso, se reinicia con él y se usa un único worker; detrás del proxy puede agrupar accesos. No sustituye monitoreo ni protección distribuida.

La nueva tabla admin_sessions es aditiva: el arranque la crea sin sustituir productos o pedidos. La sesión no se comparte entre negocios y persiste en servidor tras un reinicio, pero el navegador la conserva solo en memoria; recargar exige volver a entrar. Recuperación inicial: propietario con acceso SSH conserva la clave en .env/respaldo privado. No hay envío de contraseñas ni restablecimiento automático por correo.

Validación actual: 37 pruebas API aisladas, 30 frontend, compilación y Docker saludables. Navegador: inicio de sesión, acceso a Carta y Salir. Configuración de VPS/HTTPS y sintaxis de scripts comprobadas localmente; DNS, certificado público y restauración Linux real se comprobarán en el servidor antes de abrir pedidos. Continúan pendientes reordenación avanzada e integración de impresora. No se ha accedido a IONOS ni publicado estos cambios.
