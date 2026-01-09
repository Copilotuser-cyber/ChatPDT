
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User, Chat, RemoteOverride } from '../types';

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    premiumUsers: 0,
    bannedUsers: 0
  });

  const [ghostText, setGhostText] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const u = await storage.getUsers();
      setUsers(u);
      const s = await storage.getSystemStats();
      setStats(s);
    };
    loadData();
  }, []);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id.includes(searchTerm)
  );

  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    const chats = await storage.getUserChats(user.id);
    setUserChats(chats);
    setSelectedChat(chats.length > 0 ? chats[0] : null);
  };

  const handleDeployGhost = () => {
    if (!selectedUser || !ghostText.trim()) return;
    storage.setRemoteOverride(selectedUser.id, { 
      ghostPayload: { text: ghostText, timestamp: Date.now() } 
    });
    setGhostText('');
    alert(`Ghost message injected for ${selectedUser.username}.`);
  };

  const handleTriggerPrank = (type: 'rickroll' | 'stickbug') => {
    if (!selectedUser) return;
    storage.setRemoteOverride(selectedUser.id, {
      prank: {
        type,
        triggeredAt: Date.now()
      }
    });
    alert(`Tactical ${type} deployed against ${selectedUser.username}.`);
  };

  const handleTogglePremium = async (user: User) => {
    const nextPremium = !user.isPremium;
    await storage.updateUser(user.id, { isPremium: nextPremium });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isPremium: nextPremium } : u));
  };

  const handleToggleBan = async (user: User) => {
    const nextBanned = !user.isBanned;
    await storage.updateUser(user.id, { isBanned: nextBanned });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBanned: nextBanned } : u));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-7xl h-[95vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl border-red-500/20">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-[0.3em]">Command Matrix</h2>
              <p className="text-[10px] text-red-500 uppercase tracking-widest font-black">Neural Grid Centralized Control</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-400 border border-slate-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r border-slate-800 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-900/20">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Users Grid</div>
             <input type="text" placeholder="Scan Signatures..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3.5 text-xs outline-none focus:border-red-500 transition-all" />
             <div className="space-y-2">
               {filteredUsers.map(u => (
                 <div key={u.id} onClick={() => handleViewUser(u)} className={`p-4 rounded-2xl cursor-pointer transition-all border group ${selectedUser?.id === u.id ? 'bg-indigo-600/10 border-indigo-500/30' : 'hover:bg-slate-800/50 border-transparent'} ${u.isBanned ? 'opacity-50 grayscale' : ''}`}>
                   <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black bg-slate-700 text-white group-hover:bg-indigo-600 transition-colors">
                       {u.username.charAt(0).toUpperCase()}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="text-sm font-black text-white truncate">{u.username}</div>
                       <div className="text-[8px] text-slate-500 font-bold uppercase truncate">{u.id}</div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          <div className="flex-1 flex flex-col bg-slate-950/20 overflow-hidden">
            {selectedUser ? (
               <div className="flex flex-col h-full overflow-hidden animate-fade-in">
                  <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                     <div className="space-y-1">
                       <h4 className="text-xl font-black text-white uppercase tracking-widest">Linked: {selectedUser.username}</h4>
                       <p className="text-[9px] text-red-500 font-black uppercase tracking-[0.3em]">Device Trace Active</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => handleTogglePremium(selectedUser)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedUser.isPremium ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>Premium</button>
                        <button onClick={() => handleToggleBan(selectedUser)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedUser.isBanned ? 'bg-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{selectedUser.isBanned ? 'Unban' : 'Ban'}</button>
                     </div>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                        <section className="bg-red-500/5 p-6 rounded-3xl border border-red-500/10 h-fit">
                           <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">GHOST HIJACK</h5>
                           <textarea value={ghostText} onChange={e => setGhostText(e.target.value)} placeholder="Type message to appear as AI..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-indigo-200 outline-none h-32 mb-4 font-bold" />
                           <button onClick={handleDeployGhost} disabled={!ghostText.trim()} className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Inject Message</button>
                        </section>

                        <section className="bg-amber-500/5 p-6 rounded-3xl border border-amber-500/10 h-fit">
                           <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Neural Disruptors</h5>
                           <div className="space-y-3">
                              <button 
                                 onClick={() => handleTriggerPrank('rickroll')} 
                                 className="w-full py-4 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border border-amber-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                              >
                                 Force Rickroll Still
                              </button>
                              <button 
                                 onClick={() => handleTriggerPrank('stickbug')} 
                                 className="w-full py-4 bg-green-600/20 hover:bg-green-600/30 text-green-500 border border-green-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                              >
                                 Force Stickbug Still
                              </button>
                           </div>
                           <p className="mt-4 text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                              DISRUPTION CAUSES AN 8-SECOND FULL-SCREEN IMAGE HIJACK ON THE TARGET UNIT'S INTERFACE.
                           </p>
                        </section>
                     </div>
                     
                     <div className="bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20 max-w-2xl">
                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Live Feed Trace</h5>
                        <div className="space-y-4">
                          {selectedChat?.messages.slice(-10).map(m => (
                            <div key={m.id} className="text-xs font-bold text-slate-300">
                              <span className="text-indigo-400 uppercase text-[9px] mr-2">{m.role === 'user' ? 'USER' : 'CORE'}:</span>
                              {m.text.slice(0, 200)}
                            </div>
                          ))}
                          {selectedChat?.messages.length === 0 && <p className="text-slate-600 text-[10px] uppercase font-black">No neural traffic detected</p>}
                        </div>
                     </div>
                  </div>
               </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                 <p className="font-black text-xl uppercase tracking-[1em]">Select Unit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
