# Pizzetas — Menú digital y demo

Estado vigente: 9 de noviembre de 2026. Carta móvil modificable, API FastAPI y PostgreSQL funcionando en Docker. No publicado en Internet; sin pagos ni mensajes reales enviados.

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
