
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const users = storage.getUsers();
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
      const users = storage.getUsers();
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
      storage.saveUser(newUser);
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
            <h1 className="text-3xl font-bold text-white mb-2">Flash Pro</h1>
            <p className="text-slate-400 text-sm">{isLogin ? 'Welcome back' : 'Create your secure account'}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600" placeholder="Enter username" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600" placeholder="••••••••" />
            </div>
            {error && <div className="text-red-400 text-xs text-center font-bold animate-shake p-2 bg-red-500/10 rounded-lg">{error}</div>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">{isLogin ? 'Sign In' : 'Sign Up'}</button>
          </form>
          <div className="mt-8 text-center"><button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-indigo-400 text-sm hover:underline font-medium">{isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}</button></div>
        </div>
      </div>
    </div>
  );
};
