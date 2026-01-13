
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  Firestore,
  Unsubscribe
} from "firebase/firestore";
import { User, Chat, Message, RemoteOverride, GameProject } from "../types";

// Hardcoded Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYd5Kd6kIfWLsncEyk-1w-89KY_h_lM6I",
  authDomain: "chat-pdt-3532f.firebaseapp.com",
  projectId: "chat-pdt-3532f",
  storageBucket: "chat-pdt-3532f.firebasestorage.app",
  messagingSenderId: "948197554656",
  appId: "1:948197554656:web:c9122f6eb21cc9c48f5385",
  measurementId: "G-051J2VSN0T"
};

let db: Firestore | null = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Initialization Failed:", e);
}

const COLLECTIONS = {
  USERS: 'neural_users',
  CHATS: 'neural_chats',
  OVERRIDES: 'neural_overrides',
  GAMES: 'neural_games'
};

const getLocal = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
};
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const storage = {
  isCloudEnabled: () => !!db,

  getUsers: async (): Promise<User[]> => {
    if (db) {
      const q = query(collection(db, COLLECTIONS.USERS));
      const snap = await getDocs(q);
      return snap.docs.map(doc => {
        const data = doc.data();
        return { ...data, id: data.id || doc.id } as User;
      });
    }
    return getLocal(COLLECTIONS.USERS) || [];
  },

  saveUser: async (user: User) => {
    if (!user.id) return;
    if (db) await setDoc(doc(db, COLLECTIONS.USERS, user.id), user);
    else {
      const users = await storage.getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx > -1) users[idx] = user; else users.push(user);
      setLocal(COLLECTIONS.USERS, users);
    }
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    if (!userId) return;
    if (db) await updateDoc(doc(db, COLLECTIONS.USERS, userId), updates);
    else {
      const users = await storage.getUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx > -1) {
        users[idx] = { ...users[idx], ...updates };
        setLocal(COLLECTIONS.USERS, users);
      }
    }
  },

  getUserChats: async (userId: string): Promise<Chat[]> => {
    if (!userId) return [];
    if (db) {
      const q = query(collection(db, COLLECTIONS.CHATS), where("userId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Chat).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    const all: Chat[] = getLocal(COLLECTIONS.CHATS) || [];
    return all.filter(c => c.userId === userId).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  subscribeToUserChats: (userId: string, callback: (chats: Chat[]) => void): Unsubscribe => {
    if (!userId) {
      callback([]);
      return () => {};
    }
    if (db) {
      const q = query(collection(db, COLLECTIONS.CHATS), where("userId", "==", userId));
      return onSnapshot(q, (snap) => {
        const chats = snap.docs.map(d => d.data() as Chat).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        callback(chats);
      });
    }
    const interval = setInterval(() => { storage.getUserChats(userId).then(callback); }, 5000);
    return () => clearInterval(interval);
  },

  saveChat: async (chat: Chat) => {
    if (!chat.id) return;
    if (db) await setDoc(doc(db, COLLECTIONS.CHATS, chat.id), chat);
    else {
      const all: Chat[] = getLocal(COLLECTIONS.CHATS) || [];
      const idx = all.findIndex(c => c.id === chat.id);
      if (idx > -1) all[idx] = chat; else all.push(chat);
      setLocal(COLLECTIONS.CHATS, all);
    }
  },

  deleteChat: async (chatId: string) => {
    if (!chatId) return;
    if (db) await deleteDoc(doc(db, COLLECTIONS.CHATS, chatId));
    else {
      const all: Chat[] = getLocal(COLLECTIONS.CHATS) || [];
      setLocal(COLLECTIONS.CHATS, all.filter(c => c.id !== chatId));
    }
  },

  getChat: async (chatId: string): Promise<Chat | undefined> => {
    if (!chatId) return undefined;
    if (db) {
      const d = await getDoc(doc(db, COLLECTIONS.CHATS, chatId));
      return d.exists() ? d.data() as Chat : undefined;
    }
    const all: Chat[] = getLocal(COLLECTIONS.CHATS) || [];
    return all.find(c => c.id === chatId);
  },

  getGameProjects: async (userId: string): Promise<GameProject[]> => {
    if (!userId) return [];
    if (db) {
      const q = query(collection(db, COLLECTIONS.GAMES), where("userId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as GameProject).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    const all: GameProject[] = getLocal(COLLECTIONS.GAMES) || [];
    return all.filter(p => p.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  saveGameProject: async (project: GameProject) => {
    if (!project.id) return;
    if (db) await setDoc(doc(db, COLLECTIONS.GAMES, project.id), project);
    else {
      const all: GameProject[] = getLocal(COLLECTIONS.GAMES) || [];
      const idx = all.findIndex(p => p.id === project.id);
      if (idx > -1) all[idx] = project; else all.push(project);
      setLocal(COLLECTIONS.GAMES, all);
    }
  },

  deleteGameProject: async (projectId: string) => {
    if (!projectId) return;
    if (db) await deleteDoc(doc(db, COLLECTIONS.GAMES, projectId));
    else {
      const all: GameProject[] = getLocal(COLLECTIONS.GAMES) || [];
      setLocal(COLLECTIONS.GAMES, all.filter(p => p.id !== projectId));
    }
  },

  setRemoteOverride: async (userId: string, data: Partial<RemoteOverride>) => {
    if (!userId) return;
    if (db) await setDoc(doc(db, COLLECTIONS.OVERRIDES, userId), { ...data, timestamp: Date.now() }, { merge: true });
  },

  subscribeToOverrides: (userId: string, callback: (data: RemoteOverride) => void): Unsubscribe => {
    if (!userId) return () => {};
    if (db) return onSnapshot(doc(db, COLLECTIONS.OVERRIDES, userId), (snap) => { if (snap.exists()) callback(snap.data() as RemoteOverride); });
    return () => {};
  },

  getSystemStats: async () => {
    const users = await storage.getUsers();
    let chatCount = 0;
    if (db) { try { const chatsSnap = await getDocs(collection(db, COLLECTIONS.CHATS)); chatCount = chatsSnap.size; } catch (e) {} }
    return {
      totalUsers: users.length,
      totalChats: chatCount,
      totalMessages: 0,
      premiumUsers: users.filter(u => u.isPremium).length,
      bannedUsers: users.filter(u => u.isBanned).length
    };
  }
};
