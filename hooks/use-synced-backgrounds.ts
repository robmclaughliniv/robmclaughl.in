'use client';

import { useState, useEffect, useRef } from 'react';
import { useAudioPlayerContext } from '@/components/audio-player/AudioPlayerContext';
import { useChannelContext } from '@/components/channels/ChannelContext';

const FALLBACK_VIDEO = '/channels/study-chill/videos/bg-sand.mp4';
const FALLBACK_IMAGE = '/placeholder.jpg';

interface MediaEntry {
  id: string;
  src: string;
}

interface MobileVideoEntry extends MediaEntry {
  poster?: string;
}

interface VideoManifest {
  videos: MediaEntry[];
}

interface MobileManifest {
  videos?: MobileVideoEntry[];
  images?: MediaEntry[];
}

export interface MobileBackgroundEntry {
  src: string;
  poster: string;
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

const loadVideoManifest = async (manifestUrl: string): Promise<string[]> => {
  const response = await fetch(manifestUrl);
  if (!response.ok) throw new Error(`Video manifest HTTP ${response.status}`);

  const data: VideoManifest = await response.json();
  if (!data.videos?.length) throw new Error('Empty video manifest');

  return data.videos.map((video) => video.src);
};

const loadMobileManifest = async (
  manifestUrl: string
): Promise<{
  videos: MobileBackgroundEntry[];
  images: string[];
}> => {
  const response = await fetch(manifestUrl);
  if (!response.ok) throw new Error(`Mobile manifest HTTP ${response.status}`);

  const data: MobileManifest = await response.json();
  const images = data.images?.map((image) => image.src) ?? [];
  const imagePosterById = new Map(
    data.images?.map((image) => [image.id, image.src]) ?? []
  );

  const videos =
    data.videos?.map((video) => ({
      src: video.src,
      poster: video.poster ?? imagePosterById.get(video.id) ?? FALLBACK_IMAGE,
    })) ?? [];

  if (videos.length === 0 && images.length === 0) {
    throw new Error('Empty mobile manifest');
  }

  return { videos, images };
};

export const useSyncedBackgrounds = () => {
  const { currentTrackIndex, tracks } = useAudioPlayerContext();
  const { currentChannel } = useChannelContext();
  const [videoSrc, setVideoSrc] = useState(FALLBACK_VIDEO);
  const [mobileVideoSrc, setMobileVideoSrc] = useState<string | null>(null);
  const [mobilePosterSrc, setMobilePosterSrc] = useState(FALLBACK_IMAGE);
  const [mobileImageSrc, setMobileImageSrc] = useState(FALLBACK_IMAGE);
  const [isLoading, setIsLoading] = useState(true);
  const videosRef = useRef<string[]>([]);
  const mobileVideosRef = useRef<MobileBackgroundEntry[]>([]);
  const imagesRef = useRef<string[]>([]);
  const lastVideoRef = useRef(FALLBACK_VIDEO);
  const lastMobileVideoRef = useRef<string | null>(null);
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

  const selectNextMobileVideo = (exclude = lastMobileVideoRef.current) => {
    const pool = mobileVideosRef.current;
    if (pool.length === 0) {
      selectNextImage();
      setMobileVideoSrc(null);
      return;
    }

    const sources = pool.map((entry) => entry.src);
    const nextSrc = pickRandomItem(sources, pool[0].src, exclude);
    const entry = pool.find((item) => item.src === nextSrc) ?? pool[0];

    lastMobileVideoRef.current = nextSrc;
    setMobileVideoSrc(nextSrc);
    setMobilePosterSrc(entry.poster);
    setMobileImageSrc(entry.poster);
  };

  const currentTrackKey =
    tracks.length > 0
      ? `${currentTrackIndex}:${tracks[currentTrackIndex]?.id ?? 'unknown'}`
      : null;

  const channelId = currentChannel?.id ?? null;
  const desktopManifestUrl = currentChannel?.assets.desktopVideos ?? null;
  const mobileManifestUrl = currentChannel?.assets.mobileBackgrounds ?? null;

  useEffect(() => {
    if (!desktopManifestUrl || !mobileManifestUrl) return;

    let cancelled = false;

    const fetchManifests = async () => {
      setIsLoading(true);
      prevTrackKeyRef.current = null;

      const [videoResult, mobileResult] = await Promise.allSettled([
        loadVideoManifest(desktopManifestUrl),
        loadMobileManifest(mobileManifestUrl),
      ]);

      if (cancelled) return;

      if (videoResult.status === 'fulfilled') {
        videosRef.current = videoResult.value;
        selectNextVideo();
      } else {
        console.error('Failed to load video manifest:', videoResult.reason);
        videosRef.current = [FALLBACK_VIDEO];
        lastVideoRef.current = FALLBACK_VIDEO;
        setVideoSrc(FALLBACK_VIDEO);
      }

      if (mobileResult.status === 'fulfilled') {
        mobileVideosRef.current = mobileResult.value.videos;
        imagesRef.current = mobileResult.value.images;

        if (mobileVideosRef.current.length > 0) {
          selectNextMobileVideo();
        } else if (imagesRef.current.length > 0) {
          selectNextImage();
          setMobileVideoSrc(null);
        }
      } else {
        console.error('Failed to load mobile manifest:', mobileResult.reason);
        mobileVideosRef.current = [];
        imagesRef.current = [FALLBACK_IMAGE];
        lastImageRef.current = FALLBACK_IMAGE;
        setMobileVideoSrc(null);
        setMobilePosterSrc(FALLBACK_IMAGE);
        setMobileImageSrc(FALLBACK_IMAGE);
      }

      setIsLoading(false);
    };

    void fetchManifests();

    return () => {
      cancelled = true;
    };
  }, [channelId, desktopManifestUrl, mobileManifestUrl]);

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

    if (mobileVideosRef.current.length > 0) {
      selectNextMobileVideo();
    } else if (imagesRef.current.length > 0) {
      selectNextImage();
    }

    prevTrackKeyRef.current = currentTrackKey;
  }, [currentTrackKey, isLoading]);

  return { videoSrc, mobileVideoSrc, mobilePosterSrc, mobileImageSrc, isLoading };
};
