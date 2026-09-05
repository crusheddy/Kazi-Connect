// Renders the launcher icons from the Kazi Connect artwork in brand/.
//
//   brand/logo.png             the full badge
//   brand/logo-foreground.png  the K, sphere and swoosh, background keyed out
//
// Android composites an adaptive icon from two layers and then applies the
// launcher's mask, which is guaranteed to preserve only the centre 66 of the
// 108dp canvas. So the layers are built separately:
//
//   background  the badge's green field, rebuilt as a gradient - the badge
//               itself cannot be the background layer because it already
//               contains the mark, which would then show twice
//   foreground  the mark alone, inset into the safe zone so no mask clips it
//
// Pre-26 devices ignore all that and use the flattened ic_launcher.png, which
// is built from the same two layers plus its own rounded corners - nothing
// masks it, so it has to carry its own shape. It deliberately drops the
// wordmark like the adaptive icon does: at 48px it is unreadable, and two
// different-looking icons across Android versions is worse than one.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RES = join(ROOT, 'android', 'app', 'src', 'main', 'res');

const legacy = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const adaptive = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const SAFE = 74 / 108;   // 66 is the guarantee; 74 reads better and still clears

// Sampled from brand/logo.png: the field darkens from the rim to the centre.
const FIELD = 'radial-gradient(circle at 50% 42%, #02120F 0%, #0B211C 55%, #17332B 100%)';

const dataUri = async (name) =>
  `data:image/png;base64,${(await readFile(join(ROOT, 'brand', name))).toString('base64')}`;

const mark = await dataUri('logo-foreground.png');

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage();

const shoot = async (html, size, path, transparent) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;width:${size}px;height:${size}px;position:relative;overflow:hidden">${html}</body>`,
  );
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, await page.screenshot({ omitBackground: transparent }));
};

const flattened = (radius) => `
  <div style="position:absolute;inset:0;border-radius:${radius};overflow:hidden;background:${FIELD}">
    <img src="${mark}" style="position:absolute;inset:14%;width:72%;height:72%;object-fit:contain">
  </div>`;

for (const [density, size] of Object.entries(legacy)) {
  await shoot(flattened('22%'), size, join(RES, `mipmap-${density}`, 'ic_launcher.png'), true);
  await shoot(flattened('50%'), size, join(RES, `mipmap-${density}`, 'ic_launcher_round.png'), true);
}

for (const [density, size] of Object.entries(adaptive)) {
  await shoot(
    `<div style="position:absolute;inset:0;background:${FIELD}"></div>`,
    size,
    join(RES, `mipmap-${density}`, 'ic_launcher_background.png'),
    false,
  );
  const inset = ((1 - SAFE) / 2) * 100;
  await shoot(
    `<img src="${mark}" style="position:absolute;left:${inset}%;top:${inset}%;width:${SAFE * 100}%;height:${SAFE * 100}%;object-fit:contain">`,
    size,
    join(RES, `mipmap-${density}`, 'ic_launcher_foreground.png'),
    true,
  );
}

// Point the adaptive icons at the badge layer rather than a flat colour.
for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  await writeFile(
    join(RES, 'mipmap-anydpi-v26', name),
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`,
  );
}

await browser.close();
console.log('launcher icons written from brand/logo.png');
