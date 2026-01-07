
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AdminPanel } from './components/AdminPanel';
import { AuthView } from './components/AuthView';
import { LiveVoiceOverlay } from './components/LiveVoiceOverlay';
import { GameForge } from './components/GameForge';
import { Message, Role, ChatConfig, User, Theme, AppSettings } from './types';
import { DEFAULT_CONFIG } from './constants';
import { geminiService } from './services/gemini';
import { storage } from './services/storage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<ChatConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isGameForgeOpen, setIsGameForgeOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_visual_settings');
    return saved ? JSON.parse(saved) : {
      backgroundUrl: '',
      backgroundBlur: 10,
      backgroundOpacity: 20
    };
  });

  useEffect(() => {
    localStorage.setItem('app_visual_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_active_user');
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      setMessages(storage.getUserMessages(user.id));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('gemini_active_user', JSON.stringify(user));
    setMessages(storage.getUserMessages(user.id));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gemini_active_user');
    setMessages([]);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark');
  };

  const initChat = useCallback(async () => {
    if (!currentUser) return;
    try {
      await geminiService.startNewChat(config);
    } catch (error) {
      console.error("Initialization failed:", error);
    }
  }, [config, currentUser]);

  useEffect(() => {
    initChat();
  }, [initChat]);

  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      role: Role.USER,
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    storage.saveMessage(userMessage);
    setIsLoading(true);

    try {
      const modelMessageId = (Date.now() + 1).toString();
      let streamedText = '';

      setMessages(prev => [...prev, {
        id: modelMessageId,
        userId: currentUser.id,
        role: Role.MODEL,
        text: '',
        timestamp: new Date().toISOString()
      }]);

      const stream = geminiService.sendMessageStream(text);
      for await (const chunk of stream) {
        streamedText += chunk;
        setMessages(prev => 
          prev.map(msg => msg.id === modelMessageId ? { ...msg, text: streamedText } : msg)
        );
      }

      storage.saveMessage({
        id: modelMessageId,
        userId: currentUser.id,
        role: Role.MODEL,
        text: streamedText,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("API error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme} relative`}>
      {/* Dynamic Background Layer */}
      {appSettings.backgroundUrl && (
        <div 
          className="absolute inset-0 z-0 transition-all duration-1000"
          style={{
            backgroundImage: `url(${appSettings.backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${appSettings.backgroundBlur}px)`,
            opacity: appSettings.backgroundOpacity / 100
          }}
        />
      )}

      <div className="flex h-full w-full dark:bg-slate-950/80 bg-white/80 backdrop-blur-sm z-10">
        <div className="lg:hidden absolute top-0 left-0 right-0 h-16 dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 border-b flex items-center justify-between px-4 z-40 transition-colors">
          <button onClick={() => setIsSidebarOpen(true)} className="dark:text-slate-400 text-slate-600 p-2 hover:bg-slate-800 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-tighter text-xl">FLASH PRO</span>
          <div className="w-10 h-10 rounded-full dark:bg-slate-800 bg-slate-100 flex items-center justify-center font-bold text-indigo-500 border border-indigo-500/20">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
        </div>

        <Sidebar 
          config={config} 
          setConfig={setConfig} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen}
          onClearChat={() => { storage.clearUserMessages(currentUser.id); setMessages([]); initChat(); }}
          user={currentUser}
          onLogout={handleLogout}
          onOpenAdmin={() => setIsAdminPanelOpen(true)}
          onOpenGames={() => setIsGameForgeOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          appSettings={appSettings}
          setAppSettings={setAppSettings}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full lg:pt-0 pt-16 relative">
          <ChatWindow 
            messages={messages} 
            isLoading={isLoading} 
            onSendMessage={handleSendMessage} 
            onStartVoice={() => setIsLiveMode(true)}
          />
        </main>

        {isLiveMode && <LiveVoiceOverlay onClose={() => setIsLiveMode(false)} systemInstruction={config.systemInstruction} />}
        {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}
        {isGameForgeOpen && <GameForge onClose={() => setIsGameForgeOpen(false)} userId={currentUser.id} />}
      </div>
    </div>
  );
};

export default App;
