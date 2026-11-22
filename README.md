# Liner Mobile

A minimalist, high-performance Android music player inspired by [tryliner/desktop](https://github.com/tryliner/desktop). Built for long-term use: 100% ad-free, powered by YouTube Music, with syllable-accurate synchronized lyrics, Android Media3 background playback, and zero-friction In-App Auto-Updates via GitHub Releases.

---

## Features

- **Ad-Free Music Core**: Query and stream high-quality audio tracks, albums, and artists directly from YouTube Music via InnerTube API (`youtubei.js`).
- **Signature Minimalist UI**: Clean, full-bleed album art background blur, fluid controls, and distraction-free dark typography.
- **Syllable-Level Synced Lyrics**:
  - Live auto-scrolling flatlist synced to current playback milliseconds.
  - Progressive word/syllable glowing highlight effect.
  - Interactive tap-to-seek directly to any lyric line.
  - Multi-source lyrics engine powered by LRCLIB and YouTube Music.
- **Android Media3 Background Playback & Samsung Optimization**:
  - Persistent Android Foreground Service (`FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `WAKE_LOCK`).
  - Native lock screen MediaStyle controls, seekbar, and Bluetooth/headset media buttons.
  - Samsung One UI proactive battery optimization exemption handler to prevent the OS from killing playback.
- **In-App Auto-Updater**:
  - Automatically queries your repository's latest GitHub release on launch.
  - Seamless background APK download with progress indicator.
  - 1-tap installation via Android `FileProvider`.
- **Automated CI/CD**: GitHub Actions workflow builds and attaches release APKs automatically upon pushing any Git tag.

---

## Tech Stack

- **Framework**: React Native with Expo (Prebuild / Bare workflow)
- **Audio Service**: `react-native-track-player` (ExoPlayer / Android Media3)
- **Streaming Parser**: `youtubei.js`
- **Styling**: NativeWind (Tailwind CSS)
- **State & Caching**: Zustand + TanStack Query + AsyncStorage
- **CI/CD**: GitHub Actions (`build-apk.yml`)

---

## Project Structure

```
liner-mobile/
├── .github/workflows/
│   └── build-apk.yml        # Automated release APK pipeline
├── android/                 # Native Android project (Media3 & FileProvider)
├── src/
│   ├── components/
│   │   ├── lyrics/          # Syllable & line-synced lyrics viewer
│   │   ├── player/          # MiniPlayer & scrub bar
│   │   └── UpdateModal.tsx  # In-App Auto-Updater modal
│   ├── constants/           # App & repository configurations
│   ├── screens/             # Home, Search, Player, Library
│   ├── services/
│   │   ├── lyrics/          # LRCLIB & LRC/TTML parser
│   │   ├── playbackService  # Android headless media service
│   │   ├── updater.ts       # GitHub Releases APK installer
│   │   └── youtube.ts       # InnerTube stream extraction
│   ├── store/               # Zustand player & library state
│   └── types/               # TypeScript definitions
├── App.tsx                  # Root application coordinator
└── index.js                 # Entry point & headless service registration
```

---

## Getting Started

### 1. Prerequisites
- Node.js 20+
- npm or yarn

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Run Development Server
```bash
npx expo start
```

---

## Configuring the In-App Auto-Updater

To connect the In-App Updater to your own GitHub repository:
1. Open [`src/constants/config.ts`](src/constants/config.ts).
2. Set `DEFAULT_GITHUB_OWNER` and `DEFAULT_GITHUB_REPO`:
   ```typescript
   export const APP_CONFIG = {
     DEFAULT_GITHUB_OWNER: "your-github-username",
     DEFAULT_GITHUB_REPO: "your-repo-name",
     // ...
   };
   ```

---

## Publishing a Release & Triggering Auto-Update

When you push a new Git tag to GitHub, the automated CI/CD workflow builds the APK and publishes a new GitHub Release:

```bash
# 1. Update version in package.json and app.json (e.g. 1.0.1)
# 2. Commit and tag
git commit -am "Release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

The GitHub Actions workflow will:
1. Compile the Android release APK (`liner-mobile.apk`).
2. Attach it to the release tag `v1.0.1`.
3. Non-technical users opening Liner Mobile will immediately be prompted with:
   *"Update Available: Version v1.0.1 is now available"*
   and can update with a single tap.
