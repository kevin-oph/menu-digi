# Plan de mejoras y cierre de V1 — Pizzetas

## Objetivo y alcance

Cerrar una V1 modificable, móvil y probada localmente antes del VPS. La prioridad es que cliente y encargado sepan qué pasó con cada pedido, que los cobros coincidan con sus productos y que dos clientes o dos operadores no produzcan mezclas, duplicados ni autorizaciones contradictorias.

Estado de partida: React con catálogo y carrito locales, checkout y mensaje de prueba. No hay aún API de pedidos, PostgreSQL, panel operativo ni integración real con impresora. Dockerfile y Compose existentes contienen únicamente el frontend. No interpretar pruebas del prototipo como pruebas de concurrencia de producción.

## Reglas confirmadas

- Solo recoger. Transferencia mínima de 50% antes de preparar, con comprobante en WhatsApp y validación humana del abono.
- Saldo al recoger en efectivo, transferencia o tarjeta. No hay procesamiento de tarjeta en línea.
- Dos mitades se cobran al mayor precio del tamaño elegido; extras aprobados de $30.
- Logo, datos operativos reales e impresoras pendientes. No publicar en servidores en esta etapa.
- Un enlace de WhatsApp prepara texto: no acredita envío, adjunta la imagen ni valida el pago automáticamente.

## Decisiones consultadas al usuario

1. Confirmado: el encargado valida el anticipo y envía manualmente una respuesta preparada por WhatsApp. No integrar automatización de mensajería en esta V1.
2. Confirmado: un encargado inicialmente. Mantener control de versión para evitar conflictos incluso entre dos pestañas de la misma persona.
3. Confirmado: tiempo habitual 25–35 minutos desde la confirmación. Con cocina ocupada puede subir a 45–50 minutos u otro tiempo acordado; el encargado lo comunica y el cliente decide. Los pedidos con varias horas de anticipación pueden solicitar una hora. No reservar cupos ni prometer tiempos automáticos.

La interfaz ofrece «Lo antes posible» y «Solicitar una hora». El tiempo definitivo depende de la carga de hornos/freidoras y se acuerda por WhatsApp. Antes de preparar, deben estar validados el anticipo y la aceptación del horario si hubo una propuesta distinta. No implementar cupos arbitrarios ni confundir la hora solicitada con una hora confirmada.

## Etapas y puertas de verificación

| Paso | Implementación | Para darlo por verificado |
| --- | --- | --- |
| 1. Cierre claro del cliente | Resumen final de prueba, referencia local, copia descargable y vuelta al menú. Recuperar el último resumen en la sesión, sin borrar el carrito al abrir WhatsApp. | El usuario distingue borrador, transferencia pendiente y confirmación. Copiar y volver no generan un pedido nuevo. No aparecen mensajes falsos de pago o envío. |
| 2. Registro real y concurrencia | FastAPI + PostgreSQL. Crear pedido con ID interno, folio visible, negocio, versión, instantánea de productos/precios, importes en centavos y estado. Clave de idempotencia por intento lógico. | Dos compradores crean pedidos distintos. Reintentar exactamente el mismo pedido devuelve el mismo resultado. Reutilizar la clave con contenido distinto produce conflicto. No hay folios repetidos. |
| 3. Integración cliente/API | El servidor recalcula precio y disponibilidad; frontend muestra cambios antes de transferir. Registrar primero, después abrir WhatsApp con folio y referencia. | Cambios de precio no se aceptan silenciosamente. Si no se registró, no se indica recibido. Error o timeout preserva carrito e intento para reintentar sin duplicar. |
| 4. Panel del encargado | Acceso autenticado por negocio, lista de pendientes, importe verificado manualmente, horario acordado y autorización con historial. Estados y actualizaciones con control de versión. | Dos encargados que abren el mismo pedido no sobrescriben cambios. El segundo recibe la versión actual para revisar. Menos del 50% no autoriza cocina. Abrir el chat no cambia el estado. |
| 5. Confirmación y copia | Mensaje con folio, productos, total, abono recibido, saldo y hora confirmada. Canal según respuesta del usuario. | La confirmación solo existe tras validación humana. Distinguir mensaje preparado, enviado y entregado según la evidencia real del canal. Un fallo de WhatsApp no duplica pago ni pedido. |
| 6. Plantilla editable y fotos desde móvil | Panel para productos, categorías, variantes, disponibilidad, identidad y datos bancarios. Cargar, previsualizar, sustituir y retirar fotos desde cámara o galería. Reglas de cobro reservadas al administrador del sistema. | Foto guardada en servidor y visible en otros dispositivos tras recargar. Aislamiento por negocio. Cambiar catálogo o fotos no altera pedidos históricos. Guardado fallido conserva la foto anterior. |
| 7. Cocina e impresión | Adaptador según equipo recibido; cola de trabajos ligada al pedido autorizado, reintento y reimpresión explícita. | Una confirmación duplicada no crea dos tickets. Registrar fallos y distinguir enviado a impresora de impreso cuando el equipo permita confirmarlo. No imprimir pendientes de pago. |
| 8. Docker y ensayo local completo | Compose frontend/API/PostgreSQL, inicialización versionada, healthchecks, persistencia, respaldo y restauración. Ensayo del recorrido completo. | Arrancar desde un entorno limpio, reiniciar sin perder pedidos y restaurar copia. Completar pruebas concurrentes en PostgreSQL real. No subir al VPS antes de estas comprobaciones. |

