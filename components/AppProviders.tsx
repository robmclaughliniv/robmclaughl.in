'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { ChannelProvider } from '@/components/channels/ChannelProvider';
import { AudioPlayerLoader } from '@/components/audio-player/AudioPlayerLoader';
import { AudioPlayerProvider } from '@/components/audio-player/AudioPlayerProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  // disableTransitionOnChange injects a style element, which style-src 'self' blocks.
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ChannelProvider>
        <AudioPlayerProvider>
          {children}
          <AudioPlayerLoader />
        </AudioPlayerProvider>
      </ChannelProvider>
    </ThemeProvider>
  );
};
