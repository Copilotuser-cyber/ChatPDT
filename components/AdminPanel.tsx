
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User, Chat, RemoteOverride } from '../types';
import { SYSTEM_PERSONAS, ATMOSPHERE_PRESETS, MODELS } from '../constants';

const ACCENT_COLORS = [
  { name: 'Default', hex: '#4f46e5' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Gold', hex: '#f59e0b' },
  { name: 'Cyber', hex: '#06b6d4' },
  { name: 'Shadow', hex: '#1e293b' }
];

const FONTS = [
  { name: 'Inter (Sans)', val: 'sans' },
  { name: 'Fira (Mono)', val: 'mono' },
  { name: 'Classic (Serif)', val: 'serif' },
  { name: 'Comic (Fun)', val: 'comic' },
  { name: 'Orbit (Future)', val: 'futuristic' }
];

const FILTERS = [
  { name: 'Normal', val: 'none' },
  { name: 'Grayscale', val: 'grayscale(1)' },
  { name: 'Sepia', val: 'sepia(0.8)' },
  { name: 'Invert', val: 'invert(0.9)' },
  { name: 'VHS', val: 'contrast(1.2) brightness(0.9) saturate(1.5) blur(0.5px)' }
];

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [stats, setStats] = useState(storage.getSystemStats());
  const [broadcast, setBroadcast] = useState(localStorage.getItem('system_broadcast') || '');

  // Hijack Matrix States
  const [audioUrl, setAudioUrl] = useState('');
  const [isMusicActive, setIsMusicActive] = useState(false);
  const [vMatrix, setVMatrix] = useState({
    accentColor: '#4f46e5',
    borderRadius: '1rem',
    fontType: 'sans',
    filter: 'none'
  });

  useEffect(() => {
    setUsers(storage.getUsers());
  }, []);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id.includes(searchTerm)
  );

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    const chats = storage.getUserChats(user.id);
    setUserChats(chats);
    setSelectedChat(chats.length > 0 ? chats[0] : null);
    
    const existing = storage.getRemoteOverride(user.id) as RemoteOverride;
    if (existing?.visualMatrix) setVMatrix(existing.visualMatrix as any);
    if (existing?.audioMatrix) {
      setAudioUrl(existing.audioMatrix.appleMusicUrl || '');
      setIsMusicActive(!!existing.audioMatrix.isPlaying);
    }
  };

  const handlePushVisuals = (updates: any) => {
    if (!selectedUser) return;
    const newMatrix = { ...vMatrix, ...updates };
    setVMatrix(newMatrix);
    storage.setRemoteOverride(selectedUser.id, { visualMatrix: newMatrix });
  };

  const handlePushAudio = (isPlaying: boolean) => {
    if (!selectedUser) return;
    setIsMusicActive(isPlaying);
    storage.setRemoteOverride(selectedUser.id, { 
      audioMatrix: { appleMusicUrl: audioUrl, isPlaying } 
    });
  };

  const handleTriggerPrank = (type: 'rickroll' | 'stickbug') => {
    if (!selectedUser) return;
    storage.setRemoteOverride(selectedUser.id, { 
      prank: { type, triggeredAt: Date.now() } 
    });
    alert(`Deploying ${type} to node ${selectedUser.username}`);
  };

  const handleForceModel = (modelId: string) => {
    if (!selectedUser) return;
    storage.setRemoteOverride(selectedUser.id, { 
      config: { model: modelId } 
    });
    alert(`Forced unit ${selectedUser.username} to ${modelId}`);
  };

  const handleShadowAction = (action: string, data: any) => {
    if (!selectedUser) return;
    storage.setRemoteOverride(selectedUser.id, { [action]: data });
  };

  const handleTogglePremium = (user: User) => {
    const nextPremium = !user.isPremium;
    storage.updateUser(user.id, { isPremium: nextPremium });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isPremium: nextPremium } : u));
    setStats(storage.getSystemStats());
  };

  const handleToggleBan = (user: User) => {
    const nextBanned = !user.isBanned;
    storage.updateUser(user.id, { isBanned: nextBanned });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBanned: nextBanned } : u));
    setStats(storage.getSystemStats());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-7xl h-[95vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl border-red-500/20">
        
        {/* Hub Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg animate-pulse">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-[0.3em]">Neural Command Hub</h2>
              <p className="text-[10px] text-red-500 uppercase tracking-widest font-black">Shadow Link Status: ACTIVE • FULL HIJACK ENABLED</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-400 border border-slate-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex bg-slate-900/30 border-b border-slate-800">
           <div className="flex-1 p-6 border-r border-slate-800">
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">System-Wide Broadcast</label>
              <div className="flex gap-3">
                <input value={broadcast} onChange={e => setBroadcast(e.target.value)} placeholder="Push notification to all units..." className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs outline-none focus:border-indigo-500" />
                <button onClick={() => { localStorage.setItem('system_broadcast', broadcast); alert('Broadcast sent.'); }} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Push</button>
              </div>
           </div>
           <div className="grid grid-cols-4 gap-4 p-6 w-2/3">
              {[
                { label: 'Nodes', val: stats.totalUsers, color: 'text-white' },
                { label: 'Logs', val: stats.totalMessages, color: 'text-emerald-500' },
                { label: 'Premium', val: stats.premiumUsers, color: 'text-amber-500' },
                { label: 'Banned', val: stats.bannedUsers, color: 'text-red-500' }
              ].map(s => (
                <div key={s.label} className="bg-slate-800/20 p-3 rounded-2xl border border-slate-800/50">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</div>
                  <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                </div>
              ))}
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* User Navigator */}
          <div className="w-80 border-r border-slate-800 overflow-y-auto custom-scrollbar p-6 space-y-4">
            <input type="text" placeholder="Lookup Node Signature..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3.5 text-xs outline-none focus:border-red-500 transition-all" />
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1 mb-4">Neural Directory</h3>
              {filteredUsers.map(u => (
                <div key={u.id} onClick={() => handleViewUser(u)} className={`p-4 rounded-2xl cursor-pointer transition-all border group ${selectedUser?.id === u.id ? 'bg-indigo-600/10 border-indigo-500/30' : 'hover:bg-slate-800/50 border-transparent'} ${u.isBanned ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {u.isPremium && <span className="absolute -top-3 -left-2 text-xs">👑</span>}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${u.isPremium ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white'}`}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-white truncate flex items-center gap-2">
                        {u.username}
                        {u.isAdmin && <span className="text-[7px] bg-red-500/20 text-red-500 px-1 py-0.5 rounded font-black uppercase">Admin</span>}
                      </div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase truncate">{u.lastDeviceInfo || 'Offline'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wix-style Command Matrix */}
          <div className="flex-1 flex flex-col bg-slate-950/20 overflow-hidden">
            {selectedUser ? (
              <div className="flex flex-col h-full overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                      Linked: {selectedUser.username}
                    </h4>
                    <p className="text-[9px] text-red-500 font-black uppercase tracking-[0.3em] animate-pulse flex items-center gap-2">
                      Device Signature: {selectedUser.lastDeviceInfo}
                    </p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleTogglePremium(selectedUser)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedUser.isPremium ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-amber-500'}`}>Premium</button>
                     <button onClick={() => handleToggleBan(selectedUser)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedUser.isBanned ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-red-500'}`}>{selectedUser.isBanned ? 'Unban' : 'Ban'}</button>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                   {/* Prank & Model Hijack Left Column */}
                   <div className="w-80 border-r border-slate-800 p-6 space-y-8 overflow-y-auto custom-scrollbar bg-slate-900/10">
                      <section>
                        <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          PRANK PAYLOADS (10s Force)
                        </h5>
                        <div className="grid grid-cols-1 gap-2">
                           <button onClick={() => handleTriggerPrank('rickroll')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all">Rick Roll Force</button>
                           <button onClick={() => handleTriggerPrank('stickbug')} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all">Stick Bug Hijack</button>
                        </div>
                      </section>

                      <section>
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Remote Audio Matrix (Autoplay)</h5>
                        <div className="space-y-3">
                           <input value={audioUrl} onChange={e => setAudioUrl(e.target.value)} placeholder="Apple Music URL..." className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-pink-500" />
                           <div className="flex gap-2">
                              <button onClick={() => handlePushAudio(true)} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${isMusicActive ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-slate-800 text-slate-400'}`}>Inject & Play</button>
                              <button onClick={() => handlePushAudio(false)} className="flex-1 py-2.5 bg-slate-950 border border-slate-800 text-slate-500 rounded-xl text-[9px] font-black uppercase">Stop</button>
                           </div>
                        </div>
                      </section>

                      <section>
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Forced Model Selection</h5>
                        <div className="grid grid-cols-1 gap-1.5">
                           {MODELS.map(m => (
                             <button key={m.id} onClick={() => handleForceModel(m.id)} className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500 transition-all text-left">
                                <div className="text-[9px] font-black text-white uppercase truncate">{m.name}</div>
                                <div className="text-[7px] text-slate-500 uppercase truncate">Force Node Selection</div>
                             </button>
                           ))}
                        </div>
                      </section>
                   </div>

                   {/* Visual Wix-style Architecture Center Column */}
                   <div className="flex-1 p-8 space-y-10 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 gap-12">
                         <div className="space-y-4">
                            <h5 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">Font Hijack Matrix</h5>
                            <div className="grid grid-cols-2 gap-3">
                               {FONTS.map(f => (
                                 <button key={f.name} onClick={() => handlePushVisuals({ fontType: f.val })} className={`p-4 rounded-2xl border transition-all text-center ${vMatrix.fontType === f.val ? 'border-indigo-500 bg-indigo-600/20 text-indigo-400' : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-indigo-500/50'}`}>
                                   <div className="text-[10px] font-black uppercase mb-1">{f.name}</div>
                                   <div className="text-[8px] opacity-40 italic">Override Typography</div>
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="space-y-6">
                            <h5 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Architecture Matrix</h5>
                            <div className="space-y-4">
                               <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-3">Unit Roundness</label>
                                  <div className="flex gap-2">
                                     {['0px', '0.75rem', '1.5rem', '999px'].map(r => (
                                       <button key={r} onClick={() => handlePushVisuals({ borderRadius: r })} className={`flex-1 py-3 border rounded-xl text-[10px] font-black uppercase ${vMatrix.borderRadius === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                                         {r === '0px' ? 'Sharp' : r === '999px' ? 'Pill' : 'Soft'}
                                       </button>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h5 className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-2">Screen Filter Injection</h5>
                         <div className="grid grid-cols-5 gap-3">
                            {FILTERS.map(f => (
                              <button key={f.name} onClick={() => handlePushVisuals({ filter: f.val })} className={`p-4 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${vMatrix.filter === f.val ? 'bg-red-600 border-red-500 text-white shadow-red-500/20 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                                {f.name}
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20">
                         <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Live Log Observation</h5>
                         <div className="h-40 overflow-y-auto custom-scrollbar p-4 bg-black/40 rounded-2xl space-y-4 text-[12px] font-bold">
                            {selectedChat?.messages.slice(-5).map(m => (
                               <div key={m.id} className="flex gap-2 animate-fade-in">
                                  <span className={`uppercase text-[9px] ${m.role === 'user' ? 'text-indigo-400' : 'text-slate-500'}`}>{m.role === 'user' ? 'In' : 'Out'}:</span>
                                  <span className="text-slate-300 line-clamp-2">{m.text}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-800 gap-8 opacity-20">
                <svg className="w-32 h-32 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 18a10.003 10.003 0 01-9.57-7.752m9.57 7.752V13m0-10V3m0 10l8.114-1.352a10.001 10.001 0 00-7.359-7.359L12 11zm0 0l1.352 8.114a10.001 10.001 0 007.359-7.359L12 11z" /></svg>
                <p className="font-black text-xl uppercase tracking-[1em]">Establishing Link...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
