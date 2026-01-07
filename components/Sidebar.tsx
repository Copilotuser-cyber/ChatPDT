
import React from 'react';
import { ChatConfig, User, Theme, AppSettings } from '../types';
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
  onOpenGames: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  config, setConfig, isOpen, setIsOpen, onClearChat, user, onLogout, onOpenAdmin, onOpenGames, theme, onToggleTheme, appSettings, setAppSettings 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: name === 'model' || name === 'systemInstruction' ? value : parseFloat(value)
    });
  };

  const updateSetting = (name: string, value: any) => {
    setAppSettings({ ...appSettings, [name]: value });
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-80 dark:bg-slate-900/80 bg-white/80 backdrop-blur-xl border-r dark:border-slate-800 border-slate-200 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col shadow-2xl overflow-hidden`}
    >
      <div className="p-6 dark:border-slate-800 border-slate-200 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
             {user.username.charAt(0).toUpperCase()}
           </div>
           <div>
             <div className="text-sm font-bold dark:text-white text-slate-800 truncate max-w-[120px]">{user.username}</div>
             <div className="text-[10px] dark:text-slate-500 text-slate-400 uppercase tracking-tighter">Status: Authorized</div>
           </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden dark:text-slate-400 text-slate-500 hover:text-indigo-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Feature Buttons */}
        <div className="grid grid-cols-2 gap-2">
           <button 
             onClick={onOpenGames}
             className="flex flex-col items-center gap-2 p-3 rounded-xl dark:bg-slate-800/50 bg-slate-100 hover:bg-indigo-600 hover:text-white transition-all border border-transparent hover:border-indigo-400 shadow-sm"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
             <span className="text-[10px] font-bold uppercase tracking-widest">Game Forge</span>
           </button>
           <button 
             onClick={onToggleTheme}
             className="flex flex-col items-center gap-2 p-3 rounded-xl dark:bg-slate-800/50 bg-slate-100 hover:bg-amber-500 hover:text-white transition-all border border-transparent shadow-sm"
           >
             {theme === 'dark' ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>}
             <span className="text-[10px] font-bold uppercase tracking-widest">{theme} Mode</span>
           </button>
        </div>

        {user.isAdmin && (
          <button 
            onClick={onOpenAdmin}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all border border-red-500/20"
          >
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Admin Matrix</span>
          </button>
        )}

        {/* Background Settings */}
        <div className="space-y-4 pt-2 border-t dark:border-slate-800 border-slate-100">
          <label className="block text-[10px] font-bold dark:text-slate-500 text-slate-400 uppercase tracking-widest">Neural Background</label>
          <input 
            type="text"
            placeholder="Image URL (Unsplash)..."
            value={appSettings.backgroundUrl}
            onChange={(e) => updateSetting('backgroundUrl', e.target.value)}
            className="w-full dark:bg-slate-800 bg-slate-50 border dark:border-slate-700 border-slate-200 dark:text-slate-200 text-slate-800 rounded-xl p-3 text-xs outline-none"
          />
          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Blur</label>
                <input 
                  type="range" min="0" max="20"
                  value={appSettings.backgroundBlur}
                  onChange={(e) => updateSetting('backgroundBlur', parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
             </div>
             <div className="flex-1">
                <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1">Opacity</label>
                <input 
                  type="range" min="0" max="100"
                  value={appSettings.backgroundOpacity}
                  onChange={(e) => updateSetting('backgroundOpacity', parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
             </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold dark:text-slate-500 text-slate-400 uppercase tracking-widest mb-3">Model Matrix</label>
          <select 
            name="model" 
            value={config.model} 
            onChange={handleChange}
            className="w-full dark:bg-slate-800 bg-slate-50 border dark:border-slate-700 border-slate-200 dark:text-slate-200 text-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold dark:text-slate-500 text-slate-400 uppercase tracking-widest mb-3">System Persona</label>
          <textarea 
            name="systemInstruction"
            value={config.systemInstruction}
            onChange={handleChange}
            rows={3}
            className="w-full dark:bg-slate-800 bg-slate-50 border dark:border-slate-700 border-slate-200 dark:text-slate-200 text-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-[10px] leading-relaxed"
          />
        </div>
      </div>

      <div className="p-6 border-t dark:border-slate-800 border-slate-200 space-y-3 bg-white/20 dark:bg-slate-900/20">
        <button 
          onClick={onLogout}
          className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-indigo-600/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
};
