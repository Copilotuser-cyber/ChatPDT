
import React, { useEffect, useRef, useState } from 'react';
import { Modality, LiveServerMessage, Blob } from '@google/genai';
import { geminiService } from '../services/gemini';

interface LiveVoiceOverlayProps {
  onClose: () => void;
  systemInstruction: string;
}

export const LiveVoiceOverlay: React.FC<LiveVoiceOverlayProps> = ({ onClose, systemInstruction }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Helper functions for audio encoding/decoding
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  useEffect(() => {
    const startLiveSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        audioContextInRef.current = new AudioContext({ sampleRate: 16000 });
        audioContextOutRef.current = new AudioContext({ sampleRate: 24000 });

        const sessionPromise = geminiService.connectLive({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setStatus('listening');
              const source = audioContextInRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextInRef.current!.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                setStatus('speaking');
                const ctx = audioContextOutRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => {
                  activeSourcesRef.current.delete(source);
                  if (activeSourcesRef.current.size === 0) setStatus('listening');
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                activeSourcesRef.current.add(source);
              }
              if (message.serverContent?.interrupted) {
                activeSourcesRef.current.forEach(s => s.stop());
                activeSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setStatus('listening');
              }
            },
            onerror: (e) => {
              console.error('Live Error:', e);
              setStatus('error');
              setErrorMsg('Connection failed.');
            },
            onclose: () => onClose()
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setErrorMsg(err.message || 'Microphone access denied.');
      }
    };

    startLiveSession();

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioContextInRef.current?.close();
      audioContextOutRef.current?.close();
      sessionRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-fade-in">
      <div className="relative flex flex-col items-center max-w-md w-full p-8 text-center">
        {/* Animated Rings */}
        <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full bg-indigo-500/10 border border-indigo-500/20 scale-150 ${status === 'listening' ? 'animate-ping' : ''}`}></div>
          <div className={`absolute inset-4 rounded-full bg-indigo-500/20 border border-indigo-500/30 scale-125 ${status === 'speaking' ? 'animate-pulse' : ''}`}></div>
          <div className="relative w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40 z-10">
            {status === 'connecting' ? (
              <svg className="w-12 h-12 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : status === 'error' ? (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            ) : (
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-1.5 rounded-full bg-white transition-all duration-300 ${status === 'speaking' ? 'animate-[bounce_1s_infinite]' : 'h-4'}`} style={{ animationDelay: `${i * 0.1}s`, height: status === 'speaking' ? '2rem' : '1rem' }}></div>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2">
          {status === 'connecting' ? 'Connecting...' : status === 'listening' ? 'Listening' : status === 'speaking' ? 'Gemini Speaking' : 'Error'}
        </h2>
        
        <p className="text-slate-400 text-sm mb-12 font-medium">
          {status === 'listening' ? 'Speak naturally and Gemini will answer.' : 
           status === 'speaking' ? 'Gemini is responding...' :
           status === 'error' ? errorMsg : 'Establishing voice connection...'}
        </p>

        <button 
          onClick={onClose}
          className="group flex items-center justify-center gap-3 px-10 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-600/20 active:scale-95"
        >
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
             <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
          </div>
          END VOICE CHAT
        </button>
      </div>
    </div>
  );
};
