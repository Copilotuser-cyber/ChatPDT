import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const SignupSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || 'Unknown Unit';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a] relative overflow-hidden">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl p-10 rounded-[3rem] border border-slate-800 shadow-2xl text-center space-y-8">
          <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Signal Established</h2>
            <p className="text-slate-400 text-sm font-medium">Your neural link has been successfully registered in the Matrix.</p>
          </div>

          <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 text-left space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit ID</span>
              <span className="text-xs font-mono text-indigo-400">{username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase text-xs tracking-[0.2em]"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    </div>
  );
};
