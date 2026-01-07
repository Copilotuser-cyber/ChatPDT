
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/gemini';
import { GoogleGenAI } from "@google/genai";

interface GameForgeProps {
  onClose: () => void;
  userId: string;
}

export const GameForge: React.FC<GameForgeProps> = ({ onClose, userId }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [gameUrl, setGameUrl] = useState<string | null>(null);

  const generateGame = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGameCode(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a simple, fun, and playable game in a single HTML file (including CSS and Javascript) based on this request: "${prompt}". 
        Requirements:
        1. It must be a complete, self-contained HTML file.
        2. Use a modern, dark-themed aesthetic.
        3. Make sure controls are clear (keyboard or mouse).
        4. No external assets unless they are from a reliable CDN.
        5. Return ONLY the code, no markdown blocks like \`\`\`html.`,
      });

      const code = response.text || '';
      setGameCode(code);
      
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setGameUrl(url);
    } catch (err) {
      console.error("Game Generation Error:", err);
      alert("Failed to forge the game. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Game Forge</h2>
            <p className="text-xs text-indigo-400 font-bold">AI ENGINE ALPHA</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Controls */}
          <div className="w-full md:w-80 border-r border-slate-800 p-6 flex flex-col gap-4 bg-slate-900/50">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Desciption</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A neon space shooter where you avoid triangles..."
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
              />
            </div>
            <button 
              onClick={generateGame}
              disabled={isGenerating || !prompt}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Forging...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Build Game
                </>
              )}
            </button>
            <div className="mt-auto">
               <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                  <p className="text-[10px] text-indigo-300 font-medium leading-relaxed">
                    The Forge uses Gemini 3 Pro to write raw code. Complex games might take a few attempts to refine.
                  </p>
               </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 bg-black relative flex items-center justify-center">
            {gameUrl ? (
              <iframe 
                src={gameUrl} 
                className="w-full h-full border-none"
                title="AI Generated Game"
              />
            ) : (
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <p className="text-slate-500 font-medium italic">Describe a game and hit Build to play</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
