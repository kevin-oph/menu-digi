# Pizzetas — entrega visual local, 11 de noviembre de 2026

## Alcance definitivo solicitado

Se detuvo el retoque de fotografías existentes. El otro agente recibe únicamente 28 originales pendientes, con instrucciones y nombres exactos; las 11 fotografías ya retocadas están excluidas de ese trabajo. Aquí se generaron únicamente las 39 ilustraciones de productos que no tenían fotografía verificada en la carta auditada.

Actualización posterior autorizada: incorporadas localmente las 39 ilustraciones y las 11 fotos mejoradas (50 imágenes) mediante API con control de versión. Respaldo completo previo de base y medios. No se publicaron en GitHub Pages. No se modificaron recetas, precios o disponibilidad. Las fotos originales se conservan en el respaldo.

## Entregables

- `../PAQUETE_RETOQUE_PENDIENTE.zip`: 28 originales, prompt detallado, CSV de nombres y tres referencias de estilo ya terminadas.
- `../PAQUETE_RETOQUE_PENDIENTE/OMITIR_YA_RETOCADAS.txt`: 11 fotos que el otro agente no debe volver a procesar.
- `../PRODUCTOS_SIN_FOTO_39.zip`: 39 ilustraciones nuevas, identificadas por el ID del producto.
- `../FOTOS_YA_RETOCADAS_11.zip`: los 11 retoques terminados antes del cambio de alcance.
- `revision-1.jpg` a `revision-4.jpg`: hojas de revisión de las 39 ilustraciones.
- `productos-sin-foto.json`: relación de las 39 tareas y especificaciones utilizadas.

La carpeta `imagenes` conserva también una prueba anterior de agua embotellada que NO pertenece a las 39 ilustraciones entregadas. No se incluye en su ZIP. El manifiesto de trabajo registra intentos y correcciones; no debe contarse como una lista de archivos finales únicos. Los ZIP separados son las entregas definitivas por alcance.

## Dirección visual reutilizable

Formato cuadrado, mesa de piedra beige cálida, fondo arena discreto, luz natural lateral suave, producto cercano y protagonista. Para fotografías reales, preservar ingredientes, porción y presentación; eliminar el paisaje y objetos ajenos. Para productos sin foto, crear una ilustración fiel a la descripción y mostrarla como «Imagen ilustrativa», nunca como fotografía real del restaurante. Usar una tarea y un nombre por producto; no copiar una misma imagen en varias fichas.

El procedimiento completo y el prompt con campos sustituibles están en `../PAQUETE_RETOQUE_PENDIENTE/PROMPT_Y_PROCEDIMIENTO.md`.

## Revisión antes de incorporarlas a la carta

Se inspeccionaron las 39 ilustraciones en hojas de contacto. No son prueba de la receta o porción real. Confirmar las presentaciones genéricas: crepas, malteada de vainilla, mini pastel de chocolate, agua de sabor roja, bebidas sin especificación de sabor y cervezas de marca. Los nachos deben revisarse especialmente para distinguir claramente la versión sin carne de la versión con carne. No utilizar una imagen para prometer ingredientes o acompañamientos no confirmados.

Antes de cargar fotos, respaldar base y medios, obtener la versión actual de cada producto y usar el control de concurrencia de la API. Generar miniaturas sin deformar, verificar el recorte en móvil y conservar los originales. El código local incluye soporte para procedencia de imágenes y la etiqueta ilustrativa; los contenedores se reconstruyeron para activar este soporte y las 50 imágenes ya están cargadas en la carta local.

## Validación técnica registrada

Durante esta sesión pasaron 30 pruebas de frontend, 32 pruebas de API y la compilación del frontend. La prueba nueva comprueba que la procedencia de la foto sea pública, que se rechacen valores inválidos y que una sustitución manual vuelva a marcarse como foto subida por el usuario. No se publicó ni se hizo push de estos cambios.
