
// Standard modular Firebase imports for v9+
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
  onSnapshot,
  addDoc,
  getDoc,
  arrayUnion
} from "firebase/firestore";
import type { Firestore, Unsubscribe } from "firebase/firestore";
import { User, Chat, Message, RemoteOverride, GameProject, CommunityPost, NeuralRoom } from "../types";

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
  COMMUNITY: 'neural_community',
  ROOMS: 'neural_rooms',
  ROOM_MESSAGES: 'neural_room_messages',
  SYSTEM: 'neural_system'
};

const getLocal = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
};

const setLocal = (key: string, data: any) => {
  try {
    const seen = new WeakSet();
    const safeData = JSON.stringify(data, (k, v) => {
      if (typeof v === 'object' && v !== null) {
        if (seen.has(v)) return;
        seen.add(v);
      }
      return v;
    });
    localStorage.setItem(key, safeData);
  } catch (e) {
    console.warn(`Neural Storage: Failed to persist ${key} to local core.`, e);
  }
};

const sanitizeForFirestore = (val: any, seen = new WeakSet()): any => {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (val instanceof Date) return val.toISOString();
  
  // Handle circular references
  if (seen.has(val)) return undefined;
  seen.add(val);
  
  if (Array.isArray(val)) {
    return val.map(item => sanitizeForFirestore(item, seen)).filter(item => item !== undefined);
  }

  // Only recurse into plain objects to avoid Firebase internals or DOM elements
  const isPlainObject = (obj: any) => {
    return Object.prototype.toString.call(obj) === '[object Object]' && 
           (Object.getPrototypeOf(obj) === Object.prototype || Object.getPrototypeOf(obj) === null);
  };

  if (!isPlainObject(val)) {
    // If it's a Firebase Timestamp or similar, try to convert to string or date
    if (typeof val.toISOString === 'function') return val.toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    return String(val);
  }

  const sanitized: any = {};
  Object.keys(val).forEach(key => {
    const cleaned = sanitizeForFirestore(val[key], seen);
    if (cleaned !== undefined) sanitized[key] = cleaned;
  });
  return sanitized;
};

