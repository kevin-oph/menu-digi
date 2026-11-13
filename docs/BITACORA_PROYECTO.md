# Bitácora — menu-digital-whastapp-plantilla

Última actualización: 7 de noviembre de 2026.

## Propósito

Construir una V1 que comerciantes locales puedan probar con clientes reales. Usar lo aprendido para desarrollar una plantilla reutilizable y posteriormente ampliar su alcance a nivel estatal.

Este archivo se actualizará conforme avance el proyecto. Distingue trabajo realizado, acuerdos, pendientes e ideas; una propuesta no equivale a una función implementada.

## Estado actual

Fase: carta móvil revisada por el usuario; backend y panel inicial locales, integración cliente pendiente.

Existe frontend de demostración y backend FastAPI con panel local inicial en outputs/pizzetas-v1. Compilación y 23 pruebas frontend + 20 API pasaron; API probada con SQLite aislado. Compose incluye frontend, API y PostgreSQL, sin arranque verificado porque Docker no está instalado. La carta aún no está conectada al registro real; fotos, impresión y despliegue pendientes. Las entradas siguientes conservan el historial; las aclaraciones posteriores prevalecen.

## Acuerdos confirmados

- Proyecto independiente de catalogo-ventas.
- El piloto inicial contempla cinco negocios: pizzería, artículos para eventos, tienda de variedad, artículos para fiestas infantiles y ropones.
- Se empezará por la pizzería.
- Cada negocio tendrá su propio enlace e identidad y un catálogo adaptado a sus categorías y productos.
- El usuario proporcionará la información inicial de los negocios.
- Los comerciantes actualizarán sus productos desde un panel simple, sencillo y bonito.
- La V1 permitirá únicamente recoger en el negocio.
- El método de pago será transferencia bancaria.
- El cliente enviará el comprobante por WhatsApp.
- La validación del pago será humana. Recibir una imagen no equivale a verificar el abono.
- La preparación en cocina debe comenzar después de la validación del pago.
- Los pedidos de la pizzería deben llegar a la impresora de cocina.
- Los datos de las impresoras se proporcionarán al final. Su integración queda pendiente; no se presupone marca, conexión ni equipo auxiliar.
- Las reglas de pago y entrega también aplicarán inicialmente a las otras tiendas. Sus cambios futuros corresponderán al administrador del sistema.
- El diseño debe ser novedoso, simple y casual, con información clara que transmita confianza.
- Consultar al usuario antes de tomar decisiones críticas.

## Base técnica solicitada

La especificación inicial solicita React, Tailwind CSS y Framer Motion; FastAPI con Pydantic y SQLAlchemy/SQLModel asíncrono; PostgreSQL; Docker Compose y proxy inverso con SSL automático; soporte PWA y documentación de instalación.

El alojamiento objetivo es infraestructura propia en un VPS. La organización de las instancias o de los datos de varios negocios está pendiente de decisión; no se ha seleccionado todavía una arquitectura multiinquilino.

## Flujo funcional de referencia

1. El cliente consulta el catálogo del negocio.
2. Selecciona productos y, si corresponden, variantes o extras.
3. Revisa cantidades y total en el carrito.
4. Proporciona nombre, teléfono y hora estimada para recoger.
5. Consulta los datos bancarios y realiza la transferencia.
6. Envía el pedido y el comprobante por WhatsApp.
7. Una persona revisa el pago antes de autorizar la preparación.
8. El pedido autorizado llega a cocina mediante impresión, con el mecanismo aún por definir.

El enlace de WhatsApp puede preparar el texto, pero no forzar que el cliente adjunte una imagen ni confirmar que envió el mensaje. Falta acordar cómo se registrará la autorización del encargado y cómo se vinculará con la impresión.

## Registro de avances

| Fecha | Trabajo realizado | Resultado |
| --- | --- | --- |
| 2026-11-07 | Lectura de la especificación técnica adjunta | Identificados stack, catálogo, carrito, checkout, administración y entregables solicitados. |
| 2026-11-07 | Aclaración del objetivo comercial | Piloto local de cinco negocios, empezando por la pizzería. |
| 2026-11-07 | Definición de pago y entrega | Recoger en negocio, transferencia, comprobante por WhatsApp y validación humana. |
| 2026-11-07 | Identificación de dependencia de impresión | Integración aplazada hasta recibir detalles del equipo. |
| 2026-11-07 | Creación de esta bitácora | Acuerdos, pendientes y propuestas V2 documentados. |

## Siguientes pasos

- Recibir nombre, menú, categorías, tamaños, precios y extras de la pizzería.
- Recibir logotipo o referencias visuales, si existen; acordar el estilo antes de fijar la identidad.
- Identificar horario, dirección y reglas de recolección.
- Definir qué puede editar el comerciante y qué queda reservado al administrador del sistema.
- Preparar una propuesta visual para revisar el catálogo, selección de pizza, carrito y checkout.
- Acordar el registro de pedidos y la acción de validación humana antes de implementar ese flujo.
- Definir acceso al panel y separación de datos entre negocios antes de implementar la administración.
- Confirmar disponibilidad de VPS y dominio antes del despliegue.
- Recibir detalles de la impresora y acordar el mecanismo de impresión al final.

## Posibles mejoras para V2 — propuestas sin aprobar

