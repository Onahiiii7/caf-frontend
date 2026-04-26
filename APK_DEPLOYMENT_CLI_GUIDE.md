# APK/AAB Deployment (CLI-only, No Android Studio)

This guide gives you a production path to build signed Android artifacts from the command line using Capacitor + Gradle.

## 1) One-time prerequisites

- Install JDK 17+
- Install Android SDK + platform/build-tools
- Make sure `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) is set
- Ensure Android command-line tools are available

## 2) Prepare signing credentials

1. Generate keystore once (if you don't have one):

```powershell
keytool -genkeypair -v -keystore release-key.jks -alias caf_release -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/keystore.properties` from example:

- Copy `android/keystore.properties.example` -> `android/keystore.properties`
- Fill values:
  - `storeFile`
  - `storePassword`
  - `keyAlias`
  - `keyPassword`

Alternative: set env vars instead of file:
- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

## 3) Build signed release artifacts

From `frontend`:

### Signed AAB (for Play Store)
```powershell
pnpm run android:bundle
```
Output:
- `android/app/build/outputs/bundle/release/app-release.aab`

### Signed APK (for direct install/testing)
```powershell
pnpm run android:apk
```
Output:
- `android/app/build/outputs/apk/release/app-release.apk`

## 4) Increment version before each release

Edit `android/app/build.gradle`:
- `versionCode` must increase every Play upload
- `versionName` is display version for users

## 5) Upload to Google Play

- Use `app-release.aab`
- Start with Internal Testing track first
- Promote to Closed/Open/Production after verification

---

# Automatic updates after install (web layer)

## Important limitation

Capacitor live updates can update **web assets only** (JS/CSS/HTML).
Native/plugin changes still require a new store release.

## Implemented in this project

The app bootstrap already includes a mobile-only live update check in:
- `src/main.tsx`

Environment controls:
- `VITE_ENABLE_LIVE_UPDATES=true|false`
- `VITE_LIVE_UPDATE_CHANNEL=production`

Current behavior on native builds:
1. `notifyAppReady()`
2. `setChannel(...)`
3. `download(...)`
4. `set(...)` when a new bundle exists

## Recommended approach

Use a Capacitor live-update service (e.g., Capgo or Ionic Appflow):

1. Install plugin and configure channel (e.g., `production`)
2. On app start, check for updates
3. Download and apply update automatically
4. Keep staged rollout channels: `beta` -> `production`

## Capgo CLI flow (example)

1. Install dependencies:

```powershell
pnpm install
```

2. Build web assets:

```powershell
pnpm run live:update:build
```

3. Publish built web bundle to your Capgo channel (example command; adjust to your Capgo setup):

```powershell
npx @capgo/cli bundle upload --channel production --path dist
```

4. Install/update app once from Play/Internal testing.

5. Subsequent web updates can roll out by publishing new bundles to the same channel.

## Safe rollout strategy

- Push update to `beta` first
- Test on real devices
- Promote to `production`
- Keep a rollback path to last known good bundle

## Suggested release model

- Native release cadence: only when plugins/permissions/native code changes
- Live update cadence: UI and business logic fixes/features

---

# CI/CD idea (optional)

You can fully automate with GitHub Actions:

1. Install Node + Java + Android SDK
2. `pnpm install`
3. `pnpm run android:bundle`
4. Upload artifact / auto-publish to Play Internal track

Store signing secrets in CI secret manager (never in repo).
