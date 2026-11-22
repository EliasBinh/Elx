<div align="center">

<img src="./assets/icon.png" alt="Elx Logo" width="120" style="border-radius: 26px;" />

# Elx

**An open-source Android music player with syllable-synced lyrics, Media3 background playback, and GitHub Releases auto-updates.**

[![Build APK](https://img.shields.io/github/actions/workflow/status/EliasBinh/Elx/build-apk.yml?branch=main&style=flat-square&label=Build%20APK&labelColor=0d0d10&logo=githubactions&logoColor=white)](https://github.com/EliasBinh/Elx/actions) [![Release](https://img.shields.io/github/v/release/EliasBinh/Elx?style=flat-square&label=release&labelColor=0d0d10&color=7a4dff)](https://github.com/EliasBinh/Elx/releases/latest) [![Platform](https://img.shields.io/badge/platform-Android-2ec4b6?style=flat-square&labelColor=0d0d10&logo=android&logoColor=white)](https://github.com/EliasBinh/Elx/releases/latest) [![License](https://img.shields.io/badge/license-MIT-534dff?style=flat-square&labelColor=0d0d10)](./LICENSE)

[Features](#features) • [Architecture](#architecture) • [Getting Started](#getting-started) • [Building APK](#building-apk) • [Auto-Updater](#auto-updater) • [License](#license)

</div>

---

## Features

- **YouTube Music Engine**: Searches and streams audio formats (m4a/opus) via `youtubei.js`, with automatic infinite queue generation based on related tracks.
- **Syllable-Synced Lyrics**: Parses standard LRC and word-level timestamps (`<mm:ss.xx>`) from LRCLIB and YouTube Music. Smooth auto-scroll with word-by-word glow and tap-to-seek.
- **Android Media3 Background Playback**: Native foreground service via `react-native-track-player` with lock screen controls, live artwork, and audio focus handling (auto-pause on calls).
- **Samsung One UI Optimization**: Proactive check prompting users to disable battery restrictions so audio isn't killed in the background.
- **In-App Auto-Updater**: Checks GitHub Releases on launch, downloads newer APKs with progress, and triggers Android's package installer via `FileProvider`.
- **Minimalist Player UI**: Blurred album art backdrop, docked mini player, and persistent favorites cached with AsyncStorage.

---

## Architecture

```
Elx/
├── .github/workflows/
│   └── build-apk.yml        # GitHub Actions APK build & release
├── android/                 # Bare Android native project (Media3 & FileProvider)
│   └── app/src/main/
│       ├── AndroidManifest.xml  # Permissions, MusicService & FileProvider
│       └── res/xml/file_paths   # Secure cache paths for APK installer
├── assets/                  # Icons, adaptive mipmaps & splash assets
├── src/
│   ├── components/
│   │   ├── lyrics/          # Synced lyrics viewer (line & syllable glow)
│   │   ├── player/          # Docked MiniPlayer
│   │   └── UpdateModal.tsx  # In-app update dialog
│   ├── constants/           # App config & GitHub repo target
│   ├── screens/             # HomeScreen, PlayerScreen, LibraryScreen
│   ├── services/
│   │   ├── lyrics/          # LRCLIB fetcher & timestamp parsers
│   │   ├── playbackService  # Android headless media events
│   │   ├── updater.ts       # GitHub release checker & APK installer
│   │   └── youtube.ts       # InnerTube stream extraction & recommendations
│   ├── store/               # Zustand player & library stores
│   └── types/               # TypeScript definitions
├── App.tsx                  # Root navigation & app initialization
└── index.js                 # Entry point & TrackPlayer service registration
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Android device or emulator (Android 7.0+)

### Setup

```bash
git clone https://github.com/EliasBinh/Elx.git
cd Elx
npm install --legacy-peer-deps
npm start
```

---

## Building APK

### 1. Automated via GitHub Actions

Pushing a version tag triggers `.github/workflows/build-apk.yml`, builds `elx.apk`, and creates a GitHub Release:

```bash
git commit -am "Release v1.0.2"
git tag v1.0.2
git push origin v1.0.2
```

### 2. Manual Local Build

```bash
cd android
./gradlew assembleRelease --no-daemon
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`.

---

## Auto-Updater

1. The app queries `https://api.github.com/repos/EliasBinh/Elx/releases/latest` on launch.
2. If a higher semantic version tag exists, an update prompt appears.
3. The APK downloads directly into the app cache via `expo-file-system`.
4. An `Intent.ACTION_VIEW` intent opens the installer with a `content://` URI from `FileProvider`.

---

## License

MIT License. Free for personal and open-source usage.
