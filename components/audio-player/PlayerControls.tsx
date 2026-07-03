'use client';

import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { PixelWaveform } from '@/components/audio-player/PixelWaveform';
import { ChannelControls } from '@/components/channels/ChannelControls';
import type { UseAudioPlayerReturn } from '@/hooks/use-audio-player';

interface PlayerControlsProps {
  player: UseAudioPlayerReturn;
  className?: string;
}

export const PlayerControls = ({ player, className }: PlayerControlsProps) => {
  const [showVolume, setShowVolume] = useState(false);
  const isMobile = useIsMobile();
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

  const handleVolumeButtonClick = () => {
    const wasMuted = player.isMuted;
    player.toggleMute();

    if (isMobile) {
      setShowVolume(!wasMuted);
    }
  };

  const sliderVolume = player.isMuted ? 0 : player.volume;

  return (
    <div
      className={cn(
        'player-pixel-border box-flicker bg-secondary/90 p-3 opacity-80',
        'transition-all duration-300 ease-in-out',
        'w-[calc(100vw-2rem)] md:w-72',
        className
      )}
    >
      {/* Track info + waveform */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <PixelWaveform
            analyserRef={player.analyserRef}
            isPlaying={player.isPlaying}
            barCount={12}
            className="h-4 w-12 shrink-0"
          />
          <span
            className={cn(
              'text-[8px] font-pixel leading-tight truncate',
              player.isPlaying ? 'text-flicker text-accent' : 'text-muted-foreground'
            )}
          >
            {currentTrack?.title ?? 'NO TRACK'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="player-btn size-8 shrink-0 rounded-none border border-border bg-background/50 text-muted-foreground hover:text-accent hover:border-accent/60 md:size-7"
          onClick={player.toggleCollapse}
          aria-label="Minimize player"
        >
          <Minimize2 className="size-3.5" />
        </Button>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-1">
        <ChannelControls />

        <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        <Button
          variant="ghost"
          size="icon"
          className="player-btn size-11 rounded-none border border-border bg-background/50 text-muted-foreground hover:text-accent hover:border-accent/60 md:size-8"
          onClick={player.prevTrack}
          aria-label="Previous track"
        >
          <SkipBack className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'player-btn size-11 rounded-none border bg-background/50 md:size-9',
            player.isPlaying
              ? 'border-accent/60 text-accent text-flicker'
              : 'border-border text-foreground hover:text-accent hover:border-accent/60'
          )}
          onClick={handlePlayPause}
          aria-label={player.isPlaying ? 'Pause' : 'Play'}
        >
          {player.isPlaying ? (
            <Pause className="size-5" />
          ) : (
            <Play className="size-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="player-btn size-11 rounded-none border border-border bg-background/50 text-muted-foreground hover:text-accent hover:border-accent/60 md:size-8"
          onClick={player.nextTrack}
          aria-label="Next track"
        >
          <SkipForward className="size-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'player-btn size-11 rounded-none border bg-background/50 md:size-8',
            player.isMuted
              ? 'border-border text-muted-foreground hover:text-accent hover:border-accent/60'
              : 'border-accent/60 text-accent'
          )}
          onClick={handleVolumeButtonClick}
          aria-label={player.isMuted ? 'Unmute' : 'Mute'}
        >
          {player.isMuted ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
        </Button>

        <Slider
          value={[sliderVolume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="player-slider hidden w-20 md:flex"
          aria-label="Volume"
        />
      </div>

      {showVolume && (
        <div className="mt-2.5 flex items-center gap-3 px-1 md:hidden">
          <VolumeX className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Slider
            value={[sliderVolume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="player-slider flex-1"
            aria-label="Volume"
          />
          <Volume2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
    </div>
  );
};
