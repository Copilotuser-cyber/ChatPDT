
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
  const [syncLatency, setSyncLatency] = useState<number>(0);
  
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

  // Real-time Firebase Sync
  useEffect(() => {
    if (!currentUser) return;

    // Listen for Chats
    const unsubChats = storage.subscribeToUserChats(currentUser.id, (updatedChats) => {
      setChats(updatedChats);
      if (updatedChats.length > 0 && !activeChatId) {
        setActiveChatId(updatedChats[0].id);
      }
    });

    // Listen for Admin Overrides
    const unsubOverrides = storage.subscribeToOverrides(currentUser.id, (overrides) => {
      setSyncLatency(Math.abs(Date.now() - (overrides.timestamp || Date.now())));
      
      if (overrides.appSettings) setAppSettings(prev => ({ ...prev, ...overrides.appSettings }));
      if (overrides.theme) setTheme(overrides.theme);
      if (overrides.config) setConfig(prev => ({ ...prev, ...overrides.config }));
      
      if (overrides.audioMatrix) {
        setAudioOverride({
          url: overrides.audioMatrix.appleMusicUrl || '',
          isPlaying: !!overrides.audioMatrix.isPlaying
        });
      }

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
        setTimeout(() => setActivePrank(null), 10000);
      }

      // Ghost Protocol Hijack
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
          // We don't update local state directly here as the saveChat call will trigger the sub listener
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
      // Verify account status from Firebase
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
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser || !activeChatId) return;
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const userMessage: Message = { id: Date.now().toString(), userId: currentUser.id, role: Role.USER, text, timestamp: new Date().toISOString() };
    const updatedMessages = [...activeChat.messages, userMessage];
    
    // Optimistic Update and Sync
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

      // Final persistence
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
      {/* Prank Overlays */}
      {activePrank && (
        <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center animate-fade-in">
          <iframe className="w-full h-full border-none" src={activePrank === 'rickroll' ? "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&mute=0" : "https://www.youtube.com/embed/fC7oUOUEEi4?autoplay=1&controls=0&mute=0"} allow="autoplay"></iframe>
        </div>
      )}

      {/* Background Layer */}
      {appSettings.backgroundUrl && (
        <div className="fixed inset-0 z-0 transition-all duration-1000 bg-no-repeat bg-cover bg-center" style={{ backgroundImage: `url("${appSettings.backgroundUrl}")`, filter: `blur(${appSettings.backgroundBlur}px) brightness(${theme === 'dark' ? '0.5' : '0.8'})`, opacity: appSettings.backgroundOpacity / 100, transform: 'scale(1.1)' }} />
      )}

      <div className="flex h-full w-full dark:bg-slate-950/70 bg-white/70 backdrop-blur-sm z-10">
        <Sidebar 
          config={config} setConfig={setConfig} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
          user={currentUser} onLogout={handleLogout} onOpenAdmin={() => setIsAdminPanelOpen(true)}
          onOpenGames={() => setIsGameForgeOpen(true)} theme={theme} onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          appSettings={appSettings} setAppSettings={setAppSettings} chats={chats} activeChatId={activeChatId}
          onSelectChat={setActiveChatId} onNewChat={handleNewChat}
          onDeleteChat={storage.deleteChat}
          onRenameChat={(id, title) => {
            const chat = chats.find(c => c.id === id);
            if (chat) storage.saveChat({ ...chat, title, updatedAt: new Date().toISOString() });
          }}
        />
        <main className="flex-1 flex flex-col min-w-0 h-full relative">
          <div className="flex items-center justify-between px-6 py-2 border-b dark:border-slate-800 border-slate-200 bg-white/10 dark:bg-slate-900/10">
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Neural Net Linked</span>
                </div>
                <div className="text-[9px] font-bold text-slate-400 border-l dark:border-slate-800 border-slate-200 pl-3">
                  Sync: {syncLatency}ms
                </div>
             </div>
             {broadcast && <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500 animate-pulse">Broadcast: {broadcast}</div>}
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
