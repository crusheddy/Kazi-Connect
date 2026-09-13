/* ------------------------------------------------------------------
   Stamps the origin from site-url.js into every absolute self-reference
   in the public pages: rel="canonical", og:url, og:image and
   twitter:image. Each tag keeps its own path; only the origin changes,
   so this works no matter what the pages currently say.

   Run from the project root:  node set-site-url.js
                               node set-site-url.js --check
   Safe to re-run. Kept OUTSIDE site/ so it is never deployed.
   ------------------------------------------------------------------ */
const fs = require('fs');
const SITE_URL = require('./site-url');

const pages = ['index.html','services.html','software.html','sectors.html',
               'about.html','contact.html','legal.html'];

// investor.html is deliberately absent: it is noindex,nofollow and carries
// no canonical, being the gated briefing.

const check = process.argv.includes('--check');
const origin = SITE_URL.replace(/\/+$/, '');

// Attribute order varies and the formatter wrapped some tags across lines,
// so match whole tags first and rewrite the URL inside them.
const TAG = /<(?:link|meta)\b[^>]*>/gis;
const CARRIES_URL = /rel="canonical"|property="og:url"|property="og:image"|name="twitter:image"/i;
const ABSOLUTE = /(href="|content=")https?:\/\/[^"/]+([^"]*)(")/gi;

let changed = 0, drift = [];

for (const p of pages) {
  const file = 'site/' + p;
  const src = fs.readFileSync(file, 'utf8');

  const out = src.replace(TAG, (tag) => {
    if (!CARRIES_URL.test(tag)) return tag;
    return tag.replace(ABSOLUTE, (_m, lead, path, close) => lead + origin + path + close);
  });

  if (out === src) continue;
  drift.push(p);
  if (!check) { fs.writeFileSync(file, out); changed++; }
}

if (check) {
  if (drift.length) {
    console.error('site URLs disagree with site-url.js (' + origin + '):');
    drift.forEach((p) => console.error('  ' + p));
    process.exit(1);
  }
  console.log('all pages match ' + origin);
} else {
  console.log(changed + '/' + pages.length + ' pages rewritten to ' + origin);
}
