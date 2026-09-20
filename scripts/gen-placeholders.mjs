// Genera imágenes placeholder locales (SVG), usadas solo como fallback si
// Cloudinary no tiene el asset. Viven en public/ (no src/) para que Vite las
// copie tal cual a dist/ sin necesidad de import — se referencian por
// string en data-fallback (ver src/main.js).
import { writeFileSync, mkdirSync } from 'node:fs'

const OUT_DIR = new URL('../public/placeholders/', import.meta.url)
mkdirSync(OUT_DIR, { recursive: true })

const items = [
  { name: 'hero',           label: 'Hero',            bg: '#17a2e8', fg: '#ffffff' },
  { name: 'quienes-somos',  label: 'Quiénes somos',    bg: '#eaf7fd', fg: '#0b74b0' },
  { name: 'trabajo-1',      label: 'Trabajo 01',       bg: '#cdeefb', fg: '#0b74b0' },
  { name: 'trabajo-2',      label: 'Trabajo 02',       bg: '#cdeefb', fg: '#0b74b0' },
  { name: 'trabajo-3',      label: 'Trabajo 03',       bg: '#cdeefb', fg: '#0b74b0' },
  { name: 'blog',           label: 'Blog',             bg: '#eaf7fd', fg: '#0b74b0' },
  { name: 'contacto',       label: 'Contacto',         bg: '#17a2e8', fg: '#ffffff' },
]

function svg({ label, bg, fg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${bg}"/>
  <g stroke="${fg}" stroke-opacity="0.25" stroke-width="1">
    ${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="600"/>`).join('\n    ')}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="800" y2="${i * 100}"/>`).join('\n    ')}
  </g>
  <circle cx="400" cy="255" r="60" fill="none" stroke="${fg}" stroke-width="3" stroke-opacity="0.6"/>
  <text x="400" y="360" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${fg}">${label}</text>
  <text x="400" y="392" text-anchor="middle" font-family="sans-serif" font-size="13" fill="${fg}" fill-opacity="0.55">placeholder 800x600</text>
</svg>`
}

for (const item of items) {
  writeFileSync(new URL(`${item.name}.svg`, OUT_DIR), svg(item))
}

console.log(`Generados ${items.length} placeholders en public/placeholders/`)