## Estados y evidencias

- **Borrador local / prueba:** solo existe en el navegador; no recibido por el negocio.
- **Registrado, pendiente de validación:** existe en base de datos. El cliente aún puede tener que enviar su mensaje y comprobante.
- **Confirmado:** el encargado registró abono suficiente y horario acordado. El estado de pago conserva su saldo por separado.
- **En preparación → listo → entregado:** transiciones autorizadas y registradas por el negocio.
- **Cancelado:** no debe desaparecer del historial. Cancelaciones con abonos y devoluciones requieren una regla comercial aún por definir.

Abrir WhatsApp y copiar el texto son eventos de interfaz; no son confirmaciones de envío, pago o preparación.

## Diseño para dos pedidos al mismo tiempo

1. Cada pedido tiene un ID generado en servidor y un folio protegido por restricción única en la base de datos. No usar número de teléfono ni la hora como identificador.
2. Cada intento lógico usa una clave de idempotencia. Deshabilitar el botón durante el envío mejora la interfaz, pero la garantía debe estar en una restricción única y transacción del servidor.
3. La clave y una huella del contenido se almacenan por negocio. Mismo contenido + misma clave devuelve el mismo pedido; contenido diferente + misma clave devuelve conflicto.
4. Guardar pedido, líneas e importes de manera atómica: no dejar medio pedido si una operación falla.
5. Confirmaciones y cambios operativos exigen la versión esperada del pedido. Si otra persona lo cambió, recargar para revisar, sin sobrescribir.
6. Si se incorpora inventario con unidades, reservar/descontar dentro de una transacción con actualización condicional; nunca mediante «leer cantidad y después restar» sin protección. Hasta aprobar inventario, no prometer reserva automática ni stock exacto.
7. El horario solicitado no reserva capacidad de cocina por sí mismo. La regla depende de la decisión sobre horarios y cupos.
8. Los trabajos de impresión y notificación se vinculan a una acción única del pedido, con reintentos separados del cobro y la confirmación.

## Matriz de errores y pruebas requeridas

| Caso | Comportamiento esperado | Prueba |
| --- | --- | --- |
| Dos clientes diferentes a la vez | Dos pedidos aislados, cada uno con sus productos y folio | Solicitudes paralelas y comprobación de líneas/negocio |
| Doble clic, recarga o reintento tras timeout | Un único pedido por intento lógico | Varias solicitudes concurrentes con la misma clave |
| Misma clave y carrito distinto | Conflicto visible, sin alterar el pedido original | Solicitudes con huellas distintas |
| Se pierde respuesta después de guardar | Recuperar el pedido creado al reintentar | Simular corte entre persistencia y respuesta |
| API o base de datos caída | Aviso claro, carrito conservado, sin «pedido confirmado» | Fallo de red y error del servidor |
| Producto pausado/precio modificado mientras se compra | Mostrar diferencia y pedir revisión antes de transferir | Catálogo cambiado entre selección y registro |
| Dos encargados confirman lo mismo | Una transición válida; el otro revisa la versión vigente | Actualizaciones paralelas sobre la misma versión |
| Anticipo menor al mínimo o mayor al total | No autorizar preparación / no aceptar importes inconsistentes | Validación monetaria exacta |
| WhatsApp no abre o el cliente no envía | Resumen recuperable, reabrir chat; sin afirmar envío | Bloqueo de apertura y regreso a la app |
| Portapapeles bloqueado | Texto visible y seleccionable, sin bloqueo indefinido | Pruebas ya existentes y recorrido móvil |
| Sesión local corrupta, almacenamiento bloqueado o vencido | No romper la app; degradar con aviso y evitar rescatar datos de forma indefinida | Pruebas de lectura/escritura y expiración |
| Token de otro negocio o folio adivinado | Rechazo de acceso; sin revelar datos de clientes | Pruebas de autenticación y aislamiento |
| Impresora desconectada/reintento | Mostrar trabajo pendiente/fallido y permitir recuperación controlada | Según equipo al recibirlo |
| Reinicio de contenedores | Persistencia de pedidos, pagos e historial | Docker Compose y volumen PostgreSQL |

