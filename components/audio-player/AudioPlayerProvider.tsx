'use client';

import { useMemo } from 'react';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { useChannelContext } from '@/components/channels/ChannelContext';
import { AudioPlayerContext } from './AudioPlayerContext';

interface AudioPlayerProviderProps {
  children: React.ReactNode;
}

export const AudioPlayerProvider = ({ children }: AudioPlayerProviderProps) => {
  const { currentChannel, isLoading: isChannelsLoading } = useChannelContext();
  const playlistUrl = currentChannel?.assets.playlist ?? null;
  const player = useAudioPlayer(isChannelsLoading ? null : playlistUrl);

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
