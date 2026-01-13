
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User, Chat, GameProject } from '../types';

export const AdminPanel: React.FC<{ onClose: () => void, currentUser: User }> = ({ onClose, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [userGames, setUserGames] = useState<GameProject[]>([]);
  const [selectedContent, setSelectedContent] = useState<Chat | GameProject | null>(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [isSuperUser] = useState(currentUser.username === '@Maintenance');

  useEffect(() => {
    storage.getUsers().then(setUsers);
  }, []);

  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    const [chats, games] = await Promise.all([
      storage.getUserChats(user.id),
      storage.getGameProjects(user.id)
    ]);
    setUserChats(chats);
    setUserGames(games);
    setSelectedContent(null);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    const allUsers = await storage.getUsers();
    await Promise.all(allUsers.map(u => 
      storage.setRemoteOverride(u.id, { broadcast: { text: broadcastText, timestamp: Date.now() } })
    ));
    setBroadcastText('');
    alert("Broadcast sent to all active users.");
  };

  const handleToggleAdmin = async (user: User) => {
    if (!isSuperUser) return;
    const nextAdmin = !user.isAdmin;
    await storage.updateUser(user.id, { isAdmin: nextAdmin });
    setUsers(users.map(u => u.id === user.id ? { ...u, isAdmin: nextAdmin } : u));
    if (selectedUser?.id === user.id) setSelectedUser({...selectedUser, isAdmin: nextAdmin});
  };

  const handleToggleBan = async (user: User) => {
    if (user.username === '@Maintenance') return;
    const nextBanned = !user.isBanned;
    await storage.updateUser(user.id, { isBanned: nextBanned });
    setUsers(users.map(u => u.id === user.id ? { ...u, isBanned: nextBanned } : u));
  };

  const filteredUsers = users.filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[400] bg-white dark:bg-slate-950 flex flex-col animate-fade-in">
      <header className="px-8 py-6 border-b dark:border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black dark:text-white">Admin Management</h2>
          <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Sovereign Control Node</p>
        </div>
        <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* User Sidebar */}
        <div className="w-80 border-r dark:border-slate-800 flex flex-col p-6 space-y-6">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl text-xs font-bold outline-none border dark:border-slate-800"
          />
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {filteredUsers.map(u => (
              <div 
                key={u.id} 
                onClick={() => handleViewUser(u)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border-2 flex items-center gap-3 ${selectedUser?.id === u.id ? 'bg-indigo-500 text-white border-indigo-500 shadow-xl' : 'hover:bg-slate-100 dark:hover:bg-slate-900 border-transparent'}`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300">
                  {u.username?.charAt(0)}
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs font-black truncate">{u.username}</div>
                  <div className={`text-[8px] font-black uppercase ${selectedUser?.id === u.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {u.isAdmin ? 'Admin' : 'User'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Details & Surveillance */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900/20">
          {selectedUser ? (
            <div className="flex-1 flex flex-col overflow-hidden p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter">{selectedUser.username}</h3>
                  <p className="text-xs text-slate-500 font-bold">Member Since {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-4">
                  {isSuperUser && (
                    <button onClick={() => handleToggleAdmin(selectedUser)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedUser.isAdmin ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                      {selectedUser.isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                    </button>
                  )}
                  <button onClick={() => handleToggleBan(selectedUser)} className="px-6 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500">
                    {selectedUser.isBanned ? 'Unban User' : 'Ban User'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 flex-1 overflow-hidden">
                <div className="flex flex-col space-y-4 overflow-hidden">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Surveillance: Chats</h4>
                  <div className="flex-1 overflow-y-auto space-y-2 bg-white dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 custom-scrollbar">
                    {userChats.map(c => (
                      <div key={c.id} onClick={() => setSelectedContent(c)} className={`p-4 rounded-xl cursor-pointer text-xs font-bold border transition-all ${selectedContent?.id === c.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        {c.title}
                      </div>
                    ))}
                    {userChats.length === 0 && <p className="text-center text-slate-500 text-[10px] uppercase font-bold py-10">No chats found</p>}
                  </div>
                </div>

                <div className="flex flex-col space-y-4 overflow-hidden">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Surveillance: Games</h4>
                  <div className="flex-1 overflow-y-auto space-y-2 bg-white dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 custom-scrollbar">
                    {userGames.map(g => (
                      <div key={g.id} onClick={() => setSelectedContent(g)} className={`p-4 rounded-xl cursor-pointer text-xs font-bold border transition-all ${selectedContent?.id === g.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        {g.title}
                      </div>
                    ))}
                    {userGames.length === 0 && <p className="text-center text-slate-500 text-[10px] uppercase font-bold py-10">No games found</p>}
                  </div>
                </div>
              </div>

              {selectedContent && (
                <div className="h-64 bg-white dark:bg-slate-900 rounded-3xl p-6 border dark:border-slate-800 overflow-y-auto custom-scrollbar">
                  <h5 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-4">Content Preview</h5>
                  <div className="space-y-3">
                    {'messages' in selectedContent && selectedContent.messages.map(m => (
                      <div key={m.id} className="text-[11px] font-bold dark:text-slate-300 text-slate-600">
                        <span className="uppercase text-[9px] opacity-50">{m.role}:</span> {m.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl mb-8 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h4 className="text-xl font-black dark:text-white uppercase">Global Control</h4>
              <p className="text-slate-500 text-xs mt-2 max-w-sm">Select a user to monitor signals or execute administrative actions.</p>
              
              <div className="mt-12 w-full max-w-lg space-y-4">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Broadcast</h5>
                <textarea 
                  value={broadcastText}
                  onChange={e => setBroadcastText(e.target.value)}
                  placeholder="Enter message to broadcast to all units..."
                  className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 text-xs font-bold outline-none h-32"
                />
                <button onClick={handleSendBroadcast} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-red-500 transition-all">Send Global Signal</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
