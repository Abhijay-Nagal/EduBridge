import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const publicDir = join(here, '..', 'public')
const svg = readFileSync(join(publicDir, 'favicon.svg'))

// Maskable icons need the artwork inset so Android's circular crop doesn't clip it.
const maskable = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#4f46e5"/>
  <g transform="translate(102 102) scale(0.6)">${svg
    .toString()
    .replace(/<\?xml.*?\?>/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')}</g>
</svg>`)

await sharp(svg).resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'))
await sharp(svg).resize(512, 512).png().toFile(join(publicDir, 'icon-512.png'))
await sharp(maskable).resize(512, 512).png().toFile(join(publicDir, 'icon-maskable-512.png'))

console.log('Generated icon-192.png, icon-512.png, icon-maskable-512.png')