const handleStorageError = (error: any) => {
  const errorMessage = String(error?.message || '');
  const errorCode = String(error?.code || '');
  
  if (errorCode === 'permission-denied' || errorMessage.includes('permission')) {
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
        return snap.docs.map(doc => ({ ...doc.data(), id: String(doc.id) }) as User);
      } catch (e) { handleStorageError(e); }
    }
    return getLocal(COLLECTIONS.USERS) || [];
  },

  saveUser: async (user: User) => {
    const uid = String(user.id || '');
    if (!uid) return;
    if (storage.isCloudEnabled()) {
      try { await setDoc(doc(db!, COLLECTIONS.USERS, uid), sanitizeForFirestore(user)); }
      catch (e) { handleStorageError(e); }
    }
    const users = await storage.getUsers();
    const idx = users.findIndex(u => String(u.id) === uid);
    if (idx > -1) users[idx] = user; else users.push(user);
    setLocal(COLLECTIONS.USERS, users);
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    const uid = String(userId || '');
    if (!uid) return;
    if (storage.isCloudEnabled()) {
      try { await updateDoc(doc(db!, COLLECTIONS.USERS, uid), sanitizeForFirestore(updates)); }
      catch (e) { handleStorageError(e); }
    }
    const users = getLocal(COLLECTIONS.USERS) || [];
    const idx = users.findIndex((u: any) => String(u.id) === uid);
    if (idx > -1) { users[idx] = { ...users[idx], ...updates }; setLocal(COLLECTIONS.USERS, users); }
  },

  getUserChats: async (userId: string): Promise<Chat[]> => {
    const uid = String(userId || '');
    if (!uid) return [];
    if (storage.isCloudEnabled()) {
      try {
        const q = query(collection(db!, COLLECTIONS.CHATS), where("userId", "==", uid));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as Chat).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } catch (e) { handleStorageError(e); }
    }
    return (getLocal(COLLECTIONS.CHATS) || []).filter((c: Chat) => String(c.userId) === uid);
  },

  subscribeToUserChats: (userId: string, callback: (chats: Chat[]) => void): Unsubscribe => {
    const uid = String(userId || '');
    if (!uid) { callback([]); return () => {}; }
    if (storage.isCloudEnabled()) {
      try {
        const q = query(collection(db!, COLLECTIONS.CHATS), where("userId", "==", uid));
        return onSnapshot(q, (snap) => {
          const chats = snap.docs.map(d => d.data() as Chat).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          callback(chats);
        }, handleStorageError);
      } catch (e) { handleStorageError(e); }
    }
    callback((getLocal(COLLECTIONS.CHATS) || []).filter((c: Chat) => String(c.userId) === uid));
    return () => {};
  },

  saveChat: async (chat: Chat) => {
    const cid = String(chat.id || '');
    if (!cid) return;
    if (storage.isCloudEnabled()) {
      try { await setDoc(doc(db!, COLLECTIONS.CHATS, cid), sanitizeForFirestore(chat)); }
      catch (e) { handleStorageError(e); }
    }
    const all = getLocal(COLLECTIONS.CHATS) || [];
    const idx = all.findIndex((c: any) => String(c.id) === cid);
    if (idx > -1) all[idx] = chat; else all.push(chat);
    setLocal(COLLECTIONS.CHATS, all);
  },

  deleteChat: async (chatId: string) => {
    const cid = String(chatId || '');
    if (!cid) return;
    if (storage.isCloudEnabled()) {
      try { await deleteDoc(doc(db!, COLLECTIONS.CHATS, cid)); }
      catch (e) { handleStorageError(e); }
    }
    const all = getLocal(COLLECTIONS.CHATS) || [];
    setLocal(COLLECTIONS.CHATS, all.filter((c: any) => String(c.id) !== cid));
  },

  subscribeToRooms: (callback: (rooms: NeuralRoom[]) => void): Unsubscribe => {
    if (storage.isCloudEnabled()) {
      const q = query(collection(db!, COLLECTIONS.ROOMS), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ ...d.data(), id: String(d.id) } as NeuralRoom)));
      });
    }
    callback([]);
    return () => {};
  },

  createRoom: async (title: string, description: string, userId: string, roomType: 'chat' | 'game-collab' = 'chat', initialCode?: string) => {
    if (!storage.isCloudEnabled()) return null;
    const room: Omit<NeuralRoom, 'id'> = {
      title: String(title || ''),
      description: String(description || ''),
      createdBy: String(userId || ''),
      createdAt: new Date().toISOString(),
      activeParticipants: [String(userId || '')],
      members: [String(userId || '')],
      roomType,
      sharedCode: initialCode || (roomType === 'game-collab' ? '<html><body><h1>Collaborative Game</h1></body></html>' : undefined)
    };
    const docRef = await addDoc(collection(db!, COLLECTIONS.ROOMS), sanitizeForFirestore(room));
    return docRef.id;
  },

  updateRoom: async (roomId: string, updates: Partial<NeuralRoom>) => {
    const rid = String(roomId || '');
    if (!rid || !storage.isCloudEnabled()) return;
    try {
      await updateDoc(doc(db!, COLLECTIONS.ROOMS, rid), sanitizeForFirestore(updates));
    } catch (e) { handleStorageError(e); }
  },

  deleteRoom: async (roomId: string) => {
    const rid = String(roomId || '');
    if (!rid || !storage.isCloudEnabled()) return;
    try {
      await deleteDoc(doc(db!, COLLECTIONS.ROOMS, rid));
    } catch (e) { handleStorageError(e); }
  },

  getRooms: async (): Promise<NeuralRoom[]> => {
    if (storage.isCloudEnabled()) {
      try {
        const q = query(collection(db!, COLLECTIONS.ROOMS), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data(), id: String(d.id) } as NeuralRoom));
      } catch (e) { handleStorageError(e); }
    }
    return [];
  },

  updateCursor: async (roomId: string, userId: string, cursor: { x: number, y: number, username: string, color: string, isPremium?: boolean }) => {
    const rid = String(roomId || '');
    if (!rid || !storage.isCloudEnabled()) return;
    try {
      await updateDoc(doc(db!, COLLECTIONS.ROOMS, rid), {
        [`cursors.${userId}`]: cursor
      });
    } catch (e) { handleStorageError(e); }
  },

  subscribeToRoom: (roomId: string, callback: (room: NeuralRoom | null) => void): Unsubscribe => {
    const rid = String(roomId || '');
    if (!rid || !storage.isCloudEnabled()) return () => {};
    return onSnapshot(doc(db!, COLLECTIONS.ROOMS, rid), (snap) => {
      if (snap.exists()) {
        callback({ ...snap.data(), id: String(snap.id) } as NeuralRoom);
      } else {
        callback(null);
      }
    });
  },

  addRoomMember: async (roomId: string, userId: string) => {
    const rid = String(roomId || '');
    if (!rid || !storage.isCloudEnabled()) return;
    try {
      await updateDoc(doc(db!, COLLECTIONS.ROOMS, rid), {
        members: arrayUnion(userId)
      });
    } catch (e) { handleStorageError(e); }
  },

  subscribeToAllRooms: (callback: (rooms: NeuralRoom[]) => void): Unsubscribe => {
    if (storage.isCloudEnabled()) {
      const q = query(collection(db!, COLLECTIONS.ROOMS), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ ...d.data(), id: String(d.id) } as NeuralRoom)));
      });
    }
    return () => {};
  },

  subscribeToRoomMessages: (roomId: string, callback: (messages: Message[]) => void): Unsubscribe => {
    const rid = String(roomId || '');
    if (!rid || !storage.isCloudEnabled()) return () => {};
    const q = query(
      collection(db!, COLLECTIONS.ROOMS, rid, COLLECTIONS.ROOM_MESSAGES),
      orderBy("timestamp", "asc")
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: String(d.id) } as Message)));
    });
  },

  sendRoomMessage: async (roomId: string, message: Message) => {
    const rid = String(roomId || '');
    if (!rid || !storage.isCloudEnabled()) return;
    await addDoc(
      collection(db!, COLLECTIONS.ROOMS, rid, COLLECTIONS.ROOM_MESSAGES),
      sanitizeForFirestore(message)
    );
  },

  getGameProjects: async (userId: string): Promise<GameProject[]> => {
    const uid = String(userId || '');
    if (!uid) return [];
    if (storage.isCloudEnabled()) {
      try {
        const q = query(collection(db!, COLLECTIONS.GAMES), where("userId", "==", uid));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as GameProject);
      } catch (e) { handleStorageError(e); }
    }
    return (getLocal(COLLECTIONS.GAMES) || []).filter((p: GameProject) => String(p.userId) === uid);
  },

  getPublicGame: async (gameId: string): Promise<GameProject | null> => {
    const gid = String(gameId || '');
    if (!gid) return null;
    if (storage.isCloudEnabled()) {
      try {
        const q = query(collection(db!, COLLECTIONS.GAMES), where("id", "==", gid));
        const snap = await getDocs(q);
        if (!snap.empty) return snap.docs[0].data() as GameProject;
      } catch (e) { handleStorageError(e); }
    }
    return (getLocal(COLLECTIONS.GAMES) || []).find((p: GameProject) => String(p.id) === gid) || null;
  },

  saveGameProject: async (project: GameProject) => {
    const pid = String(project.id || '');
    if (!pid) return;
    if (storage.isCloudEnabled()) {
      try { await setDoc(doc(db!, COLLECTIONS.GAMES, pid), sanitizeForFirestore(project)); }
      catch (e) { handleStorageError(e); }
    }
    const all = getLocal(COLLECTIONS.GAMES) || [];
    const idx = all.findIndex((p: any) => String(p.id) === pid);
    if (idx > -1) all[idx] = project; else all.push(project);
    setLocal(COLLECTIONS.GAMES, all);
  },

  saveCommunityPost: async (post: CommunityPost) => {
    const pid = String(post.id || '');
    if (!pid) return;
    if (storage.isCloudEnabled()) {
      try { await setDoc(doc(db!, COLLECTIONS.COMMUNITY, pid), sanitizeForFirestore(post)); }
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

  setRemoteOverride: async (userId: string, data: Record<string, any>) => {
    const uid = String(userId || '');
    if (!uid || !storage.isCloudEnabled()) return;
    try { 
      // Convert nested objects to dot notation for precise merging
      const updates: Record<string, any> = { timestamp: Date.now() };
      const seen = new WeakSet();
      
      const isPlainObject = (obj: any) => {
        return Object.prototype.toString.call(obj) === '[object Object]' && 
               (Object.getPrototypeOf(obj) === Object.prototype || Object.getPrototypeOf(obj) === null);
      };

      const flatten = (obj: any, prefix = '') => {
        if (seen.has(obj)) return;
        seen.add(obj);

        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const newKey = prefix ? `${prefix}.${key}` : key;
          
          if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && isPlainObject(value)) {
            flatten(value, newKey);
          } else {
            updates[newKey] = sanitizeForFirestore(value);
          }
        });
      };
      flatten(data);
      await updateDoc(doc(db!, COLLECTIONS.OVERRIDES, uid), updates); 
    }
    catch (e) { 
      // If document doesn't exist, use setDoc
      try { await setDoc(doc(db!, COLLECTIONS.OVERRIDES, uid), sanitizeForFirestore({ ...data, timestamp: Date.now() })); }
      catch (err) { handleStorageError(err); }
    }
  },

  subscribeToOverrides: (userId: string, callback: (data: RemoteOverride) => void): Unsubscribe => {
    const uid = String(userId || '');
    if (!uid || !storage.isCloudEnabled()) return () => {};
    try {
      return onSnapshot(doc(db!, COLLECTIONS.OVERRIDES, uid), (snap) => { if (snap.exists()) callback(snap.data() as RemoteOverride); }, handleStorageError);
    } catch (e) { handleStorageError(e); }
    return () => {};
  },

  deleteGameProject: async (projectId: string) => {
    const pid = String(projectId || '');
    if (!pid || !storage.isCloudEnabled()) return;
    try {
      await deleteDoc(doc(db!, COLLECTIONS.GAMES, pid));
    } catch (e) { handleStorageError(e); }
  },

  subscribeToAllUsers: (callback: (users: User[]) => void): Unsubscribe => {
    if (storage.isCloudEnabled()) {
      const q = query(collection(db!, COLLECTIONS.USERS));
      return onSnapshot(q, (snap) => {
        callback(snap.docs.map(doc => ({ ...doc.data(), id: String(doc.id) }) as User));
      });
    }
    return () => {};
  },

  subscribeToAllOverrides: (callback: (overrides: Record<string, RemoteOverride>) => void): Unsubscribe => {
    if (storage.isCloudEnabled()) {
      const q = query(collection(db!, COLLECTIONS.OVERRIDES));
      return onSnapshot(q, (snap) => {
        const overrides: Record<string, RemoteOverride> = {};
        snap.docs.forEach(d => {
          overrides[d.id] = d.data() as RemoteOverride;
        });
        callback(overrides);
      });
    }
    return () => {};
  },

  setSystemBroadcast: async (text: string, sender: string) => {
    if (!storage.isCloudEnabled()) return;
    try {
      await setDoc(doc(db!, COLLECTIONS.SYSTEM, 'broadcast'), {
        text,
        sender,
        timestamp: Date.now()
      });
    } catch (e) { handleStorageError(e); }
  },

  subscribeToSystemBroadcast: (callback: (broadcast: { text: string, sender: string, timestamp: number } | null) => void): Unsubscribe => {
    if (!storage.isCloudEnabled()) return () => {};
    return onSnapshot(doc(db!, COLLECTIONS.SYSTEM, 'broadcast'), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as any);
      } else {
        callback(null);
      }
    });
  }
};
