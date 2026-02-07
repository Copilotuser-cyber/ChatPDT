
import React, { useState } from 'react';
import { ChatConfig, User, Theme, AppSettings, Chat } from '../types';
import { MODELS, SYSTEM_PERSONAS } from '../constants';
import { chatService } from '../services/chatService';
import { ProfileSettings } from './ProfileSettings';

interface SidebarProps {
  config: ChatConfig;
  setConfig: (config: ChatConfig) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenGames: () => void;
  onOpenCommunity: () => void;
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
  config, setConfig, isOpen, setIsOpen, user, onUpdateUser, onLogout, onOpenAdmin, onOpenGames, onOpenCommunity, onOpenDM,
  theme, onToggleTheme, appSettings, setAppSettings,
  chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat, onRedeemCode
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [code, setCode] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const provider = chatService.getProvider();

  const submitRename = (id: string) => {
    onRenameChat(id, editTitle);
    setEditingChatId(null);
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 dark:bg-slate-900 bg-white border-r dark:border-slate-800 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col`}>
      <div className="p-6 border-b dark:border-slate-800 flex items-center gap-3">
        <button 
          onClick={() => setIsProfileOpen(true)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg overflow-hidden group relative transition-all hover:scale-105 active:scale-95 ${user.isPremium ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg' : 'bg-slate-700'}`}
        >
          {user.profilePic ? (
            <img src={user.profilePic} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            user.username?.charAt(0).toUpperCase()
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
        </button>
        <div className="flex-1 truncate">
          <div className="font-black text-sm dark:text-white truncate">{user.username}</div>
          <div className={`text-[9px] font-black uppercase tracking-widest ${user.isPremium ? 'text-indigo-400' : 'text-slate-500'}`}>{user.isPremium ? 'Premium citizen' : 'Standard Core'}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
        <div className="space-y-2">
          <button onClick={onNewChat} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/10">New signal stream</button>
          <button onClick={onOpenCommunity} className="w-full py-3 bg-indigo-600/10 text-indigo-500 rounded-xl font-black text-[10px] uppercase tracking-widest border border-indigo-500/20">Community Nexus</button>
          <button onClick={onOpenDM} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest">Global Link (DM)</button>
        </div>

        <div className="space-y-1">
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">Signal Logs</label>
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => onSelectChat(chat.id)} 
              className={`group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${activeChatId === chat.id ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'}`}
            >
              <div className={`w-1 h-4 rounded-full ${activeChatId === chat.id ? 'bg-indigo-500' : 'bg-transparent'}`} />
              {editingChatId === chat.id ? (
                <input 
                  autoFocus className="flex-1 bg-transparent text-[11px] font-bold outline-none dark:text-white"
                  value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={() => submitRename(chat.id)}
                  onKeyDown={e => e.key === 'Enter' && submitRename(chat.id)} onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className={`flex-1 text-[11px] font-bold truncate ${activeChatId === chat.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>{chat.title}</span>
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={(e) => { e.stopPropagation(); setEditingChatId(chat.id); setEditTitle(chat.title); }} className="p-1 text-slate-400 hover:text-indigo-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                 <button onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }} className="p-1 text-slate-400 hover:text-red-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg></button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t dark:border-slate-800 border-slate-100">
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Assistant Calibration</label>
          <div className="space-y-4">
            {provider === 'gemini' && (
              <div className="animate-fade-in">
                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Gemini Core Model</label>
                <select 
                  name="model" 
                  value={config.model} 
                  onChange={(e) => setConfig({ ...config, model: e.target.value })} 
                  className="w-full bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-[10px] font-bold dark:text-white outline-none border border-transparent focus:border-indigo-500"
                >
                  {MODELS.filter(m => !m.id.includes('pro') || user.isPremium).map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase mb-2">Active Persona</label>
              <div className="grid grid-cols-2 gap-1.5">
                {SYSTEM_PERSONAS.map(p => (
                  <button 
                    key={p.name} onClick={() => setConfig({...config, systemInstruction: p.instruction})}
                    className={`p-2 rounded-lg border text-[9px] font-black transition-all ${config.systemInstruction === p.instruction ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <input 
            type="text" placeholder="Neural code..." value={code}
            onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && (onRedeemCode(code), setCode(''))}
            className="w-full bg-slate-50 dark:bg-slate-950 p-3 text-[10px] rounded-xl outline-none border dark:border-slate-800 dark:text-white font-bold placeholder:text-slate-600 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="p-6 space-y-2 border-t dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <button onClick={onOpenGames} className="w-full py-3 bg-indigo-600/10 text-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600/20 transition-all">Neural Game Forge</button>
        {user.isAdmin && <button onClick={onOpenAdmin} className="w-full py-3 bg-red-600/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600/20 transition-all">Admin Matrix</button>}
        <button onClick={onLogout} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-all">Disconnect</button>
      </div>

      {isProfileOpen && (
        <ProfileSettings 
          user={user} 
          onUpdateUser={(updated) => { onUpdateUser(updated); setIsProfileOpen(false); }}
          onClose={() => setIsProfileOpen(false)}
        />
      )}
    </aside>
  );
};
