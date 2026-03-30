'use client';

import dynamic from 'next/dynamic';

const AudioPlayer = dynamic(
  () => import('./AudioPlayer').then((mod) => ({ default: mod.AudioPlayer })),
  { ssr: false }
);

export const AudioPlayerLoader = () => {
  return <AudioPlayer />;
};
