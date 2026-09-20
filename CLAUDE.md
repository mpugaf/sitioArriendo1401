# serviciosInformaticos — contexto del proyecto

Orden de importancia (leer de arriba hacia abajo primero).

## 1. Qué es esto

Sitio demo con un **mecanismo de scroll horizontal propio**: el scroll
vertical del mouse/trackpad se traduce en desplazamiento horizontal, con
easing/inercia vía GSAP. Proyecto independiente, con diseño, contenido y
código propios de acá en adelante.

Contenido actual: menú con 4 secciones genéricas (Quiénes somos, Nuestros
trabajos, Blog, Contacto) + imágenes servidas desde Cloudinary (ver sección
7), pensado como base para que el usuario vaya reemplazando contenido/imágenes
reales.

## 2. Mecanismo de scroll (resumen técnico)

- `.scroll-wrap` = contenedor con `overflow-x: scroll` **nativo** (no
  `translateX`), `.scroll-wrap__inner` en `flex; flex-wrap: nowrap`, items
  `flex: none`.
- Activo solo en desktop (`matchMedia("(min-width:1080px)")`). Por debajo de
  1080px el layout vuelve a bloque vertical normal, sin JS de scroll.
- Rueda del mouse/trackpad: evento `wheel` nativo sobre `.scroll-wrap` →
  `gsap.to(scrollWrap, { scrollLeft: target, duration: 0.3, ease: 'power2.out' })`.
  El easing/inercia lo da GSAP tweenando la propiedad `scrollLeft`, no hay
  física manual.
- **Dirección: rueda hacia abajo = avanza** (como un sitio vertical normal,
  a pedido del usuario). Implementado como `scrollByDelta(-e.deltaY * 3)` en
  `src/main.js` — el signo negativo es intencional, no un bug.
- Arrastre (drag-to-pan) con `GSAP Draggable` (`type:"scrollLeft", inertia:true,
  bounds: scrollWrap`) — el momentum real lo da `InertiaPlugin` (ya incluido,
  ver sección 3).
- Teclado: `Space`/`→` avanza `window.innerWidth`, `←` retrocede lo mismo.
- Los links del menú saltan por `el.offsetLeft`, sin asumir que cada sección
  mide exactamente un viewport de ancho.

Archivos clave: [index.html](index.html), [src/style.css](src/style.css),
[src/main.js](src/main.js).

## 3. Stack e instalación

```json
"dependencies": { "gsap": "^3.15.0" }
"devDependencies": { "vite": "^6.3.5" }
```

- **Un solo paquete externo real: `gsap`** (incluye `Draggable` +
  `InertiaPlugin` gratis desde que Webflow lo liberó — no hace falta Club
  GreenSock).
- No usa jQuery: el evento `wheel` nativo alcanza para normalizar el input
  del mouse/trackpad — stack mínimo, decisión intencional.
- **IMPORTANTE — gotcha ya resuelto**: `npm create vite@latest` scaffoldea
  por defecto **Vite 8 con el motor experimental `rolldown`**, que en este
  entorno falla (`Cannot find module '@rolldown/binding-linux-x64-gnu'`,
  falta el binario nativo para esta plataforma). Se bajó explícitamente a
  `vite ^6` (estable, sin rolldown) en `package.json`. **No actualizar a
  Vite 8+ sin verificar antes que el binding de rolldown funciona acá.**

Comandos:
```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # genera dist/
npm run preview  # sirve dist/ localmente para probar el build de prod
```

## 4. Deploy realizado (este servidor)

- Este mismo host es el "servidor": hostname `mpugaserver`, IP LAN
  `192.168.100.151` (interfaz `wlo1`). No es una máquina remota distinta.
- El host ya corre múltiples proyectos vía Docker (hackathonai, airflow,
  postgres, etc.) — **antes de tocar puertos, revisar `docker ps` y
  `ss -tlnp`** para no pisar nada. Puertos ocupados al momento de este deploy:
  21, 53, 80, 2222, 3100, 3306, 4040, 5173 (vite dev), 5432, 5433, 6379, 8000,
  8080, 32400-32601 (Plex), etc.
- Deploy elegido: build estático (`dist/`) servido por un contenedor
  `nginx:alpine` aislado, puerto host **8081** (libre en el momento del
  deploy) → contenedor puerto 80, montando `dist/` como volumen de solo
  lectura.
- Nombre del contenedor: `serviciosinformaticos-web`.
- URL de acceso en LAN: **http://192.168.100.151:8081/**

### Re-desplegar tras cambios de código

```bash
npm run build
docker restart serviciosinformaticos-web   # sirve el nuevo dist/ (mismo volumen)
```

Si el contenedor no existe (se borró):
```bash
npm run build
docker run -d --name serviciosinformaticos-web \
  -p 8081:80 \
  -v "$(pwd)/dist:/usr/share/nginx/html:ro" \
  --restart unless-stopped \
  nginx:alpine
```

### Bajar el deploy
```bash
docker stop serviciosinformaticos-web && docker rm serviciosinformaticos-web
```

Este deploy fue manual y puntual ("por esta vez"). No hay CI/CD ni pipeline
automático configurado — si se pide "cada vez que cambie X, redeployar",
eso requeriría un hook/cron explícito, no asumirlo implícito.

## 5. Estado del repo