| Idea | Beneficio esperado | Dependencia o criterio para considerarla |
| --- | --- | --- |
| Entrega a domicilio | Ampliar cobertura | Validar demanda, zonas, costos y operación de reparto. |
| Más métodos de pago | Facilitar compras | Autorización del administrador y experiencia del piloto. |
| Inventario y disponibilidad por variante | Reducir pedidos de productos agotados | Confirmar necesidades reales de cada giro. |
| Horarios y capacidad por franja de recolección | Evitar saturación en cocina | Medir tiempos de preparación y volumen. |
| Notificaciones de pedido listo | Mejorar la recolección | Elegir canal, consentimiento e integración. |
| Automatización mediante WhatsApp Business Platform | Reducir tareas manuales | Evaluar costos, requisitos y utilidad tras el piloto. |
| Pantalla de cocina y reimpresión controlada | Facilitar operación y recuperación de fallos | Conocer equipo y resultados de impresión de V1. |
| Cotizaciones y fecha de evento | Adaptar el flujo a tiendas de eventos | Validar catálogo y operación de esos negocios. |
| Incorporación guiada de nuevos comerciantes | Agilizar expansión estatal | Estabilizar la plantilla con los primeros cinco negocios. |
| Métricas de conversión y recompra | Identificar mejoras comerciales | Distinguir pedidos registrados, pagos confirmados y ventas completadas. |

## Criterios de seguimiento del piloto

Propuesta a acordar: observar si el cliente completa el pedido sin ayuda, si el comerciante actualiza un producto sin asistencia, qué dudas aparecen en el pago y qué fallos ocurren al recibir o imprimir pedidos. No hay todavía resultados medidos ni metas numéricas aprobadas.

## Verificaciones y límites

- La especificación se leyó desde el archivo adjunto del usuario.
- La carpeta del proyecto estaba vacía salvo outputs/ y work/ al iniciar esta bitácora.
- Node.js y Python están disponibles en el equipo; Docker no se encontró como comando disponible.
- No se ha verificado rendimiento, funcionamiento en móviles, impresión ni despliegue.
- No se han configurado datos bancarios, números de WhatsApp ni credenciales reales.

## Cómo mantener este archivo

En cada avance, registrar el trabajo efectivamente realizado y su verificación, actualizar los pendientes y separar las nuevas propuestas V2 de los requisitos aprobados. Documentar cualquier decisión crítica junto con su confirmación. No guardar contraseñas ni secretos aquí.

## Avance: recepción del menú de Pizzetas Artesanales

- Recibido y leído el PDF Menú Pizzetas 2026 (16 páginas). Se generó MENU_EXTRAIDO.md como referencia de trabajo, sin convertirlo aún en catálogo aprobado.
- Revisadas visualmente portada, primera página de pizzas, postres y bebidas para comprobar identidad, columnas de precios y condiciones.
- Nombre visible en la portada: Pizzetas Artesanales. Logo definitivo pendiente por indicación del usuario.
- Referencia cromática autorizada: colores del logo visible en el PDF — rojo, naranja coral, blanco, gris oscuro y café del horno. No se han fijado códigos de color definitivos.
- Identificadas 15 pizzas con tamaños personal y grande; además pastas, empanadas, ensaladas, tapas, snacks, mixes, hamburguesas, postres, café/frappes, bebidas, menú infantil y paquetes de eventos.
- Pendiente confirmar si bebidas alcohólicas y paquetes de cenas románticas/pedida de mano se ofrecen en este flujo para recoger. No se incluyen ni descartan automáticamente.
- En postres y café/frappes aparece la leyenda EFECTIVO. Confirmar si la transferencia obligatoria de la app sustituye esa condición para pedidos digitales.
- Pendiente confirmar si las pizzas permiten mitades y cómo se cobran; tamaños en centímetros, extras permitidos y alcance de los precios de ingrediente extra ($30) y toppings/aderezos ($20). No se extrapolan a todo el menú.
- No se ha implementado todavía la aplicación ni modificado el documento original.

## Avance: reglas de catálogo y personalización confirmadas

- Incluir bebidas alcohólicas en el catálogo de la V1.
- Excepción a la regla general de transferencia: los postres pueden pagarse al recoger. El usuario también mencionó pago «por WhatsApp»; falta precisar si significa transferencia coordinada por ese canal. Esta aclaración posterior prevalece sobre la regla general inicial para postres.
- Se permiten pizzas de dos mitades. Para un mismo tamaño se cobra el precio completo de la especialidad de mayor precio entre las dos elegidas; no se promedian precios ni se suman dos pizzas completas. Ejemplo de referencia del PDF: personal Peperoni ($150) + personal Boneless ($185) = $185 antes de extras.
- Se desea permitir personalización con ingredientes habituales o presentes en otras especialidades. La lista concreta, disponibilidad y cargos aún deben confirmarse; no asumir que todos los ingredientes, incluidos los de mayor costo, tienen el mismo cargo.
- Pendiente definir el cálculo en pizzas personalizadas: precio base, cargo por ingrediente, aplicación por mitad o pizza completa y posibles diferencias por tamaño.
- Pendiente definir en pedidos mixtos si solo se transfiere el subtotal de productos que requieren prepago y los postres quedan como saldo por cobrar al recoger, así como cuándo se autoriza su preparación.
- Pendiente confirmar si los paquetes de cenas románticas y pedidas de mano quedan fuera del flujo para recoger; fue propuesto, pero no confirmado.
- No se han implementado estas reglas todavía.

