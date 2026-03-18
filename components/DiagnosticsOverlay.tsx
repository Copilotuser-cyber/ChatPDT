
import React from 'react';

interface DiagnosticsOverlayProps {
  data: any;
  onClose: () => void;
}

export const DiagnosticsOverlay: React.FC<DiagnosticsOverlayProps> = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-2xl rounded-[2.5rem] border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        <header className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Neural Diagnostics</h2>
            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">System Core Dump</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-800 rounded-xl hover:scale-110 transition-all border border-slate-700 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="p-8 overflow-y-auto custom-scrollbar font-mono text-xs text-indigo-300 space-y-6">
          <div className="space-y-2">
            <div className="text-indigo-500 font-black uppercase text-[10px] tracking-widest">User Identity</div>
            <pre className="bg-black/40 p-4 rounded-xl border border-indigo-500/10 overflow-x-auto">
              {JSON.stringify(data.user, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="text-indigo-500 font-black uppercase text-[10px] tracking-widest">Active Matrix Config</div>
            <pre className="bg-black/40 p-4 rounded-xl border border-indigo-500/10 overflow-x-auto">
              {JSON.stringify(data.config, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="text-indigo-500 font-black uppercase text-[10px] tracking-widest">Visual Calibration</div>
            <pre className="bg-black/40 p-4 rounded-xl border border-indigo-500/10 overflow-x-auto">
              {JSON.stringify(data.appSettings, null, 2)}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-indigo-500 font-black uppercase text-[10px] tracking-widest">Signal ID</div>
              <div className="bg-black/40 p-4 rounded-xl border border-indigo-500/10 font-black text-white">
                {data.activeChatId || 'NULL'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-indigo-500 font-black uppercase text-[10px] tracking-widest">Room ID</div>
              <div className="bg-black/40 p-4 rounded-xl border border-indigo-500/10 font-black text-white">
                {data.activeRoomId || 'NULL'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-indigo-500 font-black uppercase text-[10px] tracking-widest">Theme Protocol</div>
            <div className="bg-black/40 p-4 rounded-xl border border-indigo-500/10 font-black text-white uppercase">
              {data.theme}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-900/50 border-t border-slate-800 text-center">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
