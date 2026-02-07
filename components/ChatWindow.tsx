
import React, { useRef, useEffect, useState } from 'react';
import { Message, Role, User } from '../types';
import { storage } from '../services/storage';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onStartVoice: () => void;
  isPremium: boolean;
  isAdmin: boolean;
  provider?: string;
}

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-indigo-400 font-black">{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs">{part.slice(1, -1)}</code>;
        if (part === '\n') return <br key={i} />;
        return part;
      })}
    </>
  );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSendMessage, onStartVoice, isAdmin, provider }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[90%] md:max-w-[75%] rounded-3xl p-6 ${
              msg.role === Role.USER 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-600/10' 
                : 'dark:bg-slate-900 bg-white dark:text-slate-100 text-slate-800 rounded-tl-none border dark:border-slate-800 shadow-sm'
            }`}>
              <div className="text-[8px] mb-3 opacity-40 font-black uppercase tracking-[0.3em]">
                {msg.role === Role.USER ? 'Identity: User' : `Neural Core: ${provider?.toUpperCase()}`}
              </div>
              <div className="text-sm md:text-base font-bold leading-relaxed">
                <FormattedText text={msg.text} />
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-8">
        <div className="max-w-5xl mx-auto flex items-end gap-4">
          <button onClick={onStartVoice} className="p-5 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-500 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="relative flex items-center bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2rem] shadow-2xl px-6 py-1">
              <input
                value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message terminal..."
                className="flex-1 bg-transparent py-5 outline-none font-bold text-sm dark:text-white"
              />
              <button type="submit" disabled={!inputValue.trim() || isLoading} className="p-4 text-indigo-500 disabled:text-slate-700 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
