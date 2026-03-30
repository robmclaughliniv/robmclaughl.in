'use client';

import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Minimize2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { UseAudioPlayerReturn } from '@/hooks/use-audio-player';

interface PlayerControlsProps {
  player: UseAudioPlayerReturn;
  className?: string;
}

export const PlayerControls = ({ player, className }: PlayerControlsProps) => {
  const [showVolume, setShowVolume] = useState(false);
  const currentTrack = player.tracks[player.currentTrackIndex];

  const handlePlayPause = () => {
    if (player.isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    player.setVolume(value[0]);
  };

  const handleVolumeToggle = () => {
    setShowVolume((prev) => !prev);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-background/80 backdrop-blur-md p-3 shadow-xl",
        "transition-all duration-300 ease-in-out",
        "w-[calc(100vw-2rem)] md:w-72",
        className
      )}
    >
      {/* Track info */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Music className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
          <span className="text-xs font-mono text-muted-foreground truncate">
            {currentTrack?.title ?? 'No track'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 md:size-6 shrink-0 text-muted-foreground hover:text-accent transition-colors duration-200"
          onClick={player.toggleCollapse}
          aria-label="Minimize player"
        >
          <Minimize2 className="size-4 md:size-3.5" />
        </Button>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 md:size-8 text-muted-foreground hover:text-accent player-btn"
          onClick={player.prevTrack}
          aria-label="Previous track"
        >
          <SkipBack className="size-5 md:size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-11 md:size-9 text-foreground hover:text-accent player-btn"
          onClick={handlePlayPause}
          aria-label={player.isPlaying ? 'Pause' : 'Play'}
        >
          {player.isPlaying ? (
            <Pause className="size-6 md:size-5" />
          ) : (
            <Play className="size-6 md:size-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-11 md:size-8 text-muted-foreground hover:text-accent player-btn"
          onClick={player.nextTrack}
          aria-label="Next track"
        >
          <SkipForward className="size-5 md:size-4" />
        </Button>

        <div className="w-px h-5 bg-border/40 mx-1" aria-hidden="true" />

        {/* On mobile: tap toggles volume slider. On desktop: just mutes. */}
        <Button
          variant="ghost"
          size="icon"
          className="size-11 md:size-8 text-muted-foreground hover:text-accent player-btn"
          onClick={() => {
            handleVolumeToggle();
            if (typeof window !== 'undefined' && window.innerWidth >= 768) {
              player.toggleMute();
            }
          }}
          aria-label={player.isMuted ? 'Unmute' : 'Mute'}
        >
          {player.isMuted ? (
            <VolumeX className="size-5 md:size-4" />
          ) : (
            <Volume2 className="size-5 md:size-4" />
          )}
        </Button>

        {/* Desktop: always visible inline slider */}
        <Slider
          value={[player.isMuted ? 0 : player.volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="w-20 player-slider hidden md:flex"
          aria-label="Volume"
        />
      </div>

      {/* Mobile: volume slider row, toggled by volume icon */}
      {showVolume && (
        <div className="flex items-center gap-3 mt-2.5 px-1 md:hidden">
          <VolumeX className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Slider
            value={[player.isMuted ? 0 : player.volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="flex-1 player-slider"
            aria-label="Volume"
          />
          <Volume2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-accent player-btn"
            onClick={player.toggleMute}
            aria-label={player.isMuted ? 'Unmute' : 'Mute'}
          >
            <span className="text-[10px] font-mono">
              {player.isMuted ? 'OFF' : 'ON'}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};
