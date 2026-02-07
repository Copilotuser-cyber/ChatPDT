
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User, CommunityPost, GameProject } from '../types';

interface CommunityPageProps {
  onClose: () => void;
  currentUser: User;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ onClose, currentUser }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'games'>('all');
  const [playingGame, setPlayingGame] = useState<GameProject | null>(null);

  useEffect(() => {
    const unsub = storage.subscribeToCommunity(setPosts);
    return unsub;
  }, []);

  const handlePostSignal = async () => {
    if (!inputText.trim()) return;
    const post: CommunityPost = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      text: inputText,
      type: 'signal',
      timestamp: new Date().toISOString(),
      profilePic: currentUser.profilePic
    };
    await storage.saveCommunityPost(post);
    setInputText('');
  };

  const handlePlayGame = async (gameId: string) => {
    const game = await storage.getPublicGame(gameId);
    if (game) setPlayingGame(game);
    else alert("SIGNAL LOST: Game core could not be retrieved.");
  };

  const filteredPosts = activeTab === 'all' ? posts : posts.filter(p => p.type === 'game');

  return (
    <div className="fixed inset-0 z-[450] bg-white dark:bg-slate-950 flex flex-col animate-fade-in lg:inset-10 lg:rounded-[3.5rem] lg:shadow-2xl border dark:border-slate-800 overflow-hidden">
      <header className="px-10 py-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Community Nexus</h2>
            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.4em]">Global signal frequency</p>
          </div>
        </div>
        <button onClick={onClose} className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:scale-110 active:scale-90 transition-all border dark:border-slate-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Feed Column */}
        <div className="flex-1 flex flex-col border-r dark:border-slate-800">
          <div className="p-8 border-b dark:border-slate-800 bg-white dark:bg-slate-900/20">
            <div className="max-w-3xl mx-auto flex gap-4">
              <input 
                type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePostSignal()}
                placeholder="Broadcast a signal to the Nexus..."
                className="flex-1 bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
              />
              <button onClick={handlePostSignal} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all">Broadcast</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex gap-4 mb-8">
                <button onClick={() => setActiveTab('all')} className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-indigo-400'}`}>All Signals</button>
                <button onClick={() => setActiveTab('games')} className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all ${activeTab === 'games' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-indigo-400'}`}>Published Games</button>
              </div>

              {filteredPosts.map(post => (
                <div key={post.id} className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm animate-fade-in relative overflow-hidden group">
                  {post.type === 'game' && <div className="absolute top-0 right-0 px-4 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl">Game Deploy</div>}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 dark:border-slate-700 shadow-sm">
                      {post.profilePic ? (
                        <img src={post.profilePic} alt={post.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-indigo-500">{post.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-black dark:text-white uppercase tracking-wider">{post.username}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{new Date(post.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{post.text}</p>
                      
                      {post.type === 'game' && post.gameId && (
                        <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700 rounded-3xl flex justify-between items-center">
                          <div>
                            <div className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Forge Project</div>
                            <h4 className="text-sm font-black dark:text-white uppercase tracking-tight">{post.gameTitle}</h4>
                          </div>
                          <button onClick={() => handlePlayGame(post.gameId!)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-md">Execute Matrix</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredPosts.length === 0 && <div className="py-20 text-center text-slate-500 font-black uppercase tracking-[0.4em] opacity-30">Frequency Silent...</div>}
            </div>
          </div>
        </div>

        {/* Play Overlay */}
        {playingGame && (
          <div className="absolute inset-0 z-[500] bg-black/95 flex flex-col p-10 animate-fade-in">
             <header className="flex justify-between items-center mb-8">
               <div>
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Executing: {playingGame.title}</h3>
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Dev: {playingGame.username || 'Anonymous Unit'}</p>
               </div>
               <button onClick={() => setPlayingGame(null)} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </header>
             <div className="flex-1 bg-white rounded-[3rem] overflow-hidden shadow-2xl relative">
                <iframe srcDoc={playingGame.latestCode} className="w-full h-full border-none" title="Arcade Preview" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
