// Script pour générer les icônes PWA PNG
// Utilise Canvas API via node-canvas si disponible, sinon crée des SVG renommés

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, 'public')

// SVG source pour les icônes
const svgIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.1875}" fill="#E63946"/>
  <circle cx="${size/2}" cy="${size * 0.42}" r="${size * 0.28}" fill="white" opacity="0.15"/>
  <text x="${size/2}" y="${size * 0.68}" font-size="${size * 0.52}" text-anchor="middle" dominant-baseline="middle" font-family="serif">🩸</text>
  <text x="${size/2}" y="${size * 0.88}" font-size="${size * 0.1}" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="bold" letter-spacing="1">BLOODLINK</text>
</svg>`

// Écrire les SVG (utilisés comme fallback)
writeFileSync(join(publicDir, 'pwa-192x192.svg'), svgIcon(192))
writeFileSync(join(publicDir, 'pwa-512x512.svg'), svgIcon(512))
writeFileSync(join(publicDir, 'apple-touch-icon.svg'), svgIcon(180))

console.log('✅ Icônes SVG générées dans public/')
console.log('ℹ️  Pour des PNG réels, installez: npm install -D sharp')
