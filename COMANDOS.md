# Comandos básicos

## Instalación inicial

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```
Abre servidor en `http://localhost:5173` con hot reload.

**Cerrar:** `Ctrl+C` en la terminal.

## Build para producción

```bash
npm run build
```
Genera carpeta `dist/` lista para desplegar.

## Previsualizar build

```bash
npm run preview
```
Sirve `dist/` localmente para verificar que el build de producción funciona.

**Cerrar:** `Ctrl+C` en la terminal.

## Deploy en Docker (puerto 8081)

### Crear contenedor (primera vez)

```bash
npm run build
docker run -d --name arriendo-web \
  -p 8081:80 \
  -v "$(pwd)/dist:/usr/share/nginx/html:ro" \
  --restart unless-stopped \
  nginx:alpine
```

Acceso: `http://192.168.100.151:8081/`

### Redeployar tras cambios

```bash
npm run build
docker restart arriendo-web
```

### Bajar el servicio

```bash
docker stop arriendo-web && docker rm arriendo-web
```

## Regenerar placeholders (fallback)

```bash
node scripts/gen-placeholders.mjs
```

## Verificar puertos ocupados

```bash
ss -tlnp
docker ps
```
