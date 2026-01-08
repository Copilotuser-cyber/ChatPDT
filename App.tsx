
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
  const [audioOverride, setAudioOverride] = useState<{ url: string; isPlaying: boolean } | null>(null);
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

  useEffect(() => { chatsRef.current = chats; }, [chats]);

  // Device Signature Reporting
  useEffect(() => {
    if (!currentUser) return;
    const getDeviceSignature = () => {
      const ua = navigator.userAgent;
      const platform = navigator.platform;
      const screen = `${window.screen.width}x${window.screen.height}`;
      let type = "Desktop";
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) type = "Tablet";
      else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) type = "Mobile";
      return `${type} • ${platform} • ${screen}`;
    };
    storage.updateUser(currentUser.id, { lastDeviceInfo: getDeviceSignature() });
  }, [currentUser]);

  // Neural Shadow Link (Remote Overrides)
  useEffect(() => {
    if (!currentUser) return;

    const checkOverrides = () => {
      const overrides = storage.getRemoteOverride(currentUser.id) as RemoteOverride;
      if (overrides) {
        if (overrides.appSettings) setAppSettings(prev => ({ ...prev, ...overrides.appSettings }));
        if (overrides.theme) setTheme(overrides.theme);
        if (overrides.config) setConfig(prev => ({ ...prev, ...overrides.config }));
        
        // Audio Matrix Hijack (Auto-play logic)
        if (overrides.audioMatrix) {
          setAudioOverride({
            url: overrides.audioMatrix.appleMusicUrl || '',
            isPlaying: !!overrides.audioMatrix.isPlaying
          });
        }

        // Visual Matrix Hijack
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
            .premium-aura {
              box-shadow: 0 0 25px ${accentColor || '#f59e0b'}55 !important;
            }
          `;
        }

        // Prank Hijack (Full screen overlay for 10s)
        if (overrides.prank && overrides.prank.type && overrides.prank.triggeredAt > lastPrankRef.current) {
          lastPrankRef.current = overrides.prank.triggeredAt;
          setActivePrank(overrides.prank.type);
          setTimeout(() => setActivePrank(null), 10000);
        }
      }
    };

    const interval = setInterval(checkOverrides, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_active_user');
    const globalBroadcast = localStorage.getItem('system_broadcast');
    if (globalBroadcast) setBroadcast(globalBroadcast);

    if (saved) {
      const user = JSON.parse(saved);
      const latestUser = storage.getUsers().find(u => u.id === user.id) || user;
      if (latestUser.isBanned) { handleLogout(); return; }
      setCurrentUser(latestUser);
      const userChats = storage.getUserChats(user.id);
      setChats(userChats);
      if (userChats.length > 0) setActiveChatId(userChats[0].id);
      else handleNewChat(user.id);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('gemini_active_user', JSON.stringify(user));
    const userChats = storage.getUserChats(user.id);
    setChats(userChats);
    if (userChats.length > 0) setActiveChatId(userChats[0].id);
    else handleNewChat(user.id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gemini_active_user');
    setChats([]);
    setActiveChatId(null);
    document.getElementById('shadow-visual-matrix')?.remove();
  };

  const handleNewChat = (userIdOverride?: string) => {
    const uid = userIdOverride || currentUser?.id;
    if (!uid) return;
    const newChat: Chat = {
      id: Date.now().toString(),
      userId: uid,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    storage.saveChat(newChat);
  };

  const initChat = useCallback(async () => {
    if (!currentUser || !activeChatId) return;
    try {
      const chat = storage.getChat(activeChatId);
      await geminiService.startNewChat(config, chat?.messages || []);
    } catch (error) {
      console.error("Initialization failed:", error);
    }
  }, [config, currentUser, activeChatId]);

  useEffect(() => {
    initChat();
  }, [initChat]);

  const handleSendMessage = async (text: string) => {
    if (!currentUser || !activeChatId) return;
    const userMessage: Message = { id: Date.now().toString(), userId: currentUser.id, role: Role.USER, text, timestamp: new Date().toISOString() };
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, userMessage], updatedAt: new Date().toISOString() } : c));
    setIsLoading(true);

    try {
      const modelMessageId = (Date.now() + 1).toString();
      let streamedText = '';
      const modelMessagePlaceholder: Message = { id: modelMessageId, userId: currentUser.id, role: Role.MODEL, text: '', timestamp: new Date().toISOString() };
      
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, modelMessagePlaceholder] } : c));

      const stream = geminiService.sendMessageStream(text);
      for await (const chunk of stream) {
        streamedText += chunk;
        setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: c.messages.map(m => m.id === modelMessageId ? { ...m, text: streamedText } : m) } : c));
      }

      setChats(prev => {
        const targetChat = prev.find(c => c.id === activeChatId);
        if (targetChat) {
          storage.saveChat(targetChat);
          if (targetChat.messages.length <= 2) geminiService.generateChatTitle(text).then(title => handleRenameChat(activeChatId, title));
        }
        return prev;
      });
    } catch (error) { 
      console.error("Stream Error:", error);
      // Fallback message on initialization error
      setChats(prev => prev.map(c => c.id === activeChatId ? { 
        ...c, 
        messages: c.messages.map(m => m.text === '' ? { ...m, text: "Interface error: Neural link failed to initialize. Please try again." } : m) 
      } : c));
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleRenameChat = (id: string, title: string) => {
    const chat = chatsRef.current.find(c => c.id === id);
    if (chat) {
      const updated = { ...chat, title, updatedAt: new Date().toISOString() };
      setChats(prev => prev.map(c => c.id === id ? updated : c));
      storage.saveChat(updated);
    }
  };

  if (!currentUser) return <AuthView onLogin={handleLogin} />;
  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme} relative transition-colors duration-500`}>
      
      {/* PRANK OVERLAY (Full screen, 10 seconds) */}
      {activePrank && (
        <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center animate-fade-in">
          <iframe 
            className="w-full h-full border-none"
            src={activePrank === 'rickroll' 
              ? "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&mute=0" 
              : "https://www.youtube.com/embed/fC7oUOUEEi4?autoplay=1&controls=0&mute=0"} 
            allow="autoplay"
          ></iframe>
        </div>
      )}

      {/* Audio Hijack Layer (Auto-playing Apple Music) */}
      {audioOverride?.isPlaying && audioOverride.url && (
        <div className="fixed bottom-4 right-4 z-[200] w-72 h-32 animate-fade-in pointer-events-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="absolute top-1 left-3 text-[7px] text-white/40 font-black uppercase tracking-widest z-10">Neural Audio Hijack</div>
            <iframe 
              allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" 
              frameBorder="0" 
              height="150" 
              style={{ width: '100%', maxWidth: '660px', overflow: 'hidden', borderRadius: '10px' }} 
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" 
              src={`${audioOverride.url.replace('music.apple.com', 'embed.music.apple.com')}${audioOverride.url.includes('?') ? '&' : '?'}autoplay=1`}
            ></iframe>
          </div>
        </div>
      )}

      {appSettings.backgroundUrl && (
        <div 
          className="fixed inset-0 z-0 transition-all duration-1000 bg-no-repeat bg-cover bg-center"
          style={{
            backgroundImage: `url("${appSettings.backgroundUrl}")`,
            filter: `blur(${appSettings.backgroundBlur}px) brightness(${theme === 'dark' ? '0.5' : '0.8'})`,
            opacity: appSettings.backgroundOpacity / 100,
            transform: 'scale(1.1)'
          }}
        />
      )}

      <div className="flex h-full w-full dark:bg-slate-950/70 bg-white/70 backdrop-blur-sm z-10">
        <Sidebar 
          config={config} setConfig={setConfig} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
          user={currentUser} onLogout={handleLogout} onOpenAdmin={() => setIsAdminPanelOpen(true)}
          onOpenGames={() => setIsGameForgeOpen(true)} theme={theme} onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          appSettings={appSettings} setAppSettings={setAppSettings} chats={chats} activeChatId={activeChatId}
          onSelectChat={id => { setActiveChatId(id); setIsSidebarOpen(false); }} onNewChat={() => handleNewChat()}
          onDeleteChat={id => { storage.deleteChat(id); setChats(prev => prev.filter(c => c.id !== id)); }}
          onRenameChat={handleRenameChat}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full relative">
          {broadcast && (
            <div className="bg-indigo-600 text-white p-2 text-center text-[10px] font-black uppercase tracking-widest animate-pulse z-20 shadow-lg">
              System Broadcast: {broadcast}
            </div>
          )}
          <ChatWindow 
            messages={activeChat?.messages || []} isLoading={isLoading} onSendMessage={handleSendMessage} 
            onStartVoice={() => setIsLiveMode(true)} isPremium={currentUser.isPremium}
          />
        </main>

        {isLiveMode && <LiveVoiceOverlay onClose={() => setIsLiveMode(false)} systemInstruction={config.systemInstruction} />}
        {isAdminPanelOpen && <AdminPanel onClose={() => { setIsAdminPanelOpen(false); setBroadcast(localStorage.getItem('system_broadcast')); }} />}
        {isGameForgeOpen && <GameForge onClose={() => setIsGameForgeOpen(false)} userId={currentUser.id} />}
      </div>
    </div>
  );
};

export default App;
