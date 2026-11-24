# Pizzetas — plan de consolidación de la V1

Decisión del propietario, 23 de noviembre de 2026: esta instalación es exclusiva de Pizzetas y será la demostración comercial de la herramienta. No se amplía ahora a cinco negocios. Se conservan los mecanismos existentes de aislamiento y las pruebas separadas; no se borran datos para cambiar el enfoque.

## Criterio de terminado

El encargado puede mantener su carta desde el móvil sin editar archivos: productos, categorías, fotos, precios, presentaciones, opciones y disponibilidad. El cliente ve la carta actual y recibe instrucciones claras. Los pedidos se registran una sola vez; el encargado valida al menos el 50%, acuerda el tiempo y controla preparación, entrega y saldo. Datos y fotos sobreviven a reinicios y se pueden recuperar desde respaldo. La demo pública identifica sus operaciones simuladas.

## Orden de trabajo y aceptación

1. **Autonomía del catálogo.** Auditar altas, edición, retiro, fotos y categorías. Incorporar opciones como Salsa, Marca y Sabor; validar duplicados y vacíos, proteger ediciones simultáneas y pedidos históricos. Después completar reorganización de categorías/productos y revisar el recorrido de edición en móvil. No cambiar reglas de precio arbitrariamente: presentaciones con precios propios; opciones de elección sin recargo.
2. **Acceso del encargado.** Sustituir el token técnico usado en local por inicio de sesión apropiado para la operación: sesión con caducidad, salida, protección contra intentos y procedimiento de recuperación. Inicialmente una persona, conforme a la decisión del propietario. Resolver recuperación y alojamiento antes de habilitar acceso público.
3. **Operación diaria.** Revisar bandeja y actualización de pedidos, validación humana del anticipo, acuerdo de 25–35 minutos o demora informada de 45–50, pedidos programados, estados, saldo y pausas. No prometer tiempo automáticamente por tener hornos ocupados.
4. **WhatsApp y errores.** Probar resumen y confirmación preparados, comprobante adjuntado manualmente por el cliente, dos compradores, doble toque, respuesta perdida, dos pestañas y cambio de precio/disponibilidad. Abrir WhatsApp no acredita envío ni confirma pago. El mensaje automático al cliente requiere una integración distinta y no forma parte del piloto acordado.
5. **Despliegue del piloto.** Elegir alojamiento con el propietario, preparar HTTPS, sesiones, API, PostgreSQL, medios, respaldos externos y recuperación. Ensayo en teléfono físico y pedido completo antes de activar recepción. GitHub Pages mantiene la demo visual hasta autorizar el cambio operativo. Integración de cocina pendiente de datos de impresora.

## Primer incremento

El panel existente ya administra productos, fotos, categorías, precios y disponibilidad. Faltaba administrar los grupos de elección existentes en la carta: Marca, Salsa o Sabor. Se incorpora esa edición con un nombre de grupo y una opción por línea, guardado explícito y hasta 12 grupos de 30 valores. Todos los grupos exigen una elección del comprador; no se añaden recargos ni opciones múltiples en este incremento.

La API conserva las opciones cuando una integración anterior omite `choices`; enviar una lista vacía las retira explícitamente. Se normalizan espacios, se rechazan nombres/valores repetidos o vacíos y se mantiene control de versión. Las instantáneas de pedidos anteriores no se reescriben.

## Mejoras posteriores a la V1

Inventario y capacidad de cocina, varias cuentas y permisos, automatización de WhatsApp, integración de impresora, promociones y recargos por opción, historial/restauración de catálogo y limpieza de fotos antiguas. La skill de reproducción de cartas se prepara después de validar esta instalación con Pizzetas; el comerciante no necesita Codex para mantener su menú.
