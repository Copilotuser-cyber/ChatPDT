
import { User, Message, Chat } from '../types';

const USERS_KEY = 'gemini_app_users_v2';
const CHATS_KEY = 'gemini_app_chats_v2';
const OVERRIDES_KEY = 'gemini_app_remote_overrides';

export const storage = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: User) => {
    const users = storage.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index > -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  updateUser: (userId: string, updates: Partial<User>) => {
    const users = storage.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index > -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  },

  deleteUser: (userId: string) => {
    const users = storage.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const chats = storage.getAllChats().filter(c => c.userId !== userId);
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    storage.clearOverrides(userId);
  },

  // Remote Overrides for Admin Shadow Control
  setRemoteOverride: (userId: string, data: any) => {
    const all = storage.getAllOverrides();
    all[userId] = { ...all[userId], ...data, timestamp: Date.now() };
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
  },

  getRemoteOverride: (userId: string) => {
    const all = storage.getAllOverrides();
    return all[userId];
  },

  getAllOverrides: () => {
    const data = localStorage.getItem(OVERRIDES_KEY);
    return data ? JSON.parse(data) : {};
  },

  clearOverrides: (userId: string) => {
    const all = storage.getAllOverrides();
    delete all[userId];
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
  },

  // Chat Operations
  getAllChats: (): Chat[] => {
    const data = localStorage.getItem(CHATS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getUserChats: (userId: string): Chat[] => {
    return storage.getAllChats()
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  saveChat: (chat: Chat) => {
    const chats = storage.getAllChats();
    const index = chats.findIndex(c => c.id === chat.id);
    if (index > -1) {
      chats[index] = chat;
    } else {
      chats.push(chat);
    }
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  },

  deleteChat: (chatId: string) => {
    const chats = storage.getAllChats().filter(c => c.id !== chatId);
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  },

  getChat: (chatId: string): Chat | undefined => {
    return storage.getAllChats().find(c => c.id === chatId);
  },

  getSystemStats: () => {
    const users = storage.getUsers();
    const chats = storage.getAllChats();
    const messages = chats.reduce((acc, chat) => acc + chat.messages.length, 0);
    return {
      totalUsers: users.length,
      totalChats: chats.length,
      totalMessages: messages,
      premiumUsers: users.filter(u => u.isPremium).length,
      bannedUsers: users.filter(u => u.isBanned).length
    };
  },

  resetSystem: () => {
    const admin = storage.getUsers().find(u => u.isAdmin);
    localStorage.clear();
    if (admin) storage.saveUser(admin);
  }
};

// Initial admin seed
if (storage.getUsers().length === 0) {
  storage.saveUser({
    id: 'admin-001',
    username: 'admin@PDT',
    password: 'pdt333',
    isAdmin: true,
    isPremium: true,
    createdAt: new Date().toISOString()
  });
}
