# Kazi Connect - marketing site

The public website for Kazi Connect: recruitment & HR services (TZS) and the
Kazi Connect HMS software subscription (USD).

This is a **separate project from the HMS application**, which lives in
`E:\HMS V0.001\site-repo` and deploys to a different Netlify site.

| | |
|---|---|
| Live site | https://kaziconnects.netlify.app |
| Netlify project | `kaziconnects` (id `1c458853-ef3a-4c01-84a5-75666747d6ca`) |
| HMS app (separate) | https://afrikakazihms.netlify.app |

## Layout

```
Kazi Connect/
  site/                  <- everything that gets deployed
    index.html           home
    services.html        Line 1 - Recruitment & HR Services (TZS)
    software.html        Line 2 - Kazi Connect HMS (USD)
    sectors.html         four sectors
    about.html           the company
    contact.html         enquiry form
    legal.html           6 policies, anchored (#privacy #terms #pdpa
                         #refunds #conduct #copyright)
    investor.html        gated briefing, noindex, off-nav
    assets/
      styles.css         whole design system, shared by every page
      site.js            theme, nav, forms, investor gate, charts
      img/               web-sized images only
    netlify.toml         security headers (CSP, X-Frame-Options, etc.)

  build-footer.js        rewrites the shared footer on all public pages
  add-og-image.js        adds Open Graph / Twitter image tags
  remove-results.js      (historical) removed the Results page + its links
  fix-dashes.js          replaces em dashes with ASCII hyphens
  process-images.ps1     resize/crop/compress source photos into site/assets/img

  unused-images/         source photos NOT used on the site, plus the
                         full-size originals. Never deployed.
  archive/               the original single-file version, superseded
```

Maintenance scripts live **outside** `site/` on purpose, so they are never
published. Run them from this folder (`E:\Kazi Connect`), not from `site/`.

## No build step

Plain HTML, CSS and JS. No npm, no framework, no bundler. The only external
dependency is Chart.js via CDN, loaded on `investor.html` only.

## Local preview

```bash
python -m http.server 8765 --directory site
```

Then open http://localhost:8765

## Deploy

```bash
netlify deploy --prod --dir site --site 1c458853-ef3a-4c01-84a5-75666747d6ca
```

Run it from `E:\Kazi Connect`. This is a manual CLI deploy - the site is not
yet connected to a git repository for automatic deploys.

## Things to change before/when you can

- **`FORM_ENDPOINT`** in `site/assets/site.js` is a placeholder. All three
  forms (candidate registration, enquiry, investor documents) POST to it and
  currently fall back to an "email us instead" message.
- **`INVESTOR_ACCESS_CODE`** in `site/assets/site.js` is `KAZI2026`. The gate
  is client-side only - anyone reading the page source can find it. It keeps
  the briefing out of casual view; it is not security.
- **Social URLs** in `build-footer.js` are placeholders pointing at unclaimed
  handles. Edit them there, then run `node build-footer.js` to update all
  pages at once.
- **Founder photo, logo and HMS screenshots** are still missing. The About
  page shows initials, and the software page describes the product without
  showing it.

## Accuracy rules this site follows

Kazi Connect is pre-launch with no delivered client engagements. The site
deliberately makes **no claim of a track record**: there are no case studies,
no client names, no outcome figures. The investor page states the pre-revenue
position explicitly and labels every figure a projection.

If you add results later, report them unrounded, and label any sample data in
HMS screenshots as illustrative.
