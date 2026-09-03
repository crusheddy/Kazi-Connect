// Renders the Kazi Connect "K" mark into every launcher-icon density.
// Uses the same colours as the site favicon (site/*.html) so the app icon,
// the browser tab and the site header all match.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RES = join(dirname(fileURLToPath(import.meta.url)), '..', 'android', 'app', 'src', 'main', 'res');
const INK = '#1B2D2A';
const ACCENT = '#C25E3A';

// Legacy square/round icons: full-bleed mark.
const legacy = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
// Adaptive foreground: 108dp canvas, mark confined to the 66dp safe zone.
const adaptive = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

const mark = (size, inset, radius, bg) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${INK}"/>` : ''}
    <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif" font-weight="700"
          font-size="${(size - inset * 2) * 0.78}" fill="${ACCENT}">K</text>
  </svg>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();

const render = async (svg, size, path, transparent) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;${transparent ? '' : `background:${INK};`}">${svg}</body>`,
  );
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, await page.screenshot({ omitBackground: transparent }));
};

for (const [density, size] of Object.entries(legacy)) {
  const svg = mark(size, 0, size * 0.19, true);
  await render(svg, size, join(RES, `mipmap-${density}`, 'ic_launcher.png'), false);
  await render(
    mark(size, 0, size / 2, true),
    size,
    join(RES, `mipmap-${density}`, 'ic_launcher_round.png'),
    false,
  );
}

for (const [density, size] of Object.entries(adaptive)) {
  // Transparent foreground - Android composites it over ic_launcher_background.
  await render(
    mark(size, size * 0.21, 0, false),
    size,
    join(RES, `mipmap-${density}`, 'ic_launcher_foreground.png'),
    true,
  );
}

await writeFile(
  join(RES, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${INK}</color>\n</resources>\n`,
);

await browser.close();
console.log('launcher icons written');
