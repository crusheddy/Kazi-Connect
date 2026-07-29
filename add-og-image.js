/* One-off: add Open Graph / Twitter image tags to every public page.
   Run from the project root:  node add-og-image.js
   Safe to re-run - skips files that already have og:image. */
const fs = require('fs');

const BASE = 'https://kaziconnects.netlify.app';
const TAGS = `
<meta property="og:image" content="${BASE}/assets/img/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Two colleagues reviewing reports at a meeting table - Kazi Connect, recruitment and HR services in Dar es Salaam.">
<meta name="twitter:card" content="summary_large_image">`;

// results.html was removed (pre-launch: no delivered engagements to report)
const pages = ['index.html','services.html','software.html','sectors.html',
               'about.html','contact.html','legal.html'];

let changed = 0;
for (const p of pages) {
  const file = 'site/' + p;
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('og:image')) { console.log('already has og:image  ' + file); continue; }
  const m = src.match(/<meta property="og:url"[^>]*>/);
  if (!m) { console.log('!! no og:url anchor in ' + file); continue; }
  const out = src.replace(m[0], m[0] + TAGS);
  fs.writeFileSync(file, out);
  changed++;
  console.log('updated  ' + file);
}
console.log('\n' + changed + '/' + pages.length + ' pages updated');
