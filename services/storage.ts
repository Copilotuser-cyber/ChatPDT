// Standard modular Firebase imports for v9+
// Fix: Use a namespaced import for firebase/app to ensure initializeApp is correctly resolved as a member.
import * as firebaseApp from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot
} from "firebase/firestore";
// Fix: Import types as types to prevent module resolution errors if initializeApp is incorrectly flagged on subsequent lines.
import type { Firestore, Unsubscribe } from "firebase/firestore";
import { User, Chat, Message, RemoteOverride, GameProject, CommunityPost } from "../types";

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
let cloudSyncActive = true;

try {
  // Fix: Explicitly ensure initializeApp is called correctly from the modular SDK via the namespaced import.
  const app = firebaseApp.initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Neural Storage: Firebase Initialization failed. Reverting to local core.");
  cloudSyncActive = false;
}

const COLLECTIONS = {
  USERS: 'neural_users',
  CHATS: 'neural_chats',
  OVERRIDES: 'neural_overrides',
  GAMES: 'neural_games',
  COMMUNITY: 'neural_community'
};

const getLocal = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
};

const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

const sanitizeForFirestore = (val: any): any => {
  if (val === null || typeof val !== 'object') return val;
  if (val instanceof Date) return val.toISOString();
  
  if (Array.isArray(val)) {
    return val.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }

  const sanitized: any = {};
  Object.keys(val).forEach(key => {
    const cleaned = sanitizeForFirestore(val[key]);
    if (cleaned !== undefined) sanitized[key] = cleaned;
  });
  return sanitized;
};

const handleStorageError = (error: any) => {
  if (error.code === 'permission-denied' || error.message?.includes('permission')) {
    if (cloudSyncActive) {
      console.warn("SYSTEM: Cloud permissions insufficient. Auto-switching to Local Neural Core.");
      cloudSyncActive = false;
    }
  } else {
    console.error("Storage Matrix Error:", error);
  }
};

