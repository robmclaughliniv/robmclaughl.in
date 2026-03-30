'use client';

import { useAudioPlayer } from '@/hooks/use-audio-player';
import { PlayerControls } from './PlayerControls';
import { CollapsedPlayer } from './CollapsedPlayer';

export const AudioPlayer = () => {
  const player = useAudioPlayer();

  if (player.isLoading || player.hasError || player.tracks.length === 0) {
    return null;
  }

  const currentTrack = player.tracks[player.currentTrackIndex];

  return (
    <div
      role="region"
      aria-label={`Audio player${currentTrack ? ` — now playing: ${currentTrack.title}` : ''}`}
      className="fixed bottom-4 z-[60] right-4 left-4 md:left-auto"
    >
      {player.isCollapsed ? (
        <div className="flex justify-end">
          <CollapsedPlayer
            isPlaying={player.isPlaying}
            onExpand={player.toggleCollapse}
          />
        </div>
      ) : (
        <div className="flex justify-center md:justify-end">
          <PlayerControls player={player} />
        </div>
      )}
    </div>
  );
};
