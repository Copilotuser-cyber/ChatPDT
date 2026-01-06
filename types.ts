
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
  timestamp: string; // ISO string for storage
}

export interface User {
  id: string;
  username: string;
  password?: string;
  isAdmin: boolean;
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
