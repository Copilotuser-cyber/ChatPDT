
import React, { useState } from 'react';
import { ChatConfig, User, Theme, AppSettings, Chat } from '../types';
import { MODELS, SYSTEM_PERSONAS, ATMOSPHERE_PRESETS } from '../constants';

interface SidebarProps {
  config: ChatConfig;
  setConfig: (config: ChatConfig) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: User;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenGames: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  config, setConfig, isOpen, setIsOpen, user, onLogout, onOpenAdmin, onOpenGames, 
  theme, onToggleTheme, appSettings, setAppSettings,
  chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: name === 'model' || name === 'systemInstruction' ? value : parseFloat(value)
    });
  };

  const selectPersona = (instruction: string) => {
    setConfig({ ...config, systemInstruction: instruction });
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-80 dark:bg-slate-900/95 bg-white/95 backdrop-blur-2xl border-r dark:border-slate-800 border-slate-200 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col shadow-2xl overflow-hidden`}
    >
      <div className="p-5 dark:border-slate-800 border-slate-200 border-b flex justify-between items-center bg-white/10 dark:bg-slate-900/10">
        <div className="flex items-center gap-3">
           <div className="relative">
             {user.isPremium && <span className="absolute -top-3 -left-2 text-sm z-10 drop-shadow-md">👑</span>}
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xl ${user.isPremium ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/30' : 'bg-indigo-600 shadow-indigo-500/30'}`}>
               {user.username.charAt(0).toUpperCase()}
             </div>
           </div>
           <div>
             <div className="text-sm font-black dark:text-white text-slate-800 truncate max-w-[120px]">{user.username}</div>
             <div className={`text-[9px] font-bold uppercase tracking-widest ${user.isPremium ? 'text-amber-500' : 'text-slate-500'}`}>
               {user.isPremium ? '★ Premium Tier' : 'Standard Tier'}
             </div>
           </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden dark:text-slate-400 text-slate-500 p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <button 
          onClick={onNewChat}
          className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-600/30 active:scale-95 uppercase"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          Initialize Stream
        </button>

        <div className="space-y-2">
          <label className="block text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest px-2 mb-1">Neural Channels</label>
          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {chats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  activeChatId === chat.id 
                    ? 'dark:bg-indigo-500/20 bg-indigo-50 border-indigo-500/30' 
                    : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeChatId === chat.id ? 'bg-indigo-500' : 'bg-slate-500 opacity-30'}`}></div>
                {editingChatId === chat.id ? (
                  <input 
                    autoFocus
                    className="flex-1 bg-transparent text-xs font-bold outline-none text-indigo-500"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => { onRenameChat(chat.id, editTitle); setEditingChatId(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && (onRenameChat(chat.id, editTitle), setEditingChatId(null))}
                  />
                ) : (
                  <span className={`flex-1 text-xs font-bold truncate ${activeChatId === chat.id ? 'dark:text-white text-slate-900' : 'text-slate-500'}`}>
                    {chat.title}
                  </span>
                )}
                <div className="hidden group-hover:flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setEditingChatId(chat.id); setEditTitle(chat.title); }} className="p-1 text-slate-500 hover:text-indigo-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }} className="p-1 text-slate-500 hover:text-red-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="block text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest px-1">Persona Matrix</label>
          <div className="grid grid-cols-1 gap-2">
            {SYSTEM_PERSONAS.map(persona => (
              <button
                key={persona.name}
                onClick={() => selectPersona(persona.instruction)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${config.systemInstruction === persona.instruction ? 'dark:bg-indigo-500/10 bg-indigo-50 border-indigo-500/40 text-indigo-500' : 'dark:bg-slate-800/40 bg-slate-50 border-transparent text-slate-500 hover:border-slate-300'}`}
              >
                <span className="text-lg">{persona.icon}</span>
                <span className="text-[11px] font-black uppercase tracking-wider">{persona.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t dark:border-slate-800 border-slate-100">
          <label className="block text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest px-1">Atmosphere Core</label>
          <div className="grid grid-cols-5 gap-2 px-1">
            {ATMOSPHERE_PRESETS.map(preset => (
              <button 
                key={preset.name}
                onClick={() => setAppSettings({ ...appSettings, backgroundUrl: preset.url })}
                title={preset.name}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-110 ${appSettings.backgroundUrl === preset.url ? 'border-indigo-500' : 'border-transparent'}`}
              >
                <img src={preset.url} className="w-full h-full object-cover" alt={preset.name} />
              </button>
            ))}
          </div>
          <div className="flex gap-4 px-1">
             <div className="flex-1">
                <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Blur</label>
                <input type="range" min="0" max={user.isPremium ? 60 : 20} value={appSettings.backgroundBlur} onChange={(e) => setAppSettings({ ...appSettings, backgroundBlur: parseInt(e.target.value) })} className="w-full accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none" />
             </div>
             <div className="flex-1">
                <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Density</label>
                <input type="range" min="0" max={user.isPremium ? 100 : 40} value={appSettings.backgroundOpacity} onChange={(e) => setAppSettings({ ...appSettings, backgroundOpacity: parseInt(e.target.value) })} className="w-full accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none" />
             </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t dark:border-slate-800 border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-widest px-1">Model Node</label>
            <button onClick={onToggleTheme} className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all font-bold text-xs">
               {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
          <select name="model" value={config.model} onChange={handleConfigChange} className="w-full dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-200 dark:text-slate-200 text-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-[11px] font-black uppercase tracking-wider">
            {MODELS.filter(m => !m.id.includes('pro') || user.isPremium).map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>
          {user.isPremium && (
            <div className="pt-2">
              <label className="block text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1 px-1">Neural Thinking Tokens</label>
              <input type="range" min="0" max="24000" step="1000" name="thinkingBudget" value={config.thinkingBudget} onChange={handleConfigChange} className="w-full accent-amber-500 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none" />
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t dark:border-slate-800 border-slate-200 bg-slate-900/10 space-y-2">
        <button onClick={onOpenGames} className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">Open Game Forge</button>
        {user.isAdmin && (<button onClick={onOpenAdmin} className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">Admin Matrix</button>)}
        <button onClick={onLogout} className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-black text-[10px] tracking-widest transition-all hover:bg-slate-900 uppercase">Terminate Link</button>
      </div>
    </aside>
  );
};
