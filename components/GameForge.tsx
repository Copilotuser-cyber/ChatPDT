
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface GameForgeProps {
  onClose: () => void;
  userId: string;
}

export const GameForge: React.FC<GameForgeProps> = ({ onClose, userId }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateGame = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGameUrl(null);

    try {
      // Ensure API key is correctly extracted from environment
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("System configuration missing: API_KEY not found in environment.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Attempt with Gemini 3 Pro first for best quality
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a simple, fun, and playable game in a single HTML file (including CSS and Javascript) based on this request: "${prompt}". 
        Requirements:
        1. It must be a complete, self-contained HTML file.
        2. Use a modern, dark-themed aesthetic.
        3. Make sure controls are clear (keyboard or mouse).
        4. No external assets unless they are from a reliable CDN.
        5. Return ONLY the code, no markdown blocks like \`\`\`html.`,
      }).catch(async (err) => {
        // Fallback to Flash if Pro is restricted or busy
        console.warn("Pro engine failed, trying Flash engine...", err);
        return await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Create a playable HTML5 game based on: "${prompt}". Return ONLY pure HTML/JS code.`,
        });
      });

      const code = response.text || '';
      // Strip any accidental markdown formatting if the model didn't follow instructions perfectly
      const cleanCode = code.replace(/```html|```javascript|```css|```/gi, '').trim();
      
      const blob = new Blob([cleanCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setGameUrl(url);
    } catch (err: any) {
      console.error("Game Generation Error:", err);
      setError(err.message || "The Forge failed to initialize neural link.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Game Forge</h2>
            <p className="text-xs text-indigo-400 font-bold">NEURAL GEN ENGINE</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Controls */}
          <div className="w-full md:w-80 border-r border-slate-800 p-6 flex flex-col gap-4 bg-slate-900/50">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Game Vision</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A retro wave platformer where you jump over neon bars..."
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none transition-all"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[10px] text-red-400 font-medium animate-shake">
                {error}
              </div>
            )}

            <button 
              onClick={generateGame}
              disabled={isGenerating || !prompt}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Forging...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Initiate Build
                </>
              )}
            </button>

            <div className="mt-auto">
               <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                  <p className="text-[10px] text-indigo-300 font-medium leading-relaxed">
                    The Forge streams raw logic from the Gemini neural net. Complex mechanics may require prompt refinement.
                  </p>
               </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 bg-black relative flex items-center justify-center">
            {gameUrl ? (
              <iframe 
                src={gameUrl} 
                className="w-full h-full border-none bg-slate-900"
                title="AI Generated Game"
              />
            ) : (
              <div className="text-center space-y-4 px-8">
                 <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-500 ${isGenerating ? 'bg-indigo-600/20 animate-pulse text-indigo-400' : 'bg-slate-900 text-slate-700'}`}>
                    <svg className={`w-12 h-12 ${isGenerating ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <h3 className="text-slate-400 font-black uppercase tracking-widest text-sm">Preview Matrix</h3>
                 <p className="text-slate-600 text-xs italic max-w-xs mx-auto leading-relaxed">Describe your interactive experience in the vision terminal and hit Build to deploy.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
