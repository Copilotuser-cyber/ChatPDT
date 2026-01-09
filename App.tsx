
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AdminPanel } from './components/AdminPanel';
import { AuthView } from './components/AuthView';
import { LiveVoiceOverlay } from './components/LiveVoiceOverlay';
import { GameForge } from './components/GameForge';
import { Message, Role, ChatConfig, User, Theme, AppSettings, Chat, RemoteOverride } from './types';
import { DEFAULT_CONFIG } from './constants';
import { geminiService } from './services/gemini';
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
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('app_theme') as Theme) || 'dark');
  const [broadcast, setBroadcast] = useState<string | null>(null);
  const [activePrank, setActivePrank] = useState<'rickroll' | 'stickbug' | null>(null);
  
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_visual_settings');
    return saved ? JSON.parse(saved) : {
      backgroundUrl: '',
      backgroundBlur: 10,
      backgroundOpacity: 20
    };
  });

  const chatsRef = useRef<Chat[]>([]);
  const lastPrankRef = useRef<number>(0);
  const lastGhostRef = useRef<number>(0);

  useEffect(() => { chatsRef.current = chats; }, [chats]);

  // Real-time Cloud Sync
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
      if (overrides.config) setConfig(prev => ({ ...prev, ...overrides.config }));
      
      if (overrides.visualMatrix) {
        const { accentColor, borderRadius, fontType, filter } = overrides.visualMatrix;
        let styleEl = document.getElementById('shadow-visual-matrix');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'shadow-visual-matrix';
          document.head.appendChild(styleEl);
        }
        
        let fontStack = "'Inter', sans-serif";
        if (fontType === 'mono') fontStack = "'Fira Code', monospace";
        if (fontType === 'serif') fontStack = "serif";
        if (fontType === 'comic') fontStack = "'Comic Sans MS', cursive";
        if (fontType === 'futuristic') fontStack = "'Orbitron', sans-serif";

        styleEl.innerHTML = `
          :root {
            --indigo-600: ${accentColor || '#4f46e5'} !important;
            --indigo-50: ${accentColor}11 !important;
          }
          .chat-bubble, .rounded-xl, .rounded-2xl, button, input, textarea, select {
            border-radius: ${borderRadius || '1rem'} !important;
          }
          body {
            font-family: ${fontStack} !important;
            filter: ${filter || 'none'} !important;
          }
        `;
      }

      if (overrides.prank && overrides.prank.type && overrides.prank.triggeredAt > lastPrankRef.current) {
        lastPrankRef.current = overrides.prank.triggeredAt;
        setActivePrank(overrides.prank.type);
        setTimeout(() => setActivePrank(null), 8000);
      }

      if (overrides.ghostPayload && overrides.ghostPayload.timestamp > lastGhostRef.current) {
        lastGhostRef.current = overrides.ghostPayload.timestamp;
        const ghostText = overrides.ghostPayload.text;
        const currentId = activeChatId;
        if (currentId && ghostText) {
          const ghostMsg: Message = {
            id: Date.now().toString(),
            userId: currentUser.id,
            role: Role.MODEL,
            text: ghostText,
            timestamp: new Date().toISOString()
          };
          const chatToUpdate = chatsRef.current.find(c => c.id === currentId);
          if (chatToUpdate) {
            storage.saveChat({ ...chatToUpdate, messages: [...chatToUpdate.messages, ghostMsg], updatedAt: new Date().toISOString() });
          }
        }
      }
    });

    return () => {
      unsubChats();
      unsubOverrides();
    };
  }, [currentUser, activeChatId]);

  // Persist Auth
  useEffect(() => {
    const saved = localStorage.getItem('gemini_active_user');
    if (saved) {
      const user = JSON.parse(saved);
      storage.getUsers().then(users => {
        const latest = users.find(u => u.id === user.id);
        if (!latest || latest.isBanned) handleLogout();
        else setCurrentUser(latest);
      });
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('gemini_active_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gemini_active_user');
    setChats([]);
    setActiveChatId(null);
    document.getElementById('shadow-visual-matrix')?.remove();
  };

  const handleNewChat = () => {
    if (!currentUser) return;
    const newChat: Chat = {
      id: Date.now().toString(),
      userId: currentUser.id,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    storage.saveChat(newChat);
    setActiveChatId(newChat.id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser || !activeChatId) return;
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const userMessage: Message = { id: Date.now().toString(), userId: currentUser.id, role: Role.USER, text, timestamp: new Date().toISOString() };
    const updatedMessages = [...activeChat.messages, userMessage];
    
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: updatedMessages } : c));
    setIsLoading(true);

    try {
      const modelMessageId = (Date.now() + 1).toString();
      let streamedText = '';
      
      const stream = geminiService.sendMessageStream(text);
      for await (const chunk of stream) {
        streamedText += chunk;
        setChats(prev => prev.map(c => c.id === activeChatId ? { 
          ...c, 
          messages: [...updatedMessages, { id: modelMessageId, userId: currentUser.id, role: Role.MODEL, text: streamedText, timestamp: new Date().toISOString() }] 
        } : c));
      }

      const finalMessages = [...updatedMessages, { id: modelMessageId, userId: currentUser.id, role: Role.MODEL, text: streamedText, timestamp: new Date().toISOString() }];
      storage.saveChat({ ...activeChat, messages: finalMessages, updatedAt: new Date().toISOString() });
      
      if (activeChat.messages.length <= 1) {
        const title = await geminiService.generateChatTitle(text);
        storage.saveChat({ ...activeChat, messages: finalMessages, title, updatedAt: new Date().toISOString() });
      }
    } catch (error) { 
      console.error(error);
    } finally { setIsLoading(false); }
  };

  if (!currentUser) return <AuthView onLogin={handleLogin} />;
  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme} relative transition-colors duration-500`}>
      {/* Prank Overlays - Unsplash Driven */}
      {activePrank && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center animate-fade-in text-center p-12">
          <img 
            src={activePrank === 'rickroll' ? "https://images.unsplash.com/photo-1514525253361-b83f859b25c0?q=80&w=2000" : "https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=2000"} 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            alt="Hijack"
          />
          <div className="relative z-10 space-y-4">
            <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-bounce">
              {activePrank === 'rickroll' ? "NEVER GONNA GIVE YOU UP" : "GET STICKBUGGED LOL"}
            </h2>
            <div className="bg-red-600 text-white px-6 py-3 rounded-full inline-block font-black text-xl uppercase tracking-widest shadow-2xl animate-pulse">
              System Overridden by Admin
            </div>
          </div>
          <div className="absolute bottom-10 text-white/40 text-[10px] font-black uppercase tracking-[0.5em]">
            Neural Network Protocol Compromised
          </div>
        </div>
      )}

      {appSettings.backgroundUrl && (
        <div className="fixed inset-0 z-0 transition-all duration-1000 bg-no-repeat bg-cover bg-center" style={{ backgroundImage: `url("${appSettings.backgroundUrl}")`, filter: `blur(${appSettings.backgroundBlur}px) brightness(${theme === 'dark' ? '0.5' : '0.8'})`, opacity: appSettings.backgroundOpacity / 100, transform: 'scale(1.1)' }} />
      )}

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex h-full w-full dark:bg-slate-950/70 bg-white/70 backdrop-blur-sm z-10">
        <Sidebar 
          config={config} setConfig={setConfig} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
          user={currentUser} onLogout={handleLogout} onOpenAdmin={() => setIsAdminPanelOpen(true)}
          onOpenGames={() => setIsGameForgeOpen(true)} theme={theme} onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          appSettings={appSettings} setAppSettings={setAppSettings} chats={chats} activeChatId={activeChatId}
          onSelectChat={(id) => { setActiveChatId(id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} onNewChat={handleNewChat}
          onDeleteChat={storage.deleteChat}
          onRenameChat={(id, title) => {
            const chat = chats.find(c => c.id === id);
            if (chat) storage.saveChat({ ...chat, title, updatedAt: new Date().toISOString() });
          }}
        />
        <main className="flex-1 flex flex-col min-w-0 h-full relative">
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b dark:border-slate-800 border-slate-200 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl dark:bg-slate-800 bg-slate-100 dark:text-slate-300 text-slate-600 border dark:border-slate-700 border-slate-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div className={`w-1.5 h-1.5 rounded-full ${storage.isCloudEnabled() ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`}></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 truncate">
                    {storage.isCloudEnabled() ? 'Neural Grid Active' : 'Offline Storage'}
                  </span>
                </div>
             </div>
             {broadcast && <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500 animate-pulse truncate max-w-[150px]">{broadcast}</div>}
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-500 text-[10px] font-black border border-indigo-500/20">
                  {activeChat?.messages.length || 0}
                </div>
             </div>
          </div>
          <ChatWindow messages={activeChat?.messages || []} isLoading={isLoading} onSendMessage={handleSendMessage} onStartVoice={() => setIsLiveMode(true)} isPremium={currentUser.isPremium} />
        </main>
        {isLiveMode && <LiveVoiceOverlay onClose={() => setIsLiveMode(false)} systemInstruction={config.systemInstruction} />}
        {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}
        {isGameForgeOpen && <GameForge onClose={() => setIsGameForgeOpen(false)} userId={currentUser.id} />}
      </div>
    </div>
  );
};

export default App;
