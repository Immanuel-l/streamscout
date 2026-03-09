import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const publicDir = resolve(process.cwd(), 'public')
const svgBuffer = readFileSync(resolve(publicDir, 'favicon.svg'))

// Generate 192x192 PNG
await sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile(resolve(publicDir, 'icon-192.png'))
console.log('Created icon-192.png')

// Generate 512x512 PNG
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(resolve(publicDir, 'icon-512.png'))
console.log('Created icon-512.png')

// Generate apple-touch-icon (180x180)
await sharp(svgBuffer)
  .resize(180, 180)
  .png()
  .toFile(resolve(publicDir, 'apple-touch-icon.png'))
console.log('Created apple-touch-icon.png')

// Generate OG image (1200x630) — app branding card
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#050505"/>
  <rect x="40" y="40" width="1120" height="550" rx="32" fill="#0a0a0a" stroke="#1a1a1a" stroke-width="2"/>
  
  <!-- Icon -->
  <rect x="100" y="200" width="120" height="120" rx="24" fill="#111"/>
  <path d="M140 230 L200 260 L140 290Z" fill="#f59e0b"/>
  
  <!-- Title -->
  <text x="260" y="260" font-family="sans-serif" font-weight="900" font-size="72" fill="white" letter-spacing="2">StreamScout</text>
  
  <!-- Subtitle -->
  <text x="260" y="310" font-family="sans-serif" font-weight="400" font-size="28" fill="#999">Filme &amp; Serien entdecken</text>
  
  <!-- Feature pills -->
  <rect x="100" y="380" width="140" height="44" rx="22" fill="#1a1a1a"/>
  <text x="170" y="408" font-family="sans-serif" font-size="18" fill="#ccc" text-anchor="middle">🔍 Suche</text>
  
  <rect x="260" y="380" width="160" height="44" rx="22" fill="#1a1a1a"/>
  <text x="340" y="408" font-family="sans-serif" font-size="18" fill="#ccc" text-anchor="middle">🎭 Stimmung</text>
  
  <rect x="440" y="380" width="170" height="44" rx="22" fill="#1a1a1a"/>
  <text x="525" y="408" font-family="sans-serif" font-size="18" fill="#ccc" text-anchor="middle">📺 Streaming</text>
  
  <rect x="630" y="380" width="160" height="44" rx="22" fill="#1a1a1a"/>
  <text x="710" y="408" font-family="sans-serif" font-size="18" fill="#ccc" text-anchor="middle">🎲 Zufall</text>
  
  <rect x="810" y="380" width="170" height="44" rx="22" fill="#1a1a1a"/>
  <text x="895" y="408" font-family="sans-serif" font-size="18" fill="#ccc" text-anchor="middle">📋 Watchlist</text>

  <!-- Accent line -->
  <rect x="100" y="470" width="200" height="4" rx="2" fill="#f59e0b"/>
  
  <!-- Domain -->
  <text x="100" y="520" font-family="sans-serif" font-size="20" fill="#666">streamscout.netlify.app</text>
</svg>`

await sharp(Buffer.from(ogSvg))
  .resize(1200, 630)
  .png()
  .toFile(resolve(publicDir, 'og-image.png'))
console.log('Created og-image.png')

console.log('All icons and images generated!')
