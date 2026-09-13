// Downloads the Google Fonts used by the site + HMS and writes them into
// vendor/ so the packaged app renders correctly with no network.
// Run once (or after changing font families); the output is committed.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'vendor');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// Every family/weight combination referenced across site/ and hms/.
// The site asks for Playfair Display and Inter in its font stacks but never
// loaded them, so it silently fell back - to Georgia on desktop and to Noto
// Serif on Android, whose wider metrics rewrapped the headings.
const CSS_URL =
  'https://fonts.googleapis.com/css2' +
  '?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700' +
  '&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700' +
  '&family=DM+Mono:wght@400;500' +
  '&family=Raleway:wght@400;500;600;700;800;900' +
  '&family=Inter:wght@300;400;500;600;700' +
  '&display=swap';

const res = await fetch(CSS_URL, { headers: { 'User-Agent': UA } });
if (!res.ok) throw new Error(`Google Fonts CSS ${res.status}`);
let css = await res.text();

await mkdir(join(OUT, 'fonts'), { recursive: true });

const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]))];
console.log(`fetching ${urls.length} font files`);

for (const url of urls) {
  const name = url.split('/').slice(-3).join('-').replace(/[^\w.-]/g, '_');
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  await writeFile(join(OUT, 'fonts', name), buf);
  css = css.split(url).join(`fonts/${name}`);
}

await writeFile(join(OUT, 'fonts.css'), css);
console.log(`wrote vendor/fonts.css (${(css.length / 1024).toFixed(1)} KB)`);
