
import React, { useState } from 'react';
import { storage } from '../services/storage';
import { User } from '../types';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const users = await storage.getUsers();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (user) {
        if (user.isBanned) {
          setError('Access Denied: Unit Offline');
          return;
        }
        onLogin(user);
      } else {
        setError('Verification Failed');
      }
    } else {
      const users = await storage.getUsers();
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        setError('Signature already exists');
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
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Flash Pro</h1>
            <p className="text-slate-400 text-sm font-medium">{isLogin ? 'Establish connection to neural grid' : 'Create new unit signature'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Identifier</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="Username" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Access Key</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="••••••••" />
            </div>
            
            {error && <div className="text-red-400 text-[10px] text-center font-black uppercase p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 animate-shake">{error}</div>}
            
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-600/20 transition-all uppercase text-[11px] tracking-widest">{isLogin ? 'Sign In' : 'Register'}</button>
            
            <div className="pt-6 border-t border-slate-800 text-center">
               <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-indigo-400">
                 {isLogin ? "New unit? Create signature" : "Existing unit? Authenticate"}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
