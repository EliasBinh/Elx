<div align="center">

<img src="./assets/icon.png" alt="Elx Logo" width="130" style="border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />

# Elx

**Modern Android music streaming player with syllable-synced lyrics, Media3 background engine, and zero-friction in-app auto-updater.**

[![Build APK](https://img.shields.io/github/actions/workflow/status/EliasBinh/Elx/build-apk.yml?branch=main&style=flat-square&label=Build%20APK&labelColor=0d0d10&logo=githubactions&logoColor=white)](https://github.com/EliasBinh/Elx/actions) [![Release](https://img.shields.io/github/v/release/EliasBinh/Elx?style=flat-square&label=release&labelColor=0d0d10&color=7a4dff)](https://github.com/EliasBinh/Elx/releases/latest) [![Platform](https://img.shields.io/badge/platform-Android-2ec4b6?style=flat-square&labelColor=0d0d10&logo=android&logoColor=white)](https://github.com/EliasBinh/Elx/releases/latest) [![Audio Core](https://img.shields.io/badge/audio-Media3%20%2F%20ExoPlayer-f59e0b?style=flat-square&labelColor=0d0d10)](https://github.com/doublesymmetry/react-native-track-player) [![License](https://img.shields.io/badge/license-MIT-534dff?style=flat-square&labelColor=0d0d10)](./LICENSE)

[Features](#features) • [Architecture](#architecture) • [Getting Started](#getting-started) • [Building APK](#building-apk) • [In-App Updater](#in-app-updater) • [Samsung Optimization](#samsung-optimization) • [License](#license)

</div>

---

## Features

- **Ad-Free Music Core**: High-bitrate audio extraction directly from YouTube Music using InnerTube API (`youtubei.js`). Infinite radio queue autoplay based on the current playing track.
- **Syllable-Accurate Synced Lyrics**:
  - Live auto-scrolling flatlist tracked at 100ms intervals.
  - Progressive word/syllable glowing effect: words transition from muted zinc to radiant glowing white as the artist sings.
  - Interactive tap-to-seek directly to any lyric line.
  - Multi-source lyrics fallback combining LRCLIB and YouTube Music.
- **Android Media3 Background Playback**:
  - Guaranteed foreground background playback service (`FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `WAKE_LOCK`).
  - Android MediaStyle lock screen notifications with seekbar, album artwork, and play/pause/skip controls.
  - Audio focus management: Automatically pauses for incoming phone calls and smoothly resumes when finished.
- **Zero-Friction In-App Auto-Updater**:
  - Background check against GitHub Releases API on app launch.
  - Direct in-app APK download with real-time percentage progress bar.
  - 1-tap installation via Android `FileProvider` (`ACTION_VIEW`).
- **Signature Minimalist UI**:
  - Full-bleed blurred album art background with dynamic color adaptation.
  - Docked floating Mini Player and expansive full-screen playback screen.
  - Offline favorites and listening history cached via AsyncStorage.

---

## Architecture

The project is structured with modular service layers, state machines, and bare native Android integrations:

```
Elx/
├── .github/
│   └── workflows/
│       └── build-apk.yml        # Automated CI/CD release workflow
├── android/                     # Bare Android native project (Media3 & FileProvider)
│   └── app/src/main/
│       ├── AndroidManifest.xml  # Foreground services, permissions & FileProvider
│       └── res/xml/file_paths   # Secure cache paths for APK installer
├── assets/
│   ├── icon.png                 # Master high-res squircle icon
│   ├── adaptive-icon.png        # Android Adaptive Icon (Safe zone centered)
│   └── splash.png               # Minimalist launch screen
├── src/
│   ├── components/
│   │   ├── lyrics/
│   │   │   └── SyncedLyricsView # Word-by-word glowing lyrics viewer
│   │   ├── player/
│   │   │   └── MiniPlayer.tsx   # Docked bottom mini player bar
│   │   └── UpdateModal.tsx      # In-App Auto-Updater modal dialog
│   ├── constants/
│   │   └── config.ts            # App metadata & GitHub repo configuration
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Instant search & recently played queue
│   │   ├── LibraryScreen.tsx    # Saved favorites manager
│   │   └── PlayerScreen.tsx     # Full-bleed blurred now playing screen
│   ├── services/
│   │   ├── lyrics/
│   │   │   ├── lyricsParser.ts  # Enhanced LRC, TTML & Musixmatch parser
│   │   │   └── lyricsService.ts # LRCLIB + YouTube lyrics resolver
│   │   ├── playbackService.ts   # Android headless background audio service
│   │   ├── playerInit.ts        # TrackPlayer setup & audio capabilities
│   │   ├── samsungOptimizer.ts  # Samsung One UI battery optimization guard
│   │   ├── updater.ts           # GitHub Releases downloader & APK trigger
│   │   └── youtube.ts           # InnerTube stream extraction & radio autoplay
│   ├── store/
│   │   ├── libraryStore.ts      # Persistent favorites & history (AsyncStorage)
│   │   └── playerStore.ts       # Playback state machine & queue (Zustand)
│   └── types/
│       └── index.ts             # TypeScript definitions
├── App.tsx                      # Root coordinator & navigation shell
├── index.js                     # Entry point & headless service registration
└── tailwind.config.js           # NativeWind styling configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** `v20+`
- **npm** or **yarn**
- Android device or emulator (Android 7.0+)

---

### Setup & Development

```bash
# Clone the repository
git clone https://github.com/EliasBinh/Elx.git
cd Elx

# Install dependencies
npm install --legacy-peer-deps

# Start Expo development server
npm start
```

---

## Building APK

### 1. Automated via GitHub Actions (Recommended)

Every time you push a Git tag to GitHub, GitHub Actions compiles the Android release APK (`elx.apk`) and attaches it to a new GitHub Release:

```bash
# Commit your changes
git commit -am "Release v1.0.1"

# Create and push a version tag
git tag v1.0.1
git push origin v1.0.1
```

Track the build progress under [Actions](https://github.com/EliasBinh/Elx/actions).

---

### 2. Local Manual Build

```bash
# Generate native Android project
npx expo prebuild --platform android --clean

# Compile release APK
cd android
./gradlew assembleRelease --no-daemon
```

The compiled APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## In-App Updater

Elx includes a zero-friction auto-updater for non-technical users:
1. On launch, the app checks `https://api.github.com/repos/EliasBinh/Elx/releases/latest`.
2. When a newer semantic version is detected, a clean dialog prompts the user:
   > **Update Available**  
   > Version vX.X.X of Elx is now available.
3. Tapping **Update Now** downloads the APK with live percentage progress tracking.
4. Android's native `FileProvider` triggers `ACTION_VIEW` (`application/vnd.android.package-archive`) to prompt the user to install with a single tap.

---

## Samsung Optimization

Samsung One UI enforces aggressive battery restrictions that can terminate background media playback. Elx implements:
1. Android 14+ `FOREGROUND_SERVICE_MEDIA_PLAYBACK` and `WAKE_LOCK`.
2. Proactive check (`samsungOptimizer.ts`) that guides Samsung users to set the app's battery usage to **"Unrestricted"** for uninterrupted 24/7 background playback.

---

## License

Elx is distributed under the **MIT License**. Free for personal and open-source usage.
