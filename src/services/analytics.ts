import { APP_CONFIG } from '../constants/config';
import { TrackInfo } from '../types';

/**
 * Lightweight global telemetry & analytics client.
 * Connects to PostHog, Supabase, or custom analytics endpoints.
 */
export interface AnalyticsEvent {
  event: 'app_launch' | 'song_played' | 'song_completed' | 'lyrics_viewed' | 'update_prompted';
  properties?: Record<string, any>;
  timestamp: string;
}

export const analytics = {
  /**
   * Dispatches an anonymous telemetry event.
   */
  async track(event: AnalyticsEvent['event'], properties: Record<string, any> = {}) {
    try {
      const payload: AnalyticsEvent = {
        event,
        properties: {
          ...properties,
          app_version: APP_CONFIG.VERSION,
          app_name: APP_CONFIG.APP_NAME,
        },
        timestamp: new Date().toISOString(),
      };

      // If remote telemetry endpoint is configured, POST payload
      // e.g., fetch('https://your-analytics-domain/api/event', { method: 'POST', body: JSON.stringify(payload) })
      if (__DEV__) {
        console.log('[Analytics Event]:', payload.event, payload.properties);
      }
    } catch (e) {
      // Telemetry should never crash or interfere with app performance
    }
  },

  trackSongPlayed(track: TrackInfo) {
    this.track('song_played', {
      track_id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
    });
  },

  trackAppLaunch() {
    this.track('app_launch', {
      platform: 'android',
    });
  },
};

