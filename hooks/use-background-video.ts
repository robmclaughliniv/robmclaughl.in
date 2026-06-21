'use client';

import { useState, useEffect, useRef } from 'react';
import { useAudioPlayerContext } from '@/components/audio-player/AudioPlayerContext';

const MANIFEST_URL = '/videos/manifest.json';
const FALLBACK_VIDEO = '/videos/bg-sand.mp4';

interface VideoEntry {
  id: string;
  src: string;
}

interface VideoManifest {
  videos: VideoEntry[];
}

export const pickRandomVideo = (videos: string[], exclude?: string): string => {
  if (videos.length === 0) return FALLBACK_VIDEO;
  if (videos.length === 1) return videos[0];

  const candidates = exclude ? videos.filter((src) => src !== exclude) : videos;
  const pool = candidates.length > 0 ? candidates : videos;

  return pool[Math.floor(Math.random() * pool.length)];
};

export const useBackgroundVideo = () => {
  const { currentTrackIndex, tracks } = useAudioPlayerContext();
  const [videoSrc, setVideoSrc] = useState(FALLBACK_VIDEO);
  const [isLoading, setIsLoading] = useState(true);
  const videosRef = useRef<string[]>([]);
  const lastVideoRef = useRef(FALLBACK_VIDEO);
  const prevTrackKeyRef = useRef<string | null>(null);

  const selectNextVideo = (exclude = lastVideoRef.current) => {
    const next = pickRandomVideo(videosRef.current, exclude);
    lastVideoRef.current = next;
    setVideoSrc(next);
  };

  const currentTrackKey =
    tracks.length > 0
      ? `${currentTrackIndex}:${tracks[currentTrackIndex]?.id ?? 'unknown'}`
      : null;

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const response = await fetch(MANIFEST_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data: VideoManifest = await response.json();
        if (!data.videos?.length) throw new Error('Empty manifest');

        const sources = data.videos.map((video) => video.src);
        videosRef.current = sources;
        selectNextVideo();
      } catch (error) {
        console.error('Failed to load video manifest:', error);
        videosRef.current = [FALLBACK_VIDEO];
        lastVideoRef.current = FALLBACK_VIDEO;
        setVideoSrc(FALLBACK_VIDEO);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchManifest();
  }, []);

  useEffect(() => {
    if (isLoading || !currentTrackKey) return;

    if (prevTrackKeyRef.current === null) {
      prevTrackKeyRef.current = currentTrackKey;
      return;
    }

    if (prevTrackKeyRef.current === currentTrackKey) return;

    selectNextVideo();
    prevTrackKeyRef.current = currentTrackKey;
  }, [currentTrackKey, isLoading]);

  return { videoSrc, isLoading };
};