## Avance: plan de ejecución y comienzo de etapa 1

- Creado PLAN_V1.md con etapas, entregables, verificaciones y decisiones pendientes.
- Iniciada etapa 1: CATALOGO_PIZZAS_V1.md contiene las 15 especialidades y sus 30 precios por tamaño, transcritos de las páginas 2 y 3. El resto del menú está extraído como referencia, pero aún no estructurado ni aprobado para publicación.
- Actualización confirmada por el usuario: pizza, postres y otros productos pueden pagarse en efectivo o transferencia; postres agregados forman parte de la misma cuenta. Esto sustituye las restricciones de pago anotadas anteriormente; las entradas anteriores se conservan como historial.
- Cada ingrediente extra cuesta $30. Aún falta precisar aplicación por mitad y lista seleccionable.
- Pizzas muy fuera de la oferta deben canalizarse a atención humana; no se implementará un precio base libre sin acuerdo.
- Excluir cenas románticas y paquetes de pedida de mano de V1.
- Pendiente acordar cómo pasa a cocina un pedido en efectivo. No asumir confirmación de pago ni impresión automática por abrir WhatsApp.
- Primera etapa iniciada; no hay frontend, backend ni despliegue implementados todavía.

## Regla vigente de pago: anticipo obligatorio

Aclaración posterior del usuario, que prevalece sobre las notas anteriores de pago:

- En V1 el cliente debe transferir al menos el 50% del costo total del pedido antes de comenzar la preparación. No se permite comenzar con pago exclusivamente en efectivo.
- El total incluye todos los productos agregados, incluidos postres y bebidas. Se permite transferencia del total, pues el 50% es el mínimo.
- El comprobante se envía por WhatsApp y la validación sigue siendo humana. Solo tras verificar el importe recibido se autoriza el paso a cocina.
- Registrar total, anticipo confirmado y saldo pendiente por separado. Un pedido con anticipo validado no debe aparecer como totalmente pagado.
- Pendiente confirmar si el saldo puede liquidarse en efectivo o transferencia al recoger.
- Actualizado PLAN_V1.md para reflejar esta regla. No hay lógica de cobro ni de impresión implementada todavía.

## Avance: primera vista móvil local y contenedor de frontend

### Acuerdos nuevos
- El saldo restante se puede pagar en efectivo, transferencia o tarjeta al recoger. El anticipo obligatorio del 50% por transferencia se mantiene.
- El enfoque visual será mobile-first con el criterio «menos es más».
- Trabajar primero localmente, dockerizar el conjunto antes de subir al VPS y no publicar en esta etapa.

### Implementado
- Proyecto React, Tailwind CSS y Framer Motion en outputs/pizzetas-v1.
- 119 productos en ocho categorías a partir de las páginas 2–14 del menú; incluyen bebidas alcohólicas y excluyen eventos.
- Fotografías extraídas del PDF y optimizadas a WebP; no se añaden imágenes externas. Identidad tipográfica provisional, sin incorporar el logo definitivo.
- Menú adaptable, categorías fijas con seguimiento de scroll, búsqueda por texto sin acentos y modo claro/oscuro.
- Selección de tamaños, dos mitades al precio mayor, opciones de productos y extras a $30 aplicados a toda la pizza en esta propuesta. No se habilita colocación ni cobro de extras por mitad sin confirmación.
- Carrito con cantidades, eliminación y persistencia local de productos. Datos del cliente no persistidos en localStorage.
- Checkout con nombre, teléfono, hora solicitada, anticipo mínimo 50% o pago total, desglose del saldo y mensaje del pedido.
- Sin banco, CLABE ni WhatsApp configurados, únicamente permite copiar el mensaje de prueba. No registra pedidos reales ni confirma transferencias.
- Dockerfile de varias etapas y Compose para frontend con Nginx sin privilegios, puerto solo local y healthcheck. README con instrucciones Docker y desarrollo.

### Verificación realizada
- npm install completado tras autorizar acceso a red para dependencias.
- Nueve pruebas de reglas monetarias y mensaje pasaron; incluyen cálculo de mitades en ambos órdenes, extras, pedido mixto, anticipo y rechazo de opciones inválidas.
- npm run build completado: JavaScript ~403 kB (128 kB gzip), CSS ~30 kB (7 kB gzip), sin contar imágenes. Estas cifras no demuestran rendimiento 4G.
- La revisión visual en navegador está en curso; el primer acceso al servidor aislado agotó el tiempo de conexión. No marcar QA móvil como completada sin una vista accesible.
- Docker no está disponible en el equipo, por lo que el contenedor no se ha construido ni arrancado. FastAPI y PostgreSQL todavía no están implementados ni incluidos en Compose; se integrarán antes del despliegue.

### Próximos pendientes
- Revisar vista móvil con el usuario y confirmar opciones ambiguas del menú (combinaciones, porciones, sabores disponibles y aderezos).
- Validar lista de ingredientes extra. En esta propuesta se deriva de las especialidades del menú, sin afirmar disponibilidad real.
- Definir arquitectura de negocios y acceso al panel antes de backend; recibir datos reales antes de activar envíos.
- Incorporar backend y PostgreSQL en Docker y verificar el conjunto localmente.
- Recibir datos de impresión al final, según lo acordado.

