'use client';

import { useState, useEffect, useRef } from 'react';
import { useAudioPlayerContext } from '@/components/audio-player/AudioPlayerContext';

const VIDEO_MANIFEST_URL = '/videos/manifest.json';
const IMAGE_MANIFEST_URL = '/mobile_backgrounds/manifest.json';
const FALLBACK_VIDEO = '/videos/bg-sand.mp4';
const FALLBACK_IMAGE = '/placeholder.svg';

interface MediaEntry {
  id: string;
  src: string;
}

interface VideoManifest {
  videos: MediaEntry[];
}

interface ImageManifest {
  images: MediaEntry[];
}

export const pickRandomItem = (items: string[], fallback: string, exclude?: string): string => {
  if (items.length === 0) return fallback;
  if (items.length === 1) return items[0];

  const candidates = exclude ? items.filter((src) => src !== exclude) : items;
  const pool = candidates.length > 0 ? candidates : items;

  return pool[Math.floor(Math.random() * pool.length)];
};

export const pickRandomVideo = (videos: string[], exclude?: string): string =>
  pickRandomItem(videos, FALLBACK_VIDEO, exclude);

const loadVideoManifest = async (): Promise<string[]> => {
  const response = await fetch(VIDEO_MANIFEST_URL);
  if (!response.ok) throw new Error(`Video manifest HTTP ${response.status}`);

  const data: VideoManifest = await response.json();
  if (!data.videos?.length) throw new Error('Empty video manifest');

  return data.videos.map((video) => video.src);
};

const loadImageManifest = async (): Promise<string[]> => {
  const response = await fetch(IMAGE_MANIFEST_URL);
  if (!response.ok) throw new Error(`Image manifest HTTP ${response.status}`);

  const data: ImageManifest = await response.json();
  if (!data.images?.length) throw new Error('Empty image manifest');

  return data.images.map((image) => image.src);
};

export const useSyncedBackgrounds = () => {
  const { currentTrackIndex, tracks } = useAudioPlayerContext();
  const [videoSrc, setVideoSrc] = useState(FALLBACK_VIDEO);
  const [mobileImageSrc, setMobileImageSrc] = useState(FALLBACK_IMAGE);
  const [isLoading, setIsLoading] = useState(true);
  const videosRef = useRef<string[]>([]);
  const imagesRef = useRef<string[]>([]);
  const lastVideoRef = useRef(FALLBACK_VIDEO);
  const lastImageRef = useRef(FALLBACK_IMAGE);
  const prevTrackKeyRef = useRef<string | null>(null);

  const selectNextVideo = (exclude = lastVideoRef.current) => {
    const next = pickRandomItem(videosRef.current, FALLBACK_VIDEO, exclude);
    lastVideoRef.current = next;
    setVideoSrc(next);
  };

  const selectNextImage = (exclude = lastImageRef.current) => {
    const next = pickRandomItem(imagesRef.current, FALLBACK_IMAGE, exclude);
    lastImageRef.current = next;
    setMobileImageSrc(next);
  };

  const currentTrackKey =
    tracks.length > 0
      ? `${currentTrackIndex}:${tracks[currentTrackIndex]?.id ?? 'unknown'}`
      : null;

  useEffect(() => {
    const fetchManifests = async () => {
      const [videoResult, imageResult] = await Promise.allSettled([
        loadVideoManifest(),
        loadImageManifest(),
      ]);

      if (videoResult.status === 'fulfilled') {
        videosRef.current = videoResult.value;
        selectNextVideo();
      } else {
        console.error('Failed to load video manifest:', videoResult.reason);
        videosRef.current = [FALLBACK_VIDEO];
        lastVideoRef.current = FALLBACK_VIDEO;
        setVideoSrc(FALLBACK_VIDEO);
      }

      if (imageResult.status === 'fulfilled') {
        imagesRef.current = imageResult.value;
        selectNextImage();
      } else {
        console.error('Failed to load image manifest:', imageResult.reason);
        imagesRef.current = [FALLBACK_IMAGE];
        lastImageRef.current = FALLBACK_IMAGE;
        setMobileImageSrc(FALLBACK_IMAGE);
      }

      setIsLoading(false);
    };

    void fetchManifests();
  }, []);

  useEffect(() => {
    if (isLoading || !currentTrackKey) return;

    if (prevTrackKeyRef.current === null) {
      prevTrackKeyRef.current = currentTrackKey;
      return;
    }

    if (prevTrackKeyRef.current === currentTrackKey) return;

    if (videosRef.current.length > 0) {
      selectNextVideo();
    }

    if (imagesRef.current.length > 0) {
      selectNextImage();
    }

    prevTrackKeyRef.current = currentTrackKey;
  }, [currentTrackKey, isLoading]);

  return { videoSrc, mobileImageSrc, isLoading };
};
