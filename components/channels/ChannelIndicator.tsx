'use client';

import { cn } from '@/lib/utils';
import { useChannelContext } from '@/components/channels/ChannelContext';

export const ChannelIndicator = () => {
  const { currentChannel, showOsd, isLoading } = useChannelContext();

  if (isLoading || !currentChannel) return null;

  const channelLabel = `CH ${String(currentChannel.number).padStart(2, '0')}`;

  return (
    <div
      className={cn(
        'pointer-events-none fixed left-4 top-4 z-[70] font-pixel text-[10px] leading-tight tracking-wide',
        'transition-opacity duration-500 ease-in-out',
        showOsd ? 'opacity-100' : 'opacity-0'
      )}
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      <div className="player-pixel-border-sm bg-secondary/90 px-3 py-2 text-accent shadow-[0_0_12px_rgba(255,102,199,0.25)]">
        <span className="text-flicker">{channelLabel}</span>
        <span className="mx-2 text-muted-foreground" aria-hidden="true">
          ·
        </span>
        <span className="text-foreground">{currentChannel.name}</span>
      </div>
    </div>
  );
};
