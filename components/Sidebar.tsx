
import React, { useState } from 'react';
import { ChatConfig, User, Theme, AppSettings, Chat } from '../types';
import { MODELS, SYSTEM_PERSONAS } from '../constants';

interface SidebarProps {
  config: ChatConfig;
  setConfig: (config: ChatConfig) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: User;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenGames: () => void;
  onOpenDM: () => void;
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
  onRedeemCode: (code: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  config, setConfig, isOpen, setIsOpen, user, onLogout, onOpenAdmin, onOpenGames, onOpenDM,
  theme, onToggleTheme, appSettings, setAppSettings,
  chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat, onRedeemCode
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [code, setCode] = useState('');

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: name === 'model' || name === 'systemInstruction' ? value : parseFloat(value)
    });
  };

  const startRename = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const submitRename = (id: string) => {
    onRenameChat(id, editTitle);
    setEditingChatId(null);
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-80 dark:bg-slate-900 bg-white border-r dark:border-slate-800 border-slate-200 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col shadow-2xl lg:shadow-none`}>
      <div className="p-6 border-b dark:border-slate-800 border-slate-200 flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl transition-transform hover:rotate-3 ${user.isPremium ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-indigo-600'}`}>
          {user.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="font-black truncate dark:text-white text-slate-800">{user.username}</div>
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{user.isPremium ? 'Premium Plan' : 'Standard User'}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <div className="space-y-3">
          <button onClick={onNewChat} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            New Chat
          </button>

          <button onClick={onOpenDM} className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border dark:border-slate-700 border-slate-200 active:scale-95 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            Direct Messages
          </button>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">History</label>
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => onSelectChat(chat.id)} 
              className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${activeChatId === chat.id ? 'bg-indigo-50 dark:bg-slate-800 border-indigo-500/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'}`}
            >
              <div className={`w-2 h-2 rounded-full ${activeChatId === chat.id ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
              
              {editingChatId === chat.id ? (
                <input 
                  autoFocus
                  className="flex-1 bg-white dark:bg-slate-900 text-xs font-bold p-1 rounded outline-none border border-indigo-500"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={() => submitRename(chat.id)}
                  onKeyDown={e => e.key === 'Enter' && submitRename(chat.id)}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className={`flex-1 text-xs font-bold truncate ${activeChatId === chat.id ? 'text-indigo-600 dark:text-white' : 'text-slate-500'}`}>{chat.title}</span>
              )}

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={(e) => startRename(chat, e)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                 </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t dark:border-slate-800 border-slate-100">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Assistant Configuration</label>
          
          <div className="space-y-4 px-2">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Intelligence Model</label>
              <select name="model" value={config.model} onChange={handleConfigChange} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-xs font-bold border dark:border-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/50">
                {MODELS.filter(m => !m.id.includes('pro') || user.isPremium).map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Persona Selection</label>
              <div className="grid grid-cols-2 gap-2">
                {SYSTEM_PERSONAS.map(persona => (
                  <button 
                    key={persona.name}
                    onClick={() => setConfig({...config, systemInstruction: persona.instruction})}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-[10px] font-black transition-all ${config.systemInstruction === persona.instruction ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <span>{persona.icon}</span>
                    <span className="truncate">{persona.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <input 
                type="text" 
                placeholder="Access code..." 
                value={code} 
                onChange={e => setCode(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 p-2 text-xs rounded-xl outline-none border dark:border-slate-700 text-slate-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button onClick={() => { onRedeemCode(code); setCode(''); }} className="px-4 bg-slate-200 dark:bg-slate-700 hover:bg-indigo-500 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-sm">Redeem</button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t dark:border-slate-800 border-slate-200 space-y-2 bg-white/50 dark:bg-slate-900/50">
        <button onClick={onOpenGames} className="w-full py-3 bg-indigo-500/10 text-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-colors">Game Forge</button>
        {user.isAdmin && <button onClick={onOpenAdmin} className="w-full py-3 bg-red-600/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600/20 transition-colors">Admin Panel</button>}
        <button onClick={onLogout} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Logout</button>
      </div>
    </aside>
  );
};
