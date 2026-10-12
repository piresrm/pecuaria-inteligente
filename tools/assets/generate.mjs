import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'apps/web/src/assets');
await mkdir(out, { recursive: true });
if (sharp.versions.sharp !== '0.35.5')
  throw new Error(`Sharp incompatível: ${sharp.versions.sharp}`);
const manifest = {
  schema: 'pecuaria-inteligente/assets/v1',
  transformer: { name: 'sharp', version: sharp.versions.sharp, versions: sharp.versions },
  images: [],
};
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function variants(name, source, widths, ratio) {
  const input = path.join(root, source);
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Imagem sem dimensões: ${source}`);
  const image = {
    name,
    source,
    sourceSha256: sha256(await readFile(input)),
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    transform: {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true,
      ratio,
      webp: { quality: 25, effort: 6 },
      jpeg: { quality: 70, mozjpeg: true, progressive: true },
    },
    variants: [],
  };
  for (const width of widths) {
    if (width > metadata.width) throw new Error(`Upscale não permitido: ${source} → ${width}px`);
    const height = Math.floor(width / ratio);
    const pipeline = sharp(input).resize(width, height, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true,
    });
    const webp = await pipeline
      .clone()
      .webp({ quality: 25, effort: 6 })
      .toFile(path.join(out, `${name}-${width}.webp`));
    if (
      ((name === 'pasto' && width === 1280) || (name === 'curral' && width === 480)) &&
      webp.size > 30 * 1024
    )
      throw new Error(`Variante inicial excede 30 KiB: ${webp.size} bytes`);
    await pipeline
      .clone()
      .jpeg({ quality: 70, mozjpeg: true, progressive: true })
      .toFile(path.join(out, `${name}-${width}.jpg`));
    for (const format of ['webp', 'jpg']) {
      const file = `apps/web/src/assets/${name}-${width}.${format}`;
      const bytes = await readFile(path.join(root, file));
      image.variants.push({ file, width, height, bytes: bytes.length, sha256: sha256(bytes) });
    }
  }
  manifest.images.push(image);
}

await variants('pasto', 'docs/imagens/fontes/pasto.jpg', [768, 1280, 1920], 4);
await variants('curral', 'docs/imagens/fontes/curral.jpg', [320, 480, 768], 16 / 9);

await writeFile(
  path.join(root, 'tools/assets/manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
