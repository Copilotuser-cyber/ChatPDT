
import React from 'react';
import { ChatConfig, User, Theme } from '../types';
import { MODELS } from '../constants';

interface SidebarProps {
  config: ChatConfig;
  setConfig: (config: ChatConfig) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onClearChat: () => void;
  user: User;
  onLogout: () => void;
  onOpenAdmin: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  config, setConfig, isOpen, setIsOpen, onClearChat, user, onLogout, onOpenAdmin, theme, onToggleTheme 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: name === 'model' || name === 'systemInstruction' ? value : parseFloat(value)
    });
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-80 dark:bg-slate-900 bg-white border-r dark:border-slate-800 border-slate-200 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col shadow-2xl`}
    >
      <div className="p-6 dark:border-slate-800 border-slate-200 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
             {user.username.charAt(0).toUpperCase()}
           </div>
           <div>
             <div className="text-sm font-bold dark:text-white text-slate-800 truncate max-w-[120px]">{user.username}</div>
             <div className="text-[10px] dark:text-slate-500 text-slate-400 uppercase tracking-tighter">Status: Online</div>
           </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden dark:text-slate-400 text-slate-500 hover:text-indigo-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Admin Link - Stealthily placed */}
        {user.isAdmin && (
          <button 
            onClick={onOpenAdmin}
            className="w-full flex items-center gap-3 p-3 rounded-xl dark:bg-slate-800/50 bg-slate-100 dark:hover:bg-slate-800 hover:bg-slate-200 transition-all border border-indigo-500/20"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <span className="text-sm font-semibold dark:text-indigo-400 text-indigo-600">Console Core</span>
          </button>
        )}

        <div>
          <label className="block text-[10px] font-bold dark:text-slate-500 text-slate-400 uppercase tracking-widest mb-3">Model Configuration</label>
          <select 
            name="model" 
            value={config.model} 
            onChange={handleChange}
            className="w-full dark:bg-slate-800 bg-slate-50 border dark:border-slate-700 border-slate-200 dark:text-slate-200 text-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all shadow-sm"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold dark:text-slate-500 text-slate-400 uppercase tracking-widest mb-3">System Instruction</label>
          <textarea 
            name="systemInstruction"
            value={config.systemInstruction}
            onChange={handleChange}
            rows={4}
            className="w-full dark:bg-slate-800 bg-slate-50 border dark:border-slate-700 border-slate-200 dark:text-slate-200 text-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-xs leading-relaxed"
            placeholder="AI Persona details..."
          />
        </div>

        <div className="pt-2">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-[10px] font-bold dark:text-slate-500 text-slate-400 uppercase tracking-widest">Temperature</label>
            <span className="text-xs font-mono dark:text-indigo-400 text-indigo-600">{config.temperature}</span>
          </div>
          <input 
            type="range" 
            name="temperature"
            min="0" max="2" step="0.1"
            value={config.temperature}
            onChange={handleChange}
            className="w-full h-1.5 dark:bg-slate-800 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div className="space-y-4 pt-4">
           <button 
             onClick={onToggleTheme}
             className="w-full flex items-center justify-between p-3 rounded-xl dark:bg-slate-800/30 bg-slate-100 hover:bg-indigo-500/10 transition-all border dark:border-slate-800 border-slate-200"
           >
             <span className="text-xs font-semibold dark:text-slate-400 text-slate-600">Interface Theme</span>
             <div className="dark:text-indigo-400 text-amber-500">
               {theme === 'dark' ? (
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
               ) : (
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
               )}
             </div>
           </button>
        </div>
      </div>

      <div className="p-6 border-t dark:border-slate-800 border-slate-200 space-y-3">
        <button 
          onClick={onClearChat}
          className="w-full py-2.5 px-4 dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-red-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Purge History
        </button>
        <button 
          onClick={onLogout}
          className="w-full py-3 px-4 bg-slate-900/10 dark:bg-slate-800/30 text-indigo-500 hover:bg-indigo-500 hover:text-white border dark:border-slate-800 border-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Terminate Session
        </button>
      </div>
    </aside>
  );
};
