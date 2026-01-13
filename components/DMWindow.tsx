
import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../services/storage';
import { User } from '../types';

interface DMMessage {
  sender: string;
  text: string;
  timestamp: number;
  isMe: boolean;
}

interface DMWindowProps {
  onClose: () => void;
  currentUser: User;
}

export const DMWindow: React.FC<DMWindowProps> = ({ onClose, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dmHistories, setDmHistories] = useState<Record<string, DMMessage[]>>(() => {
    const saved = localStorage.getItem(`dm_history_${currentUser.id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedRef = useRef<number>(0);

  useEffect(() => {
    storage.getUsers().then(u => setUsers(u.filter(user => user.id !== currentUser.id && user.username !== '@Maintenance')));
  }, [currentUser.id]);

  useEffect(() => {
    // Persistent subscription to catch incoming messages for ANY user while the DM window is open
    const unsub = storage.subscribeToOverrides(currentUser.id, (overrides) => {
      if (overrides.ghostPayload && overrides.ghostPayload.timestamp > lastProcessedRef.current) {
        lastProcessedRef.current = overrides.ghostPayload.timestamp;
        
        const { sender, text, timestamp } = overrides.ghostPayload;
        
        setDmHistories(prev => {
          const history = prev[sender] || [];
          // Avoid duplicate appends if the timestamp is exactly the same (Firestore might trigger multiple times)
          if (history.length > 0 && history[history.length - 1].timestamp === timestamp) return prev;

          const updated = {
            ...prev,
            [sender]: [...history, { sender, text, timestamp, isMe: false }]
          };
          localStorage.setItem(`dm_history_${currentUser.id}`, JSON.stringify(updated));
          return updated;
        });
      }
    });
    return unsub;
  }, [currentUser.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUser, dmHistories]);

  const handleSendMessage = async () => {
    if (!selectedUser || !inputText.trim()) return;
    const timestamp = Date.now();
    
    // Send to remote user
    await storage.setRemoteOverride(selectedUser.id, {
      ghostPayload: { text: inputText, timestamp, sender: currentUser.username }
    });

    // Update local history
    setDmHistories(prev => {
      const history = prev[selectedUser.username] || [];
      const updated = {
        ...prev,
        [selectedUser.username]: [...history, { sender: currentUser.username, text: inputText, timestamp, isMe: true }]
      };
      localStorage.setItem(`dm_history_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    });

    setInputText('');
  };

  const currentMessages = selectedUser ? (dmHistories[selectedUser.username] || []) : [];

  return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-slate-950 flex flex-col animate-fade-in lg:inset-y-10 lg:inset-x-20 lg:rounded-[3rem] lg:shadow-2xl lg:border-2 lg:border-slate-800">
      <header className="px-8 py-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 backdrop-blur-md lg:rounded-t-[3rem]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">DM</div>
          <div>
            <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Messaging</h2>
            <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Secure Private Link</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-sm hover:scale-110 active:scale-90 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden lg:rounded-b-[3rem]">
        {/* User List Sidebar */}
        <div className="w-80 border-r dark:border-slate-800 overflow-y-auto p-6 space-y-3 bg-slate-50/50 dark:bg-slate-900/20 custom-scrollbar">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Recent Contacts</h3>
          {users.map(u => {
            const lastMsg = (dmHistories[u.username] || []).slice(-1)[0];
            return (
              <div 
                key={u.id} 
                onClick={() => setSelectedUser(u)} 
                className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group border-2 ${selectedUser?.id === u.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl' : 'bg-white dark:bg-slate-900 border-transparent hover:border-indigo-500/30'}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner transition-colors ${selectedUser?.id === u.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-500/10'}`}>
                  {u.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                  <div className="text-sm font-black truncate">{u.username}</div>
                  <div className={`text-[9px] font-bold truncate opacity-60`}>
                    {lastMsg ? lastMsg.text : 'Start a chat...'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Messaging Area */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
          {selectedUser ? (
            <>
              <div className="p-6 border-b dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md">{selectedUser.username?.charAt(0).toUpperCase()}</div>
                <div className="font-black text-sm dark:text-white uppercase tracking-wider">{selectedUser.username}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-indigo-50/30 dark:bg-indigo-950/5">
                {currentMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[75%] p-4 rounded-2xl font-bold text-sm shadow-md border ${m.isMe ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-white dark:bg-slate-900 dark:text-white border-slate-100 dark:border-slate-800 rounded-tl-none'}`}>
                      <div className="text-[8px] uppercase opacity-40 mb-1 tracking-widest">{m.isMe ? 'You' : m.sender}</div>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 shadow-2xl">
                <div className="flex gap-4 max-w-4xl mx-auto">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Message ${selectedUser.username}...`}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-500 transition-all dark:text-white"
                  />
                  <button onClick={handleSendMessage} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-90 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30 select-none">
              <div className="w-32 h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl mb-8 flex items-center justify-center">
                <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h4 className="text-3xl font-black uppercase tracking-widest text-slate-500">Private Signal</h4>
              <p className="text-xs font-bold mt-4 max-w-xs text-slate-400">Select a contact from the terminal directory to establish an encrypted private link.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
