
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AdminPanel } from './components/AdminPanel';
import { AuthView } from './components/AuthView';
import { LiveVoiceOverlay } from './components/LiveVoiceOverlay';
import { GameForge } from './components/GameForge';
import { DMWindow } from './components/DMWindow';
import { CommunityPage } from './components/CommunityPage';
import { Message, Role, ChatConfig, User, Theme, AppSettings, Chat } from './types';
import { DEFAULT_CONFIG } from './constants';
import { chatService } from './services/chatService';
import { storage } from './services/storage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [config, setConfig] = useState<ChatConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isGameForgeOpen, setIsGameForgeOpen] = useState(false);
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('app_theme') as Theme) || 'dark');
  const [notification, setNotification] = useState<{ text: string, sender: string } | null>(null);
  const [broadcast, setBroadcast] = useState<string | null>(null);
  const [isRainbowMode, setIsRainbowMode] = useState(false);
  
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_visual_settings');
    return saved ? JSON.parse(saved) : {
      backgroundUrl: '',
      backgroundBlur: 10,
      backgroundOpacity: 20,
      discoMode: false
    };
  });

  const lastBroadcastRef = useRef<number>(0);
  const lastGhostRef = useRef<number>(0);

  useEffect(() => {
    if (!currentUser) return;

    const unsubChats = storage.subscribeToUserChats(currentUser.id, (updatedChats) => {
      setChats(updatedChats);
      if (updatedChats.length > 0 && !activeChatId) {
        setActiveChatId(updatedChats[0].id);
      }
    });

    const unsubOverrides = storage.subscribeToOverrides(currentUser.id, (overrides) => {
      if (overrides.appSettings) setAppSettings(prev => ({ ...prev, ...overrides.appSettings }));
      if (overrides.theme) setTheme(overrides.theme);
      
      if (overrides.broadcast && overrides.broadcast.timestamp > lastBroadcastRef.current) {
        lastBroadcastRef.current = overrides.broadcast.timestamp;
        setBroadcast(overrides.broadcast.text);
        setTimeout(() => setBroadcast(null), 10000);
      }

      if (overrides.ghostPayload && overrides.ghostPayload.timestamp > lastGhostRef.current) {
        lastGhostRef.current = overrides.ghostPayload.timestamp;
        setNotification({ text: overrides.ghostPayload.text, sender: overrides.ghostPayload.sender });
      }
    });

    return () => {
      unsubChats();
      unsubOverrides();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_active_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        storage.getUsers().then(users => {
          const latest = users.find(u => u.id === user.id);
          if (!latest || latest.isBanned) handleLogout();
          else setCurrentUser(latest);
        });
      } catch (e) { handleLogout(); }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('gemini_active_user', JSON.stringify(user));
  };

  const handleUpdateUser = (updated: User) => {
    setCurrentUser(updated);
    localStorage.setItem('gemini_active_user', JSON.stringify(updated));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gemini_active_user');
    setChats([]);
    setActiveChatId(null);
  };

  const handleNewChat = (title = 'New Signal Stream') => {
    if (!currentUser) return;
    const newChat: Chat = {
      id: Date.now().toString(),
      userId: currentUser.id,
      title: title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    storage.saveChat(newChat);
    setActiveChatId(newChat.id);
  };

  const handleRenameChat = async (id: string, title: string) => {
    const chat = chats.find(c => c.id === id);
    if (!chat) return;
    const updatedChat = { ...chat, title, updatedAt: new Date().toISOString() };
    await storage.saveChat(updatedChat);
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser || !activeChatId || !text) return;

    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const userMessage: Message = { id: Date.now().toString(), userId: currentUser.id, role: Role.USER, text, timestamp: new Date().toISOString() };
    const updatedMessages = [...activeChat.messages, userMessage];
    
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: updatedMessages } : c));
    setIsLoading(true);

    try {
      const modelMessageId = (Date.now() + 1).toString();
      let streamedText = '';
      const stream = chatService.sendMessageStream(text, activeChat.messages, config);

      for await (const chunk of stream) {
        streamedText += chunk;
        setChats(prev => prev.map(c => c.id === activeChatId ? { 
          ...c, 
          messages: [...updatedMessages, { id: modelMessageId, userId: currentUser.id, role: Role.MODEL, text: streamedText, timestamp: new Date().toISOString() }] 
        } : c));
      }
      
      const finalMessages = [...updatedMessages, { id: modelMessageId, userId: currentUser.id, role: Role.MODEL, text: streamedText, timestamp: new Date().toISOString() }];
      
      let finalTitle = activeChat.title;
      if (activeChat.messages.length === 0) finalTitle = await chatService.generateChatTitle(text);

      storage.saveChat({ ...activeChat, title: finalTitle, messages: finalMessages, updatedAt: new Date().toISOString() });
    } catch (error: any) { 
      alert(`System Transmission Error: ${error.message}`);
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleRedeemCode = (code: string) => {
    const c = code.toUpperCase();
    if (c === 'DONT DO IT') {
      setAppSettings(prev => ({ ...prev, discoMode: !prev.discoMode }));
    } else if (c === 'PREMIUM_ACCESS' && currentUser) {
      storage.updateUser(currentUser.id, { isPremium: true });
      setCurrentUser({ ...currentUser, isPremium: true });
      alert("PREMIUM ENCRYPTED LINK ESTABLISHED.");
    } else if (c === 'GHOST_MODE') {
      setAppSettings(prev => ({ ...prev, backgroundOpacity: 10 }));
      alert("STEALTH MODE ACTIVATED.");
    } else if (c === 'RAINBOW_ROAD') {
      setIsRainbowMode(!isRainbowMode);
    } else if (c === 'RESET_SYSTEM') {
      localStorage.clear();
      window.location.reload();
    } else {
      alert("INVALID REDEMPTION SIGNAL.");
    }
  };

  if (!currentUser) return <AuthView onLogin={handleLogin} />;
  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme} relative ${isRainbowMode ? 'animate-rainbow-bg' : ''} transition-all duration-700`}>
      <style>{`
        @keyframes rainbow {
          0% { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.05); }
          25% { border-color: #10b981; background-color: rgba(16, 185, 129, 0.05); }
          50% { border-color: #3b82f6; background-color: rgba(59, 130, 246, 0.05); }
          75% { border-color: #a855f7; background-color: rgba(168, 85, 247, 0.05); }
          100% { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.05); }
        }
        .animate-rainbow-bg { animation: rainbow 4s infinite linear; border-width: 8px; }
      `}</style>

      {broadcast && (
        <div className="fixed top-0 left-0 right-0 z-[300] bg-indigo-600 text-white py-2 px-6 text-center font-black animate-bounce shadow-2xl uppercase tracking-tighter text-xs border-b border-white/20">
          SYSTEM BROADCAST: {broadcast}
        </div>
      )}

      {notification && (
        <div 
          onClick={() => { setNotification(null); setIsDMOpen(true); }}
          className="fixed top-20 right-6 z-[200] w-72 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border-2 border-indigo-500 cursor-pointer animate-fade-in hover:translate-x-[-10px] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-black text-xs">
              {notification.sender?.charAt(0) || '?'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[10px] font-black text-indigo-500 uppercase">{notification.sender}</div>
              <div className="text-xs font-bold truncate dark:text-white text-slate-800">{notification.text}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-full w-full dark:bg-slate-950 bg-white z-10 transition-colors">
        <Sidebar 
          config={config} setConfig={setConfig} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
          user={currentUser} onUpdateUser={handleUpdateUser} onLogout={handleLogout} onOpenAdmin={() => setIsAdminPanelOpen(true)}
          onOpenGames={() => setIsGameForgeOpen(true)} onOpenDM={() => setIsDMOpen(true)}
          onOpenCommunity={() => setIsCommunityOpen(true)}
          theme={theme} onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          appSettings={appSettings} setAppSettings={setAppSettings} chats={chats} activeChatId={activeChatId}
          onSelectChat={setActiveChatId} onNewChat={() => handleNewChat()}
          onDeleteChat={storage.deleteChat} onRedeemCode={handleRedeemCode}
          onRenameChat={handleRenameChat}
        />
        <main className="flex-1 flex flex-col min-w-0 h-full relative border-l dark:border-slate-800">
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
             <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="flex flex-col">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {activeChat?.title || 'Neural Mainframe'}
                  </div>
                  <div className={`text-[10px] font-bold text-indigo-500`}>
                    Core: GEMINI {config.model.includes('pro') ? 'PRO' : 'FLASH'}
                  </div>
                </div>
             </div>
             {currentUser.isPremium && <div className="text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full uppercase shadow-lg shadow-orange-500/20">Sovereign Link</div>}
          </div>
          <ChatWindow 
            messages={activeChat?.messages || []} 
            isLoading={isLoading} 
            onSendMessage={handleSendMessage} 
            onStartVoice={() => setIsLiveMode(true)} 
            isPremium={currentUser.isPremium} 
            isAdmin={currentUser.isAdmin} 
            provider="Gemini"
          />
        </main>
        {isLiveMode && <LiveVoiceOverlay onClose={() => setIsLiveMode(false)} systemInstruction={config.systemInstruction} />}
        {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} currentUser={currentUser} />}
        {isGameForgeOpen && <GameForge onClose={() => setIsGameForgeOpen(false)} userId={currentUser.id} username={currentUser.username} />}
        {isDMOpen && <DMWindow onClose={() => setIsDMOpen(false)} currentUser={currentUser} />}
        {isCommunityOpen && <CommunityPage onClose={() => setIsCommunityOpen(false)} currentUser={currentUser} />}
      </div>
    </div>
  );
};

export default App;