### Ideas nuevas para V2, sin aprobar
- Recordar favoritos en el dispositivo sin requerir cuenta.
- Repetir una combinación de pizza anterior.
- Accesos QR por negocio con el mismo catálogo actualizable.

## Correcciones tras revisión del usuario — 8 de noviembre de 2026

- Corregido el selector de cantidad: los botones + y − ahora tienen type="button". Antes el navegador los trataba como submit dentro del formulario, lo que agregaba el producto y cerraba la selección. Solo «Agregar» envía el formulario.
- Ajustado también el tipo explícito del botón de cierre para evitar envíos accidentales si se reutiliza dentro de formularios.
- Mejorado «Copiar pedido de prueba»: muestra confirmación persistente junto al botón y abre el texto del pedido para revisión. La copia de prueba no exige marcar la confirmación de envío de comprobante; dicha confirmación sigue siendo necesaria para el enlace de WhatsApp real.
- Si el portapapeles no existe, rechaza el permiso o no responde en 1.8 segundos, el texto queda visible y seleccionable, con instrucciones de copia manual. No se anuncia éxito si no hubo respuesta del navegador.
- Verificación en navegador: aumentar de 1 a 5 piezas mantuvo la selección abierta y mostró $750 para Peperoni personal; reducir volvió a 4. Repetido aumento a 5 en pantalla móvil de 390 px. El carrito del usuario permaneció en sus 7 productos originales; no se añadieron ni quitaron productos de su prueba.
- Verificación de checkout con datos ficticios: «Copiar pedido de prueba» habilitado, mensaje visible, confirmación visible y contenido del portapapeles idéntico al mensaje mostrado. No se enviaron mensajes a terceros.
- Compilación de producción completada y 14 pruebas automatizadas aprobadas (9 de pedido y 5 de portapapeles). Corregido el comando npm test para evitar el glob no expandido en Windows.
- Reiniciado el servidor de desarrollo en 127.0.0.1:5173: la pestaña conservaba una vista anterior, pero el proceso ya no estaba activo.
- Guardadas capturas CANTIDAD_CORREGIDA.jpg y COPIA_PEDIDO_CORREGIDA.jpg en outputs/.
- WhatsApp sigue pendiente de configurar con el número real del negocio. La integración prevista usa un enlace oficial wa.me con texto preparado: el cliente debe enviarlo y adjuntar su comprobante, y el encargado debe validar el abono. No se confirma automáticamente un pago.
- No se modificaron reglas de precios, anticipo, datos bancarios, infraestructura ni impresión en esta corrección.

## Revisión del cierre de pedido y confirmación al cliente

- El usuario solicita que el flujo no termine en una ventana de copia: desea un cierre claro y una copia del pedido con confirmación por WhatsApp.
- Estado actual: «Copiar pedido de prueba» solo prepara/copia el texto. No registra un pedido, no envía mensajes y no verifica una transferencia. Mantener el texto visible tras copiar permite revisarlo; falta una pantalla final específica del flujo real.
- Flujo propuesto para V1: preparar resumen, abrir WhatsApp, cliente envía pedido y adjunta comprobante, encargado valida anticipo, responde con confirmación y copia del pedido, y autoriza cocina.
- Abrir el chat no demuestra que el cliente haya enviado el pedido. La pantalla de retorno debe conservar el resumen y mostrar «Pendiente de validación», sin afirmar envío, pago ni confirmación automática. No borrar el carrito solo por abrir WhatsApp.
- La confirmación al cliente debe distinguir total, anticipo recibido, saldo y hora acordada para recoger. Solo usar «Pedido confirmado» después de validar el abono.
- Para V1, la respuesta puede enviarse manualmente por el encargado mediante un mensaje preparado. Automatizar el envío posterior a su validación requiere integrar WhatsApp Business Platform y backend; no está implementado con el enlace wa.me actual.
- La foto del comprobante la adjunta el cliente en el chat. El enlace actual prepara texto, no adjunta una imagen automáticamente.
- Esta entrada documenta la mejora solicitada y sus límites. No se modificó todavía la implementación del cierre ni se habilitaron mensajes automáticos.

## Plan de mejoras, concurrencia y fotos móviles

- Creado PLAN_MEJORAS_V1.md: etapas, garantías por verificar y matriz de fallos para pedidos simultáneos, doble clic, reintentos, cambios de precio, falta de red, pagos y edición concurrente.
- Confirmado por el usuario: un encargado inicialmente, validación humana y envío manual de una respuesta preparada por WhatsApp.
- Confirmada operación de cocina: referencia habitual 25–35 minutos desde confirmación; con saturación, tiempo propuesto por el encargado y aceptado por el cliente. Se añadieron «Lo antes posible» y «Solicitar una hora» a la interfaz; ningún tiempo queda confirmado automáticamente.
- Implementado el primer paso: resumen local final con referencia, copia descargable, retorno al menú, recuperación durante la sesión y conservación del carrito. No es un pedido registrado ni una confirmación de pago.
- Se agregó src/draft.mjs y pruebas de instantánea, referencias independientes, reutilización del mismo resumen, recuperación, datos corruptos, importes inconsistentes y almacenamiento bloqueado. La recuperación del resumen se limita a la sesión y a 24 horas; no es la caducidad comercial de un pedido.
- Dependencias de FastAPI, SQLAlchemy, asyncpg y pruebas instaladas en work/pydeps para preparar el backend. Aún no existe una API de registro implementada ni una prueba de concurrencia contra PostgreSQL real.
- El usuario solicita fotos administrables por el encargado desde móvil. Se incorporó a V1: cámara/galería, previsualización, carga autenticada, almacenamiento persistente por negocio, optimización y manejo de errores. La carga de fotos todavía no está implementada.
- Objetivo posterior confirmado: una skill de Codex para preparar nuevas cartas sobre la misma plantilla. No se creó la skill todavía; se desarrollará al estabilizar la aplicación y su esquema configurable.

