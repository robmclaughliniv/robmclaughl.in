'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

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

export type UseAudioPlayerReturn = AudioPlayerState & AudioPlayerActions;

const PLAYLIST_URL = '/audio/playlist.json';
const DEFAULT_VOLUME = 0.5;

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeBeforeMute = useRef(DEFAULT_VOLUME);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Create the Audio element once on mount
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = DEFAULT_VOLUME;
    audioRef.current.muted = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Fetch playlist on mount
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await fetch(PLAYLIST_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data: Playlist = await response.json();
        if (!data.tracks?.length) throw new Error('Empty playlist');

        setTracks(data.tracks);
        setHasError(false);
      } catch (error) {
        console.error('Failed to load playlist:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylist();
  }, []);

  // Load and play track when tracks load or index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;

    const track = tracks[currentTrackIndex];
    if (!track) return;

    audio.src = track.src;
    audio.load();

    audio.muted = isMuted;
    audio.volume = volume;

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [tracks, currentTrackIndex]); // eslint-disable-line react-hooks/exhaustive-deps

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
    audioRef.current?.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.muted = false;
      audio.volume = volumeBeforeMute.current;
      setVolumeState(volumeBeforeMute.current);
      setIsMuted(false);
    } else {
      volumeBeforeMute.current = audio.volume;
      audio.muted = true;
      setIsMuted(true);
    }
  }, [isMuted]);

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = clamped;
    setVolumeState(clamped);
    volumeBeforeMute.current = clamped;

    if (clamped === 0) {
      audio.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
    }
  }, [isMuted]);

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
    play,
    pause,
    toggleMute,
    setVolume,
    nextTrack,
    prevTrack,
    toggleCollapse,
  };
};
