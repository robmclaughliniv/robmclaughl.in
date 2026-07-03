'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { loadChannelsManifest } from '@/lib/channels/load-channel-manifest';
import type { Channel, UseChannelsReturn } from '@/lib/channels/types';

const STORAGE_KEY = 'channels:v1:lastIndex';
const OSD_DURATION_MS = 2000;

const readStoredIndex = (maxIndex: number): number => {
  if (typeof window === 'undefined') return 0;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return 0;
    const parsed = parseInt(stored, 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > maxIndex) return 0;
    return parsed;
  } catch {
    return 0;
  }
};

const writeStoredIndex = (index: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(index));
  } catch {
    // Private browsing or storage disabled
  }
};

export const useChannels = (): UseChannelsReturn => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showOsd, setShowOsd] = useState(false);
  const osdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashOsd = useCallback(() => {
    setShowOsd(true);
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    osdTimeoutRef.current = setTimeout(() => {
      setShowOsd(false);
    }, OSD_DURATION_MS);
  }, []);

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const manifest = await loadChannelsManifest();
        const sorted = [...manifest.channels].sort((a, b) => a.number - b.number);
        setChannels(sorted);

        const defaultIndex = sorted.findIndex((c) => c.id === manifest.defaultChannelId);
        const fallbackIndex = defaultIndex >= 0 ? defaultIndex : 0;
        const storedIndex = readStoredIndex(sorted.length - 1);
        setCurrentChannelIndex(storedIndex >= 0 ? storedIndex : fallbackIndex);
        setHasError(false);
      } catch (error) {
        console.error('Failed to load channels manifest:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchManifest();

    return () => {
      if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    };
  }, []);

  const setChannelByIndex = useCallback(
    (index: number) => {
      if (channels.length === 0) return;

      const wrapped = ((index % channels.length) + channels.length) % channels.length;
      setCurrentChannelIndex((prev) => {
        if (prev === wrapped) return prev;
        writeStoredIndex(wrapped);
        flashOsd();
        return wrapped;
      });
    },
    [channels.length, flashOsd]
  );

  const setChannelById = useCallback(
    (id: string) => {
      const index = channels.findIndex((c) => c.id === id);
      if (index >= 0) setChannelByIndex(index);
    },
    [channels, setChannelByIndex]
  );

  const nextChannel = useCallback(() => {
    if (channels.length <= 1) return;
    setChannelByIndex(currentChannelIndex + 1);
  }, [channels.length, currentChannelIndex, setChannelByIndex]);

  const prevChannel = useCallback(() => {
    if (channels.length <= 1) return;
    setChannelByIndex(currentChannelIndex - 1);
  }, [channels.length, currentChannelIndex, setChannelByIndex]);

  const currentChannel = channels[currentChannelIndex] ?? null;

  return {
    channels,
    currentChannelIndex,
    currentChannel,
    isLoading,
    hasError,
    showOsd,
    nextChannel,
    prevChannel,
    setChannelByIndex,
    setChannelById,
  };
};
