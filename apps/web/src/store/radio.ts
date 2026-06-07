import { create } from 'zustand';

export interface RadioConfig {
  streamUrl: string | null;
  stationName: string | null;
  coverImageUrl: string | null;
  isEnabled: boolean;
}

export interface NowPlaying {
  title: string | null;
  artist: string | null;
  art: string | null;
  listeners: number | null;
  isLive: boolean;
}

interface RadioState {
  config: RadioConfig | null;
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  volume: number; // 0..1
  muted: boolean;
  setConfig: (c: RadioConfig | null) => void;
  setNowPlaying: (n: NowPlaying | null) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

export const useRadioStore = create<RadioState>((set) => ({
  config: null,
  nowPlaying: null,
  isPlaying: false,
  volume: 0.8,
  muted: false,
  setConfig: (config) => set({ config }),
  setNowPlaying: (nowPlaying) => set({ nowPlaying }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setVolume: (volume) => set({ volume, muted: volume === 0 }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}));
