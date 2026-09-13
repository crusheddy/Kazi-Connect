# Kazi Connect — Android app

Packages the marketing site and the Hiring Management System into a single
APK. Both are bundled offline: everything needed to render ships inside the
app, so it opens with no internet.

```
android-app/
  scripts/build-www.mjs    assembles www/ from ../site + hms-src/
  scripts/vendor-fonts.mjs downloads the Google Fonts into vendor/ (run once)
  scripts/make-icons.mjs   renders the launcher icons
  scripts/check-icons.mjs  previews them under Android's mask shapes
  brand/logo.png           the Kazi Connect badge, as supplied
  brand/logo-foreground.png the K, sphere and swoosh, background keyed out
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
- Launcher icon: replace `brand/logo.png`, re-derive `brand/logo-foreground.png`
  from it (the mark with the green field keyed out), then `npm run icons`.
  `node scripts/check-icons.mjs` writes `icon-masks.png` showing the result
  under Android's circle, squircle, rounded-square and teardrop masks. Both
  scripts need Playwright (`npm i --no-save playwright`); the icons they
  produce are committed, so a normal build does not need it.

  The icon deliberately drops the "Kazi Connect" wordmark. Android's adaptive
  masks crop to the centre 66 of a 108dp canvas, which would cut the wordmark
  off, and at 48px it is unreadable anyway.

## Release builds

`npm run apk` produces a *debug* APK. The release build is wired up but needs
a signing key, which never goes in the repo.

**1. Generate the keystore** (once, and keep it safe — if the app ever reaches
the Play Store this key is its permanent identity, and losing it means never
being able to publish an update):

```bash
keytool -genkeypair -v \
  -keystore kazi-connect-release.keystore \
  -alias kazi-connect -keyalg RSA -keysize 2048 -validity 10000
```

**2. Add four repository secrets** under Settings → Secrets and variables →
Actions:

| Secret | Value |
| --- | --- |
| `KEYSTORE_BASE64` | `base64 -w0 kazi-connect-release.keystore` |
| `KEYSTORE_PASSWORD` | the store password from step 1 |
| `KEY_ALIAS` | `kazi-connect` |
| `KEY_PASSWORD` | the key password from step 1 |

Push, and the workflow attaches a signed `…-release.apk` to the run. Until
those secrets exist the release build still runs and is still checked — it
just comes out unsigned, and an unsigned APK will not install.

**Building a release locally** — put the same values in
`~/.gradle/gradle.properties` (outside the repo):

```properties
kaziKeystoreFile=/absolute/path/kazi-connect-release.keystore
kaziKeystorePassword=…
kaziKeyAlias=kazi-connect
kaziKeyPassword=…
```

then `cd android && ./gradlew assembleRelease`.

**R8** is on for release builds (`minifyEnabled` + `shrinkResources`).
Capacitor loads its plugins by name from `assets/capacitor.plugins.json`, so
R8 sees no reference to them — `android/app/proguard-rules.pro` keeps those
classes, and CI checks the built release APK still contains the plugin
manifest and the web bundle. Adding a Capacitor plugin means checking it
survives; a stripped plugin shows up as a crash on launch, not a build error.
