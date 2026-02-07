
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User, Chat, GameProject, Role } from '../types';

type AdminTab = 'info' | 'chats' | 'games';

export const AdminPanel: React.FC<{ onClose: () => void, currentUser: User }> = ({ onClose, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('info');
  
  // Surveillance Data
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [userGames, setUserGames] = useState<GameProject[]>([]);
  const [inspectedChat, setInspectedChat] = useState<Chat | null>(null);
  const [inspectedGame, setInspectedGame] = useState<GameProject | null>(null);

  const [broadcastText, setBroadcastText] = useState('');
  const isSuperUser = currentUser.username === '@Maintenance';

  useEffect(() => {
    storage.getUsers().then(setUsers);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      storage.getUserChats(selectedUser.id).then(setUserChats);
      storage.getGameProjects(selectedUser.id).then(setUserGames);
      setInspectedChat(null);
      setInspectedGame(null);
      setActiveTab('info');
    }
  }, [selectedUser]);

  const handleAction = async (userId: string, updates: Partial<User>) => {
    await storage.updateUser(userId, updates);
    setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, ...updates });
  };

  const forceTheme = async (userId: string, theme: 'light' | 'dark') => {
    await storage.setRemoteOverride(userId, { theme });
    alert(`SIGNAL PUSHED: Theme forced to ${theme.toUpperCase()}.`);
  };

  const wipeHistory = async (userId: string) => {
    if (confirm("CRITICAL: Wipe all neural signals for this unit?")) {
      const chats = await storage.getUserChats(userId);
      await Promise.all(chats.map(c => storage.deleteChat(c.id)));
      setUserChats([]);
      alert("SIGNAL WIPE COMPLETE.");
    }
  };

  const sendAlert = async (userId: string) => {
    const text = prompt("Enter Alert Message:");
    if (text) await storage.setRemoteOverride(userId, { broadcast: { text, timestamp: Date.now() } });
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    const allUsers = await storage.getUsers();
    await Promise.all(allUsers.map(u => storage.setRemoteOverride(u.id, { broadcast: { text: broadcastText, timestamp: Date.now() } })));
    setBroadcastText('');
    alert("GLOBAL SIGNAL BURST DEPLOYED.");
  };

  return (
    <div className="fixed inset-0 z-[400] bg-white dark:bg-slate-950 flex flex-col animate-fade-in lg:rounded-[3.5rem] lg:inset-12 shadow-2xl border dark:border-slate-800 overflow-hidden">
      <header className="px-10 py-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Admin Matrix</h2>
          <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.4em]">Grid surveillance mode</p>
        </div>
        <button onClick={onClose} className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:scale-105 transition-all border dark:border-slate-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* User Navigation Sidebar */}
        <div className="w-80 border-r dark:border-slate-800 p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col">
          <input 
            type="text" placeholder="Trace signal..." value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl text-xs font-bold outline-none border dark:border-slate-800 focus:border-indigo-500/40 transition-all dark:text-white"
          />
          <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
            {users.filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
              <div 
                key={u.id} onClick={() => setSelectedUser(u)}
                className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex items-center gap-4 ${selectedUser?.id === u.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl' : 'hover:bg-slate-100 dark:hover:bg-slate-900/40 border-transparent dark:text-slate-400'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-inner ${u.isAdmin ? 'bg-red-500' : 'bg-slate-700'}`}>{u.username?.charAt(0)}</div>
                <div className="flex-1 truncate font-black text-xs uppercase tracking-widest">{u.username}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Detail Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
          {selectedUser ? (
            <>
              {/* Internal Tab Bar */}
              <div className="px-10 py-6 border-b dark:border-slate-800 flex items-center gap-8">
                {(['info', 'chats', 'games'] as AdminTab[]).map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => { setActiveTab(tab); setInspectedChat(null); setInspectedGame(null); }}
                    className={`text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-indigo-500 underline underline-offset-8 decoration-2' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {tab === 'info' ? 'Unit Profile' : tab === 'chats' ? `Neural Logs (${userChats.length})` : `Forge Projects (${userGames.length})`}
                  </button>
                ))}
              </div>

              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                {activeTab === 'info' && (
                  <div className="max-w-4xl space-y-12 animate-fade-in">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-5xl font-black dark:text-white tracking-tighter uppercase mb-2">{selectedUser.username}</h3>
                        <div className="flex gap-2">
                          {selectedUser.isPremium && <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-3 py-1 rounded-full uppercase border border-amber-500/20 shadow-lg shadow-amber-500/10">Premium</span>}
                          {selectedUser.isAdmin && <span className="bg-red-500/10 text-red-500 text-[9px] font-black px-3 py-1 rounded-full uppercase border border-red-500/20 shadow-lg shadow-red-500/10">Admin</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleAction(selectedUser.id, { isBanned: !selectedUser.isBanned })} className="px-8 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all">{selectedUser.isBanned ? 'Lift Ban' : 'Terminate Link'}</button>
                        <button onClick={() => handleAction(selectedUser.id, { isPremium: !selectedUser.isPremium })} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">Toggle Premium</button>
                        {isSuperUser && <button onClick={() => handleAction(selectedUser.id, { isAdmin: !selectedUser.isAdmin })} className="px-8 py-4 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest col-span-2 border border-slate-700 hover:bg-slate-700 transition-all">Grant Matrix Access</button>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm space-y-6">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tactical Override</h4>
                        <div className="space-y-2">
                          <button onClick={() => forceTheme(selectedUser.id, 'light')} className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase dark:text-white border dark:border-slate-700 hover:scale-[1.02] transition-all">Force Light Theme</button>
                          <button onClick={() => forceTheme(selectedUser.id, 'dark')} className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase dark:text-white border dark:border-slate-700 hover:scale-[1.02] transition-all">Force Dark Theme</button>
                          <button onClick={() => sendAlert(selectedUser.id)} className="w-full p-4 bg-indigo-600/10 text-indigo-500 rounded-2xl text-[10px] font-black uppercase border border-indigo-500/20 hover:scale-[1.02] transition-all">Deploy Pulsar Alert</button>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm space-y-6">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Signal Integrity</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                             <span>Link Established</span>
                             <span className="text-slate-500">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                          </div>
                          <button onClick={() => wipeHistory(selectedUser.id)} className="w-full p-4 bg-red-600/10 text-red-500 rounded-2xl text-[10px] font-black uppercase border border-red-500/20 hover:bg-red-600/20 transition-all mt-4">Purge Signal History</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'chats' && (
                  <div className="animate-fade-in space-y-6">
                    {inspectedChat ? (
                      <div className="space-y-6">
                        <button onClick={() => setInspectedChat(null)} className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2 hover:translate-x-[-5px] transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg> BACK TO SIGNAL LOGS
                        </button>
                        <h3 className="text-2xl font-black dark:text-white uppercase">Intercepting: {inspectedChat.title}</h3>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-8 border dark:border-slate-800 space-y-8">
                          {inspectedChat.messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-6 rounded-3xl text-sm font-bold shadow-md ${m.role === Role.USER ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 dark:text-white rounded-tl-none border dark:border-slate-700'}`}>
                                <div className="text-[8px] uppercase opacity-40 mb-2 tracking-widest">{m.role === Role.USER ? selectedUser.username : 'Neural Core'}</div>
                                {m.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userChats.map(chat => (
                          <div 
                            key={chat.id} 
                            onClick={() => setInspectedChat(chat)}
                            className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border dark:border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-all group"
                          >
                            <div className="text-[10px] font-black text-indigo-500 uppercase mb-2 tracking-widest">{new Date(chat.updatedAt).toLocaleDateString()}</div>
                            <h4 className="text-sm font-black dark:text-white uppercase truncate group-hover:text-indigo-400">{chat.title}</h4>
                            <p className="text-[10px] font-bold text-slate-500 mt-2">{chat.messages.length} Packets transmitted</p>
                          </div>
                        ))}
                        {userChats.length === 0 && <div className="col-span-full py-20 text-center text-slate-500 font-black uppercase tracking-[0.2em] opacity-40">No Signal History Found</div>}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'games' && (
                  <div className="animate-fade-in space-y-6">
                    {inspectedGame ? (
                      <div className="space-y-6">
                        <button onClick={() => setInspectedGame(null)} className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2 hover:translate-x-[-5px] transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg> BACK TO FORGE DIRECTORY
                        </button>
                        <h3 className="text-2xl font-black dark:text-white uppercase">Inspecting: {inspectedGame.title}</h3>
                        <div className="grid grid-cols-2 gap-8 h-[600px]">
                           <div className="bg-slate-950 p-8 rounded-[2rem] border border-slate-800 overflow-y-auto custom-scrollbar font-mono text-xs text-indigo-300">
                             <pre>{inspectedGame.latestCode}</pre>
                           </div>
                           <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden relative">
                              <iframe 
                                title="Surveillance Preview" 
                                srcDoc={inspectedGame.latestCode} 
                                className="w-full h-full border-none" 
                              />
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userGames.map(game => (
                          <div 
                            key={game.id} 
                            onClick={() => setInspectedGame(game)}
                            className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border dark:border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-all group"
                          >
                            <div className="text-[10px] font-black text-indigo-500 uppercase mb-2 tracking-widest">Studio Project</div>
                            <h4 className="text-sm font-black dark:text-white uppercase truncate group-hover:text-indigo-400">{game.title}</h4>
                            <p className="text-[10px] font-bold text-slate-500 mt-2">Latest Code: {game.latestCode.length} Bytes</p>
                          </div>
                        ))}
                        {userGames.length === 0 && <div className="col-span-full py-20 text-center text-slate-500 font-black uppercase tracking-[0.2em] opacity-40">No Studio Projects Found</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-xl space-y-8 animate-fade-in">
                <div className="space-y-2">
                  <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Global Signal Burst</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Broadcast to all active units</p>
                </div>
                <textarea 
                  value={broadcastText} onChange={e => setBroadcastText(e.target.value)}
                  placeholder="Inject signal payload..."
                  className="w-full h-48 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 text-sm font-bold dark:text-white outline-none focus:border-indigo-500/40 transition-all shadow-inner"
                />
                <button onClick={handleSendBroadcast} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95">Deploy Signal</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
