'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PixelWaveform } from '@/components/audio-player/PixelWaveform';

interface CollapsedPlayerProps {
  isPlaying: boolean;
  analyserRef: React.RefObject<AnalyserNode | null>;
  onExpand: () => void;
}

export const CollapsedPlayer = ({
  isPlaying,
  analyserRef,
  onExpand,
}: CollapsedPlayerProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'player-pixel-border-sm player-btn size-11 rounded-none bg-secondary/90 p-1',
        'flex flex-col items-center justify-center gap-0.5',
        'text-muted-foreground hover:text-accent',
        isPlaying && 'border-accent/60 shadow-[0_0_8px_rgba(255,102,199,0.4)]'
      )}
      onClick={onExpand}
      aria-label={isPlaying ? 'Expand player — currently playing' : 'Expand player — paused'}
    >
      <PixelWaveform
        analyserRef={analyserRef}
        isPlaying={isPlaying}
        barCount={5}
        className="h-3 w-5"
      />
      <span className="font-pixel text-[6px] leading-none text-accent/80">♪</span>
    </Button>
  );
};
