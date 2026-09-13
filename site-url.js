/* ------------------------------------------------------------------
   The site's public origin - the ONE place it is written down.

   Canonical tags and og:/twitter: URLs have to be literal in the HTML,
   because crawlers and link-preview fetchers never run the page's
   JavaScript. So this cannot be a runtime constant: changing the domain
   means editing the line below and running

       node set-site-url.js

   which stamps it into every public page. `node set-site-url.js --check`
   reports drift without writing, so a stale domain is detectable.
   ------------------------------------------------------------------ */
module.exports = 'https://sternconnect.netlify.app';
