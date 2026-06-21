'use client';

import { useMemo } from 'react';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { AudioPlayerContext } from './AudioPlayerContext';

interface AudioPlayerProviderProps {
  children: React.ReactNode;
}

export const AudioPlayerProvider = ({ children }: AudioPlayerProviderProps) => {
  const player = useAudioPlayer();

  const value = useMemo(
    () => player,
    [
      player.isPlaying,
      player.isMuted,
      player.volume,
      player.currentTrackIndex,
      player.tracks,
      player.isLoading,
      player.isCollapsed,
      player.hasError,
      player.analyserRef,
      player.play,
      player.pause,
      player.toggleMute,
      player.setVolume,
      player.nextTrack,
      player.prevTrack,
      player.toggleCollapse,
    ]
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};
