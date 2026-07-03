'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAudioAnalyser } from '@/hooks/use-audio-analyser';

interface Track {
  id: string;
  title: string;
  src: string;
}

interface Playlist {
  tracks: Track[];
}

interface AudioPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTrackIndex: number;
  tracks: Track[];
  isLoading: boolean;
  isCollapsed: boolean;
  hasError: boolean;
}

interface AudioPlayerActions {
  play: () => void;
  pause: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleCollapse: () => void;
}

export type UseAudioPlayerReturn = AudioPlayerState &
  AudioPlayerActions & {
    analyserRef: React.RefObject<AnalyserNode | null>;
  };

const DEFAULT_VOLUME = 0.5;
const MOBILE_BREAKPOINT = 768;
const CHANNEL_FADE_SEC = 0.25;

const getInitialCollapsed = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
};

const shuffleTracks = <T,>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const attemptPlay = async (
  audio: HTMLAudioElement,
  ensureGraphReady: () => boolean,
  resumeAudioContext: () => Promise<void>
): Promise<boolean> => {
  if (!ensureGraphReady()) return false;

  // Must stay false when using MediaElementSource — element mute silences the graph.
  audio.muted = false;
  await resumeAudioContext();
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
};

const createAudioElement = (): HTMLAudioElement => {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  return audio;
};

export const useAudioPlayer = (playlistUrl: string | null): UseAudioPlayerReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (audioRef.current === null && typeof window !== 'undefined') {
    audioRef.current = createAudioElement();
  }
  const volumeBeforeMute = useRef(DEFAULT_VOLUME);
  const interactionRetryRegistered = useRef(false);
  const isMutedRef = useRef(true);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const prevPlaylistUrlRef = useRef<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed);
  const [hasError, setHasError] = useState(false);

  isMutedRef.current = isMuted;
  volumeRef.current = volume;

  const { analyserRef, resumeAudioContext, ensureGraphReady, fadeGain } = useAudioAnalyser({
    audioRef,
    isMuted,
    volume,
  });

  const registerInteractionRetry = useCallback(() => {
    if (interactionRetryRegistered.current) return;
    interactionRetryRegistered.current = true;

    const handleInteraction = () => {
      const audio = audioRef.current;
      if (!audio) return;

      void attemptPlay(audio, ensureGraphReady, resumeAudioContext).then((success) => {
        if (success) setIsPlaying(true);
      });

      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('pointerdown', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
  }, [ensureGraphReady, resumeAudioContext]);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsCollapsed(true);
      }
    };

    mql.addEventListener('change', handleViewportChange);
    return () => mql.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!playlistUrl) return;

    let cancelled = false;

    const fetchPlaylist = async () => {
      const isChannelSwitch =
        prevPlaylistUrlRef.current !== null && prevPlaylistUrlRef.current !== playlistUrl;
      prevPlaylistUrlRef.current = playlistUrl;

      setIsLoading(true);

      const audio = audioRef.current;
      if (isChannelSwitch && audio) {
        await fadeGain(0, CHANNEL_FADE_SEC);
        audio.pause();
        setIsPlaying(false);
      }

      try {
        const response = await fetch(playlistUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data: Playlist = await response.json();
        if (!data.tracks?.length) throw new Error('Empty playlist');

        if (cancelled) return;

        setTracks(shuffleTracks(data.tracks));
        setCurrentTrackIndex(0);
        setHasError(false);

        if (isChannelSwitch) {
          const targetGain = isMutedRef.current ? 0 : volumeRef.current;
          await fadeGain(targetGain, CHANNEL_FADE_SEC);
        }
      } catch (error) {
        console.error('Failed to load playlist:', error);
        if (!cancelled) {
          setHasError(true);
          setTracks([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchPlaylist();

    return () => {
      cancelled = true;
    };
  }, [playlistUrl, fadeGain]);

  // Load and play track when tracks load or index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;

    const track = tracks[currentTrackIndex];
    if (!track) return;

    audio.src = track.src;
    audio.load();

    void attemptPlay(audio, ensureGraphReady, resumeAudioContext).then((success) => {
      if (success) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
        registerInteractionRetry();
      }
    });
  }, [tracks, currentTrackIndex, ensureGraphReady, resumeAudioContext, registerInteractionRetry]);

  // Advance to next track on ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setCurrentTrackIndex((prev) =>
        prev >= tracks.length - 1 ? 0 : prev + 1
      );
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [tracks.length]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    void attemptPlay(audio, ensureGraphReady, resumeAudioContext).then((success) => {
      setIsPlaying(success);
    });
  }, [ensureGraphReady, resumeAudioContext]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggleMute = useCallback(() => {
    void resumeAudioContext();

    if (isMuted) {
      const restored =
        volumeBeforeMute.current > 0 ? volumeBeforeMute.current : DEFAULT_VOLUME;
      setVolumeState(restored);
      volumeBeforeMute.current = restored;
      setIsMuted(false);
    } else {
      volumeBeforeMute.current = volume > 0 ? volume : DEFAULT_VOLUME;
      setIsMuted(true);
    }
  }, [isMuted, volume, resumeAudioContext]);

  const setVolume = useCallback(
    (newVolume: number) => {
      void resumeAudioContext();
      const clamped = Math.max(0, Math.min(1, newVolume));

      if (clamped === 0) {
        if (!isMuted && volume > 0) {
          volumeBeforeMute.current = volume;
        }
        setVolumeState(0);
        setIsMuted(true);
        return;
      }

      setVolumeState(clamped);
      volumeBeforeMute.current = clamped;
      if (isMuted) {
        setIsMuted(false);
      }
    },
    [isMuted, volume, resumeAudioContext]
  );

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) =>
      prev >= tracks.length - 1 ? 0 : prev + 1
    );
  }, [tracks.length]);

  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) =>
      prev <= 0 ? tracks.length - 1 : prev - 1
    );
  }, [tracks.length]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return {
    isPlaying,
    isMuted,
    volume,
    currentTrackIndex,
    tracks,
    isLoading,
    isCollapsed,
    hasError,
    analyserRef,
    play,
    pause,
    toggleMute,
    setVolume,
    nextTrack,
    prevTrack,
    toggleCollapse,
  };
};