### Verificación del primer paso del plan de mejoras

- Compilación del frontend completada tras incorporar resumen final y opciones de recolección.
- 23 pruebas automatizadas aprobadas: precios/pedido, portapapeles y resumen de sesión; incluyen la opción «Lo antes posible» sin prometer una hora.
- Recorrido de navegador: solicitud a las 20:00 reflejada en resumen; opción inmediata reflejada como tiempo por confirmar.
- Comprobada copia del resumen y descarga .txt con advertencia explícita de que no confirma pedido ni pago.
- Comprobado retorno al menú, recuperación después de recargar con la misma referencia y conservación de los 10 productos que tenía el carrito del usuario en esa revisión. No se enviaron pedidos ni se validaron pagos.
- Revisado diseño móvil a 390 px y guardada RESUMEN_FINAL_MOVIL.jpg en outputs/.
- Guardar un resumen local no demuestra concurrencia de servidor: registro idempotente y pruebas PostgreSQL continúan pendientes en el paso 2.

## Avance: datos bancarios, backend y panel local

### Solicitud y decisiones
- El usuario aprobó el cierre revisado y solicita que cada negocio edite sus datos bancarios desde el panel.
- Implementado un destino activo con banco, titular y CLABE/cuenta/tarjeta para recibir transferencias. No se piden NIP, CVV ni vencimiento. Validación de formato únicamente.
- Agregados al panel nombre, descripción, WhatsApp, dirección, horario informativo, color de referencia, tiempos orientativos y pausa/habilitación del registro de API.

### Código entregado
- FastAPI asíncrono, Pydantic, SQLAlchemy y compatibilidad asyncpg para PostgreSQL. Modelos de negocios, productos, pedidos, versión de esquema e historial.
- Registro transaccional de pedidos con folios únicos, clave de idempotencia por negocio, control de cambios de precio/disponibilidad y copia de precios/datos bancarios por pedido.
- Acceso de cliente con token específico de pedido; acceso administrativo por clave de negocio. Sin claves compartidas en código ni contraseñas por defecto.
- Validación humana del anticipo mínimo y acuerdo de recolección; versión esperada para evitar confirmaciones duplicadas. Generación de respuesta preparada, sin envíos automáticos.
- Panel /admin con configuración, edición básica de productos y consulta/confirmación de pedidos registrados. Carga del panel separada de la carta.
- Script local de configuración privada y runner de API solo en loopback con SQLite en work/local-api.
- Compose ampliado con frontend, API y PostgreSQL, volumen, healthchecks y API detrás de Nginx. Dependencias Python bloqueadas y esquema inicial init.sql exportado; ejecución en PostgreSQL pendiente.

### Verificación
- 20 pruebas API aprobadas con SQLite: 12 compradores simultáneos con folios separados, 12 reintentos con un único pedido y evento, dos confirmaciones que aplican una sola validación, versiones de configuración, acceso por negocio y persistencia histórica del destino bancario.
- 23 pruebas frontend aprobadas y compilación completada.
- Navegador: acceso al panel, selección de tipo tarjeta, guardado de datos ficticios y recuperación desde servidor. Datos ficticios retirados al terminar; banco final vacío y recepción de pedidos deshabilitada.
- Verificado guardado de un producto sin cambiar su contenido y lista de pedidos vacía, sin convertir resúmenes locales en pedidos.
- Revisado panel móvil a 390 px. Guardada PANEL_DATOS_BANCARIOS_MOVIL.jpg con datos ficticios para mostrar el formulario.
- No se realizaron transferencias, envíos de WhatsApp ni despliegues.

### Documentación y límites
- README.md reescrito con estado real, comandos de instalación local/Docker, acceso al panel, campos configurables, reglas, pruebas y pendientes.
- La carta sigue usando catálogo/configuración de demostración. Conectar esa vista al servidor es el siguiente paso: editar el panel aún no cambia la carta del cliente.
- No se han probado contenedores ni PostgreSQL real; tampoco hay todavía fotos móviles, edición de categorías, alta/baja de productos, liquidación de saldo desde panel, impresión, backups ni ciclo completo de producción.
- Los números de pedidos concurrentes son escenarios de pruebas SQLite, no una promesa de capacidad o rendimiento en VPS.

## 9 de noviembre de 2026 — Carta conectada y Docker verificado

