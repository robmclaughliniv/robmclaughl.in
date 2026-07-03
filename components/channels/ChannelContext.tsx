'use client';

import { createContext, useContext } from 'react';
import type { UseChannelsReturn } from '@/lib/channels/types';

export const ChannelContext = createContext<UseChannelsReturn | null>(null);

export const useChannelContext = (): UseChannelsReturn => {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error('useChannelContext must be used within ChannelProvider');
  }
  return context;
};
