# Guía de imágenes a subir a Cloudinary

Paleta del sitio: **blanco / celeste** (`#17a2e8` acento, `#eaf7fd` fondo suave,
`#0b74b0` celeste oscuro). Para que las imágenes se integren bien con el
diseño, evitar fotos muy oscuras, saturadas en colores cálidos (naranja/rojo
dominante) o con fondos ruidosos — priorizar tomas luminosas, de alta luz,
con azules/celestes/blancos/grises presentes en la escena o fáciles de
recortar sobre fondo claro.

Formato sugerido: **800×600 (4:3)** o superior, JPG/PNG. Subir a Cloudinary
con el `public_id` indicado (sin extensión) para que se activen automáticamente
— ver [CLAUDE.md](CLAUDE.md) sección 7.

| `public_id` | Sección | Qué mostrar | Estilo / mood |
|---|---|---|---|
| `hero` | Hero (portada) | Imagen principal de marca: equipo trabajando, oficina luminosa, o un producto/servicio destacado en primer plano | Gran formato, mucha luz natural, tonos claros con algún acento celeste (ropa, objetos, pantalla). Debe funcionar como imagen de impacto inicial |
| `quienes-somos` | Quiénes somos | Foto de equipo (grupal, casual, no de stock genérico) o del espacio de trabajo | Cercana, humana, buena iluminación, fondo claro |
| `trabajo-1` | Nuestros trabajos — Proyecto 01 | Captura/mockup del primer proyecto o caso de éxito | Fondo blanco o celeste claro si es mockup de pantalla; foto de resultado si es servicio físico |
| `trabajo-2` | Nuestros trabajos — Proyecto 02 | Segundo proyecto/caso | Igual criterio que `trabajo-1`, mantener consistencia visual entre las 3 |
| `trabajo-3` | Nuestros trabajos — Proyecto 03 | Tercer proyecto/caso | Igual criterio que `trabajo-1` |
| `blog` | Blog | Imagen de portada genérica para la sección (ej. persona escribiendo/leyendo, o ilustración simple) | Puede ser más ilustrativa/abstracta que las demás, tono celeste dominante |
| `contacto` | Contacto | Foto de contacto: oficina/recepción, mapa estilizado, o persona atendiendo | Cálida pero dentro de la paleta clara, transmite cercanía |

## Notas

- Mientras no subas una imagen con el `public_id` correspondiente, el sitio
  muestra automáticamente un placeholder celeste generado localmente — no
  hay urgencia de tenerlas todas antes de seguir iterando.
- Si preferís nombres distintos a los de la tabla, avisame y actualizo los
  `data-cloudinary-id` en [index.html](index.html) (no requiere tocar CSS/JS).
- Si en vez de fotos preferís ilustraciones/iconografía plana, mantené la
  misma paleta (blanco de fondo + celeste de acento) para que no rompa con
  el resto del sitio.
