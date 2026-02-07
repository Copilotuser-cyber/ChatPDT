
import React from 'react';
import { AVATAR_PRESETS } from '../constants';
import { User } from '../types';
import { storage } from '../services/storage';

interface ProfileSettingsProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onClose: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdateUser, onClose }) => {
  const handleSelectAvatar = async (url: string) => {
    const updatedUser = { ...user, profilePic: url };
    await storage.updateUser(user.id, { profilePic: url });
    onUpdateUser(updatedUser);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] border dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <header className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Identity Core</h2>
            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">Select your visual signature</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 rounded-xl hover:scale-110 transition-all border dark:border-slate-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="grid grid-cols-4 gap-4">
            {AVATAR_PRESETS.map((url, i) => (
              <button 
                key={i} 
                onClick={() => handleSelectAvatar(url)}
                className={`aspect-square rounded-2xl border-4 transition-all overflow-hidden bg-slate-100 dark:bg-slate-800 hover:scale-105 active:scale-95 ${user.profilePic === url ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'}`}
              >
                <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-800 text-center">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all"
          >
            Confirm Identity
          </button>
        </div>
      </div>
    </div>
  );
};
