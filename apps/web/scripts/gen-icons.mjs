#!/usr/bin/env node
/**
 * Generates PNG icon variants from the SVG source emblem.
 * Run once after editing emblem.svg, then commit the PNGs.
 *
 * Usage: pnpm --filter web build:icons
 * Requires: sharp (devDependency)
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');
const src = join(iconsDir, 'emblem.svg');

const BACKGROUND = { r: 11, g: 15, b: 20, alpha: 1 }; // #0B0F14

async function generate() {
  // Standard icons — amber emblem on blackops square background
  await sharp(src)
    .resize(192, 192)
    .flatten({ background: BACKGROUND })
    .png()
    .toFile(join(iconsDir, 'icon-192.png'));
  console.log('✓ icon-192.png');

  await sharp(src)
    .resize(512, 512)
    .flatten({ background: BACKGROUND })
    .png()
    .toFile(join(iconsDir, 'icon-512.png'));
  console.log('✓ icon-512.png');

  // Apple touch icon (180×180, no rounded corners — iOS handles that)
  await sharp(src)
    .resize(180, 180)
    .flatten({ background: BACKGROUND })
    .png()
    .toFile(join(iconsDir, 'apple-touch-icon-180.png'));
  console.log('✓ apple-touch-icon-180.png');

  // Maskable icon — inset the emblem to ~80% so the safe zone isn't clipped by Android masks
  const MASKABLE_SIZE = 512;
  const EMBLEM_SIZE = Math.round(MASKABLE_SIZE * 0.8);
  const OFFSET = Math.round((MASKABLE_SIZE - EMBLEM_SIZE) / 2);

  const resizedEmblem = await sharp(src)
    .resize(EMBLEM_SIZE, EMBLEM_SIZE)
    .toBuffer();

  await sharp({
    create: {
      width: MASKABLE_SIZE,
      height: MASKABLE_SIZE,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: resizedEmblem, top: OFFSET, left: OFFSET }])
    .png()
    .toFile(join(iconsDir, 'icon-maskable-512.png'));
  console.log('✓ icon-maskable-512.png');

  console.log('\nAll icons generated successfully.');
}

generate().catch((err) => {
  console.error('Icon generation failed:', err.message);
  process.exit(1);
});