No es un repositorio git (`git status` → "not a git repository"). Si se pide
"commitear" en el futuro, primero preguntar si hay que inicializar el repo
(`git init`) y a qué remoto (si alguno) apunta.

## 6. Generación de placeholders (fallback, no la fuente principal)

[scripts/gen-placeholders.mjs](scripts/gen-placeholders.mjs) regenera las
imágenes SVG de `public/placeholders/` (**no** `src/` — tienen que vivir en
`public/` porque se referencian por string en `data-fallback`, no por
`import`; Vite solo copia a `dist/` lo que está en `public/` o lo importado
explícitamente). Ya no son la fuente principal de imágenes (ver sección 7)
— quedan solo como fallback si Cloudinary no tiene el asset. Correrlo de
nuevo con `node scripts/gen-placeholders.mjs` si se cambian colores/labels
ahí.

## 7. Imágenes vía Cloudinary

- Cuenta ya existente del usuario. **Cloud name: `dmbkdrlcj`** (hardcodeado
  en [src/cloudinary.js](src/cloudinary.js) — si cambia de cuenta, es el
  único lugar a tocar).
- Helper: `cloudinaryUrl(publicId, { width })` arma
  `https://res.cloudinary.com/dmbkdrlcj/image/upload/f_auto,q_auto[,w_<n>]/<publicId>`.
- En `index.html`, cada `<img>` NO tiene `src` fijo: usa
  `data-cloudinary-id="<nombre-base>.png"` + `data-fallback="/placeholders/<x>.svg"`.
  `src/main.js` recorre esos elementos al cargar, setea `img.src` con
  `cloudinaryUrl(...)`, y si la imagen da error (`onerror`, ej. 404 porque
  todavía no se subió con ese nombre) cae automáticamente al placeholder
  local — el sitio nunca queda con imágenes rotas mientras se van subiendo
  los assets reales.
- **Nombres base usados por ahora** (a pedido del usuario, ej. `"titulo.png"`
  — son placeholders de nombre, no imágenes reales todavía): `hero.png`,
  `quienes-somos.png`, `trabajo-1.png`, `trabajo-2.png`, `trabajo-3.png`,
  `blog.png`, `contacto.png`. Para activarlos de verdad, subir a Cloudinary
  un asset cuyo `public_id` sea exactamente ese nombre (sin extensión en el
  `public_id` real de Cloudinary — la `.png` en la URL es el formato de
  salida, Cloudinary hace la conversión con `f_auto`).
- Si el usuario da nombres reales de sus imágenes subidas, actualizar los
  `data-cloudinary-id` en `index.html` (no hace falta tocar `main.js` ni
  `cloudinary.js`).

## 8. Diseño visual (paleta blanco/celeste)

Definido en [src/style.css](src/style.css) vía variables CSS (`--color-primary:
#17a2e8`, `--color-bg-soft: #eaf7fd`, etc.). Incluye: paneles con fondo
alternado blanco/celeste suave (`nth-of-type(even)`), blob decorativo radial
por panel, barra de acento celeste en títulos (`::before`), tarjetas de
"trabajos" con borde superior celeste y hover con elevación, botones en
gradiente celeste. Los placeholders SVG (sección 6) ya están generados en
tonos celeste/blanco para ser consistentes con esta paleta — si se cambia la
paleta, regenerarlos también.

[IMAGENES.md](IMAGENES.md) tiene el detalle de qué imagen subir a Cloudinary
por sección y con qué estilo/mood, para que el usuario las consiga por su
cuenta sin romper la consistencia visual.

## 9. Responsive / mobile — gotchas ya resueltos

- `.panel` (desktop) es `flex-direction: row` (imagen | texto) pensado para
  1 viewport de ancho completo. Hay un override en
  `@media (max-width: 1079px)` al final de `src/style.css` que lo pasa a
  `column`, saca los anchos fijos (`40%`/`max-width:480px`) y hace `flex-wrap`
  en `.panel__cards` / `.card` — **si se agrega contenido nuevo con layout
  row/columnas fijas dentro de un `.panel`, hay que sumarle también su
  override mobile ahí**, si no el contenido se corta (el panel tiene
  `overflow: hidden` para recortar el blob decorativo, así que cualquier
  desborde horizontal en mobile queda invisible en vez de hacer scroll).
- **Gotcha no obvio ya resuelto**: `backdrop-filter` (o `filter`/`transform`)
  en un ancestro crea un *containing block* para sus descendientes
  `position:fixed`. `.header` tenía `backdrop-filter: blur(8px)` directo, lo
  que hacía que `.nav` (fixed, hijo de `.header`, usado como panel de menú
  full-screen en mobile) quedara contenido dentro de la caja de 64px del
  header en vez de ocupar el viewport — el menú mobile se veía a la mitad,
  cortado. Solución: el blur vive en `.header::before` (pseudo-elemento con
  `position:absolute; inset:0`), y `.header` en sí ya no tiene
  filter/backdrop-filter. **Si se necesita agregar `filter`, `backdrop-filter`,
  `transform` o `will-change` a `.header` (o a cualquier ancestro de un
  elemento `position:fixed`), verificar primero que no rompa el
  posicionamiento de sus hijos fixed.**
- Verificado con Playwright (viewport 390×844) sin overflow horizontal y con
  el menú mobile ocupando el 100% del alto disponible.