- Carta del cliente conectada a catálogo, configuración y pedidos de API. Registro previo a transferencia; recuperación de intento ante respuesta perdida, versiones de productos y artículos por revisar en carrito.
- Panel ampliado con fotos desde cámara/galería, optimización y retiro; productos, presentaciones y categorías; liquidación de saldo, preparación/listo/entrega y métricas excluyendo pruebas.
- Configuración de simulación por negocio. Ensayos independientes de la pizzería real, que permanece pausada y sin datos bancarios inventados.
- Docker Desktop ya instalado y motor Linux operativo. Se construyeron frontend/API; PostgreSQL 16 y los tres healthchecks funcionan. Puerto local 8080; 5173/SQLite sigue siendo independiente.
- Dependencia Pillow incluida en lock; volumen persistente de fotos, proxy /media y límite de carga configurados.
- 30 pruebas frontend y 31 API SQLite aprobadas. Compilación de producción exitosa.
- PostgreSQL real: 12 clientes con folios distintos, 12 reintentos con un solo pedido, doble confirmación con un solo abono y ciclo completo de saldo/entrega.
- Recreación de todos los contenedores: pedido entregado y foto preservados con hash idéntico.
- Script de respaldo con pausa breve de API, copia de PostgreSQL, fotos, claves y checksums. Restauración aislada recuperó 14 pedidos, uno entregado/liquidado; foto del archivo validada con SHA-256 idéntico. Base operativa no reemplazada.
- Navegador: cantidad de tres unidades sin cierre accidental y pedido conectado con folio. Revisión de cierre móvil a 390 px; captura PEDIDO_DOCKER_MOVIL.png.
- README actualizado con comandos, estado real, separación de bases, respaldo, límites y pendientes. Sin publicación, pagos ni WhatsApp reales. Impresora y ensayo físico del teléfono pendientes; skill reutilizable aún no creada.

## 9 de noviembre de 2026 — Preparación de GitHub y demo gratuita

- Usuario autorizó subir el proyecto a kevin-oph/menu-digi y eligió demo visual gratuita.
- Preparada compilación estática build:demo con rutas compatibles con /menu-digi/, catálogo y fotos locales, datos ficticios precargados, sin API, panel, pagos, WhatsApp ni service worker de operación.
- Recorrido comprobado en navegador: selección, carrito, borrador y resumen final a 390 px. Captura DEMO_PUBLICA_MOVIL.png.
- Workflow de GitHub Pages para pruebas/compilación/publicación. Proyecto Docker completo conserva compilación normal.
- Repositorio local inicializado y archivos auditados para excluir .env, secretos, bases, respaldos y dependencias. Documentación del proyecto incorporada en docs.
- La primera consulta del conector GitHub devolvió 404 por falta de acceso al repositorio; Git solicitó autenticación. No declarar subida ni demo pública completadas hasta verificar el resultado remoto.

## 9 de noviembre de 2026 — Fotos de productos desde Facebook

- Fanpage indicada por el usuario: https://www.facebook.com/pizzetasartesanales . Acceso público sin iniciar sesión; descargadas imágenes desde el visor ampliado.
- Primer lote: 32 archivos revisados y 18 fotos de alimentos/bebidas seleccionadas, separando personas, decoración, eventos y anuncios. No es todo el historial de Facebook.
- Entrega local: FOTOS_FACEBOOK_PIZZETAS.zip, hoja VISTA_PREVIA.jpg e índices CSV/JSON con resolución, origen y SHA-256. ZIP comprobado sin errores; fotos de al menos 1086 píxeles por lado.
- Agrupación: 8 bebidas, 5 postres, 4 pizzas/snacks, 1 ensalada. Nombres descriptivos orientativos; confirmar especialidades exactas antes de asignar.
- No se modificó el catálogo, no se asignaron imágenes automáticamente y no se publicaron estos archivos en GitHub.

## 9 de noviembre de 2026 — Fotos incorporadas a carta local

- Usuario autorizó asignación provisional de las 18 fotos a los productos más parecidos y marcarlas como orientativas.
- Respaldo coherente de PostgreSQL, fotos y claves antes del cambio, conservado en work/antes-fotos-facebook.
- Carga por API administrativa con versión esperada, optimización y etiquetas «Foto orientativa». No se renombraron los productos ni se cambiaron precios, variantes, ingredientes, disponibilidad ni configuración del negocio.
- Verificación: 18 fotos y sus 18 miniaturas accesibles; 119 productos conservados; comparación de todos los precios/opciones aprobada.
- Navegador móvil: fotos de crepa y pan de elote visibles y pan de elote cargado con ancho natural de 360 px. Captura FOTOS_CARTA_LOCAL_MOVIL.png.
- Tabla de correspondencias en ASIGNACION_FOTOS_CARTA.md. Cambios en base Docker local; demo estática pública y seed original sin modificar.

## 9 de noviembre de 2026 — Sección Cervezas

- Usuario confirmó conservar exclusivamente cervezas, sin tarro preparado.
- Categoría visible Bar renombrada a Cervezas (se conserva su identificador interno para mantener referencias).
- Disponibles únicamente Cerveza 355 ml, Cerveza mega, Bohemia y Modelo Especial. Los otros 40 productos de esa categoría quedaron desactivados, conservando su información e historial.
- Aplicado en PostgreSQL local mediante API con control de versión. Respaldo de estado anterior en work/importacion-facebook/carta-antes-solo-cervezas.json. Comparación verificó precios, fotos, opciones y demás categorías sin cambios.
- Catálogo base y seed actualizados para nuevas instalaciones y demo estática. 30 pruebas frontend aprobadas y compilación de demo exitosa.

## 9 de noviembre de 2026 — Imagen de pizza de dos mitades

