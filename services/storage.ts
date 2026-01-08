
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
  Timestamp,
  orderBy
} from "firebase/firestore";
import { User, Chat, Message, RemoteOverride } from "../types";

// Firebase Configuration
// Assuming these are in your environment - replace with your actual config from Firebase Console
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = {
  USERS: 'neural_users',
  CHATS: 'neural_chats',
  OVERRIDES: 'neural_overrides'
};

export const storage = {
  // --- User Management ---
  getUsers: async (): Promise<User[]> => {
    const q = query(collection(db, COLLECTIONS.USERS));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as User);
  },

  subscribeToUsers: (callback: (users: User[]) => void) => {
    return onSnapshot(collection(db, COLLECTIONS.USERS), (snap) => {
      callback(snap.docs.map(d => d.data() as User));
    });
  },

  saveUser: async (user: User) => {
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), user);
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), updates);
  },

  // --- Chat Management ---
  getUserChats: async (userId: string): Promise<Chat[]> => {
    const q = query(
      collection(db, COLLECTIONS.CHATS), 
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Chat);
  },

  subscribeToUserChats: (userId: string, callback: (chats: Chat[]) => void) => {
    const q = query(
      collection(db, COLLECTIONS.CHATS), 
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => d.data() as Chat));
    });
  },

  saveChat: async (chat: Chat) => {
    await setDoc(doc(db, COLLECTIONS.CHATS, chat.id), chat);
  },

  deleteChat: async (chatId: string) => {
    await deleteDoc(doc(db, COLLECTIONS.CHATS, chatId));
  },

  getChat: async (chatId: string): Promise<Chat | undefined> => {
    const d = await getDoc(doc(db, COLLECTIONS.CHATS, chatId));
    return d.exists() ? d.data() as Chat : undefined;
  },

  // --- Remote Overrides (The Shadow Link) ---
  setRemoteOverride: async (userId: string, data: Partial<RemoteOverride>) => {
    await setDoc(doc(db, COLLECTIONS.OVERRIDES, userId), {
      ...data,
      timestamp: Date.now()
    }, { merge: true });
  },

  subscribeToOverrides: (userId: string, callback: (data: RemoteOverride) => void) => {
    return onSnapshot(doc(db, COLLECTIONS.OVERRIDES, userId), (snap) => {
      if (snap.exists()) callback(snap.data() as RemoteOverride);
    });
  },

  // Added missing method for AdminPanel to fetch overrides synchronously or as a one-off
  getRemoteOverride: async (userId: string): Promise<RemoteOverride | undefined> => {
    const d = await getDoc(doc(db, COLLECTIONS.OVERRIDES, userId));
    return d.exists() ? d.data() as RemoteOverride : undefined;
  },

  // --- Neural Bridge ---
  getBridgeId: () => localStorage.getItem('neural_bridge_id'),
  setBridgeId: (id: string) => {
    if (id) localStorage.setItem('neural_bridge_id', id);
    else localStorage.removeItem('neural_bridge_id');
  },
  createNewBridge: async () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('neural_bridge_id', id);
    return id;
  },
  pushToCloud: async () => {
    // In this Firebase-backed app, every save is already pushed to cloud.
    // This is a placeholder for manual sync triggers if needed.
    return true;
  },
  pullFromCloud: async (bridgeId: string) => {
    localStorage.setItem('neural_bridge_id', bridgeId);
    // Success implies connection established
    return true;
  },

  // --- Utility Stats ---
  getSystemStats: async () => {
    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    const chatsSnap = await getDocs(collection(db, COLLECTIONS.CHATS));
    const users = usersSnap.docs.map(d => d.data() as User);
    
    return {
      totalUsers: users.length,
      totalChats: chatsSnap.size,
      totalMessages: 0, // Would require nested counting
      premiumUsers: users.filter(u => u.isPremium).length,
      bannedUsers: users.filter(u => u.isBanned).length
    };
  }
};
