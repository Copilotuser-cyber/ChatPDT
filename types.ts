
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

export interface GameProject {
  id: string;
  userId: string;
  username?: string;
  title: string;
  messages: Message[];
  latestCode: string;
  createdAt: string;
  updatedAt: string;
  isPublished?: boolean;
}

export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  text: string;
  type: 'signal' | 'game';
  gameId?: string;
  gameTitle?: string;
  timestamp: string;
  profilePic?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  isAdmin: boolean;
  isPremium: boolean;
  isBanned?: boolean;
  profilePic?: string;
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
  discoMode?: boolean;
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
  broadcast?: {
    text: string;
    timestamp: number;
  };
  ghostPayload?: {
    text: string;
    timestamp: number;
    sender: string;
  };
  timestamp: number;
}
