import type { ChannelsManifest } from '@/lib/channels/types';

export const CHANNELS_MANIFEST_URL = '/channels/manifest.json';

export const loadChannelsManifest = async (): Promise<ChannelsManifest> => {
  const response = await fetch(CHANNELS_MANIFEST_URL);
  if (!response.ok) {
    throw new Error(`Channels manifest HTTP ${response.status}`);
  }

  const data: ChannelsManifest = await response.json();
  if (!data.channels?.length) {
    throw new Error('Empty channels manifest');
  }

  return data;
};
