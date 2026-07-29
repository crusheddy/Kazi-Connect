/* One-off: replace every em dash (U+2014) with a plain ASCII hyphen.
   The em dash was correctly encoded, but rendered as a missing-glyph box
   in the client's browser, so it is removed site-wide in favour of a
   character that exists in every font.

   NOTE: the section-divider comments use U+2500 (─), a different
   character, and are deliberately left untouched.

   Run from the project root:  node fix-dashes.js */
const fs = require('fs');

const files = [
  'site/index.html','site/services.html','site/software.html',
  'site/sectors.html','site/about.html','site/contact.html',
  'site/legal.html','site/investor.html',
  'site/assets/site.js','site/assets/styles.css',
  'build-footer.js'
];

const EM = '—';
let total = 0;

for (const f of files) {
  if (!fs.existsSync(f)) { console.log('missing  ' + f); continue; }
  const src = fs.readFileSync(f, 'utf8');
  const n = (src.match(new RegExp(EM, 'g')) || []).length;
  if (!n) { console.log('none     ' + f); continue; }

  // " — " -> " - "   and any remaining bare em dash -> "-"
  const out = src.split(EM).join('-');

  fs.writeFileSync(f, out, 'utf8');
  total += n;
  console.log(`replaced ${String(n).padStart(3)}  ${f}`);
}
console.log('\n' + total + ' em dashes replaced');