## Datos pendientes antes de operación real

Número WhatsApp, banco/CLABE/titular, dirección, horario, tiempo de preparación, usuarios del panel y equipo de impresión. También definir caducidad de pedidos sin anticipo, tratamiento de cancelaciones con pago y disponibilidad/cupos. No inventar estos datos para aparentar una puesta en marcha.

## Registro de avance

- Plan elaborado tras la revisión del flujo y del riesgo de concurrencia.
- Paso 1 implementado y verificado: resumen final, copia, descarga, vuelta al menú y recuperación tras recargar con la misma referencia. Recolección inmediata y hora solicitada probadas en navegador, con revisión móvil de 390 px.
- Paso 2: API implementada y verificada con SQLite aislado; 20 pruebas API aprobadas. Folios únicos, restricciones de idempotencia, instantáneas, acceso por pedido y control de versión. Validación en PostgreSQL real pendiente.
- Paso 3: pendiente conectar la carta de demostración al catálogo/configuración y registro de pedidos del servidor.
- Paso 4: panel local inicial implementado para configuración, edición básica de productos, consulta de pedidos y validación de anticipo/horario. Liquidación de saldo, ciclo completo y cuentas de operadores pendientes.
- Paso 5: la API prepara la confirmación y el panel permite abrirla/copiarla; no se ha enviado un mensaje real ni se verificó impresión.
- Paso 6: edición bancaria y de datos básicos implementada; fotos, categorías y alta/baja de productos pendientes.
- Paso 8: Compose ampliado con API y PostgreSQL. No se ha arrancado: Docker no está instalado. No declarar probado el stack completo.
- Impresión y despliegue continúan pendientes. Mantener BITACORA_PROYECTO.md como historial y este plan como lista de ejecución.

## Fotos administrables desde el móvil — incorporado a V1

### Experiencia del encargado
1. Acceder al panel autenticado del negocio.
2. Buscar el producto y pulsar «Agregar foto» o «Cambiar foto».
3. Elegir galería o cámara; revisar la previsualización y el encuadre.
4. Guardar y ver progreso; mostrar confirmación únicamente cuando el servidor haya guardado la foto y asociado el producto.
5. Poder retirar una foto sin eliminar el producto. Mantener una presentación limpia cuando falte imagen.

### Implementación y almacenamiento
- Endpoint de subida autenticado y ligado al negocio/producto; los clientes de la carta no pueden modificar imágenes.
- Archivos en volumen persistente del servidor propio y referencias en PostgreSQL. No guardar fotos en localStorage ni como base64 dentro del catálogo.
- Nombres internos únicos por negocio. El encargado no necesita nombrar archivos ni conocer rutas.
- Validar archivo por contenido y decodificación, tipo, peso y dimensiones, además de la extensión. Rechazar SVG ejecutable y formatos no admitidos por el procesador.
- Normalizar orientación, eliminar metadatos de ubicación y generar versiones optimizadas para tarjeta y detalle, conservando calidad adecuada.
- Primera compatibilidad prevista: JPEG, PNG y WebP. Probar HEIC/fotografías de iPhone y definir conversión compatible o aviso útil antes de declarar soporte.
- Vista de carga, reintento y cancelación; una falla no debe borrar la imagen anterior.
- Vincular la nueva imagen al producto con control de versión. Una imagen fallida o una edición simultánea no debe sobrescribir silenciosamente otra actualización.
- Archivos con versión/nombre nuevo para evitar que la caché muestre una foto reemplazada. Considerar limpieza de archivos huérfanos.
- Respaldar imágenes y base de datos en conjunto. Probar recuperación después de reiniciar contenedores.

