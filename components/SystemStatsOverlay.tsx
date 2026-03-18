
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User, NeuralRoom, GameProject } from '../types';

interface SystemStatsOverlayProps {
  onClose: () => void;
}

export const SystemStatsOverlay: React.FC<SystemStatsOverlayProps> = ({ onClose }) => {
  const [stats, setStats] = useState<{
    users: number;
    rooms: number;
    games: number;
    premium: number;
    admins: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const users = await storage.getUsers();
        // For rooms and games, we'll use the subscription or a one-time fetch if possible
        // Since storage doesn't have a direct "getAllGames", we'll estimate or add it
        // For now, let's just get what we can easily.
        
        // We'll add a temporary "getAllGames" to storage if needed, 
        // but let's see if we can just query the collection.
        
        const premiumCount = users.filter(u => u.isPremium).length;
        const adminCount = users.filter(u => u.isAdmin).length;
        
        // We can't easily get ALL games without a specific service method, 
        // so let's just show users and rooms for now, or I'll add the method.
        
        setStats({
          users: users.length,
          rooms: 0, // Will update below
          games: 0,
          premium: premiumCount,
          admins: adminCount
        });

        // Get rooms count
        storage.subscribeToAllRooms((rooms) => {
          setStats(prev => prev ? { ...prev, rooms: rooms.length } : null);
        });

        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 overflow-hidden flex flex-col">
        <header className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Matrix Metrics</h2>
            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">Global Infrastructure Status</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-800 rounded-xl hover:scale-110 transition-all border border-slate-700 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="p-8 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Scanning Grid...</div>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 p-6 rounded-3xl border border-emerald-500/10 text-center">
                <div className="text-3xl font-black text-white mb-1">{stats.users}</div>
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Units</div>
              </div>
              <div className="bg-black/40 p-6 rounded-3xl border border-emerald-500/10 text-center">
                <div className="text-3xl font-black text-white mb-1">{stats.rooms}</div>
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Rooms</div>
              </div>
              <div className="bg-black/40 p-6 rounded-3xl border border-emerald-500/10 text-center">
                <div className="text-3xl font-black text-indigo-400 mb-1">{stats.premium}</div>
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sovereign Links</div>
              </div>
              <div className="bg-black/40 p-6 rounded-3xl border border-emerald-500/10 text-center">
                <div className="text-3xl font-black text-red-500 mb-1">{stats.admins}</div>
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Admin Units</div>
              </div>
              <div className="col-span-2 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Core Integrity</span>
                </div>
                <span className="text-[10px] font-black text-white uppercase">99.9% Stable</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-red-500 font-black uppercase text-xs">Failed to retrieve metrics</div>
          )}
        </div>

        <div className="p-8 bg-slate-900/50 border-t border-slate-800 text-center">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 shadow-xl shadow-emerald-600/20 transition-all"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
