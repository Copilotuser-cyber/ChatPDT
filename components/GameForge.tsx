
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Role as GenAIRole } from "@google/genai";
import { GameProject, Message, Role } from '../types';
import { storage } from '../services/storage';

interface GameForgeProps {
  onClose: () => void;
  userId: string;
}

export const GameForge: React.FC<GameForgeProps> = ({ onClose, userId }) => {
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [activeProject, setActiveProject] = useState<GameProject | null>(null);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProjects = async () => {
      const p = await storage.getGameProjects(userId);
      setProjects(p);
      if (p.length > 0) setActiveProject(p[0]);
    };
    loadProjects();
  }, [userId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeProject?.messages]);

  const handleNewProject = () => {
    const newProject: GameProject = {
      id: Date.now().toString(),
      userId,
      title: 'New Neural Game',
      messages: [],
      latestCode: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProjects([newProject, ...projects]);
    setActiveProject(newProject);
  };

  const handleGenerate = async () => {
    if (!input.trim() || !activeProject) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      userId,
      role: Role.USER,
      text: input,
      timestamp: new Date().toISOString()
    };

    const updatedProject = {
      ...activeProject,
      messages: [...activeProject.messages, userMsg],
      updatedAt: new Date().toISOString()
    };

    setActiveProject(updatedProject);
    setInput('');
    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      
      const history = activeProject.messages.map(m => ({
        role: m.role === Role.USER ? 'user' : 'model' as any,
        parts: [{ text: m.text }]
      }));

      const contextPrompt = `
        You are the Neural Game Forge. Your task is to develop a self-contained HTML5 game.
        Current Code State: 
        ${activeProject.latestCode || "No code yet. Start from scratch."}

        Instruction: ${input}

        Return ONLY the full HTML/JS code for the updated game. No markdown blocks.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts: [{ text: contextPrompt }] }],
        config: { temperature: 0.7 }
      });

      const rawCode = response.text || '';
      const cleanCode = rawCode.replace(/```html|```javascript|```css|```/gi, '').trim();

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        userId,
        role: Role.MODEL,
        text: "Neural Logic Optimized. Game Frame Updated.",
        timestamp: new Date().toISOString()
      };

      const finalProject = {
        ...updatedProject,
        messages: [...updatedProject.messages, modelMsg],
        latestCode: cleanCode,
        title: activeProject.messages.length === 0 ? (input.slice(0, 20) + '...') : activeProject.title
      };

      setActiveProject(finalProject);
      storage.saveGameProject(finalProject);
      setProjects(prev => prev.map(p => p.id === finalProject.id ? finalProject : p));

    } catch (err: any) {
      setError(err.message || "Neural Forge connection lost.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await storage.deleteGameProject(id);
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    if (activeProject?.id === id) setActiveProject(updated.length > 0 ? updated[0] : null);
  };

  const projectBlob = activeProject?.latestCode ? new Blob([activeProject.latestCode], { type: 'text/html' }) : null;
  const projectUrl = projectBlob ? URL.createObjectURL(projectBlob) : null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-800 w-full max-w-[95vw] h-[92vh] rounded-[3rem] flex overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.15)]">
        
        {/* Project Sidebar */}
        <div className="w-80 border-r-2 border-slate-800 flex flex-col bg-slate-900/50">
          <div className="p-8 border-b-2 border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest">Studios</h2>
              <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Active Projects</span>
            </div>
            <button onClick={handleNewProject} className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {projects.map(p => (
              <div 
                key={p.id} 
                onClick={() => setActiveProject(p)}
                className={`group p-4 rounded-2xl cursor-pointer transition-all border-2 flex items-center justify-between ${activeProject?.id === p.id ? 'bg-indigo-600/10 border-indigo-500/40 shadow-xl' : 'border-transparent hover:bg-slate-800/50'}`}
              >
                <div className="flex-1 truncate">
                  <div className={`text-xs font-black uppercase tracking-wider truncate ${activeProject?.id === p.id ? 'text-white' : 'text-slate-400'}`}>{p.title}</div>
                  <div className="text-[9px] text-slate-600 font-bold uppercase mt-1">{new Date(p.updatedAt).toLocaleDateString()}</div>
                </div>
                <button onClick={(e) => handleDeleteProject(p.id, e)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-500 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                </button>
              </div>
            ))}
          </div>
          <div className="p-6 border-t-2 border-slate-800">
            <button onClick={onClose} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all">Return to Terminal</button>
          </div>
        </div>

        {/* Development & Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-950/20 border-r-2 border-slate-800">
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {activeProject ? (
              <>
                <div className="bg-indigo-500/5 border-2 border-indigo-500/10 rounded-3xl p-6 text-center">
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-1">Neural Context Link</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">Forge remembers all previous logic. Tell it what to change or add.</p>
                </div>
                {activeProject.messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-2xl border-2 ${m.role === Role.USER ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none shadow-lg' : 'bg-slate-900 text-slate-300 border-slate-800 rounded-tl-none'}`}>
                       <div className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-2">{m.role === Role.USER ? 'Developer' : 'Forge Core'}</div>
                       <p className="text-xs font-bold leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900 border-2 border-indigo-500/30 p-5 rounded-2xl rounded-tl-none flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Synthesizing Logic...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                 <svg className="w-24 h-24 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={0.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86 7.717l.644 2.578a2 2 0 002.424 1.413l2.828-.707a2 2 0 001.414-2.414l-.707-2.828a2 2 0 00-.547-1.022zM12 10V4m0 0a2 2 0 114 0 2 2 0 01-4 0z" /></svg>
                 <p className="font-black text-xl uppercase tracking-[0.5em]">Forge Idle</p>
              </div>
            )}
          </div>
          
          <div className="p-8 bg-slate-900/50">
            <div className="relative group">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="Give your instructions to the Forge..."
                disabled={!activeProject || isGenerating}
                className="w-full bg-slate-950 border-2 border-slate-800 text-white rounded-2xl p-6 pr-20 text-sm outline-none focus:border-indigo-500/40 transition-all font-bold placeholder:text-slate-700"
              />
              <button 
                onClick={handleGenerate}
                disabled={!activeProject || isGenerating || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:bg-slate-800 transition-all shadow-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>
            </div>
            {error && <div className="mt-4 text-[10px] text-red-500 font-black uppercase tracking-widest text-center">{error}</div>}
          </div>
        </div>

        {/* Real-time Preview */}
        <div className="flex-[1.5] bg-black relative">
          {projectUrl ? (
            <iframe 
              src={projectUrl} 
              key={activeProject?.updatedAt}
              className="w-full h-full border-none bg-slate-900"
              title="Forge Preview"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center border-4 border-slate-800">
                <svg className="w-16 h-16 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={0.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
              </div>
              <h3 className="text-slate-600 font-black uppercase tracking-[0.5em] text-sm">Waiting for Logic</h3>
              <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest max-w-xs text-center leading-relaxed">Initialize a project and deliver your first instruction to generate the neural frame.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
