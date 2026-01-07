
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User, Message } from '../types';

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userMessages, setUserMessages] = useState<Message[]>([]);

  useEffect(() => {
    setUsers(storage.getUsers().filter(u => !u.isAdmin));
  }, []);

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setUserMessages(storage.getUserMessages(user.id));
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Delete this user and all their data?')) {
      storage.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl h-[85vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white">System Monitor</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Authorized Access Only</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* User List */}
          <div className="w-1/3 border-r border-slate-800 overflow-y-auto custom-scrollbar p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 px-2">Active Sessions</h3>
            {users.map(u => (
              <div 
                key={u.id}
                onClick={() => handleViewUser(u)}
                className={`p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center group ${
                  selectedUser?.id === u.id ? 'bg-indigo-600/20 border border-indigo-500/50' : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-white">{u.username}</div>
                  <div className="text-[10px] text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>

          {/* Chat Preview */}
          <div className="flex-1 flex flex-col bg-slate-950/50 overflow-hidden">
            {selectedUser ? (
              <>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Live feed: <span className="text-indigo-400">{selectedUser.username}</span></span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {userMessages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl p-3 text-xs ${m.role === 'user' ? 'bg-indigo-600/40 text-white' : 'bg-slate-800 text-slate-300'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {userMessages.length === 0 && <div className="h-full flex items-center justify-center text-slate-600 italic">No history available</div>}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <p>Select a user to monitor conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
