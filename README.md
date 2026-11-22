# Elx 🎵

A minimalist, high-performance Android music player inspired by [tryliner/desktop](https://github.com/tryliner/desktop). Built for long-term use: 100% ad-free, powered by YouTube Music, with syllable-accurate synchronized lyrics, Android Media3 background playback, and zero-friction In-App Auto-Updates via GitHub Releases.

- **Repository**: [https://github.com/EliasBinh/Elx](https://github.com/EliasBinh/Elx)

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
  - Automatically queries `https://api.github.com/repos/EliasBinh/Elx/releases/latest` on launch.
  - Seamless background APK download with progress indicator.
  - 1-tap installation via Android `FileProvider`.
- **Automated CI/CD**: GitHub Actions workflow builds and attaches `elx.apk` automatically upon pushing any Git tag.

---

## Getting Started

### 1. Run Development Server
```bash
npm start
```

### 2. Push Code to GitHub
```bash
git remote add origin https://github.com/EliasBinh/Elx.git
git branch -M main
git push -u origin main --force
```

### 3. Build & Release First APK (via GitHub Actions)
Whenever you push a tag, GitHub Actions builds and releases `elx.apk`:
```bash
git tag v1.0.0
git push origin v1.0.0
```
