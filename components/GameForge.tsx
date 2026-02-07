
import { GoogleGenAI } from "@google/genai";
import { GameProject, Message, Role, CommunityPost } from '../types';
import { storage } from '../services/storage';
import React, { useState, useEffect, useRef } from 'react';

interface GameForgeProps {
  onClose: () => void;
  userId: string;
  username?: string;
}

export const GameForge: React.FC<GameForgeProps> = ({ onClose, userId, username }) => {
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [activeProject, setActiveProject] = useState<GameProject | null>(null);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storage.getGameProjects(userId).then(p => {
      setProjects(p);
      if (p.length > 0) setActiveProject(p[0]);
    });
  }, [userId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeProject?.messages]);

  const handleNewProject = () => {
    const newProject: GameProject = {
      id: Date.now().toString(),
      userId,
      username,
      title: 'Neural Studio ' + (projects.length + 1),
      messages: [{ id: '0', userId: 'system', role: Role.MODEL, text: "Forge core initialized. Describe the reality you wish to compile.", timestamp: new Date().toISOString() }],
      latestCode: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProjects([newProject, ...projects]);
    setActiveProject(newProject);
  };

  const handlePublish = async () => {
    if (!activeProject || !activeProject.latestCode) return;
    setIsPublishing(true);
    try {
      // 1. Mark project as published
      const updatedProject = { ...activeProject, isPublished: true, username: username || 'Unit' };
      await storage.saveGameProject(updatedProject);
      
      // 2. Create community post
      const post: CommunityPost = {
        id: Date.now().toString(),
        userId,
        username: username || 'Unit',
        text: `New Forge Deployment: Check out my latest project "${activeProject.title}"!`,
        type: 'game',
        gameId: activeProject.id,
        gameTitle: activeProject.title,
        timestamp: new Date().toISOString()
      };
      await storage.saveCommunityPost(post);
      alert("SIGNAL DEPLOYED: Project is now live in the Community Nexus.");
    } catch (e) {
      alert("PUBLISH ERROR: Matrix link lost.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerate = async () => {
    if (!input.trim() || !activeProject) return;
    
    const userMsg: Message = { id: Date.now().toString(), userId, role: Role.USER, text: input, timestamp: new Date().toISOString() };
    const updatedMessages = [...activeProject.messages, userMsg];
    
    setActiveProject({ ...activeProject, messages: updatedMessages });
    setInput('');
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are the NEURAL GAME FORGE lead developer.
        Current Matrix Code: ${activeProject.latestCode || "EMPTY"}
        Update Request: ${input}
        
        TASK:
        1. CHAT FIRST: Respond like a senior engineer collaborator. Explain how you will solve the request in a cool, technical, but concise way (max 3 sentences).
        2. CODE SECOND: Provide the FULL updated HTML/JS/CSS code.
        
        STRICT FORMAT:
        [CHAT]
        Your conversational response here.
        [END_CHAT]
        [CODE]
        The full code here.
        [END_CODE]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const fullText = response.text || "";
      const chatMatch = fullText.match(/\[CHAT\]([\s\S]*?)\[END_CHAT\]/);
      const codeMatch = fullText.match(/\[CODE\]([\s\S]*?)\[END_CODE\]/);
      
      const explanation = chatMatch ? chatMatch[1].trim() : "Neural matrix updated. Code refactored for optimal performance.";
      const code = codeMatch ? codeMatch[1].replace(/```html|```/gi, "").trim() : activeProject.latestCode;

      const modelMsg: Message = { id: Date.now().toString(), userId: 'system', role: Role.MODEL, text: explanation, timestamp: new Date().toISOString() };
      const finalProject = { ...activeProject, messages: [...updatedMessages, modelMsg], latestCode: code, updatedAt: new Date().toISOString(), username };

      setActiveProject(finalProject);
      storage.saveGameProject(finalProject);
      setProjects(prev => prev.map(p => p.id === finalProject.id ? finalProject : p));
    } catch (e) {
      alert("Forge synchronization lost. Signal corrupted.");
    } finally {
      setIsGenerating(false);
    }
  };

  const projectUrl = activeProject?.latestCode ? URL.createObjectURL(new Blob([activeProject.latestCode], { type: 'text/html' })) : null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-4 lg:p-12 animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-800 w-full max-w-[1400px] h-full rounded-[3.5rem] flex overflow-hidden shadow-2xl">
        {/* Left: Project List */}
        <div className="w-72 border-r-2 border-slate-800 flex flex-col bg-slate-950/40">
          <div className="p-8 border-b-2 border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-black text-white uppercase tracking-tighter">Studios</h2>
            <button onClick={handleNewProject} className="p-2 bg-indigo-600 rounded-xl text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {projects.map(p => (
              <div key={p.id} onClick={() => setActiveProject(p)} className={`p-4 rounded-[1.5rem] cursor-pointer transition-all border-2 ${activeProject?.id === p.id ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-inner' : 'border-transparent text-slate-500 hover:bg-slate-800/50'}`}>
                <div className="text-[11px] font-black truncate uppercase tracking-widest">{p.title}</div>
              </div>
            ))}
          </div>
          <div className="p-8 space-y-3">
            {activeProject && activeProject.latestCode && (
               <button 
                onClick={handlePublish} disabled={isPublishing}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {isPublishing ? 'Deploying...' : 'Deploy to Nexus'}
              </button>
            )}
            <button onClick={onClose} className="w-full py-4 bg-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Disconnect</button>
          </div>
        </div>

        {/* Center: Conversation */}
        <div className="flex-[0.8] flex flex-col bg-slate-950/20 border-r-2 border-slate-800">
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {activeProject?.messages.map(m => (
              <div key={m.id} className={`flex ${m.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-5 rounded-3xl text-xs font-bold leading-relaxed shadow-lg ${m.role === Role.USER ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-8">
            <div className="relative group">
               <input 
                type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="Instruct Forge..." disabled={isGenerating}
                className="w-full bg-slate-950 border-2 border-slate-800 text-white rounded-3xl p-6 text-sm outline-none font-bold focus:border-indigo-500/50 transition-all pr-16"
              />
              <button onClick={handleGenerate} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:text-indigo-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Code Preview */}
        <div className="flex-1 bg-black relative">
          {projectUrl ? (
            <iframe src={projectUrl} key={activeProject?.updatedAt} className="w-full h-full border-none bg-white shadow-2xl" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-30 select-none">
              <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">Forge Core Idle</p>
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest animate-bounce shadow-2xl">Compiling Matrix...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
