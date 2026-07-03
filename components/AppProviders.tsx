'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { ChannelProvider } from '@/components/channels/ChannelProvider';
import { AudioPlayerLoader } from '@/components/audio-player/AudioPlayerLoader';
import { AudioPlayerProvider } from '@/components/audio-player/AudioPlayerProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <ChannelProvider>
        <AudioPlayerProvider>
          {children}
          <AudioPlayerLoader />
        </AudioPlayerProvider>
      </ChannelProvider>
    </ThemeProvider>
  );
};
