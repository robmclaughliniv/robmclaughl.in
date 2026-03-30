'use client';

import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CollapsedPlayerProps {
  isPlaying: boolean;
  onExpand: () => void;
}

export const CollapsedPlayer = ({ isPlaying, onExpand }: CollapsedPlayerProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "size-11 rounded-full bg-background/80 backdrop-blur-md border border-border/60 shadow-xl",
        "text-muted-foreground hover:text-accent transition-all duration-300",
        "hover:scale-105 player-btn",
        isPlaying && "animate-pulse-slow shadow-[0_0_12px_rgba(255,102,199,0.3)]"
      )}
      onClick={onExpand}
      aria-label={isPlaying ? 'Expand player — currently playing' : 'Expand player — paused'}
    >
      <Music className="size-5" />
    </Button>
  );
};
