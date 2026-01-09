
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
  Firestore
} from "firebase/firestore";
import { User, Chat, Message, RemoteOverride } from "../types";

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

// Initialize Firebase
let db: Firestore | null = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Neural Grid: Cloud Sync Active (Direct)");
} catch (e) {
  console.error("Firebase Initialization Failed:", e);
}

const COLLECTIONS = {
  USERS: 'neural_users',
  CHATS: 'neural_chats',
  OVERRIDES: 'neural_overrides'
};

// Helper for local storage fallback
const getLocal = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const storage = {
  isCloudEnabled: () => !!db,

  // --- User Management ---
  getUsers: async (): Promise<User[]> => {
    if (db) {
      try {
        const q = query(collection(db, COLLECTIONS.USERS));
        const snap = await getDocs(q);
        return snap.docs.map(doc => doc.data() as User);
      } catch (e) {
        console.error("Cloud Fetch Failed", e);
      }
    }
    return getLocal(COLLECTIONS.USERS) || [];
  },

  subscribeToUsers: (callback: (users: User[]) => void) => {
    if (db) {
      return onSnapshot(collection(db, COLLECTIONS.USERS), (snap) => {
        callback(snap.docs.map(d => d.data() as User));
      });
    }
    callback(getLocal(COLLECTIONS.USERS) || []);
    return () => {};
  },

  saveUser: async (user: User) => {
    if (db) {
      await setDoc(doc(db, COLLECTIONS.USERS, user.id), user);
    } else {
      const users = await storage.getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx > -1) users[idx] = user; else users.push(user);
      setLocal(COLLECTIONS.USERS, users);
    }
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    if (db) {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), updates);
    } else {
      const users = await storage.getUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx > -1) {
        users[idx] = { ...users[idx], ...updates };
        setLocal(COLLECTIONS.USERS, users);
      }
    }
  },

  // --- Chat Management ---
  getUserChats: async (userId: string): Promise<Chat[]> => {
    if (db) {
      try {
        // Removed orderBy to avoid requiring a composite index
        const q = query(
          collection(db, COLLECTIONS.CHATS), 
          where("userId", "==", userId)
        );
        const snap = await getDocs(q);
        return snap.docs
          .map(d => d.data() as Chat)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } catch (e) {
        console.error("Cloud Chats Fetch Failed:", e);
      }
    }
    const allChats: Chat[] = getLocal(COLLECTIONS.CHATS) || [];
    return allChats.filter(c => c.userId === userId).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  subscribeToUserChats: (userId: string, callback: (chats: Chat[]) => void) => {
    if (db) {
      // Removed orderBy to avoid requiring a composite index
      const q = query(
        collection(db, COLLECTIONS.CHATS), 
        where("userId", "==", userId)
      );
      return onSnapshot(q, (snap) => {
        const chats = snap.docs
          .map(d => d.data() as Chat)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        callback(chats);
      });
    }
    const interval = setInterval(() => {
      storage.getUserChats(userId).then(callback);
    }, 5000);
    return () => clearInterval(interval);
  },

  saveChat: async (chat: Chat) => {
    if (db) {
      await setDoc(doc(db, COLLECTIONS.CHATS, chat.id), chat);
    } else {
      const all: Chat[] = getLocal(COLLECTIONS.CHATS) || [];
      const idx = all.findIndex(c => c.id === chat.id);
      if (idx > -1) all[idx] = chat; else all.push(chat);
      setLocal(COLLECTIONS.CHATS, all);
    }
  },

  deleteChat: async (chatId: string) => {
    if (db) {
      await deleteDoc(doc(db, COLLECTIONS.CHATS, chatId));
    } else {
      const all: Chat[] = getLocal(COLLECTIONS.CHATS) || [];
      setLocal(COLLECTIONS.CHATS, all.filter(c => c.id !== chatId));
    }
  },

  getChat: async (chatId: string): Promise<Chat | undefined> => {
    if (db) {
      const d = await getDoc(doc(db, COLLECTIONS.CHATS, chatId));
      return d.exists() ? d.data() as Chat : undefined;
    }
    const all: Chat[] = getLocal(COLLECTIONS.CHATS) || [];
    return all.find(c => c.id === chatId);
  },

  // --- Remote Overrides ---
  setRemoteOverride: async (userId: string, data: Partial<RemoteOverride>) => {
    if (db) {
      await setDoc(doc(db, COLLECTIONS.OVERRIDES, userId), {
        ...data,
        timestamp: Date.now()
      }, { merge: true });
    }
  },

  subscribeToOverrides: (userId: string, callback: (data: RemoteOverride) => void) => {
    if (db) {
      return onSnapshot(doc(db, COLLECTIONS.OVERRIDES, userId), (snap) => {
        if (snap.exists()) callback(snap.data() as RemoteOverride);
      });
    }
    return () => {};
  },

  getRemoteOverride: async (userId: string): Promise<RemoteOverride | undefined> => {
    if (db) {
      const d = await getDoc(doc(db, COLLECTIONS.OVERRIDES, userId));
      return d.exists() ? d.data() as RemoteOverride : undefined;
    }
    return undefined;
  },

  getSystemStats: async () => {
    const users = await storage.getUsers();
    let chatCount = 0;
    
    if (db) {
      try {
        const chatsSnap = await getDocs(collection(db, COLLECTIONS.CHATS));
        chatCount = chatsSnap.size;
      } catch (e) {}
    }
    
    return {
      totalUsers: users.length,
      totalChats: chatCount,
      totalMessages: 0,
      premiumUsers: users.filter(u => u.isPremium).length,
      bannedUsers: users.filter(u => u.isBanned).length
    };
  }
};
