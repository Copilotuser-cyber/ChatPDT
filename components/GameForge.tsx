
import { GoogleGenAI } from "@google/genai";
import { GameProject, Message, Role, CommunityPost } from '../types';
import { storage } from '../services/storage';
import React, { useState, useEffect, useRef } from 'react';

interface GameForgeProps {
  onClose: () => void;
  userId: string;
  username?: string;
  remixData?: GameProject | null;
}

export const GameForge: React.FC<GameForgeProps> = ({ onClose, userId, username, remixData }) => {
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [activeProject, setActiveProject] = useState<GameProject | null>(null);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ isMultiplayer: boolean; reason: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storage.getGameProjects(userId).then(p => {
      setProjects(p);
      if (remixData) {
        const newProject: GameProject = {
          id: Date.now().toString(),
          userId,
          username,
          title: `Remix: ${remixData.title}`,
          messages: [{ id: '0', userId: 'system', role: Role.MODEL, text: `Remixing signal from ${remixData.username}. Matrix core replicated.`, timestamp: new Date().toISOString() }],
          latestCode: remixData.latestCode,
          remixedFrom: remixData.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setProjects(prev => [newProject, ...prev]);
        setActiveProject(newProject);
      } else if (p.length > 0) {
        setActiveProject(p[0]);
      }
    });
  }, [userId, remixData]);

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

    if (!analysisResult) {
      setIsAnalyzing(true);
      try {
        const apiKey = String(process.env.GEMINI_API_KEY || '');
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
          Analyze this code and determine if it is "multiplayer capable" within our Neural Matrix system.
          A game is multiplayer capable if it uses "window.neural.onUpdate" or "window.neural.sendState" to sync data between players.
          
          Code:
          ${activeProject.latestCode}
          
          Respond in JSON format:
          {
            "isMultiplayer": boolean,
            "reason": "Short explanation of why or why not (max 2 sentences)"
          }
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const result = JSON.parse(response.text || "{}");
        setAnalysisResult(result);
        return;
      } catch (e) {
        setAnalysisResult({ isMultiplayer: false, reason: "Analysis failed. Matrix interference detected." });
        return;
      } finally {
        setIsAnalyzing(false);
      }
    }

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
      const apiKey = String(process.env.GEMINI_API_KEY || '');
      const ai = new GoogleGenAI({ apiKey });
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

  const handleDeleteProject = async (projectId: string) => {
    if (confirm("TERMINATE PROJECT: Are you sure you want to delete this studio project?")) {
      await storage.deleteGameProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (activeProject?.id === projectId) setActiveProject(null);
    }
  };

  const handleRenameProject = async (projectId: string) => {
    const title = editTitle.trim();
    if (!title) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updated = { ...project, title, updatedAt: new Date().toISOString() };
    await storage.saveGameProject(updated);
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
    if (activeProject?.id === projectId) setActiveProject(updated);
    setEditingProjectId(null);
  };

  const handleCollaborate = async () => {
    if (!activeProject || !activeProject.latestCode) return;
    const roomId = await storage.createRoom(
      `Collab: ${activeProject.title}`,
      `Collaborative session for ${activeProject.title}`,
      userId,
      'game-collab',
      activeProject.latestCode
    );
    if (roomId) {
      alert("NEURAL LINK ESTABLISHED: Collaborative room created. You can find it in the Signal Logs.");
      onClose();
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
              <div key={p.id} onClick={() => setActiveProject(p)} className={`p-4 rounded-[1.5rem] cursor-pointer transition-all border-2 flex flex-col gap-2 group ${activeProject?.id === p.id ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-inner' : 'border-transparent text-slate-500 hover:bg-slate-800/50'}`}>
                <div className="flex justify-between items-center">
                  {editingProjectId === p.id ? (
                    <input 
                      autoFocus
                      className="bg-slate-900 text-[11px] font-black uppercase tracking-widest outline-none border-b border-indigo-500 w-full"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => handleRenameProject(p.id)}
                      onKeyDown={e => e.key === 'Enter' && handleRenameProject(p.id)}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <div className="text-[11px] font-black truncate uppercase tracking-widest flex-1">{p.title}</div>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button onClick={(e) => { e.stopPropagation(); setEditingProjectId(p.id); setEditTitle(p.title); }} className="p-1 text-slate-500 hover:text-indigo-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className="p-1 text-slate-500 hover:text-red-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                    </button>
                  </div>
                </div>
                <div className="text-[8px] font-bold opacity-40 uppercase tracking-widest">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          <div className="p-8 space-y-3">
            {activeProject && activeProject.latestCode && (
               <>
                <button 
                  onClick={handlePublish} disabled={isPublishing}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isPublishing ? 'Deploying...' : 'Deploy to Nexus'}
                </button>
                <button 
                  onClick={handleCollaborate}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                >
                  Collaborate
                </button>
               </>
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

          {/* Publish Analysis Modal */}
          {analysisResult && (
            <div className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] border dark:border-slate-800 p-8 shadow-2xl">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${analysisResult.isMultiplayer ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {analysisResult.isMultiplayer ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  )}
                </div>
                <h3 className="text-xl font-black dark:text-white uppercase tracking-tight mb-2">Forge Analysis Complete</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${analysisResult.isMultiplayer ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {analysisResult.isMultiplayer ? 'Multiplayer Capable' : 'Single Player Only'}
                  </p>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">{analysisResult.reason}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setAnalysisResult(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Back to Forge</button>
                  <button 
                    onClick={() => {
                      const res = analysisResult;
                      setAnalysisResult(null);
                      handlePublish();
                    }} 
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Confirm Publish
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-sm flex items-center justify-center z-[201]">
              <div className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest animate-pulse shadow-2xl">Analyzing Matrix Capabilities...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
