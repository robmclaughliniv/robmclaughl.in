'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { AudioPlayerLoader } from '@/components/audio-player/AudioPlayerLoader';
import { AudioPlayerProvider } from '@/components/audio-player/AudioPlayerProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <AudioPlayerProvider>
        {children}
        <AudioPlayerLoader />
      </AudioPlayerProvider>
    </ThemeProvider>
  );
};
