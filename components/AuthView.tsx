
import React, { useState } from 'react';
import { storage } from '../services/storage';
import { User } from '../types';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showBridgeLink, setShowBridgeLink] = useState(false);
  const [bridgeIdInput, setBridgeIdInput] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Fix: Correctly await pullFromCloud.
  const handleBridgeSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bridgeIdInput.trim()) return;
    setIsSyncing(true);
    const ok = await storage.pullFromCloud(bridgeIdInput);
    if (ok) {
      setShowBridgeLink(false);
      setError('Neural Link Established. Login now.');
      setTimeout(() => setError(''), 3000);
    } else {
      setError('Neural Link Failed. Check Bridge ID.');
    }
    setIsSyncing(false);
  };

  // Fix: Handle async data from storage.getUsers().
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const users = await storage.getUsers();
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        if (user.isBanned) {
          setError('This unit has been offline (BANNED)');
          return;
        }
        onLogin(user);
      } else {
        setError('Invalid credentials');
      }
    } else {
      const users = await storage.getUsers();
      if (users.some(u => u.username === username)) {
        setError('Username already exists');
        return;
      }
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        password,
        isAdmin: false,
        isPremium: false,
        isBanned: false,
        createdAt: new Date().toISOString()
      };
      await storage.saveUser(newUser);
      
      // Fix: storage methods are now correctly implemented or handled asynchronously.
      if (storage.getBridgeId()) {
        await storage.pushToCloud();
      }
      
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a] relative overflow-hidden">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Flash Pro</h1>
            <p className="text-slate-400 text-sm font-medium">{isLogin ? 'Welcome back to the grid' : 'Initialize your neural node'}</p>
          </div>

          {!showBridgeLink ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Node Identifier</label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" placeholder="Username" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Passkey</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" placeholder="••••••••" />
              </div>
              
              {error && <div className="text-red-400 text-[10px] text-center font-black uppercase p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 animate-shake">{error}</div>}
              
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 uppercase text-[11px] tracking-widest">{isLogin ? 'Sign In' : 'Sign Up'}</button>
              
              <div className="pt-6 border-t border-slate-800 flex flex-col gap-4">
                 <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-indigo-400 transition-colors">
                   {isLogin ? "No account? Register Node" : "Existing node? Authenticate"}
                 </button>
                 <button 
                   type="button"
                   onClick={() => setShowBridgeLink(true)} 
                   className="flex items-center justify-center gap-2 p-3.5 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-indigo-400 text-[10px] font-black uppercase tracking-widest transition-all"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                   Link Neural Bridge (Cloud Sync)
                 </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBridgeSync} className="space-y-6 animate-fade-in">
               <div className="text-center space-y-2">
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Bridging Protocols</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">Enter a Bridge ID from another device to pull shared accounts and history.</p>
               </div>
               <div>
                  <input 
                    type="text" 
                    required 
                    autoFocus
                    value={bridgeIdInput} 
                    onChange={e => setBridgeIdInput(e.target.value)} 
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-5 text-center text-xl font-black tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="BRIDGE ID" 
                  />
               </div>
               <div className="flex gap-3">
                  <button type="submit" disabled={isSyncing} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest">
                    {isSyncing ? 'Linking...' : 'Establish Link'}
                  </button>
                  <button type="button" onClick={() => setShowBridgeLink(false)} className="px-6 py-4 bg-slate-800 text-slate-400 font-black rounded-xl text-[10px] uppercase">Cancel</button>
               </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
