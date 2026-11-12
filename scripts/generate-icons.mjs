import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const icon = await readFile(new URL('../public/icons/icon.svg', import.meta.url));
for (const [name, size] of [['favicon-32', 32], ['apple-touch-icon', 180], ['icon-192', 192], ['icon-512', 512]]) {
  await sharp(icon).resize(size, size).png().toFile(fileURLToPath(new URL(`../public/icons/${name}.png`, import.meta.url)));
}
const maskable = await sharp(icon).resize(320, 320).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#334dea' } }).composite([{ input: maskable, left: 96, top: 96 }]).png().toFile(fileURLToPath(new URL('../public/icons/maskable-512.png', import.meta.url)));
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#faf9f5"/><path d="M760 0v630M0 520h1200" stroke="#dce0e8"/><rect x="830" y="85" width="280" height="360" rx="12" fill="#334dea"/><path d="M865 400V160h40v195h110v45Z" fill="#fff"/><circle cx="1070" cy="170" r="30" fill="#e5ed63"/><text x="75" y="105" font-family="Arial,sans-serif" font-size="30" font-weight="bold" fill="#202638">NoxaPlus Glyph</text><text x="75" y="220" font-family="Arial,sans-serif" font-size="61" font-weight="bold" fill="#202638">Find the rhythm</text><text x="75" y="300" font-family="Arial,sans-serif" font-size="61" font-weight="bold" fill="#334dea">of Persian type.</text><rect x="75" y="340" width="430" height="7" fill="#e5ed63"/><text x="75" y="400" font-family="Arial,sans-serif" font-size="23" fill="#727a8a">Compare fonts. Tune type. Export CSS.</text><text x="75" y="572" font-family="Arial,sans-serif" font-size="18" fill="#727a8a">LOCAL-FIRST / OFFLINE / OPEN SOURCE / MIT</text><text x="887" y="572" font-family="Arial,sans-serif" font-size="18" fill="#334dea">www.noxaplus.ir</text></svg>`;
await sharp(Buffer.from(og)).png().toFile(fileURLToPath(new URL('../public/og.png', import.meta.url)));
console.log('Glyph icons and social image generated.');
