
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AdminPanel } from './components/AdminPanel';
import { AuthView } from './components/AuthView';
import { LiveVoiceOverlay } from './components/LiveVoiceOverlay';
import { GameForge } from './components/GameForge';
import { DMWindow } from './components/DMWindow';
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
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('app_theme') as Theme) || 'dark');
  const [notification, setNotification] = useState<{ text: string, sender: string } | null>(null);
  const [broadcast, setBroadcast] = useState<string | null>(null);
  
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_visual_settings');
    return saved ? JSON.parse(saved) : {
      backgroundUrl: '',
      backgroundBlur: 10,
      backgroundOpacity: 20,
      discoMode: false
    };
  });

  const chatsRef = useRef<Chat[]>([]);
  const lastBroadcastRef = useRef<number>(0);
  const lastGhostRef = useRef<number>(0);

  useEffect(() => { chatsRef.current = chats; }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      const chat = chats.find(c => c.id === activeChatId);
      if (chat) {
        geminiService.startNewChat(config, chat.messages).catch(console.error);
      }
    }
  }, [activeChatId, config]);

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
  }, [currentUser, activeChatId]);

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

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gemini_active_user');
    setChats([]);
    setActiveChatId(null);
  };

  const handleNewChat = (title = 'New Chat') => {
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
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
    return newChat.id;
  };

  const handleRedeemCode = (code: string) => {
    if (code === 'dont do it') {
      setAppSettings(prev => ({ ...prev, discoMode: !prev.discoMode }));
    }
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
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  if (!currentUser) return <AuthView onLogin={handleLogin} />;
  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme} relative`}>
      {/* Secret Disco Mode Animation */}
      {appSettings.discoMode && (
        <style>{`
          @keyframes disco {
            0% { background-color: #ff000033; }
            25% { background-color: #00ff0033; }
            50% { background-color: #0000ff33; }
            75% { background-color: #ffff0033; }
            100% { background-color: #ff00ff33; }
          }
          .disco-overlay {
            position: fixed; inset: 0; z-index: 5;
            animation: disco 0.5s infinite alternate;
            pointer-events: none;
          }
        `}</style>
      )}
      {appSettings.discoMode && <div className="disco-overlay" />}

      {/* Global Broadcast Banner */}
      {broadcast && (
        <div className="fixed top-0 left-0 right-0 z-[300] bg-red-600 text-white py-3 px-6 text-center font-black animate-bounce shadow-2xl uppercase tracking-widest text-sm border-b-2 border-white/20">
          GLOBAL BROADCAST: {broadcast}
        </div>
      )}

      {/* DM Notification */}
      {notification && (
        <div 
          onClick={() => { setNotification(null); setIsDMOpen(true); }}
          className="fixed top-20 right-6 z-[200] w-80 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border-2 border-indigo-500 cursor-pointer animate-fade-in hover:scale-105 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
              {notification.sender?.charAt(0) || '?'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-black text-indigo-500 uppercase tracking-widest">{notification.sender}</div>
              <div className="text-sm font-bold truncate dark:text-white text-slate-800">{notification.text}</div>
            </div>
          </div>
        </div>
      )}

      {appSettings.backgroundUrl && (
        <div className="fixed inset-0 z-0 bg-no-repeat bg-cover bg-center" style={{ backgroundImage: `url("${appSettings.backgroundUrl}")`, filter: `blur(${appSettings.backgroundBlur}px) brightness(${theme === 'dark' ? '0.4' : '0.8'})`, opacity: appSettings.backgroundOpacity / 100 }} />
      )}

      <div className="flex h-full w-full dark:bg-slate-950/80 bg-white/80 backdrop-blur-md z-10">
        <Sidebar 
          config={config} setConfig={setConfig} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
          user={currentUser} onLogout={handleLogout} onOpenAdmin={() => setIsAdminPanelOpen(true)}
          onOpenGames={() => setIsGameForgeOpen(true)} onOpenDM={() => setIsDMOpen(true)}
          theme={theme} onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          appSettings={appSettings} setAppSettings={setAppSettings} chats={chats} activeChatId={activeChatId}
          onSelectChat={setActiveChatId} onNewChat={() => handleNewChat()}
          onDeleteChat={storage.deleteChat} onRedeemCode={handleRedeemCode}
          onRenameChat={(id, title) => {
            const chat = chats.find(c => c.id === id);
            if (chat) storage.saveChat({ ...chat, title, updatedAt: new Date().toISOString() });
          }}
        />
        <main className="flex-1 flex flex-col min-w-0 h-full relative">
          <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b dark:border-slate-800 border-slate-200">
             <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 rounded-xl dark:bg-slate-800 bg-slate-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="text-sm font-black uppercase tracking-widest text-slate-500">
                  {activeChat?.title || 'Gemini Flash'}
                </div>
             </div>
             {currentUser.isAdmin && (
               <div className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full uppercase border border-red-500/20">Admin Active</div>
             )}
          </div>
          <ChatWindow messages={activeChat?.messages || []} isLoading={isLoading} onSendMessage={handleSendMessage} onStartVoice={() => setIsLiveMode(true)} isPremium={currentUser.isPremium} isAdmin={currentUser.isAdmin} />
        </main>
        {isLiveMode && <LiveVoiceOverlay onClose={() => setIsLiveMode(false)} systemInstruction={config.systemInstruction} />}
        {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} currentUser={currentUser} />}
        {isGameForgeOpen && <GameForge onClose={() => setIsGameForgeOpen(false)} userId={currentUser.id} />}
        {isDMOpen && <DMWindow onClose={() => setIsDMOpen(false)} currentUser={currentUser} />}
      </div>
    </div>
  );
};

export default App;
