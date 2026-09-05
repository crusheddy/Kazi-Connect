import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const R = new URL('../android/app/src/main/res/', import.meta.url).pathname;
const b64 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64');
const fg = b64(`${R}/mipmap-xxxhdpi/ic_launcher_foreground.png`);
const sq = b64(`${R}/mipmap-xxxhdpi/ic_launcher.png`);
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await br.newPage();
await p.setViewportSize({ width: 880, height: 260 });
// Composite the adaptive layers the way Android does, under each mask shape.
const tile = (label, radius) => `
  <div style="text-align:center">
    <div style="width:160px;height:160px;background:#16302A;border-radius:${radius};overflow:hidden;position:relative">
      <img src="${fg}" style="position:absolute;inset:0;width:100%;height:100%">
    </div><div style="margin-top:8px">${label}</div></div>`;
await p.setContent(`<body style="margin:0;background:#8a8a8a;display:flex;gap:26px;align-items:center;padding:24px;font:12px sans-serif;color:#fff">
  ${tile('circle mask', '50%')}
  ${tile('squircle', '38px')}
  ${tile('rounded sq', '20px')}
  <div style="text-align:center"><img src="${sq}" style="width:160px;height:160px;border-radius:20px"><div style="margin-top:8px">legacy ic_launcher</div></div>
</body>`);
await p.waitForTimeout(400);
await p.screenshot({ path: new URL('../icon-masks.png', import.meta.url).pathname });
await br.close();