- Sustituida la imagen de rebanada por la fotografía de pizza de dos mitades proporcionada por el usuario.
- Fotografía original conservada; encuadre elíptico, sombra y composición realizados en CSS sin regenerar ingredientes ni editar el archivo original.
- Escritorio: texto a la izquierda y pizza protagonista a la derecha. Móvil: texto y botón arriba, pizza amplia debajo, sin superponer el texto sobre la comida.
- Revisado en navegador a 390 px y escritorio; capturas PIZZA_MITADES_MOVIL.png y PIZZA_MITADES_ESCRITORIO.png. Compilación de demo aprobada.
- No se modificaron productos, precios, pedidos ni datos de configuración.

## 9 de noviembre de 2026 — Fotos propias de carpeta PIZZETAS

- Revisados visualmente 20 archivos de la carpeta indicada por el usuario.
- Cargadas 14 fotos identificadas por nombre en 9 pizzas, Cheese burger, Onion rings burger, Costillitas mix, Fungi y Pizza mix. Guardadas por API con control de versión y optimización.
- Retiradas etiquetas provisionales anteriores de los productos ahora identificados. Conservados precios, variantes, nombres, disponibilidad y opciones; 28 recursos de foto/miniatura comprobados.
- Estado previo guardado en work/fotos-carpeta-pizzetas/antes.json. Correspondencias en ASIGNACION_CARPETA_PIZZETAS.md.
- BURGER.jpg y PIZZA.jpg pendientes de identificación por el usuario. Cenas románticas, CLERICOT y TARDES fuera de fichas del catálogo vigente. Fuente original intacta.
- Aplicado solo a la carta local de Docker; sin publicación de estas fotos en la demo estática.

## 10 de noviembre de 2026 — Fotos nuevas y mojitos

- Revisadas 15 fotos nuevas de PIZZETAS; cargadas 14 en sus productos por API y control de versión. boneless-snack.jpg elegida para Boneless; boneless.jpg conservada como alternativa.
- Mojito habilitado junto a las cuatro cervezas; sección renombrada «Cervezas y mojitos». Conservadas variantes Frutal $110 y Frapeado $120 y sabores del menú. Ninguna otra bebida del bar reactivada.
- Comprobadas 28 imágenes (fotos y miniaturas), precios, opciones, nombres y demás disponibilidades. Estado previo guardado en work/fotos-nuevas-20261110/antes.json.
- BURGER.jpg, PIZZA.jpg, CLERICOT.jpg y TARDES.jpg omitidos según respuesta del usuario, igual que cenas románticas.
- Cambios de datos en carta local Docker, sin modificar el catálogo estático de la demo pública. Correspondencias en ASIGNACION_FOTOS_NUEVAS_20261110.md.

## 10 de noviembre de 2026 — Sincronización de demo y repositorio

- Usuario solicitó subir los cambios acumulados y ampliar la presentación en github.io. Exportada instantánea pública de la carta local: 80 productos disponibles y 39 fotos aprobadas optimizadas.
- Cervezas y mojitos con sus precios/opciones actuales. Conservado diseño de dos mitades con foto propia y recorrido simulado.
- Configuración exportada limitada a identidad visual y tiempos orientativos. Sin bancos, contactos privados, claves ni pedidos; excluidas fotos personales de pruebas y archivos omitidos.
- Seed portable de 119 productos actualizado para nuevas instalaciones; no sobrescribe la base operativa existente.
- 30 pruebas frontend y compilación de demo aprobadas. Documentación acumulada incorporada. La demo sigue siendo estática; no sincroniza futuras ediciones automáticamente.

## 11 de noviembre de 2026 — Entrega de imágenes y cambio de alcance

- Proyecto local iniciado con Docker. Auditoría de 80 productos visibles: 39 fotos aprobadas, dos fotos de pruebas y 39 productos sin foto verificada.
- A solicitud del usuario se detuvo el retoque de imágenes existentes después de 11 resultados. Preparado paquete para otro agente con 28 originales pendientes, lista exacta de nombres, instrucciones detalladas y referencias terminadas. Los 11 ya retocados están expresamente excluidos de sus tareas.
- Generadas 39 ilustraciones para productos sin foto, revisadas mediante cuatro hojas de contacto. Se entregan en ZIP separado; requieren confirmar presentaciones genéricas e ingredientes antes de su uso comercial.
- Conservadas las fotografías originales. Estas imágenes NO se cargaron a la API ni se publicaron en GitHub Pages. No hubo push. Una prueba anterior de agua embotellada queda fuera del ZIP definitivo.
- Código local preparado para distinguir fotos subidas, mejoradas e ilustrativas, mostrar su procedencia y ampliar la foto en el detalle del producto. 30 pruebas frontend, 32 API y compilación aprobadas; contenedores vigentes sin reconstruir para estos cambios.
- Guía reutilizable y limitaciones: MEJORA_VISUAL_LOCAL/README.md y PAQUETE_RETOQUE_PENDIENTE/PROMPT_Y_PROCEDIMIENTO.md en outputs del espacio de trabajo.

## 11 de noviembre de 2026 — Aplicación local de imágenes autorizada

