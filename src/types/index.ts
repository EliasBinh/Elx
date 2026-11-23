export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork: string;
  duration: number; // in seconds
  streamUrl?: string;
  isLive?: boolean;
}

export interface Syllable {
  text: string;
  startTimeMs: number;
  endTimeMs: number;
}

export interface LyricLine {
  id: string;
  startTimeMs: number;
  endTimeMs: number;
  text: string;
  syllables?: Syllable[];
}

export interface LyricsData {
  trackId: string;
  synced: boolean;
  hasSyllables: boolean;
  lines: LyricLine[];
  source: 'lrclib' | 'youtube' | 'local';
}

export interface SearchResultItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork: string;
  durationText?: string;
  durationSeconds: number;
  type: 'song' | 'video' | 'album' | 'playlist' | 'artist';
}

export interface ReleaseAsset {
  id: number;
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: ReleaseAsset[];
}

export type PlaybackMode = 'repeat-off' | 'repeat-all' | 'repeat-one' | 'shuffle';

