// Assembles www/ — the offline bundle that ships inside the APK.
//
//   www/            marketing site (site/)
//   www/hms/        Hiring Management System (vendored under hms-src/)
//   www/vendor/     Chart.js + self-hosted Google Fonts
//
// Rewrites every external dependency that would need the network to render,
// and repoints the HMS backend calls at the live Netlify host (they are
// server-side and cannot be bundled).
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, '..', 'site');
const HMS = join(ROOT, 'hms-src');
const WWW = join(ROOT, 'www');

const HMS_API_HOST = 'https://afrikakazihms.netlify.app';

await rm(WWW, { recursive: true, force: true });
await mkdir(join(WWW, 'hms'), { recursive: true });

await cp(SITE, WWW, { recursive: true });
await cp(HMS, join(WWW, 'hms'), { recursive: true });
await cp(join(ROOT, 'vendor'), join(WWW, 'vendor'), { recursive: true });
await cp(
  join(ROOT, 'node_modules', 'chart.js', 'dist', 'chart.umd.js'),
  join(WWW, 'vendor', 'chart.umd.js'),
);
await cp(join(ROOT, 'src', 'app-shell.js'), join(WWW, 'app-shell.js'));
await cp(join(ROOT, 'src', 'app-polish.css'), join(WWW, 'app-polish.css'));

// The bundle is served from the app's own origin, so a page in hms/ reaches
// vendor/ one level up.
const rewrite = (html, depth) => {
  const up = '../'.repeat(depth);

  return (
    html
      // Chart.js — pinned or unpinned, both forms appear across the pages.
      .replace(
        /https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js(@[\w.]+\/dist\/chart\.umd\.min\.js)?/g,
        `${up}vendor/chart.umd.js`,
      )
      // Self-hosted fonts: drop the preconnects, point the stylesheet local.
      .replace(
        /<link[^>]*href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"[^>]*>/g,
        `<link rel="stylesheet" href="${up}vendor/fonts.css" />`,
      )
      .replace(/<link[^>]*fonts\.gstatic\.com[^>]*>/g, '')
      .replace(/<link[^>]*rel="preconnect"[^>]*fonts\.googleapis\.com[^>]*>/g, '')
      // The site links out to the hosted HMS; in the app it is bundled alongside.
      .replace(/https:\/\/afrikakazihms\.netlify\.app\//g, `${up}hms/`)
      // The site names Playfair Display and Inter in its font stacks but never
      // loaded them, so on a device without them Android substituted Noto
      // Serif and rewrapped the headings. Self-host what the CSS asks for.
      .replace(
        /<link rel="stylesheet" href="((?:\.\.\/)*)(assets\/styles\.css|styles\.css)"[^>]*>/,
        `<link rel="stylesheet" href="${up}vendor/fonts.css" />\n    $&`,
      )
      // Anchored on </head> so the HMS pages get it too - they link no
      // external stylesheet for the fonts rule above to attach to.
      .replace(
        /<\/head>/i,
        `  <link rel="stylesheet" href="${up}app-polish.css" />\n  </head>`,
      )
      // Native shell: external links, hardware back, status bar.
      .replace(
        /<\/body>/i,
        `  <script src="${up}app-shell.js"></script>\n  </body>`,
      )
  );
};

// HMS talks to Netlify Functions. Those are server-side, so the calls keep
// going to the live host instead of resolving against the local bundle.
const rewriteHmsApi = (html) =>
  html
    .replace(/(["'`])\/api\//g, `$1${HMS_API_HOST}/api/`)
    .replace(/(["'`])\/\.netlify\/functions\//g, `$1${HMS_API_HOST}/.netlify/functions/`);

const htmlIn = async (dir) =>
  (await readdir(dir, { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => join(dir, e.name));

for (const file of await htmlIn(WWW)) {
  await writeFile(file, rewrite(await readFile(file, 'utf8'), 0));
}
for (const file of await htmlIn(join(WWW, 'hms'))) {
  await writeFile(file, rewriteHmsApi(rewrite(await readFile(file, 'utf8'), 1)));
}

// Netlify build config has no meaning inside the APK.
await rm(join(WWW, 'hms', 'netlify'), { recursive: true, force: true });
for (const f of ['netlify.toml', 'package.json', 'server.js', 'README.md', '.gitignore']) {
  await rm(join(WWW, 'hms', f), { force: true });
}
await rm(join(WWW, '.netlify'), { recursive: true, force: true });

console.log('www/ built');