- Usuario autorizó incorporar las imágenes recreadas a la carta local. Cargadas 50 imágenes por API: 39 ilustraciones y 11 fotos reales mejoradas, con control de versión para cada producto.
- Respaldo completo previo de PostgreSQL y medios en work/respaldo-antes-imagenes-20261111/20261111-010608-0f834b7c07734ead9c7608be1da33d45 (privado; contiene configuración sensible, no publicar).
- Frontend y API reconstruidos con Docker y servicios saludables. La carta muestra «Imagen ilustrativa» para las 39 imágenes generadas y la procedencia en la ficha ampliada.
- Verificados los 100 recursos de foto y miniatura. Comparación antes/después confirma precios, ingredientes, variantes, opciones, disponibilidad, configuración, categorías y demás productos sin cambios.
- Revisada ficha Capricciosa en móvil: imagen visible y etiqueta correcta; aumentar cantidad mantiene abierto el producto y calcula dos piezas por $390.
- Registro local y correspondencias en work/carga-imagenes-20261111/aplicadas.json; estados antes/después en la misma carpeta. No hubo publicación ni push a GitHub.

## 11 de noviembre de 2026 — Preparación de publicación de nuevas imágenes

- Exportada instantánea pública de 80 productos y 78 imágenes aprobadas, incluidas 39 ilustraciones y 11 retoques. Conservadas las etiquetas de procedencia y excluidas las dos fotografías personales de pruebas.
- Configuración pública limitada a identidad visual y tiempos orientativos. Sin cuentas bancarias, contactos privados, claves, pedidos ni respaldos.
- Verificadas correspondencias y existencia de los 78 archivos optimizados. 30 pruebas frontend y compilación de demo aprobadas. Publicación solicitada por el usuario mediante el workflow existente de GitHub Pages.

## 11 de noviembre de 2026 — Ensalada del chef y elección libre de mitades

- Sustituida Ensalada del chef por la foto original adjunta por el usuario, sin regeneración. Retirado el aviso anterior de asignación provisional; precios y receta conservados. Estado previo en work/ensalada-chef-20261111 (fuera del repositorio).
- El botón «Armar mi pizza» abre «Mitad y mitad» con primera y segunda especialidad sin preseleccionar. Ambas son editables; solo aparecen pizzas disponibles y no se permite agregar hasta elegir ambas. Desde una ficha individual se conserva su especialidad inicial, pero la primera mitad también puede cambiarse.
- Si la primera especialidad se cambia a la que estaba elegida como segunda, se solicita nuevamente la segunda. El precio por tamaño refleja la mitad más cara, y extras/cantidad mantienen su cálculo habitual.
- Verificado en navegador local: Peperoni + Capricciosa personal $195; grande $320; dos grandes $640, con ambas especialidades en carrito y anticipo $320. Botón bloqueado antes de elegir. Nueva foto y descripción de ensalada comprobadas en la ficha.
- 30 pruebas frontend y compilación de demo aprobadas. Contenedores Docker locales reconstruidos. Exportación pública conserva 80 productos y 78 fotos, sin datos privados. Publicación en Pages autorizada por el usuario.

## 12 de noviembre de 2026 — Vegetariana, cervezas y agua Ciel

- Generadas con herramienta integrada y aplicadas localmente cuatro imágenes ilustrativas: Vegetariana con ingredientes de la carta, Corona/Victoria/XX para cerveza de 355 ml, Corona como ejemplo de cerveza mega y agua Ciel de 600 ml. Fondo beige cálido y encuadre de producto coherentes con el resto de la carta.
- El usuario confirmó conservar también las demás marcas: Bohemia, Modelo y todas las opciones de selección permanecen intactas, al igual que precios, variantes, disponibilidad y recetas.
- Respaldo de estado y recursos anteriores en work/imagenes-20261112; archivos finales y prompts en outputs/IMAGENES_20261112. Carga por API con control de versión; cuatro fotos y cuatro miniaturas comprobadas.
- Ajustado object-fit a contain en detalle de producto y miniaturas de bebidas para evitar recortar tapas o etiquetas. Compilación Docker aprobada; servicios saludables. Revisión visual en navegador de vegetariana, cerveza con opciones de marca y agua Ciel.
- Sin publicación ni push en esta sesión. Las imágenes están disponibles en la carta local; GitHub Pages conserva la última publicación anterior.

## 12 de noviembre de 2026 — Corona Mega 1.2 L y publicación de fotos pendientes

- Recreada Corona Mega usando la referencia suministrada: botella ámbar, etiqueta amarilla, texto rojo Mega y contenido 1.2 L; fondo beige cálido, sin paneles publicitarios. Sustituida la imagen local por API con control de versión; precio y opciones intactos. Respaldo en work/corona-mega-12l.
- Exportada instantánea pública con 80 productos y 80 imágenes aprobadas, incluidas Vegetariana, Ciel, Corona/Victoria/XX y la Mega corregida. Conservadas otras marcas y precios. Exportación por lista de campos públicos; sin configuración bancaria, WhatsApp privado, dirección privada, pedidos ni claves.
- El encuadre contiene las botellas completas. Archivo maestro y prompt en outputs/IMAGENES_20261112/mega-corona-12l.png y prompt-corona-mega.txt.
- Aclarado alcance operativo: la demo de Pages simula pedidos; la app local tiene configuración guardada, pero continúa en modo de prueba y con recepción pausada. Para operar por internet se requiere alojamiento de API/base y validación del flujo real, además de confirmar datos definitivos. Impresión de cocina sigue pendiente de equipo.
