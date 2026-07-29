/* ------------------------------------------------------------------
   One-off maintenance script: rewrites the shared <footer> block in
   every public page so the markup stays identical across the site.
   Run from the project root:  node build-footer.js
   (Kept OUTSIDE the site/ publish folder so it is never deployed.)
   Safe to re-run - it replaces the whole <footer class="site-footer">…
   </footer> block each time.
   ------------------------------------------------------------------ */
const fs = require('fs');

/* SOCIAL LINKS - PLACEHOLDER URLS.
   These point at plausible handles that are not claimed yet. Swap each
   href for the real profile as soon as the account exists, and delete
   any platform Kazi Connect does not use. */
const socials = [
  ['LinkedIn',  'https://www.linkedin.com/company/kazi-connect',
   '<path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5zM3 9.5h4V21H3zM10 9.5h3.8v1.6h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.2c0-1.24-.02-2.84-1.9-2.84-1.9 0-2.2 1.35-2.2 2.75V21h-4z"/>'],
  ['Instagram', 'https://www.instagram.com/kaziconnect',
   '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.3"/>'],
  ['Facebook',  'https://www.facebook.com/kaziconnect',
   '<path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.3-.04-1.3-.13-2.45-.13-2.4 0-4.05 1.47-4.05 4.17V9.9H7.5V13h2.7v8z"/>'],
  ['X',         'https://x.com/kaziconnect',
   '<path d="M17.7 3h3.3l-7.2 8.2L22 21h-6.6l-5.2-6.6L4.3 21H1l7.7-8.8L1.5 3h6.8l4.7 6.1zM16.5 19h1.8L7.6 4.9H5.6z"/>'],
  ['YouTube',   'https://www.youtube.com/@kaziconnect',
   '<path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5a2.5 2.5 0 0 0-1.8 1.8C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12zM9.8 15.2V8.8L15.5 12z"/>'],
  ['TikTok',    'https://www.tiktok.com/@kaziconnect',
   '<path d="M16.5 3c.4 2.2 1.9 3.8 4 4v3c-1.5.1-2.9-.3-4.1-1.1v6.3a5.9 5.9 0 1 1-5.1-5.85v3.1a2.85 2.85 0 1 0 2 2.72V3z"/>'],
  ['Telegram',  'https://t.me/kaziconnect',
   '<path d="M21.5 4.3 2.9 11.4c-.9.35-.9.9-.15 1.1l4.7 1.5 1.8 5.4c.2.55.35.75.75.75.4 0 .6-.2.85-.45l2.2-2.15 4.6 3.4c.85.45 1.45.2 1.65-.8l3-14.1c.3-1.2-.45-1.75-1.8-1.15z"/>'],
  ['WhatsApp',  'https://wa.me/255000000000',
   '<path d="M12 2a10 10 0 0 0-8.6 15.05L2 22l5.1-1.35A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.05.8.8-2.95-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.25-.13-1.48-.73-1.7-.8-.23-.1-.4-.13-.56.12-.16.25-.63.8-.78.96-.14.17-.28.19-.53.07-.25-.13-1.06-.4-2.02-1.25-.75-.66-1.25-1.48-1.4-1.73-.14-.25 0-.38.11-.5.11-.12.25-.3.37-.45.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42h-.47c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.17 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.5.58.19 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.47-.28z"/>']
];

const socialHtml = socials.map(([name, href, path]) =>
`          <li><a href="${href}" aria-label="Kazi Connect on ${name}" rel="noopener me" target="_blank">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${path}</svg>
          </a></li>`).join('\n');

const FOOTER = `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">

      <!-- Brand + social -->
      <div class="footer-brand">
        <a class="logo" href="index.html"><span class="logo-mark" aria-hidden="true">K</span> Kazi&nbsp;Connect</a>
        <p>Tanzania's recruitment and HR services company - and the hiring platform behind them.
           Based in Dar es Salaam.</p>
        <!-- PLACEHOLDER social URLs - swap each href in build-footer.js for the real profile -->
        <ul class="socials" aria-label="Kazi Connect on social media">
${socialHtml}
        </ul>
      </div>

      <!-- Important links -->
      <nav class="footer-col" aria-labelledby="ftImportant">
        <h2 id="ftImportant">Important Links</h2>
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="services.html">Recruitment &amp; HR Services</a></li>
          <li><a href="software.html">Kazi Connect HMS</a></li>
          <li><a href="sectors.html">Sectors</a></li>
          <li><a href="about.html">About Us</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </nav>

      <!-- Legal & policies -->
      <nav class="footer-col" aria-labelledby="ftLegal">
        <h2 id="ftLegal">Legal &amp; Policies</h2>
        <ul>
          <li><a href="legal.html#terms">Terms of Service</a></li>
          <li><a href="legal.html#privacy">Privacy Policy</a></li>
          <li><a href="legal.html#pdpa">Data Protection (PDPA 2022)</a></li>
          <li><a href="legal.html#refunds">Cancellation &amp; Refund Policy</a></li>
          <li><a href="legal.html#conduct">Code of Conduct</a></li>
          <li><a href="legal.html#copyright">Copyright &amp; Acceptable Use</a></li>
        </ul>
      </nav>

      <!-- Platform -->
      <nav class="footer-col" aria-labelledby="ftPlatform">
        <h2 id="ftPlatform">Platform</h2>
        <ul>
          <li><a href="index.html#candidates">Candidate registration</a></li>
          <li><a href="https://afrikakazihms.netlify.app/dashboard.html">HMS Dashboard</a></li>
          <li><a href="https://afrikakazihms.netlify.app/HMS_Registration_Portal.html">Registration Portal</a></li>
          <li><a href="investor.html">Investor Access</a></li>
        </ul>
      </nav>
    </div>

    <div class="footer-line">
      <span>© <span id="year">2026</span> Kazi Connect. Dar es Salaam, Tanzania.</span>
      <span>Personal data is handled under Tanzania's Personal Data Protection Act (2022).</span>
    </div>
  </div>
</footer>`;

// investor.html keeps its own minimal confidential footer
const pages = ['index.html','services.html','software.html','sectors.html',
               'about.html','contact.html','legal.html'];

const DIR = 'site/';

let changed = 0;
for (const p of pages) {
  const file = DIR + p;
  const src = fs.readFileSync(file, 'utf8');
  if (!/<footer class="site-footer">[\s\S]*?<\/footer>/.test(src)) {
    console.log('!! NO FOOTER FOUND in ' + file);
    continue;
  }
  const out = src.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, FOOTER);
  if (out !== src) { fs.writeFileSync(file, out); changed++; console.log('updated  ' + file); }
  else console.log('up to date ' + file);
}
console.log('\n' + changed + '/' + pages.length + ' pages updated');
