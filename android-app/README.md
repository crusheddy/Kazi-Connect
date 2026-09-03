# Kazi Connect — Android app

Packages the marketing site and the Hiring Management System into a single
APK. Both are bundled offline: everything needed to render ships inside the
app, so it opens with no internet.

```
android-app/
  scripts/build-www.mjs    assembles www/ from ../site + hms-src/
  scripts/vendor-fonts.mjs downloads the Google Fonts into vendor/ (run once)
  scripts/make-icons.mjs   renders the "K" launcher icons
  src/app-shell.js         native behaviour: back button, external links
  hms-src/                 HMS pages, vendored from crusheddy/HMS-V0.001
  vendor/                  self-hosted fonts (Chart.js comes from node_modules)
  android/                 the Android Studio project
  www/                     generated — not committed
```

## Build the APK

**Via GitHub Actions** — push to any branch. `.github/workflows/android.yml`
builds a debug APK and attaches it to the run; download it from the run's
Artifacts section (`kazi-connect-apk`). Also runnable on demand from the
Actions tab via *Run workflow*.

**Locally** — needs JDK 21 and the Android SDK:

```bash
cd android-app
npm ci
npm run apk     # -> android/app/build/outputs/apk/debug/app-debug.apk
```

**In Android Studio** — run `npm ci && npm run sync` first (this generates
`www/` and copies it into the Android project), then open `android-app/android`.

## What is bundled vs. what needs the network

Bundled: all 8 site pages, the HMS dashboard, registration portal and admin
login, all images, Chart.js, and the DM Sans / DM Mono / Raleway / Inter
webfonts. Verified: rendering these pages issues zero external requests.

Needs the network, and fails gracefully without it:

| Feature | Endpoint |
| --- | --- |
| HMS registration submit / inbox | `afrikakazihms.netlify.app/api/*` |
| Selcom payments | `afrikakazihms.netlify.app/.netlify/functions/*` |
| Applicant location lookup | `ipapi.co` |
| QR codes | `api.qrserver.com` |
| Social and WhatsApp links | open in the system browser |

The HMS backend is Netlify Functions, so those calls are rewritten at build
time from root-relative paths to the live host.

## Updating content

- Site changes: edit `site/`, then `npm run sync`.
- HMS changes: copy the updated pages into `hms-src/`, then `npm run sync`.
- Font families: edit the list in `scripts/vendor-fonts.mjs`, run `npm run fonts`.

## Release builds

`npm run apk` produces a *debug* APK — installable, but not Play Store
material. For a release build, generate a keystore, add a `signingConfigs`
block to `android/app/build.gradle`, and run `./gradlew assembleRelease`.
Keep the keystore out of the repo (`.gitignore` already excludes `*.keystore`).
