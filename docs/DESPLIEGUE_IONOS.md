# Pizzetas en Ubuntu / IONOS — guía para el 24 de noviembre de 2026

Objetivo: publicar la carta completa con panel y pedidos, conservando la demo de GitHub Pages como presentación. El VPS está suspendido por pago; no se ha accedido ni cambiado nada remoto. No es necesario contratar otro servidor antes de revisar el que ya existe.

## 1. Recuperar acceso y revisar el servidor

Después de regularizar el servicio, confirmar dominio, IPv4, versión de Ubuntu, RAM, CPU y disco. Revisar qué aplicaciones, datos y servicios están usando los puertos 80/443 antes de instalar o sustituir nada. No reinstalar Ubuntu, no borrar volúmenes y no desactivar servicios ajenos. Si el dominio ya tiene página o correo, preferir un subdominio como `menu.tudominio.mx`; conservar registros MX/TXT y la página actual.

Desde SSH, con acceso del propietario, revisar `lsb_release -a`, `free -h`, `df -h`, `docker version`, `docker compose version` y `sudo ss -ltnp`. Usar una llave SSH. Probar la llave antes de cambiar cualquier acceso. No compartir contraseñas ni el contenido de `.env` en el chat.

## 2. Preparar Ubuntu sin afectar lo existente

Instalar Docker Engine y el plugin Compose desde su repositorio oficial, siguiendo la guía correspondiente a la versión real de Ubuntu: https://docs.docker.com/engine/install/ubuntu/. No ejecutar un instalador genérico a ciegas. Revisar actualizaciones y necesidad de reinicio antes de desplegar. Mantener SSH disponible y permitir TCP 80/443 en el firewall de IONOS y el del sistema; no abrir PostgreSQL, API ni el puerto local 8080 al público. Docker puede gestionar reglas que no siguen todas las restricciones de UFW: comprobar los puertos desde fuera, además del firewall del proveedor.

## 3. Preparar código y respaldo

Se entrega un ZIP de código actualizado fuera del repositorio: `outputs/PAQUETE_DESPLIEGUE_PIZZETAS.zip`. Incluye configuración de producción, sesiones y scripts. NO contiene `.env`, fotos operativas privadas, pedidos ni base. Si se usa un clon de GitHub, comprobar primero que estos cambios hayan sido subidos: no desplegar una revisión anterior por error.

Antes del respaldo, confirmar desde el panel que la recepción está pausada y el modo de pruebas activo. En el equipo local generar un respaldo nuevo justo antes de migrar: `./scripts/backup-local.ps1`. El respaldo conserva PostgreSQL, medios y `.env` del mismo momento. Ya existe además una copia de preparación en `work/preparacion-vps-20261123`. Los productos nuevos del administrador no se migran solo con Git: necesitan el respaldo de base y medios.

Transferir el código y la carpeta privada del respaldo por SCP/SFTP a una carpeta nueva del VPS, con permisos privados. Conservar una copia fuera del VPS. Verificar SHA-256 de `database.dump` y `media.tgz` frente al archivo de checksums que acompaña al respaldo (el de Windows es JSON). No publicar el ZIP privado del respaldo ni `.env` en GitHub.

## 4. Configurar la instalación nueva

En la raíz del proyecto del VPS copiar el `.env` DEL RESPALDO y protegerlo con `chmod 600 .env`. No ejecutar el generador de claves sobre una base restaurada: hay que conservar APP_SECRET, ADMIN_TOKEN y POSTGRES_PASSWORD originales. Añadir únicamente `PIZZETAS_DOMAIN=menu.tudominio.mx`, con el dominio real, sin protocolo ni rutas. `.env` sigue fuera de Git.

```bash
docker compose -f docker-compose.vps.yml config --quiet
docker compose -f docker-compose.vps.yml build
```

La configuración de producción usa un proyecto/volúmenes independientes de `pizzetas-local`. Solo el gateway publica 80/443. El frontend, la API y PostgreSQL permanecen sin puertos públicos. En VPS se exige sesión de administración; las integraciones antiguas con ADMIN_TOKEN directo siguen disponibles únicamente en el Compose local por compatibilidad.

## 5. Restaurar base y fotos en volúmenes vacíos

No arrancar todavía backend/frontend/gateway. Ejecutar:

```bash
bash scripts/restore-vps.sh /ruta/privada/al/respaldo
```

