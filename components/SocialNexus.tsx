
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';

interface SocialNexusProps {
  currentUser: User;
  onClose: () => void;
}

export const SocialNexus: React.FC<SocialNexusProps> = ({ currentUser, onClose }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'blocked'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = storage.subscribeToAllUsers(setAllUsers);
    return unsub;
  }, []);

  const handleToggleFriend = async (userId: string) => {
    const friends = currentUser.friends || [];
    const isFriend = friends.includes(userId);
    const newFriends = isFriend 
      ? friends.filter(id => id !== userId)
      : [...friends, userId];
    
    await storage.updateUser(currentUser.id, { friends: newFriends });
  };

  const handleToggleBlock = async (userId: string) => {
    const blocked = currentUser.blocked || [];
    const isBlocked = blocked.includes(userId);
    const newBlocked = isBlocked 
      ? blocked.filter(id => id !== userId)
      : [...blocked, userId];
    
    await storage.updateUser(currentUser.id, { blocked: newBlocked });
  };

  const isOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    return (now.getTime() - lastSeenDate.getTime()) < 60000; // Online if active in last minute
  };

  const filteredUsers = allUsers.filter(u => {
    if (u.id === currentUser.id) return false;
    if (activeTab === 'friends' && !(currentUser.friends || []).includes(u.id)) return false;
    if (activeTab === 'blocked' && !(currentUser.blocked || []).includes(u.id)) return false;
    if (search && !String(u.username || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[80vh] rounded-[2.5rem] shadow-2xl border dark:border-slate-800 flex flex-col overflow-hidden">
        <header className="p-8 border-b dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Social Nexus</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Manage your neural connections</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
            <svg className="w-6 h-6 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="flex p-4 bg-slate-50 dark:bg-slate-950/50 gap-2">
          {(['all', 'friends', 'blocked'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
            >
              {tab}
            </button>
          ))}
          <div className="flex-1 ml-4 relative">
            <input 
              type="text" 
              placeholder="Search units..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {filteredUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border dark:border-slate-800 hover:border-indigo-500/30 transition-all group">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                    {String(user.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${isOnline(user.lastSeen) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black dark:text-white uppercase tracking-tight">{user.username}</h3>
                    {user.isPremium && <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black">PREMIUM</span>}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {isOnline(user.lastSeen) ? 'Active Now' : `Last seen: ${user.lastSeen ? new Date(user.lastSeen).toLocaleDateString() : 'Unknown'}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleToggleFriend(user.id)}
                  className={`p-2 rounded-xl transition-all ${(currentUser.friends || []).includes(user.id) ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-indigo-500 hover:text-white'}`}
                  title={(currentUser.friends || []).includes(user.id) ? 'Remove Friend' : 'Add Friend'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </button>
                <button 
                  onClick={() => handleToggleBlock(user.id)}
                  className={`p-2 rounded-xl transition-all ${(currentUser.blocked || []).includes(user.id) ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-red-500 hover:text-white'}`}
                  title={(currentUser.blocked || []).includes(user.id) ? 'Unblock' : 'Block'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                </button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-40">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-slate-500">No units detected in this sector</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
