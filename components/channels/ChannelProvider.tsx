'use client';

import { useEffect, useMemo } from 'react';
import { useChannels } from '@/hooks/use-channels';
import { ChannelContext } from '@/components/channels/ChannelContext';
import { ChannelIndicator } from '@/components/channels/ChannelIndicator';

interface ChannelProviderProps {
  children: React.ReactNode;
}

export const ChannelProvider = ({ children }: ChannelProviderProps) => {
  const channels = useChannels();

  const value = useMemo(
    () => channels,
    [
      channels.channels,
      channels.currentChannelIndex,
      channels.currentChannel,
      channels.isLoading,
      channels.hasError,
      channels.showOsd,
      channels.nextChannel,
      channels.prevChannel,
      channels.setChannelByIndex,
      channels.setChannelById,
    ]
  );

  useEffect(() => {
    const channel = channels.currentChannel;
    if (!channel) return;

    const root = document.documentElement;
    root.style.setProperty('--accent', channel.theme.accent);
  }, [channels.currentChannel]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        channels.prevChannel();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        channels.nextChannel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [channels.nextChannel, channels.prevChannel]);

  return (
    <ChannelContext.Provider value={value}>
      {children}
      <ChannelIndicator />
    </ChannelContext.Provider>
  );
};
