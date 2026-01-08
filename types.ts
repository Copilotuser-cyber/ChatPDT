
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  userId: string;
  role: Role;
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  isAdmin: boolean;
  isPremium: boolean;
  isBanned?: boolean;
  lastDeviceInfo?: string;
  createdAt: string;
}

export interface ChatConfig {
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  systemInstruction: string;
  thinkingBudget: number;
}

export type Theme = 'light' | 'dark';

export interface AppSettings {
  backgroundUrl: string;
  backgroundBlur: number;
  backgroundOpacity: number;
}

export interface RemoteOverride {
  appSettings?: Partial<AppSettings>;
  theme?: Theme;
  config?: Partial<ChatConfig>;
  visualMatrix?: {
    accentColor?: string;
    borderRadius?: string;
    fontType?: string;
    filter?: string;
  };
  audioMatrix?: {
    appleMusicUrl?: string;
    isPlaying?: boolean;
    volume?: number;
  };
  prank?: {
    type: 'rickroll' | 'stickbug' | null;
    triggeredAt: number;
  };
  customCss?: string;
  timestamp: number;
}
