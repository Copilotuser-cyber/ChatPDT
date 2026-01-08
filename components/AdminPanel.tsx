
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User, Chat, RemoteOverride } from '../types';

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  // Fix: Initialize stats with default values instead of a Promise.
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    premiumUsers: 0,
    bannedUsers: 0
  });
  const [broadcast, setBroadcast] = useState(localStorage.getItem('system_broadcast') || '');
  const [activeTab, setActiveTab] = useState<'nodes' | 'bridge'>('nodes');

  // Bridge States
  // Fix: storage.getBridgeId() is now correctly implemented in storage.ts.
  const [bridgeId, setBridgeId] = useState(storage.getBridgeId() || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Hijack Matrix States
  const [audioUrl, setAudioUrl] = useState('');
  const [isMusicActive, setIsMusicActive] = useState(false);
  const [ghostText, setGhostText] = useState('');
  const [vMatrix, setVMatrix] = useState({
    accentColor: '#4f46e5',
    borderRadius: '1rem',
    fontType: 'sans',
    filter: 'none'
  });

  // Fix: Fetch users and stats asynchronously on mount.
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

  // Fix: Handle async calls for fetching user details.
  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    const chats = await storage.getUserChats(user.id);
    setUserChats(chats);
    setSelectedChat(chats.length > 0 ? chats[0] : null);
    
    const existing = await storage.getRemoteOverride(user.id);
    if (existing?.visualMatrix) setVMatrix(existing.visualMatrix as any);
  };

  const handleCreateBridge = async () => {
    setIsSyncing(true);
    // Fix: createNewBridge is now implemented.
    const id = await storage.createNewBridge();
    if (id) {
      setBridgeId(id);
      setSyncStatus('success');
    } else {
      setSyncStatus('error');
    }
    setIsSyncing(false);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    // Fix: pushToCloud is now implemented.
    const ok = await storage.pushToCloud();
    setSyncStatus(ok ? 'success' : 'error');
    setIsSyncing(false);
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handlePushVisuals = (updates: any) => {
    if (!selectedUser) return;
    const newMatrix = { ...vMatrix, ...updates };
    setVMatrix(newMatrix);
    storage.setRemoteOverride(selectedUser.id, { visualMatrix: newMatrix });
  };

  const handleDeployGhost = () => {
    if (!selectedUser || !ghostText.trim()) return;
    storage.setRemoteOverride(selectedUser.id, { 
      ghostPayload: { text: ghostText, timestamp: Date.now() } 
    });
    setGhostText('');
    alert(`Ghost message injected as Model into ${selectedUser.username}'s active stream.`);
  };

  const handleTogglePremium = async (user: User) => {
    const nextPremium = !user.isPremium;
    await storage.updateUser(user.id, { isPremium: nextPremium });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isPremium: nextPremium } : u));
    const newStats = await storage.getSystemStats();
    setStats(newStats);
  };

  const handleToggleBan = async (user: User) => {
    const nextBanned = !user.isBanned;
    await storage.updateUser(user.id, { isBanned: nextBanned });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBanned: nextBanned } : u));
    const newStats = await storage.getSystemStats();
    setStats(newStats);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-7xl h-[95vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl border-red-500/20">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg animate-pulse">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-[0.3em]">Neural Command Hub</h2>
              <p className="text-[10px] text-red-500 uppercase tracking-widest font-black">
                {bridgeId ? `Bridge: ${bridgeId} • Link ACTIVE` : 'Local Mode • Neural Bridge Needed'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-400 border border-slate-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Admin Sidebar Navigation */}
          <div className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/40">
            <div className="p-4 space-y-2">
               <button 
                 onClick={() => setActiveTab('nodes')} 
                 className={`w-full p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-left transition-all flex items-center gap-3 ${activeTab === 'nodes' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                 Node Directory
               </button>
               <button 
                 onClick={() => setActiveTab('bridge')} 
                 className={`w-full p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-left transition-all flex items-center gap-3 ${activeTab === 'bridge' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                 Neural Bridge
               </button>
            </div>
            
            <div className="mt-auto p-6 border-t border-slate-800 space-y-4">
               <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global Stats</div>
               <div className="space-y-2">
                 <div className="flex justify-between items-center"><span className="text-[10px] text-slate-400">Total Units</span> <span className="text-xs font-bold text-white">{stats.totalUsers}</span></div>
                 <div className="flex justify-between items-center"><span className="text-[10px] text-slate-400">Exchanges</span> <span className="text-xs font-bold text-emerald-500">{stats.totalMessages}</span></div>
               </div>
            </div>
          </div>

          {activeTab === 'nodes' ? (
            <div className="flex-1 flex overflow-hidden">
               {/* User List */}
               <div className="w-80 border-r border-slate-800 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-900/20">
                  <input type="text" placeholder="Scan Node Signatures..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3.5 text-xs outline-none focus:border-red-500 transition-all" />
                  <div className="space-y-2">
                    {filteredUsers.map(u => (
                      <div key={u.id} onClick={() => handleViewUser(u)} className={`p-4 rounded-2xl cursor-pointer transition-all border group ${selectedUser?.id === u.id ? 'bg-indigo-600/10 border-indigo-500/30' : 'hover:bg-slate-800/50 border-transparent'} ${u.isBanned ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black bg-slate-700 text-white group-hover:bg-indigo-600 transition-colors">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-white truncate">{u.username}</div>
                            <div className="text-[8px] text-slate-500 font-bold uppercase truncate">{u.lastDeviceInfo || 'Offline'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Command Matrix */}
               <div className="flex-1 flex flex-col bg-slate-950/20 overflow-hidden">
                 {selectedUser ? (
                    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
                       <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="text-xl font-black text-white uppercase tracking-widest">Linked: {selectedUser.username}</h4>
                            <p className="text-[9px] text-red-500 font-black uppercase tracking-[0.3em]">Device: {selectedUser.lastDeviceInfo}</p>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => handleTogglePremium(selectedUser)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedUser.isPremium ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>Premium</button>
                             <button onClick={() => handleToggleBan(selectedUser)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedUser.isBanned ? 'bg-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{selectedUser.isBanned ? 'Unban' : 'Ban'}</button>
                          </div>
                       </div>
                       <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-10">
                          {/* Ghost Protocol Injected here (Simplified for space) */}
                          <section className="bg-red-500/5 p-6 rounded-3xl border border-red-500/10 max-w-2xl">
                             <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">GHOST PROTOCOL</h5>
                             <textarea value={ghostText} onChange={e => setGhostText(e.target.value)} placeholder="Type message to appear as AI..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-indigo-200 outline-none focus:border-red-500 h-32 mb-4 font-bold" />
                             <button onClick={handleDeployGhost} disabled={!ghostText.trim()} className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20">Inject Ghost Message</button>
                          </section>
                          
                          <div className="bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20 max-w-2xl">
                             <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Live Stream Trace</h5>
                             <div className="space-y-4">
                               {selectedChat?.messages.slice(-5).map(m => (
                                 <div key={m.id} className="text-xs font-bold text-slate-300">
                                   <span className="text-indigo-400 uppercase text-[9px] mr-2">{m.role === 'user' ? 'IN' : 'OUT'}:</span>
                                   {m.text.slice(0, 100)}...
                                 </div>
                               ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 ) : (
                   <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                      <p className="font-black text-xl uppercase tracking-[1em]">Select Node</p>
                   </div>
                 )}
               </div>
            </div>
          ) : (
            /* Neural Bridge Sync Tab */
            <div className="flex-1 p-12 bg-slate-950/20 overflow-y-auto custom-scrollbar">
               <div className="max-w-2xl mx-auto space-y-10">
                  <div className="text-center space-y-4">
                     <div className="w-24 h-24 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                        <svg className={`w-12 h-12 text-indigo-500 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                     </div>
                     <h3 className="text-3xl font-black text-white uppercase tracking-widest">Neural Bridge</h3>
                     <p className="text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
                        Connect multiple physical devices to the same Neural Grid. Once linked, accounts and history will be mirrored across all nodes.
                     </p>
                  </div>

                  {bridgeId ? (
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Bridge ID</label>
                          <div className="flex gap-4">
                             <div className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-xl text-2xl font-black text-white text-center tracking-[0.5em]">
                                {bridgeId}
                             </div>
                             <button 
                               onClick={() => { navigator.clipboard.writeText(bridgeId); alert('Bridge ID Copied'); }}
                               className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                             >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                             </button>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${syncStatus === 'success' ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                          >
                            {isSyncing ? 'Pushing Data...' : syncStatus === 'success' ? 'Link Synchronized' : 'Push Neural Sync'}
                          </button>
                          <button 
                             onClick={() => { if (confirm('Disconnect from Bridge?')) { storage.setBridgeId(''); setBridgeId(''); } }}
                             className="py-4 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all"
                          >
                            Sever Bridge Link
                          </button>
                       </div>

                       <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                            The Neural Bridge polls every 2000ms. All Admin Overrides and User Nodes are currently broadcasted to this ID.
                          </p>
                       </div>
                    </div>
                  ) : (
                    <div className="text-center p-12 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed space-y-6">
                       <p className="text-slate-500 text-sm font-bold">No active bridge detected.</p>
                       <button 
                         onClick={handleCreateBridge}
                         disabled={isSyncing}
                         className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all"
                       >
                         {isSyncing ? 'Generating Neural Path...' : 'Initialize New Neural Bridge'}
                       </button>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
