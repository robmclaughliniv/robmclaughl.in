'use client';

import { createContext, useContext } from 'react';
import type { UseAudioPlayerReturn } from '@/hooks/use-audio-player';

export const AudioPlayerContext = createContext<UseAudioPlayerReturn | null>(null);

export const useAudioPlayerContext = (): UseAudioPlayerReturn => {
  const context = useContext(AudioPlayerContext);

  if (!context) {
    throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
  }

  return context;
};
