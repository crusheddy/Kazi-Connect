// Renders the launcher icons.
//
// Source of truth is brand/logo.png when it exists - drop the real artwork
// there and it wins automatically. Otherwise this falls back to
// brand/mark.svg, a flat vector rendering of the Kazi Connect mark.
//
// Two icon families are produced:
//   ic_launcher / ic_launcher_round   full-bleed badge, background included
//   ic_launcher_foreground            transparent, inset into the 66/108dp
//                                     safe zone so Android's circular and
//                                     squircle masks cannot clip the mark
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RES = join(ROOT, 'android', 'app', 'src', 'main', 'res');
const INK = '#16302A';

const legacy = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const adaptive = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
// Android guarantees the centre 66 of the 108dp canvas; 74 reads better and
// still clears every stock mask - verified against circle, squircle and
// rounded-square in check-icons.mjs.
const SAFE = 74 / 108;

const exists = async (p) => access(p).then(() => true, () => false);

const logoPng = join(ROOT, 'brand', 'logo.png');
const usePng = await exists(logoPng);
const artwork = usePng
  ? `<img src="data:image/png;base64,${(await readFile(logoPng)).toString('base64')}" style="width:100%;height:100%;object-fit:contain">`
  : (await readFile(join(ROOT, 'brand', 'mark.svg'), 'utf8'))
      .replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"');

console.log(`source: ${usePng ? 'brand/logo.png' : 'brand/mark.svg'}`);

// The foreground layer drops the badge background; Android paints it instead.
const foregroundArt = usePng ? artwork : artwork.replace(/<rect[^>]*\/>/, '');

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage();

const shoot = async (html, size, path, transparent) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;width:${size}px;height:${size}px;${transparent ? '' : `background:${INK};`}">${html}</body>`,
  );
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, await page.screenshot({ omitBackground: transparent }));
};

for (const [density, size] of Object.entries(legacy)) {
  await shoot(artwork, size, join(RES, `mipmap-${density}`, 'ic_launcher.png'), false);
  // Same art; the round mask does the clipping.
  await shoot(artwork, size, join(RES, `mipmap-${density}`, 'ic_launcher_round.png'), false);
}

for (const [density, size] of Object.entries(adaptive)) {
  const inset = Math.round((size * (1 - SAFE)) / 2);
  const html = `<div style="position:absolute;inset:${inset}px">${foregroundArt}</div>`;
  await shoot(html, size, join(RES, `mipmap-${density}`, 'ic_launcher_foreground.png'), true);
}

await writeFile(
  join(RES, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${INK}</color>\n</resources>\n`,
);

await browser.close();
console.log('launcher icons written');
