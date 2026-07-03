export interface ChannelTheme {
  overlayColor: string;
  accent: string;
}

export interface ChannelAssets {
  playlist: string;
  desktopVideos: string;
  mobileBackgrounds: string;
}

export interface Channel {
  id: string;
  number: number;
  name: string;
  description: string;
  theme: ChannelTheme;
  assets: ChannelAssets;
}

export interface ChannelsManifest {
  version: number;
  defaultChannelId: string;
  channels: Channel[];
}

export interface ChannelState {
  channels: Channel[];
  currentChannelIndex: number;
  currentChannel: Channel | null;
  isLoading: boolean;
  hasError: boolean;
  showOsd: boolean;
}

export interface ChannelActions {
  nextChannel: () => void;
  prevChannel: () => void;
  setChannelByIndex: (index: number) => void;
  setChannelById: (id: string) => void;
}

export type UseChannelsReturn = ChannelState & ChannelActions;
