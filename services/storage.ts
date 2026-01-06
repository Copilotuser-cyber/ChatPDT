
import { User, Message } from '../types';

const USERS_KEY = 'gemini_app_users';
const MESSAGES_KEY = 'gemini_app_messages';

export const storage = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: User) => {
    const users = storage.getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  deleteUser: (userId: string) => {
    const users = storage.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    // Also cleanup messages
    const msgs = storage.getAllMessages().filter(m => m.userId !== userId);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  },

  getAllMessages: (): Message[] => {
    const data = localStorage.getItem(MESSAGES_KEY);
    return data ? JSON.parse(data) : [];
  },

  getUserMessages: (userId: string): Message[] => {
    return storage.getAllMessages().filter(m => m.userId === userId);
  },

  saveMessage: (msg: Message) => {
    const msgs = storage.getAllMessages();
    msgs.push(msg);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  },

  clearUserMessages: (userId: string) => {
    const msgs = storage.getAllMessages().filter(m => m.userId !== userId);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  }
};

// Seed admin account
if (storage.getUsers().length === 0) {
  storage.saveUser({
    id: 'admin-001',
    username: 'admin@PDT',
    password: 'pdt333',
    isAdmin: true,
    createdAt: new Date().toISOString()
  });
}
