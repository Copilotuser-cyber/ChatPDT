
import React, { useRef, useEffect } from 'react';
import { Message, Role } from '../types';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onStartVoice: () => void;
  isPremium: boolean;
}

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold dark:text-indigo-200 text-indigo-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="dark:bg-slate-950/50 bg-slate-200 px-1.5 py-0.5 rounded dark:text-indigo-300 text-indigo-800 font-mono text-xs">{part.slice(1, -1)}</code>;
        }
        if (part === '\n') return <br key={i} />;
        return part;
      })}
    </>
  );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSendMessage, onStartVoice, isPremium }) => {
  const [inputValue, setInputValue] = React.useState('');
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
    <div className="flex-1 flex flex-col dark:bg-slate-950/10 bg-slate-50/10 relative overflow-hidden transition-colors shadow-inner">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <div className="w-20 h-20 dark:bg-indigo-500/10 bg-indigo-500/5 rounded-3xl flex items-center justify-center text-indigo-500 border dark:border-indigo-500/20 border-indigo-500/10 shadow-lg animate-pulse">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Neural Sync Engaged</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'} animate-fade-in chat-row`}>
            <div className={`max-w-[92%] md:max-w-[80%] rounded-2xl p-5 shadow-xl border chat-bubble ${
              msg.role === Role.USER 
                ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500 shadow-indigo-600/20' 
                : 'dark:bg-slate-900 bg-white dark:text-slate-100 text-slate-800 rounded-tl-none dark:border-slate-800 border-slate-200'
            } ${isPremium ? 'premium-aura' : ''}`}>
              <div className="text-[9px] mb-2 opacity-50 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                {msg.role === Role.USER ? 'Source Node' : 'Neural Core Output'}
                {isPremium && <span className="text-amber-500 text-[8px] border border-amber-500/30 px-1 rounded">PREMIUM UNIT</span>}
              </div>
              <div className="whitespace-pre-wrap text-sm md:text-[15px] leading-relaxed font-bold tracking-tight">
                <FormattedText text={msg.text} />
                {msg.role === Role.MODEL && msg.text === '' && isLoading && (
                  <span className="inline-block w-1.5 h-4 bg-indigo-400 animate-pulse ml-1 align-middle"></span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-8 dark:bg-gradient-to-t from-slate-950 via-slate-950 to-transparent bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <button 
            onClick={onStartVoice}
            className="mb-1 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-90 flex-shrink-0"
            title="Start Voice Hijack"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>
          <form onSubmit={handleSubmit} className="flex-1 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-10 group-focus-within:opacity-40 transition duration-500"></div>
            <div className="relative flex items-end dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                placeholder="Query neural network..."
                className="flex-1 bg-transparent dark:text-slate-100 text-slate-800 p-4 focus:outline-none resize-none max-h-48 custom-scrollbar text-sm md:text-base placeholder:text-slate-500 font-bold"
                rows={1}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="m-2.5 p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-300 text-white rounded-xl transition-all duration-200 flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
