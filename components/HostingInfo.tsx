
import React from 'react';

export const HostingInfo: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Hosting Protocol</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Deployment manual</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-8 text-slate-300">
          <section className="space-y-3">
            <h3 className="text-lg font-black text-indigo-400 uppercase tracking-widest">1. Vercel Matrix (Recommended)</h3>
            <p className="text-sm font-medium leading-relaxed">Vercel is the optimal host for the Neural Terminal. It handles environment injection flawlessly.</p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white">A</div>
                <p className="text-xs">Go to <b>Project Settings > Environment Variables</b>.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white">B</div>
                <p className="text-xs">Add <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-bold">API_KEY</code> with your Gemini key.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white">C</div>
                <p className="text-xs">Add <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-bold">DEEPSEEK_KEYS</code> with multiple keys separated by commas for rotation.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-black text-indigo-400 uppercase tracking-widest">2. Failover Logic</h3>
            <p className="text-sm font-medium leading-relaxed">The system is designed for 100% uptime. If a DeepSeek key hits a 429 limit, it rotates to the next key. If the entire list fails, it switches the terminal to Gemini Flash automatically.</p>
          </section>

          <div className="bg-indigo-600/10 border border-indigo-500/20 p-5 rounded-2xl">
             <h4 className="font-black text-white text-xs uppercase mb-1">Key Acquisition</h4>
             <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
               Acquire Gemini keys at <a href="https://aistudio.google.com/" target="_blank" className="text-indigo-400 font-black hover:underline">Google AI Studio</a>.<br/>
               Acquire DeepSeek keys at <a href="https://platform.deepseek.com/" target="_blank" className="text-indigo-400 font-black hover:underline">DeepSeek Platform</a>.
             </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-[11px]"
        >
          Initialize Deployment
        </button>
      </div>
    </div>
  );
};