### Pruebas de aceptación
- Cargar desde móvil y comprobar desde otro navegador con el mismo catálogo.
- Galería, cámara cuando el dispositivo lo permita y orientación vertical/horizontal.
- Archivo corrupto, formato no admitido, peso excesivo y corte de red a mitad de carga.
- Sustitución de imagen, recarga, caché, producto sin foto y eliminación de la asociación.
- Intento de cargar/reemplazar una foto de otro negocio.
- Dos pestañas editan el mismo producto: se detecta conflicto y se conserva la actualización válida.

## Skill reutilizable — después de validar la aplicación

La skill será una herramienta de trabajo en Codex, no una dependencia que el comerciante deba instalar. La app del negocio y su panel funcionarán por sí solos.

Flujo previsto de la skill:
1. Recibir carta PDF/fotos/texto e identidad del negocio.
2. Extraer categorías, productos, variantes, precios e ingredientes con trazabilidad a la fuente.
3. Señalar precios ambiguos y consultar reglas comerciales que no puedan inferirse.
4. Preparar una configuración validada y datos iniciales por negocio usando el mismo esquema, sin copiar precios ni datos bancarios del negocio anterior.
5. Asociar fotografías y dejar vacías las faltantes para que el encargado las cargue desde su móvil.
6. Crear el negocio en el entorno local, ejecutar comprobaciones y presentar la vista para revisión.
7. Preparar el paquete Docker y documentación; desplegar únicamente cuando se solicite en su etapa.

Antes de crearla, estabilizar esquema de catálogo, configuración por negocio, carga de fotos, permisos, migraciones y pruebas. La extracción de una carta no debe inventar información ni sobrescribir un negocio existente por defecto.

## Datos bancarios y configuración autoservicio — avance vigente

- El encargado puede guardar banco, nombre del titular y un destino activo: CLABE, cuenta o tarjeta para recibir transferencias. Se valida formato, no existencia o titularidad bancaria.
- No se solicitan CVV, NIP ni vencimiento. Antes de cambiar destino se exige revisión explícita del encargado.
- Nombre, descripción, WhatsApp, dirección, horario informativo, color de referencia, tiempos orientativos y habilitación/pausa del registro de API también son editables.
- Los pedidos conservan sus datos bancarios y precios históricos. Las ediciones tienen versión e historial; una segunda pestaña no sobrescribe cambios silenciosamente.
- El panel actual usa clave privada de negocio conservada solo en memoria del navegador. Acceso de operadores con cuentas y ciclo de credenciales se completará antes de exposición pública.
- Horario informativo no equivale todavía a apertura/cierre automáticos por calendario. Impuestos, reglas de pago, moneda, cargos y permisos no se cambian arbitrariamente desde el panel.
- Otros datos a contemplar en la plantilla: logo, fotos, instrucciones para recoger y pausas especiales. Se incorporarán según las etapas del plan.
- README.md fue reescrito para distinguir implementado, probado y pendiente, incluyendo comandos de arranque, acceso, pruebas y límites.

## Actualización — 9 de noviembre de 2026

Este apartado sustituye los estados anteriores del registro de avance. Pasos 2 a 6 implementados: carta conectada a API, intentos recuperables, versión de productos, fotos, altas/retiros y categorías, liquidación y ciclo de entrega. Métricas excluyen simulaciones. 30 pruebas frontend y 31 API SQLite aprobadas.

Paso 8 verificado con Docker Desktop: frontend, API y PostgreSQL saludables; 12 clientes simultáneos, 12 reintentos con un único pedido y doble confirmación protegida en PostgreSQL real. Pedido liquidado y foto conservados tras recrear los tres servicios. Respaldo probado y restaurado en base desechable (14 pedidos, uno entregado/liquidado); archivo de fotos validado por SHA-256. Script scripts/backup-local.ps1 y guía vigente en README.

Cliente móvil de 390 px probado con pedido conectado y tres unidades. Negocio de simulación independiente para no alterar datos reales. Docker usa 8080 y su propia base; 5173 conserva desarrollo SQLite independiente, sin migración automática.

Paso 7 continúa pendiente del equipo de impresión. No hay publicación, pagos, ni mensajes reales. Antes del piloto faltan datos reales, logo, fotos propias, ensayo físico móvil/WhatsApp y definir cancelaciones/devoluciones/abandono. Antes del VPS faltan endurecimiento de acceso, HTTPS, migraciones y respaldo externo. Skill reutilizable posterior a estabilizar la plantilla.
