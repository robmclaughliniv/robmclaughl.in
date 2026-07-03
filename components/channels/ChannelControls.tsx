'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChannelContext } from '@/components/channels/ChannelContext';

interface ChannelControlsProps {
  className?: string;
}

export const ChannelControls = ({ className }: ChannelControlsProps) => {
  const { channels, currentChannel, nextChannel, prevChannel } = useChannelContext();

  const canSwitch = channels.length > 1;

  const handlePrevChannel = () => {
    prevChannel();
  };

  const handleNextChannel = () => {
    nextChannel();
  };

  const handlePrevKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePrevChannel();
    }
  };

  const handleNextKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNextChannel();
    }
  };

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <Button
        variant="ghost"
        size="icon"
        className="player-btn size-11 rounded-none border border-border bg-background/50 text-muted-foreground hover:text-accent hover:border-accent/60 disabled:opacity-40 md:size-8"
        onClick={handlePrevChannel}
        onKeyDown={handlePrevKeyDown}
        disabled={!canSwitch}
        aria-label={
          canSwitch
            ? `Previous channel${currentChannel ? ` — currently on ${currentChannel.name}` : ''}`
            : 'Previous channel unavailable'
        }
        tabIndex={0}
      >
        <ChevronUp className="size-4" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="player-btn size-11 rounded-none border border-border bg-background/50 text-muted-foreground hover:text-accent hover:border-accent/60 disabled:opacity-40 md:size-8"
        onClick={handleNextChannel}
        onKeyDown={handleNextKeyDown}
        disabled={!canSwitch}
        aria-label={
          canSwitch
            ? `Next channel${currentChannel ? ` — currently on ${currentChannel.name}` : ''}`
            : 'Next channel unavailable'
        }
        tabIndex={0}
      >
        <ChevronDown className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
};
