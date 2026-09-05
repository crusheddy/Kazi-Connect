// Composites the adaptive layers the way Android does and applies each stock
// mask, so clipping is something you can see rather than assume.
// Writes icon-masks.png next to the project.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RES = join(ROOT, 'android/app/src/main/res');
const uri = (p) => 'data:image/png;base64,' + readFileSync(join(RES, p)).toString('base64');

const bg = uri('mipmap-xxxhdpi/ic_launcher_background.png');
const fg = uri('mipmap-xxxhdpi/ic_launcher_foreground.png');
const legacy = uri('mipmap-xxxhdpi/ic_launcher.png');

const tile = (label, radius) => `
  <div style="text-align:center">
    <div style="width:150px;height:150px;border-radius:${radius};overflow:hidden;position:relative">
      <img src="${bg}" style="position:absolute;inset:0;width:100%;height:100%">
      <img src="${fg}" style="position:absolute;inset:0;width:100%;height:100%">
    </div><div style="margin-top:8px">${label}</div></div>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
await page.setViewportSize({ width: 900, height: 240 });
await page.setContent(`<body style="margin:0;background:#8a8a8a;display:flex;gap:26px;align-items:center;padding:24px;font:12px sans-serif;color:#fff">
  ${tile('circle', '50%')}
  ${tile('squircle', '36px')}
  ${tile('rounded sq', '20px')}
  ${tile('teardrop', '50% 50% 50% 8px')}
  <div style="text-align:center"><img src="${legacy}" style="width:150px;height:150px"><div style="margin-top:8px">legacy (pre-26)</div></div>
</body>`);
await page.waitForTimeout(400);
await page.screenshot({ path: join(ROOT, 'icon-masks.png') });
await browser.close();
console.log('wrote icon-masks.png');
