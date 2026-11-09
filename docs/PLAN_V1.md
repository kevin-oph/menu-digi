# Plan de trabajo — V1 Pizzetas Artesanales

## Objetivo
Probar con clientes reales un catálogo sencillo para recoger pedidos. La pizzería será el primer piloto de una plantilla que después se adaptará a otros cuatro comerciantes.

## Entorno acordado
Primero implementar y probar localmente. Dockerizar todos los servicios implementados antes de subir al VPS. No publicar ni desplegar en servidores en esta etapa. La primera vista tiene Dockerfile y Compose para frontend; el backend y la base de datos se sumarán cuando se implementen.

## Forma de trabajar
- Completar una etapa y registrar su resultado en BITACORA_PROYECTO.md.
- Consultar las decisiones críticas de operación, precios, seguridad y despliegue antes de implementarlas.
- Usar el menú entregado como fuente; marcar incertidumbres y no inventar precios ni disponibilidad.
- Mantener las ideas V2 separadas de lo aprobado para V1.

## Etapas y entregables

| Etapa | Trabajo | Resultado y criterio de revisión | Estado |
| --- | --- | --- | --- |
| 1. Catálogo y reglas | Ordenar categorías, productos, precios, variantes y condiciones de pago | Catálogo revisable y dudas comerciales identificadas | 119 productos estructurados en el prototipo; revisión comercial pendiente |
| 2. Diseño del pedido | Diseñar menú móvil, selección de tamaño/mitades/extras, carrito y checkout | Prototipo navegable para revisión, sin pedidos reales | Primera implementación local compilada; revisión del usuario pendiente |
| 3. Base técnica | Definir separación de negocios, acceso de administradores y esquema de pedidos | Decisiones documentadas antes de construir React, FastAPI y PostgreSQL | Pendiente |
| 4. Flujo funcional | Conectar catálogo, carrito, registro del pedido y mensaje de WhatsApp | Precios recalculados en servidor y pedido recuperable por el encargado | Pendiente |
| 5. Administración | Editar productos, precios y disponibilidad; configurar negocio y revisar pedidos | Comerciante puede mantener catálogo y validar pagos manualmente | Pendiente |
| 6. Impresión | Recibir modelo, conexión y equipo disponible; integrar autorización e impresión | Pedido autorizado se imprime, con control de fallos y duplicados | Pendiente de datos del equipo |
| 7. Prueba y despliegue | Verificar móvil, cobros, separación de negocios, PWA y Docker/Caddy | Piloto desplegado en VPS, con instrucciones y respaldo | Pendiente de infraestructura y validación |
| 8. Aprendizaje | Recoger problemas de clientes y comerciante | Ajustes de V1 y prioridades V2 basadas en uso real | Pendiente |

## Primera etapa: acuerdos de operación
- Nombre de referencia del menú: Pizzetas Artesanales; archivo definitivo del logo pendiente.
- Colores de referencia: rojo, naranja coral, blanco y gris oscuro del logo del PDF.
- Solo recoger en el negocio.
- Incluir alimentos, postres y bebidas alcohólicas del menú; excluir cenas románticas y paquetes de pedida de mano.
- Para comenzar a preparar cualquier pedido es obligatoria una transferencia de al menos el 50% del total, incluidos postres y bebidas. El cliente puede transferir el 100%. Esta es la regla vigente y sustituye la posibilidad anterior de iniciar pedidos sin anticipo.
- El cliente envía el comprobante por WhatsApp. Una persona verifica que recibió al menos el anticipo mínimo antes de autorizar la preparación y el paso a cocina. Abrir WhatsApp o recibir una imagen no acredita el pago.
- El saldo puede liquidarse al recoger en efectivo, transferencia o tarjeta en el negocio. La app no procesa cobros de tarjeta en línea. No habilitar preparación de pedidos sin anticipo validado.
- WhatsApp es el canal de coordinación y envío del comprobante, no un procesador de pagos.
- Dos mitades: cobrar el precio completo más alto entre ambas especialidades para el tamaño seleccionado.
- Ingrediente extra: $30 por ingrediente. Falta precisar unidad de cobro si se coloca solo en una mitad; no aplicar cargos duplicados sin confirmación.
- Personalizaciones muy fuera de la oferta se atienden con una persona; no se calcula automáticamente una pizza libre con un precio base inventado.
- La lista concreta de ingredientes seleccionables aún debe aprobarse.

## Decisiones necesarias para avanzar
1. Revisar el diseño móvil y aprobar catálogo y opciones antes de habilitar pedidos reales. Anticipo del 50% por transferencia y saldo en efectivo, transferencia o tarjeta al recoger ya están confirmados.
2. Extras: confirmar si los $30 aplican por ingrediente por pizza, aunque se use solo en una mitad, y confirmar cuáles pueden seleccionarse.
3. Operación: proporcionar teléfono WhatsApp, dirección, horario, tiempos de preparación y datos bancarios antes de activar pedidos reales.
4. Administración: acordar usuarios y separación de datos antes de implementar autenticación.
5. Infraestructura e impresión: completar sus detalles antes de integrar y desplegar.

## Verificación mínima del piloto
- Tamaño y mitades calculan correctamente el precio; extras y cantidades se reflejan en el total.
- Postres y bebidas se incluyen en la misma cuenta.
- El mensaje de WhatsApp coincide con el pedido registrado e indica forma de pago.
- Abrir WhatsApp no marca el pedido como enviado, pagado ni confirmado automáticamente.
- Registrar por separado total, importe confirmado y saldo pendiente. Un anticipo no equivale a liquidación total.
- No autorizar preparación con menos del 50% del total confirmado por una persona. El total y el mínimo deben calcularse en servidor, con importes monetarios exactos.
- Un pedido no se registra como totalmente pagado hasta confirmar su liquidación.
- Un comerciante no puede consultar ni editar información de otro negocio.
- Se verifican recepción, autorización e impresión cuando el equipo esté disponible.

## Límites actuales
Existe frontend local de demostración, backend y panel inicial. La API fue probada con SQLite y aún no está conectada a la carta del cliente; no hay despliegue. El objetivo de menos de 1.5 segundos se medirá; no se afirma cumplido. Docker no está disponible en este equipo: Compose de frontend/API/PostgreSQL preparado, ejecución pendiente. El catálogo requiere revisión comercial antes de recibir pedidos reales.

## Plan de mejoras vigente

Continuar con PLAN_MEJORAS_V1.md: detalla cierre, concurrencia, errores, panel, fotos móviles, Docker y futura skill. El primer paso de cierre local ya fue implementado y verificado; registro real y panel siguen pendientes. Confirmaciones por WhatsApp serán enviadas por un encargado inicialmente. La solicitud de recolección puede ser inmediata o a una hora; el tiempo definitivo depende de cocina y se acuerda con el cliente.

## Actualización de backend y panel

Se implementaron la API de registro idempotente y el panel inicial con datos bancarios y del negocio editables, más edición básica de productos. Pasaron 20 pruebas API SQLite y 23 frontend. Pendiente conectar la carta al servidor y probar PostgreSQL/Docker. Los detalles vigentes están en PLAN_MEJORAS_V1.md y en README.md del proyecto.
