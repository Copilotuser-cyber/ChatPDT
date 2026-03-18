
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { NeuralRoomView } from './components/NeuralRoomView';
import { AdminPanel } from './components/AdminPanel';
import { AuthView } from './components/AuthView';
import { SignupSuccess } from './components/SignupSuccess';
import { LiveVoiceOverlay } from './components/LiveVoiceOverlay';
import { GameForge } from './components/GameForge';
import { DMWindow } from './components/DMWindow';
import { CommunityPage } from './components/CommunityPage';
import { SocialNexus } from './components/SocialNexus';
import { DiagnosticsOverlay } from './components/DiagnosticsOverlay';
import { SystemStatsOverlay } from './components/SystemStatsOverlay';
import { DevHUD } from './components/DevHUD';
import { Message, Role, ChatConfig, User, Theme, AppSettings, Chat, NeuralRoom, GameProject } from './types';
import { DEFAULT_CONFIG } from './constants';
import { chatService } from './services/chatService';
import { storage } from './services/storage';
import { onSnapshot, doc, getFirestore } from 'firebase/firestore';

const MainApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<NeuralRoom[]>([]);
  const [config, setConfig] = useState<ChatConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isGameForgeOpen, setIsGameForgeOpen] = useState(false);
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [remixData, setRemixData] = useState<GameProject | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('app_theme') as Theme) || 'dark');
  const [notification, setNotification] = useState<{ text: string, sender: string } | null>(null);
  const [broadcast, setBroadcast] = useState<string | null>(null);
  const [premiumAlert, setPremiumAlert] = useState<string | null>(null);
  const [isRainbowMode, setIsRainbowMode] = useState(false);
  const [isGlitchMode, setIsGlitchMode] = useState(false);
  const [isNeonMode, setIsNeonMode] = useState(false);
  const [isGodMode, setIsGodMode] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isHUDVisible, setIsHUDVisible] = useState(false);
  const [isTerminalMode, setIsTerminalMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isNightVision, setIsNightVision] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  
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
    if (currentUser) {
      const isTargetAdmin = currentUser.email === 'lkmukhil@gmail.com' || currentUser.username === '@Maintenance';
      const isRevokedAdmin = currentUser.email === 'chimein.1234@gmail.com';

      if (isTargetAdmin && !currentUser.isAdmin) {
        storage.updateUser(currentUser.id, { isAdmin: true });
        setCurrentUser(prev => prev ? { ...prev, isAdmin: true } : null);
      } else if (isRevokedAdmin && currentUser.isAdmin) {
        storage.updateUser(currentUser.id, { isAdmin: false });
        setCurrentUser(prev => prev ? { ...prev, isAdmin: false } : null);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubChats = storage.subscribeToUserChats(currentUser.id, (updatedChats) => {
      setChats(updatedChats);
      if (updatedChats.length > 0 && !activeChatId && !activeRoomId) {
        setActiveChatId(updatedChats[0].id);
      }
    });

    const unsubRooms = storage.subscribeToRooms(setRooms);
    
    const unsubSystemBroadcast = storage.subscribeToSystemBroadcast((data) => {
      if (data && data.timestamp > lastBroadcastRef.current) {
        lastBroadcastRef.current = data.timestamp;
        setBroadcast(data.text);
        setTimeout(() => setBroadcast(null), 10000);
      }
    });

    const unsubOverrides = storage.subscribeToOverrides(currentUser.id, (overrides) => {
      if (overrides.appSettings) setAppSettings(prev => ({ ...prev, ...overrides.appSettings }));
      if (overrides.theme) setTheme(overrides.theme);
      if (overrides.isTerminalMode !== undefined) setIsTerminalMode(overrides.isTerminalMode);
      if (overrides.isNightVision !== undefined) setIsNightVision(overrides.isNightVision);
      if (overrides.isCompactMode !== undefined) setIsCompactMode(overrides.isCompactMode);
      
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

    const unsubUser = onSnapshot(doc(getFirestore(), 'neural_users', currentUser.id), (snap) => {
      if (snap.exists()) {
        const latest = snap.data() as User;
        if (latest.premiumNotification && (!currentUser.premiumNotification || latest.premiumNotification.timestamp > currentUser.premiumNotification.timestamp)) {
          setPremiumAlert(latest.premiumNotification.message);
          setTimeout(() => setPremiumAlert(null), 8000);
        }
        setCurrentUser(prev => prev ? { ...prev, ...latest } : latest);
      }
    });

    return () => {
      unsubChats();
      unsubRooms();
      unsubSystemBroadcast();
      unsubOverrides();
      unsubUser();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      storage.updateUser(currentUser.id, { lastSeen: new Date().toISOString() });
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    let target = 'Main';
    let type = 'Viewing';
    if (activeChatId) {
      target = chats.find(c => c.id === activeChatId)?.title || 'Chat';
      type = 'Chatting';
    } else if (activeRoomId) {
      target = rooms.find(r => r.id === activeRoomId)?.title || 'Room';
      type = 'Collaborating';
    }
    if (isGameForgeOpen) { target = 'Game Forge'; type = 'Forging'; }
    if (isAdminPanelOpen) { target = 'Admin Panel'; type = 'Managing'; }
    if (isCommunityOpen) { target = 'Community'; type = 'Browsing'; }
    if (isSocialOpen) { target = 'Social Nexus'; type = 'Connecting'; }
    
    storage.setRemoteOverride(currentUser.id, {
      currentAction: { type, target, timestamp: Date.now() }
    });
  }, [currentUser?.id, activeChatId, activeRoomId, isGameForgeOpen, isAdminPanelOpen, isCommunityOpen, isSocialOpen, isSidebarOpen, theme]);

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
    setActiveRoomId(null);
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
    setActiveRoomId(null);
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
    const c = (code || '').toUpperCase();
    if (c === 'DONT DO IT') {
      setAppSettings(prev => ({ ...prev, discoMode: !prev.discoMode }));
    } else if ((c === 'PREMIUM_ACCESS' || c === 'NEURAL_ELITE') && currentUser) {
      storage.updateUser(currentUser.id, { isPremium: true });
      setCurrentUser({ ...currentUser, isPremium: true });
      alert("PREMIUM ENCRYPTED LINK ESTABLISHED.");
    } else if (c === 'GHOST_MODE') {
      setAppSettings(prev => ({ ...prev, backgroundOpacity: 10 }));
      alert("STEALTH MODE ACTIVATED.");
    } else if (c === 'RAINBOW_ROAD') {
      setIsRainbowMode(!isRainbowMode);
    } else if (c === 'GLITCH_SYSTEM') {
      setIsGlitchMode(!isGlitchMode);
      if (!isGlitchMode) alert("PROTOCOL BREACH: SYSTEM INSTABILITY DETECTED.");
    } else if (c === 'NEON_DREAM') {
      setIsNeonMode(!isNeonMode);
      setTheme('dark');
    } else if (c === 'SUDO_GOD' || c === 'NEURAL_OVERRIDE') {
      setIsGodMode(!isGodMode);
      if (currentUser && !isGodMode) {
        storage.updateUser(currentUser.id, { isPremium: true });
        setCurrentUser({ ...currentUser, isPremium: true });
      }
      alert(isGodMode ? "GOD MODE DEACTIVATED." : "ASCENSION COMPLETE: GOD MODE ACTIVE.");
    } else if (c === 'VOID_WALKER') {
      setAppSettings(prev => ({ ...prev, backgroundOpacity: 0 }));
      alert("VOID PROTOCOL: VISUALS MINIMIZED.");
    } else if (c === 'ELITE_SIGNAL') {
      setIsGodMode(true);
      if (currentUser) {
        storage.updateUser(currentUser.id, { isPremium: true });
        setCurrentUser({ ...currentUser, isPremium: true });
      }
      alert("ELITE SIGNAL ESTABLISHED: FULL ACCESS GRANTED.");
    } else if (c === 'RESET_SYSTEM') {
      localStorage.clear();
      window.location.reload();
    } else if (c === 'DEBUG_DUMP') {
      setDiagnosticsData({
        user: currentUser,
        config: config,
        appSettings: appSettings,
        activeChatId: activeChatId,
        activeRoomId: activeRoomId,
        theme: theme
      });
      setIsDiagnosticsOpen(true);
    } else if (c === 'ADMIN_ASCEND' && currentUser) {
      storage.updateUser(currentUser.id, { isAdmin: true });
      setCurrentUser({ ...currentUser, isAdmin: true });
      alert("ADMINISTRATIVE OVERRIDE: MATRIX ACCESS GRANTED.");
    } else if (c === 'SYSTEM_STATS') {
      setIsStatsOpen(true);
    } else if (c === 'DEV_HUD') {
      setIsHUDVisible(!isHUDVisible);
      alert(isHUDVisible ? "SYSTEM HUD DEACTIVATED." : "SYSTEM HUD ACTIVATED.");
    } else if (c === 'CLEAR_MY_LOGS' && currentUser) {
      if (confirm("CRITICAL: Wipe all your neural signal logs? This cannot be undone.")) {
        storage.getUserChats(currentUser.id).then(chats => {
          Promise.all(chats.map(c => storage.deleteChat(c.id))).then(() => {
            setChats([]);
            setActiveChatId(null);
            alert("LOG PURGE COMPLETE.");
          });
        });
      }
    } else if (c === 'TERMINAL_MODE') {
      setIsTerminalMode(!isTerminalMode);
      alert(isTerminalMode ? "TERMINAL PROTOCOL DEACTIVATED." : "TERMINAL PROTOCOL ACTIVATED.");
    } else if (c === 'ZEN_MODE') {
      setIsZenMode(!isZenMode);
      if (!isZenMode) setIsSidebarOpen(false);
      alert(isZenMode ? "ZEN MODE DEACTIVATED." : "ZEN MODE ACTIVATED: FOCUS ESTABLISHED.");
    } else if (c === 'NIGHT_VISION') {
      setIsNightVision(!isNightVision);
      alert(isNightVision ? "NIGHT VISION DEACTIVATED." : "NIGHT VISION ACTIVATED.");
    } else if (c === 'GHOST_SIGNAL') {
      setNotification({ text: "SYSTEM TEST: Ghost signal received and decrypted.", sender: "Neural Core" });
    } else if (c === 'EXPORT_LOGS' && activeChatId) {
      const chat = chats.find(c => c.id === activeChatId);
      if (chat) {
        const content = chat.messages.map(m => `[${m.timestamp}] ${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neural_log_${chat.title.replace(/\s+/g, '_').toLowerCase()}.txt`;
        a.click();
        alert("SIGNAL LOG EXPORTED TO LOCAL STORAGE.");
      }
    } else if (c === 'COMPACT_UI') {
      setIsCompactMode(!isCompactMode);
      alert(isCompactMode ? "COMPACT PROTOCOL DEACTIVATED." : "COMPACT PROTOCOL ACTIVATED.");
    } else if (c === 'THEME_CYCLE') {
      const themes: Theme[] = ['dark', 'light'];
      const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
      setTheme(nextTheme);
    } else if (c === 'ANONYMOUS_LINK' && currentUser) {
      setIsAnonymousMode(!isAnonymousMode);
      alert(isAnonymousMode ? "IDENTITY RESTORED." : "IDENTITY MASKED: ANONYMOUS LINK ESTABLISHED.");
    } else if (c === 'SYSTEM_ANNOUNCE') {
      if (!currentUser?.isAdmin) {
        alert("ACCESS DENIED: ADMINISTRATIVE PRIVILEGES REQUIRED.");
        return;
      }
      const msg = prompt("ENTER GLOBAL BROADCAST MESSAGE:");
      if (msg) {
        storage.setSystemBroadcast(msg, currentUser.username);
        alert("BROADCAST SIGNAL SENT TO ALL UNITS.");
      }
    } else if (c === 'USER_SEARCH') {
      if (!currentUser?.isAdmin) {
        alert("ACCESS DENIED: ADMINISTRATIVE PRIVILEGES REQUIRED.");
        return;
      }
      const email = prompt("ENTER USER EMAIL TO SEARCH:");
      if (email) {
        storage.getUsers().then(users => {
          const found = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
          if (found) {
            alert(`USER FOUND:\nID: ${found.id}\nUsername: ${found.username}\nPremium: ${found.isPremium}\nAdmin: ${found.isAdmin}`);
          } else {
            alert("USER NOT FOUND IN MATRIX.");
          }
        });
      }
    } else if (c === 'MATRIX_RELOAD') {
      setIsLoading(true);
      Promise.all([
        storage.getUserChats(currentUser?.id || '').then(setChats),
        storage.getRooms().then(setRooms)
      ]).finally(() => {
        setIsLoading(false);
        alert("MATRIX SYNCHRONIZATION COMPLETE.");
      });
    } else {
      alert("INVALID REDEMPTION SIGNAL.");
    }
  };

  if (!currentUser) return <AuthView onLogin={handleLogin} />;
  const activeChat = chats.find(c => c.id === activeChatId);
  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme} relative ${isRainbowMode ? 'animate-rainbow-bg' : ''} ${isGlitchMode ? 'glitch-mode' : ''} ${isTerminalMode ? 'terminal-mode' : ''} ${isNightVision ? 'night-vision' : ''} ${isCompactMode ? 'compact-mode' : ''} transition-all duration-700`}>
      <style>{`
        @keyframes rainbow {
          0% { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.05); }
          25% { border-color: #10b981; background-color: rgba(16, 185, 129, 0.05); }
          50% { border-color: #3b82f6; background-color: rgba(59, 130, 246, 0.05); }
          75% { border-color: #a855f7; background-color: rgba(168, 85, 247, 0.05); }
          100% { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.05); }
        }
        .animate-rainbow-bg { animation: rainbow 4s infinite linear; border-width: 8px; }
        .terminal-mode { background-color: #000 !important; }
        .terminal-mode * { font-family: 'JetBrains Mono', monospace !important; color: #00ff00 !important; border-color: #004400 !important; }
        .terminal-mode .bg-white, .terminal-mode .bg-slate-50, .terminal-mode .bg-slate-100 { background-color: #050505 !important; }
        .night-vision::after {
          content: "";
          position: fixed;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
          z-index: 9999;
        }
        .night-vision::before {
          content: "";
          position: fixed;
          inset: 0;
          background: rgba(0, 255, 0, 0.1);
          pointer-events: none;
          z-index: 9998;
          box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.5);
        }
        .compact-mode * { padding-top: 0.1rem !important; padding-bottom: 0.1rem !important; }
        .compact-mode .p-8 { padding: 1rem !important; }
        .compact-mode .p-6 { padding: 0.75rem !important; }
        .compact-mode .md\\:p-12 { padding: 1.5rem !important; }
      `}</style>

      {broadcast && (
        <div className="fixed top-0 left-0 right-0 z-[300] bg-indigo-600 text-white py-2 px-6 text-center font-black animate-bounce shadow-2xl uppercase tracking-tighter text-xs border-b border-white/20">
          SYSTEM BROADCAST: {broadcast}
        </div>
      )}

      {premiumAlert && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-indigo-600/20 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl border-4 border-indigo-500 text-center animate-bounce">
            <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/50">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
            </div>
            <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter mb-2">Ascension Complete</h2>
            <p className="text-indigo-500 font-black uppercase tracking-widest text-sm">{premiumAlert}</p>
            <button onClick={() => setPremiumAlert(null)} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Acknowledge</button>
          </div>
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

      <div className={`flex h-full w-full ${isNeonMode ? 'neon-pulse-mode' : 'dark:bg-slate-950 bg-white'} z-10 transition-colors`}>
          {!isZenMode && (
            <Sidebar 
              config={config} setConfig={setConfig} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
              user={isAnonymousMode ? { ...currentUser, username: 'Anonymous', profilePic: '' } : currentUser} 
              onUpdateUser={handleUpdateUser} onLogout={handleLogout} onOpenAdmin={() => setIsAdminPanelOpen(true)}
              onOpenGames={() => setIsGameForgeOpen(true)} onOpenDM={() => setIsDMOpen(true)}
              onOpenCommunity={() => setIsCommunityOpen(true)}
              onOpenSocial={() => setIsSocialOpen(true)}
              theme={theme} onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              appSettings={appSettings} setAppSettings={setAppSettings} chats={chats} activeChatId={activeChatId}
              onSelectChat={setActiveChatId}
              activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId}
              onNewChat={() => handleNewChat()}
              onDeleteChat={storage.deleteChat} onRedeemCode={handleRedeemCode}
              onRenameChat={handleRenameChat}
            />
          )}
        <main className={`flex-1 flex flex-col min-w-0 h-full relative border-l dark:border-slate-800 ${isZenMode ? 'border-none' : ''}`}>
          {!isZenMode && (
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
               <div className="flex items-center gap-4">
                  <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  <div className="flex flex-col">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {activeRoomId ? `Room: ${activeRoom?.title}` : (activeChat?.title || 'Main Chat')}
                    </div>
                    <div className={`text-[10px] font-bold text-indigo-500`}>
                      {activeRoomId ? 'Mode: Global Collaboration' : `Core: GEMINI ${(config.model || '').includes('pro') ? 'PRO' : 'FLASH'}`}
                    </div>
                  </div>
               </div>
               <div className="flex gap-2">
                  {isGodMode && <div className="text-[9px] font-black bg-gradient-to-r from-yellow-400 via-white to-yellow-400 text-slate-900 px-3 py-1 rounded-full uppercase shadow-lg shadow-yellow-500/50 animate-pulse border-2 border-yellow-200">GOD UNIT</div>}
                  {currentUser.isPremium && !isGodMode && <div className="text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full uppercase shadow-lg shadow-orange-500/20">Sovereign Link</div>}
               </div>
            </div>
          )}
          
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {isZenMode && (
              <button 
                onClick={() => setIsZenMode(false)}
                className="absolute top-6 right-6 z-[100] p-3 bg-indigo-600/20 text-indigo-500 rounded-xl hover:bg-indigo-600/40 transition-all border border-indigo-500/20"
                title="Exit Zen Mode"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            {activeRoomId && activeRoom ? (
              <NeuralRoomView 
                room={activeRoom} 
                currentUser={isAnonymousMode ? { ...currentUser, username: 'Anonymous', profilePic: '' } : currentUser} 
                config={config} 
              />
            ) : (
              <ChatWindow 
                messages={activeChat?.messages || []} 
                isLoading={isLoading} 
                onSendMessage={handleSendMessage} 
                onStartVoice={() => setIsLiveMode(true)} 
                isPremium={currentUser.isPremium} 
                isAdmin={currentUser.isAdmin} 
                provider="Gemini"
              />
            )}
          </div>
        </main>
        {isSocialOpen && <SocialNexus currentUser={currentUser} onClose={() => setIsSocialOpen(false)} />}
        {isLiveMode && <LiveVoiceOverlay onClose={() => setIsLiveMode(false)} systemInstruction={config.systemInstruction} />}
        {isAdminPanelOpen && (
          <AdminPanel 
            onClose={() => setIsAdminPanelOpen(false)} 
            currentUser={currentUser} 
            onJoinRoom={(roomId) => {
              setActiveRoomId(roomId);
              setIsAdminPanelOpen(false);
            }}
          />
        )}
        {isGameForgeOpen && currentUser && (
          <GameForge 
            onClose={() => { setIsGameForgeOpen(false); setRemixData(null); }} 
            userId={currentUser.id} 
            username={currentUser.username}
            remixData={remixData}
          />
        )}
        {isDMOpen && currentUser && <DMWindow onClose={() => setIsDMOpen(false)} currentUser={currentUser} />}
        {isCommunityOpen && currentUser && (
          <CommunityPage 
            onClose={() => setIsCommunityOpen(false)} 
            currentUser={currentUser} 
            onRemix={(game) => {
              setRemixData(game);
              setIsGameForgeOpen(true);
            }}
          />
        )}
        {isDiagnosticsOpen && diagnosticsData && (
          <DiagnosticsOverlay 
            data={diagnosticsData} 
            onClose={() => setIsDiagnosticsOpen(false)} 
          />
        )}
        {isStatsOpen && (
          <SystemStatsOverlay 
            onClose={() => setIsStatsOpen(false)} 
          />
        )}
        {isHUDVisible && <DevHUD />}
      </div>
    </div>
  );
};

// Fix: Add default export for App component
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup-success" element={<SignupSuccess />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