El script arranca solo PostgreSQL y RECHAZA restaurar si ya hay tablas, si el backend corre o si el volumen de medios no está vacío. No borra instalaciones existentes. Si una restauración falla, conservar la evidencia y usar otro proyecto/volúmenes nuevos; no intentar reparar borrando datos operativos. La validación de checksums del paso anterior se hace antes de restaurar.

## 6. DNS y HTTPS

Crear/ajustar solo el registro A del subdominio elegido hacia la IPv4 del VPS. No agregar AAAA sin IPv6 configurada; corregir un AAAA antiguo del mismo subdominio si envía tráfico a otro servidor. Confirmar resolución antes de iniciar el gateway.

```bash
docker compose -f docker-compose.vps.yml up -d --wait
docker compose -f docker-compose.vps.yml ps
docker compose -f docker-compose.vps.yml logs --tail 80 gateway
```

Caddy solicita y renueva HTTPS automáticamente al usar un dominio válido: https://caddyserver.com/docs/automatic-https. Necesita DNS correcto, conectividad y los puertos accesibles; esa emisión real no puede verificarse desde el equipo local. El gateway bloquea la documentación interactiva de la API en público. Si 80/443 ya tienen un proxy del VPS, acordar su integración en vez de reemplazarlo.

## 7. Pruebas con pedidos pausados y modo de prueba

Entrar a `/admin` con la clave existente de Pizzetas. La sesión dura hasta 8 horas y se revoca con Salir; al recargar vuelve al acceso. La clave no se guarda en el navegador. Cinco intentos incorrectos bloquean temporalmente el acceso; esperar 15 minutos. Hay además límite en Nginx. Para recuperar la clave, el propietario puede consultar su `.env` privado por SSH o el respaldo; no generar otra sin actualizar y revocar accesos de forma controlada.

Verificar carta/fotos, nuevas opciones editables, altas/retiros y categorías. Probar cambios con un producto de ensayo que luego se retira, sin alterar recetas reales. Confirmar que una segunda pestaña detecta conflicto. Reiniciar contenedores y comprobar persistencia. Comparar productos, precios y fotos frente a la copia local. El nuevo esquema añade `admin_sessions`; conserva tablas y datos existentes.

Mantener la recepción real pausada hasta confirmar banco/titular/cuenta, WhatsApp, dirección, horarios y precios definitivos. Comprobar el flujo de pruebas: pizza mitad y mitad al precio mayor, extras, postre, folio, reintento sin duplicados, validación mínima del 50%, tiempo acordado, preparación, listo, liquidación y entrega. No usar comprobantes ficticios para marcar dinero real recibido. No enviar mensajes de prueba a clientes ajenos.

## 8. Respaldo y recuperación antes de abrir

```bash
bash scripts/backup-vps.sh
```

El script pausa brevemente la API, crea copia consistente de base/fotos/.env, calcula SHA-256 y vuelve a arrancar la API incluso si falla una copia. Impide registrar durante ese breve intervalo; programar fuera de atención. Preparar la periodicidad y destino externo con el propietario; no se ha activado todavía ningún cron ni almacenamiento de terceros.

Ensayar la restauración en un proyecto aislado, nunca sobre la instalación operativa. No usar `docker compose down -v` para actualizar ni solucionar fallos. Antes de una actualización conservar respaldo y revisión de código anterior; no revertir la base a un respaldo antiguo si ya recibió pedidos nuevos sin revisar cómo recuperarlos.

## 9. Apertura del piloto

Solo después de completar las pruebas: desactivar modo de prueba y activar recepción desde el panel. Hacer un pedido real controlado con el propietario: enviar resumen por WhatsApp, adjuntar comprobante manualmente, verificar pago, acordar tiempo y responder al cliente. Confirmar desde teléfono usando datos móviles. Abrir WhatsApp no envía solo ni confirma pago.

La impresora de cocina continúa pendiente de marca/modelo y conexión. La app no debe anunciar impresión automática mientras no se integre y pruebe ese equipo. Roles múltiples, reordenación avanzada y automatización de WhatsApp no bloquean el piloto con una persona, pero permanecen en el plan de mejoras.

## Lo que queda necesariamente para mañana

Acceso tras el pago, inventario del VPS, dominio/subdominio real, DNS, HTTPS público, transferencia/restauración reales, respaldo externo y ensayo físico con el WhatsApp del negocio. No se ha abierto el servicio a clientes ni se han enviado mensajes desde esta preparación local.