export const storage = {
  isCloudEnabled: () => !!db && cloudSyncActive,

  getUsers: async (): Promise<User[]> => {
    if (storage.isCloudEnabled()) {
      try {
        const q = query(collection(db!, COLLECTIONS.USERS));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as User);
      } catch (e) { handleStorageError(e); }
    }
    return getLocal(COLLECTIONS.USERS) || [];
  },

  saveUser: async (user: User) => {
    if (!user.id) return;
    if (storage.isCloudEnabled()) {
      try { await setDoc(doc(db!, COLLECTIONS.USERS, user.id), sanitizeForFirestore(user)); }
      catch (e) { handleStorageError(e); }
    }
    const users = await storage.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx > -1) users[idx] = user; else users.push(user);
    setLocal(COLLECTIONS.USERS, users);
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    if (!userId) return;
    if (storage.isCloudEnabled()) {
      try { await updateDoc(doc(db!, COLLECTIONS.USERS, userId), sanitizeForFirestore(updates)); }
      catch (e) { handleStorageError(e); }
    }
    const users = getLocal(COLLECTIONS.USERS) || [];
    const idx = users.findIndex((u: any) => u.id === userId);
    if (idx > -1) { users[idx] = { ...users[idx], ...updates }; setLocal(COLLECTIONS.USERS, users); }
  },

  getUserChats: async (userId: string): Promise<Chat[]> => {
    if (!userId) return [];
    if (storage.isCloudEnabled()) {
      try {
        const q = query(collection(db!, COLLECTIONS.CHATS), where("userId", "==", userId));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as Chat).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } catch (e) { handleStorageError(e); }
    }
    return (getLocal(COLLECTIONS.CHATS) || []).filter((c: Chat) => c.userId === userId);
  },

  subscribeToUserChats: (userId: string, callback: (chats: Chat[]) => void): Unsubscribe => {
    if (!userId) { callback([]); return () => {}; }
    if (storage.isCloudEnabled()) {
      try {
        const q = query(collection(db!, COLLECTIONS.CHATS), where("userId", "==", userId));
        return onSnapshot(q, (snap) => {
          const chats = snap.docs.map(d => d.data() as Chat).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          callback(chats);
        }, handleStorageError);
      } catch (e) { handleStorageError(e); }
    }
    callback((getLocal(COLLECTIONS.CHATS) || []).filter((c: Chat) => c.userId === userId));
    return () => {};
  },

  saveChat: async (chat: Chat) => {
    if (!chat.id) return;
    if (storage.isCloudEnabled()) {
      try { await setDoc(doc(db!, COLLECTIONS.CHATS, chat.id), sanitizeForFirestore(chat)); }
      catch (e) { handleStorageError(e); }
    }
    const all = getLocal(COLLECTIONS.CHATS) || [];
    const idx = all.findIndex((c: any) => c.id === chat.id);
    if (idx > -1) all[idx] = chat; else all.push(chat);
    setLocal(COLLECTIONS.CHATS, all);
  },

  deleteChat: async (chatId: string) => {
    if (!chatId) return;
    if (storage.isCloudEnabled()) {
      try { await deleteDoc(doc(db!, COLLECTIONS.CHATS, chatId)); }
      catch (e) { handleStorageError(e); }
    }
    const all = getLocal(COLLECTIONS.CHATS) || [];
    setLocal(COLLECTIONS.CHATS, all.filter((c: any) => c.id !== chatId));
  },

  getGameProjects: async (userId: string): Promise<GameProject[]> => {
    if (!userId) return [];
    if (storage.isCloudEnabled()) {
      try {
        const q = query(collection(db!, COLLECTIONS.GAMES), where("userId", "==", userId));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as GameProject);
      } catch (e) { handleStorageError(e); }
    }
    return (getLocal(COLLECTIONS.GAMES) || []).filter((p: GameProject) => p.userId === userId);
  },

  getPublicGame: async (gameId: string): Promise<GameProject | null> => {
    if (storage.isCloudEnabled()) {
      try {
        const q = query(collection(db!, COLLECTIONS.GAMES), where("id", "==", gameId));
        const snap = await getDocs(q);
        if (!snap.empty) return snap.docs[0].data() as GameProject;
      } catch (e) { handleStorageError(e); }
    }
    return (getLocal(COLLECTIONS.GAMES) || []).find((p: GameProject) => p.id === gameId) || null;
  },

  saveGameProject: async (project: GameProject) => {
    if (!project.id) return;
    if (storage.isCloudEnabled()) {
      try { await setDoc(doc(db!, COLLECTIONS.GAMES, project.id), sanitizeForFirestore(project)); }
      catch (e) { handleStorageError(e); }
    }
    const all = getLocal(COLLECTIONS.GAMES) || [];
    const idx = all.findIndex((p: any) => p.id === project.id);
    if (idx > -1) all[idx] = project; else all.push(project);
    setLocal(COLLECTIONS.GAMES, all);
  },

  saveCommunityPost: async (post: CommunityPost) => {
    if (storage.isCloudEnabled()) {
      try { await setDoc(doc(db!, COLLECTIONS.COMMUNITY, post.id), sanitizeForFirestore(post)); }
      catch (e) { handleStorageError(e); }
    }
    const all = getLocal(COLLECTIONS.COMMUNITY) || [];
    all.unshift(post);
    setLocal(COLLECTIONS.COMMUNITY, all.slice(0, 100));
  },

  subscribeToCommunity: (callback: (posts: CommunityPost[]) => void): Unsubscribe => {
    if (storage.isCloudEnabled()) {
      try {
        const q = query(collection(db!, COLLECTIONS.COMMUNITY), orderBy("timestamp", "desc"));
        return onSnapshot(q, (snap) => {
          callback(snap.docs.map(d => d.data() as CommunityPost));
        }, handleStorageError);
      } catch (e) { handleStorageError(e); }
    }
    callback(getLocal(COLLECTIONS.COMMUNITY) || []);
    return () => {};
  },

  setRemoteOverride: async (userId: string, data: Partial<RemoteOverride>) => {
    if (!userId || !storage.isCloudEnabled()) return;
    try { await setDoc(doc(db!, COLLECTIONS.OVERRIDES, userId), sanitizeForFirestore({ ...data, timestamp: Date.now() }), { merge: true }); }
    catch (e) { handleStorageError(e); }
  },

  subscribeToOverrides: (userId: string, callback: (data: RemoteOverride) => void): Unsubscribe => {
    if (!userId || !storage.isCloudEnabled()) return () => {};
    try {
      return onSnapshot(doc(db!, COLLECTIONS.OVERRIDES, userId), (snap) => { if (snap.exists()) callback(snap.data() as RemoteOverride); }, handleStorageError);
    } catch (e) { handleStorageError(e); }
    return () => {};
  }
};