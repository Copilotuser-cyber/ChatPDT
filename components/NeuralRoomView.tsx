
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { storage } from '../services/storage';
import { chatService } from '../services/chatService';
import { Message, Role, User, NeuralRoom, ChatConfig, CommunityPost } from '../types';

interface NeuralRoomViewProps {
  room: NeuralRoom;
  currentUser: User;
  config: ChatConfig;
}

export const NeuralRoomView: React.FC<NeuralRoomViewProps> = ({ 
  room: initialRoom, 
  currentUser, 
  config
}) => {
  const [room, setRoom] = useState<NeuralRoom>(initialRoom);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'forge'>(
    initialRoom.roomType === 'game-collab' ? 'forge' : 'chat'
  );
  const [sharedCode, setSharedCode] = useState(initialRoom.sharedCode || '');
  const [isInviting, setIsInviting] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isAiForging, setIsAiForging] = useState(false);
  const [forgeInput, setForgeInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<{ isMultiplayer: boolean; reason: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(initialRoom.title || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const codeUpdateTimeout = useRef<any>(null);
  const cursorUpdateTimeout = useRef<any>(null);

  const CODE_TEMPLATES = [
    { name: 'Basic Canvas', code: '<html><body style="margin:0;overflow:hidden;background:#000"><canvas id="c"></canvas><script>const c=document.getElementById("c");const ctx=c.getContext("2d");c.width=window.innerWidth;c.height=window.innerHeight;function draw(){ctx.fillStyle="rgba(0,0,0,0.05)";ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle="#0f0";ctx.font="20px monospace";ctx.fillText("NEURAL MATRIX",Math.random()*c.width,Math.random()*c.height);requestAnimationFrame(draw)}draw()</script></body></html>', premium: false },
    { name: 'Particle System', code: '<html><body style="margin:0;overflow:hidden;background:#050505"><canvas id="canvas"></canvas><script>const canvas=document.getElementById("canvas");const ctx=canvas.getContext("2d");canvas.width=window.innerWidth;canvas.height=window.innerHeight;const particles=[];class Particle{constructor(){this.x=Math.random()*canvas.width;this.y=Math.random()*canvas.height;this.vx=Math.random()*2-1;this.vy=Math.random()*2-1;this.size=Math.random()*2+1}update(){this.x+=this.vx;this.y+=this.vy;if(this.x<0||this.x>canvas.width)this.vx*=-1;if(this.y<0||this.y>canvas.height)this.vy*=-1}draw(){ctx.fillStyle="#6366f1";ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill()}}for(let i=0;i<50;i++)particles.push(new Particle());function animate(){ctx.clearRect(0,0,canvas.width,canvas.height);particles.forEach(p=>{p.update();p.draw()});requestAnimationFrame(animate)}animate()</script></body></html>', premium: false },
    { name: 'Cyberpunk UI', code: '<html><body style="margin:0;background:#0a0a0c;color:#00f2ff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh"><div style="border:2px solid #00f2ff;padding:40px;border-radius:20px;box-shadow:0 0 20px #00f2ff33;text-align:center"><h1 style="letter-spacing:10px;margin:0">SYSTEM ONLINE</h1><p style="opacity:0.6;font-size:12px;margin-top:10px">NEURAL LINK ESTABLISHED</p><div style="width:100%;height:4px;background:#1a1a1e;margin-top:20px;border-radius:2px"><div style="width:65%;height:100%;background:#00f2ff;box-shadow:0 0 10px #00f2ff"></div></div></div></body></html>', premium: false },
    { name: '★ 3D Matrix', code: '<html><body style="margin:0;overflow:hidden;background:#000"><canvas id="c"></canvas><script>const c=document.getElementById("c");const ctx=c.getContext("2d");c.width=window.innerWidth;c.height=window.innerHeight;const chars="01";const fontSize=16;const columns=c.width/fontSize;const drops=[];for(let x=0;x<columns;x++)drops[x]=1;function draw(){ctx.fillStyle="rgba(0,0,0,0.05)";ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle="#0F0";ctx.font=fontSize+"px monospace";for(let i=0;i<drops.length;i++){const text=chars.charAt(Math.floor(Math.random()*chars.length));ctx.fillText(text,i*fontSize,drops[i]*fontSize);if(drops[i]*fontSize>c.height&&Math.random()>0.975)drops[i]=0;drops[i]++}}setInterval(draw,33)</script></body></html>', premium: true },
    { name: '★ Neural Web', code: '<html><body style="margin:0;overflow:hidden;background:#000"><canvas id="c"></canvas><script>const c=document.getElementById("c");const ctx=c.getContext("2d");c.width=window.innerWidth;c.height=window.innerHeight;const dots=[];for(let i=0;i<100;i++)dots.push({x:Math.random()*c.width,y:Math.random()*c.height,vx:Math.random()*2-1,vy:Math.random()*2-1});function draw(){ctx.clearRect(0,0,c.width,c.height);ctx.strokeStyle="rgba(99,102,241,0.2)";ctx.fillStyle="#6366f1";dots.forEach((d,i)=>{d.x+=d.vx;d.y+=d.vy;if(d.x<0||d.x>c.width)d.vx*=-1;if(d.y<0||d.y>c.height)d.vy*=-1;ctx.beginPath();ctx.arc(d.x,d.y,2,0,Math.PI*2);ctx.fill();for(let j=i+1;j<dots.length;j++){const d2=dots[j];const dist=Math.sqrt((d.x-d2.x)**2+(d.y-d2.y)**2);if(dist<100){ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d2.x,d2.y);ctx.stroke()}}});requestAnimationFrame(draw)}draw()</script></body></html>', premium: true },
    { name: '★ Multiplayer Sync', code: '<html><head></head><body style="margin:0;background:#050505;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh"><h1>Multiplayer Matrix</h1><p id="status">Syncing...</p><div id="players" style="display:flex;gap:10px;flex-wrap:wrap"></div><script>const status=document.getElementById("status");const playersDiv=document.getElementById("players");function updateUI(state){playersDiv.innerHTML="";Object.entries(state).forEach(([id,p])=>{const el=document.createElement("div");el.style.padding="10px";el.style.background=p.color||"#6366f1";el.style.borderRadius="10px";el.innerText=p.username;playersDiv.appendChild(el)});status.innerText="Active Units: "+Object.keys(state).length}window.neural.onUpdate((state)=>{updateUI(state)});document.body.onclick=(e)=>{const x=(e.clientX/window.innerWidth)*100;const y=(e.clientY/window.innerHeight)*100;window.neural.sendState({x,y})};updateUI(window.neural.state)</script></body></html>', premium: true },
    { name: '★ 3D Tunnel', code: '<html><body style="margin:0;overflow:hidden;background:#000"><canvas id="c"></canvas><script>const c=document.getElementById("c");const ctx=c.getContext("2d");c.width=window.innerWidth;c.height=window.innerHeight;let t=0;function draw(){ctx.fillStyle="rgba(0,0,0,0.1)";ctx.fillRect(0,0,c.width,c.height);const cx=c.width/2;const cy=c.height/2;for(let i=0;i<50;i++){const r=(i*10+t)%500;ctx.strokeStyle=`hsl(${i*10+t},100%,50%)`;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke()}t+=2;requestAnimationFrame(draw)}draw()</script></body></html>', premium: true },
    { name: '★ Glitch Text', code: '<html><body style="margin:0;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace;overflow:hidden"><h1 id="t" style="font-size:5vw;letter-spacing:10px">NEURAL_LINK</h1><script>const t=document.getElementById("t");const s="NEURAL_LINK";const c="!@#$%^&*()_+";setInterval(()=>{let r="";for(let i=0;i<s.length;i++)r+=Math.random()>0.9?c[Math.floor(Math.random()*c.length)]:s[i];t.innerText=r;t.style.transform=`translate(${Math.random()*4-2}px,${Math.random()*4-2}px)`;t.style.textShadow=`${Math.random()*5}px 0 #f0f, -${Math.random()*5}px 0 #0ff`},50)</script></body></html>', premium: true },
    { name: '★ Matrix Rain', code: '<html><body style="margin:0;overflow:hidden;background:#000"><canvas id="c"></canvas><script>const c=document.getElementById("c");const ctx=c.getContext("2d");c.width=window.innerWidth;c.height=window.innerHeight;const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";const fontSize=14;const columns=c.width/fontSize;const drops=[];for(let x=0;x<columns;x++)drops[x]=1;function draw(){ctx.fillStyle="rgba(0,0,0,0.05)";ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle="#0F0";ctx.font=fontSize+"px monospace";for(let i=0;i<drops.length;i++){const text=chars.charAt(Math.floor(Math.random()*chars.length));ctx.fillText(text,i*fontSize,drops[i]*fontSize);if(drops[i]*fontSize>c.height&&Math.random()>0.975)drops[i]=0;drops[i]++}}setInterval(draw,33)</script></body></html>', premium: true },
    { name: '★ Neon Wave', code: '<html><body style="margin:0;overflow:hidden;background:#050505"><canvas id="c"></canvas><script>const c=document.getElementById("c");const ctx=c.getContext("2d");c.width=window.innerWidth;c.height=window.innerHeight;let t=0;function draw(){ctx.fillStyle="rgba(5,5,5,0.1)";ctx.fillRect(0,0,c.width,c.height);ctx.beginPath();ctx.strokeStyle="#6366f1";ctx.lineWidth=2;for(let x=0;x<c.width;x++){const y=c.height/2+Math.sin(x*0.01+t)*100+Math.sin(x*0.02+t*1.5)*50;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();t+=0.05;requestAnimationFrame(draw)}draw()</script></body></html>', premium: true },
    { name: '★ Cyber Clock', code: '<html><body style="margin:0;background:#000;color:#0ff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:monospace;text-shadow:0 0 10px #0ff"><div id="time" style="font-size:8vw;font-weight:bold">00:00:00</div><div id="date" style="font-size:2vw;opacity:0.5;margin-top:20px">SYSTEM_DATE</div><script>function update(){const now=new Date();document.getElementById("time").innerText=now.toTimeString().split(" ")[0];document.getElementById("date").innerText=now.toDateString().toUpperCase()}setInterval(update,1000);update()</script></body></html>', premium: true },
    { name: '★ Neural Particles', code: '<html><body style="margin:0;overflow:hidden;background:#000"><canvas id="c"></canvas><script>const c=document.getElementById("c");const ctx=c.getContext("2d");c.width=window.innerWidth;c.height=window.innerHeight;const p=[];for(let i=0;i<200;i++)p.push({x:Math.random()*c.width,y:Math.random()*c.height,s:Math.random()*2+1,o:Math.random(),v:Math.random()*0.02+0.01});function draw(){ctx.fillStyle="rgba(0,0,0,0.1)";ctx.fillRect(0,0,c.width,c.height);p.forEach(i=>{i.o+=i.v;ctx.fillStyle=`rgba(99,102,241,${Math.abs(Math.sin(i.o))})`;ctx.beginPath();ctx.arc(i.x,i.y,i.s,0,Math.PI*2);ctx.fill()});requestAnimationFrame(draw)}draw()</script></body></html>', premium: true }
  ];

  useEffect(() => {
    setRoom(initialRoom);
    setSharedCode(initialRoom.sharedCode || '');
  }, [initialRoom]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMember && !currentUser.isAdmin) return;
    if (cursorUpdateTimeout.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    cursorUpdateTimeout.current = setTimeout(() => {
      storage.updateCursor(room.id, currentUser.id, {
        x, y,
        username: currentUser.username,
        color: currentUser.isPremium ? '#6366f1' : '#94a3b8',
        isPremium: currentUser.isPremium
      });
      cursorUpdateTimeout.current = null;
    }, 100);
  };

  useEffect(() => {
    const unsubRoom = storage.subscribeToRoom(initialRoom.id, (updatedRoom) => {
      if (updatedRoom) {
        setRoom(updatedRoom);
        // Only update sharedCode if it's different and we're not currently typing (simple debounce/sync)
        if (updatedRoom.sharedCode !== sharedCode && !codeUpdateTimeout.current) {
          setSharedCode(updatedRoom.sharedCode || '');
        }
      }
    });
    const unsubMessages = storage.subscribeToRoomMessages(initialRoom.id, setMessages);
    
    storage.getUsers().then(setAllUsers);

    // Update Live Status for Admins
    storage.setRemoteOverride(currentUser.id, {
      currentAction: {
        type: room.roomType === 'game-collab' ? 'FORGING' : 'CHATTING',
        target: room.title,
        timestamp: Date.now(),
        currentRoomId: room.id
      }
    });

    return () => {
      unsubRoom();
      unsubMessages();
      
      // Clear status on exit
      storage.setRemoteOverride(currentUser.id, {
        currentAction: {
          type: 'IDLE',
          target: 'NONE',
          timestamp: Date.now(),
          currentRoomId: null
        }
      });
    };
  }, [initialRoom.id]);

  useEffect(() => {
    // Update action when switching views
    storage.setRemoteOverride(currentUser.id, {
      currentAction: {
        type: activeView === 'forge' ? 'FORGING' : 'CHATTING',
        target: room.title,
        timestamp: Date.now(),
        currentRoomId: room.id
      }
    });
  }, [activeView]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      profilePic: currentUser.profilePic,
      role: Role.USER,
      text: text,
      timestamp: new Date().toISOString()
    };

    setInputValue('');
    await storage.sendRoomMessage(room.id, userMessage);

    // AI Assistant Logic: Trigger AI if mentioned or every few messages
    const lowerText = (text || '').toLowerCase();
    if (lowerText.includes('@assistant') || lowerText.includes('@ai') || messages.length % 5 === 0) {
      triggerAssistant(text);
    }
  };

  const triggerAssistant = async (userText: string) => {
    setIsAiProcessing(true);
    try {
      const aiResponse = await chatService.generateResponse(
        [...messages, { role: Role.USER, text: userText } as Message],
        config,
        `You are participating in a collaborative room called "${room.title}". This is a ${room.roomType} room.`
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        userId: 'assistant',
        username: 'Neural Assistant',
        role: Role.MODEL,
        text: aiResponse,
        timestamp: new Date().toISOString()
      };

      await storage.sendRoomMessage(room.id, aiMessage);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setSharedCode(newCode);
    if (codeUpdateTimeout.current) clearTimeout(codeUpdateTimeout.current);
    codeUpdateTimeout.current = setTimeout(async () => {
      await storage.updateRoom(room.id, { sharedCode: newCode });
      codeUpdateTimeout.current = null;
    }, 1000);
  };

  const handleInvite = async (userId: string) => {
    await storage.addRoomMember(room.id, userId);
    // Notify user or just close
  };

  const handleForgeGenerate = async () => {
    if (!forgeInput.trim() || !canEdit) return;
    setIsAiForging(true);
    const instruction = forgeInput.trim();
    setForgeInput('');

    try {
      const apiKey = String(process.env.GEMINI_API_KEY || '');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are the NEURAL COLLAB FORGE lead developer.
        Current Matrix Code: ${sharedCode || "EMPTY"}
        Update Request: ${instruction}
        
        TASK:
        1. CHAT FIRST: Respond like a senior engineer collaborator. Explain how you will solve the request in a cool, technical, but concise way (max 3 sentences).
        2. CODE SECOND: Provide the FULL updated HTML/JS/CSS code.
        
        STRICT FORMAT:
        [CHAT]
        Your conversational response here.
        [END_CHAT]
        [CODE]
        The full code here.
        [END_CODE]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const fullText = response.text || "";
      const chatMatch = fullText.match(/\[CHAT\]([\s\S]*?)\[END_CHAT\]/);
      const codeMatch = fullText.match(/\[CODE\]([\s\S]*?)\[END_CODE\]/);
      
      const explanation = chatMatch ? chatMatch[1].trim() : "Neural matrix updated. Code refactored for optimal performance.";
      const newCode = codeMatch ? codeMatch[1].replace(/```html|```/gi, "").trim() : sharedCode;

      // Send explanation to chat
      const aiMessage: Message = {
        id: Date.now().toString(),
        userId: 'assistant',
        username: 'Forge AI',
        role: Role.MODEL,
        text: `[FORGE UPDATE] ${explanation}`,
        timestamp: new Date().toISOString()
      };
      await storage.sendRoomMessage(room.id, aiMessage);

      // Update shared code
      handleCodeChange(newCode);
    } catch (e) {
      alert("Forge synchronization lost. Signal corrupted.");
    } finally {
      setIsAiForging(false);
    }
  };

  const analyzeMultiplayer = async () => {
    if (!sharedCode.trim()) return;
    setIsAnalyzing(true);
    try {
      const apiKey = String(process.env.GEMINI_API_KEY || '');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        Analyze this code and determine if it is "multiplayer capable" within our Neural Matrix system.
        A game is multiplayer capable if it uses "window.neural.onUpdate" or "window.neural.sendState" to sync data between players.
        
        Code:
        ${sharedCode}
        
        Respond in JSON format:
        {
          "isMultiplayer": boolean,
          "reason": "Short explanation of why or why not (max 2 sentences)"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const result = JSON.parse(response.text || "{}");
      setAnalysisResult(result);
    } catch (e) {
      setAnalysisResult({ isMultiplayer: false, reason: "Analysis failed. Matrix interference detected." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePublishMultiplayer = async () => {
    if (!sharedCode.trim()) return;
    
    if (!analysisResult) {
      await analyzeMultiplayer();
      return;
    }

    const post: CommunityPost = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      text: `LIVE MULTIPLAYER: ${room.title} is now active in the Nexus!`,
      type: 'game',
      gameId: room.id,
      gameTitle: room.title,
      timestamp: new Date().toISOString(),
      profilePic: currentUser.profilePic
    };
    await storage.saveCommunityPost(post);
    await storage.updateRoom(room.id, { isMultiplayer: true });
    alert("SIGNAL BROADCAST: Multiplayer matrix deployed to Community Nexus.");
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteRoom = async () => {
    await storage.deleteRoom(room.id);
    setShowDeleteConfirm(false);
  };

  const handleRenameRoom = async () => {
    const title = newTitle.trim();
    if (!title) return;
    await storage.updateRoom(room.id, { title });
    setIsRenaming(false);
  };

  const filteredUsers = allUsers.filter(u => 
    u.id !== currentUser.id && 
    !(room.members || []).includes(u.id) &&
    ((u.username || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  const isMember = (room.members || []).includes(currentUser.id);
  const isAdmin = currentUser.isAdmin;
  const isCreator = room.createdBy === currentUser.id;
  const canEdit = isMember || isAdmin;
  const canView = isMember || room.isMultiplayer || isAdmin;
  const canPublish = isCreator || isAdmin;

  if (!canView) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-10 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-2">Neural Link Denied</h3>
        <p className="text-slate-500 text-sm max-w-xs">You are not authorized to access this collaborative frequency. Request an invite from the room creator.</p>
      </div>
    );
  }

  const getInjectedCode = () => {
    const multiplayerScript = `
      <script>
        // Neural Multiplayer API
        window.neural = {
          roomId: "${room.id}",
          userId: "${currentUser.id}",
          username: "${currentUser.username}",
          state: ${JSON.stringify(room.cursors || {})},
          sendState: (data) => {
            window.parent.postMessage({ type: 'NEURAL_STATE_UPDATE', data }, '*');
          },
          onUpdate: (callback) => {
            window.addEventListener('message', (e) => {
              if (e.data.type === 'NEURAL_REMOTE_STATE') {
                callback(e.data.state);
              }
            });
          }
        };
      </script>
    `;
    return sharedCode.replace('</head>', `${multiplayerScript}</head>`).includes('</head>') 
      ? sharedCode.replace('</head>', `${multiplayerScript}</head>`)
      : `${multiplayerScript}${sharedCode}`;
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'NEURAL_STATE_UPDATE') {
        storage.updateCursor(room.id, currentUser.id, {
          ...e.data.data,
          username: currentUser.username,
          color: currentUser.isPremium ? '#6366f1' : '#94a3b8'
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [room.id, currentUser]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="px-8 py-5 border-b dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input 
                  autoFocus
                  className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-sm font-black uppercase tracking-tight dark:text-white outline-none border-2 border-indigo-500"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onBlur={handleRenameRoom}
                  onKeyDown={e => e.key === 'Enter' && handleRenameRoom()}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black dark:text-white uppercase tracking-tight leading-none">{room.title}</h2>
                {isCreator && (
                  <button onClick={() => setIsRenaming(true)} className="p-1 text-slate-400 hover:text-indigo-500 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{room.roomType === 'game-collab' ? 'Forge Matrix' : 'Neural Chat'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{(room.members || []).length} Linked Units</span>
              {room.isMultiplayer && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Live Multiplayer</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {room.roomType === 'game-collab' && (
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mr-2">
              <button 
                onClick={() => setActiveView('chat')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'chat' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Comms
              </button>
              <button 
                onClick={() => setActiveView('forge')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'forge' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Forge
              </button>
            </div>
          )}
          {isMember && (
            <button onClick={() => setIsInviting(true)} className="p-2 bg-indigo-600/10 text-indigo-500 rounded-xl hover:bg-indigo-600/20 transition-all" title="Invite Collaborators">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            </button>
          )}
          {isCreator && (
            <button onClick={() => setShowDeleteConfirm(true)} className="p-2 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600/20 transition-all" title="Delete Room">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
          <div className="flex -space-x-2 overflow-hidden">
            {(room.members || []).slice(0, 3).map((mId, i) => (
              <div key={mId} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                {String(mId || '?').charAt(0).toUpperCase()}
              </div>
            ))}
            {(room.members || []).length > 3 && (
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                +{(room.members || []).length - 3}
              </div>
            )}
          </div>
          <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live
          </span>
        </div>
      </header>

      {/* Content Area */}
      <div 
        className="flex-1 overflow-hidden flex flex-col relative"
        onMouseMove={handleMouseMove}
      >
        {/* Live Cursors */}
        {Object.entries(room.cursors || {}).map(([uid, cursor]) => {
          if (uid === currentUser.id) return null;
          return (
            <div 
              key={uid}
              className="absolute z-[100] pointer-events-none transition-all duration-100 ease-out"
              style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={cursor.color}>
                <path d="M5.653 3.123l15.173 7.587a1 1 0 01.051 1.767l-5.11 2.555 2.555 5.11a1 1 0 01-1.767.051l-7.587-15.173a1 1 0 011.173-1.173z" />
              </svg>
              <div 
                className="ml-3 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest whitespace-nowrap flex items-center gap-1"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.isPremium && <span className="text-amber-300">★</span>}
                {cursor.username}
              </div>
            </div>
          );
        })}

        {activeView === 'chat' ? (
          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 space-y-8 custom-scrollbar flex flex-col">
            <div className="mt-auto" />
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">No messages yet. Start the conversation!</p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isMe = msg.userId === currentUser.id;
              const isAi = msg.role === Role.MODEL;
              const showAvatar = idx === 0 || messages[idx - 1].userId !== msg.userId;

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
                  <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 mt-1 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                      {msg.profilePic ? (
                        <img src={msg.profilePic} className="w-full h-full rounded-xl object-cover shadow-sm" alt={msg.username} />
                      ) : (
                        <div className={`w-full h-full rounded-xl flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${isAi ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                          {isAi ? 'AI' : (msg.username?.charAt(0).toUpperCase() || 'U')}
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showAvatar && (
                        <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                          {isMe ? 'You' : (msg.username || 'Anonymous')}
                        </span>
                      )}
                      <div className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : isAi 
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 border border-indigo-100 dark:border-indigo-800/50 rounded-tl-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {isAiProcessing && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col border-r dark:border-slate-800">
                <div className="p-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shared Matrix Code</span>
                    <div className="relative">
                      <button 
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[8px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
                      >
                        Templates
                      </button>
                      {showTemplates && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-2xl z-50 p-2 animate-fade-in">
                          {CODE_TEMPLATES.map(t => (
                            <button 
                              key={t.name}
                              disabled={t.premium && !currentUser.isPremium}
                              onClick={() => { handleCodeChange(t.code); setShowTemplates(false); }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex justify-between items-center ${t.premium && !currentUser.isPremium ? 'opacity-30 cursor-not-allowed' : 'hover:bg-indigo-600 hover:text-white dark:text-slate-300'}`}
                            >
                              <span>{t.name}</span>
                              {t.premium && <span className="text-amber-500">★</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsPreviewOpen(!isPreviewOpen)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">Execute</button>
                    {canPublish && (
                      <button onClick={handlePublishMultiplayer} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">Publish Multiplayer</button>
                    )}
                  </div>
                </div>
                {room.roomType === 'game-collab' && (
                  <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                      Neural Multiplayer API Active: window.neural
                    </span>
                    <button 
                      onClick={() => alert('Use window.neural.sendState(data) and window.neural.onUpdate(callback) to build multiplayer logic!')}
                      className="text-[9px] font-black text-indigo-400 uppercase hover:underline"
                    >
                      API Docs
                    </button>
                  </div>
                )}
                <textarea 
                  value={sharedCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  readOnly={!canEdit}
                  className={`flex-1 p-6 bg-slate-950 text-emerald-400 font-mono text-xs outline-none resize-none custom-scrollbar ${!canEdit ? 'opacity-70' : ''}`}
                  spellCheck={false}
                />
                {canEdit && (
                  <div className="p-4 border-t dark:border-slate-800 bg-slate-900/50">
                    <div className="relative group">
                      <input 
                        type="text" value={forgeInput} onChange={e => setForgeInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleForgeGenerate()}
                        placeholder="Tell AI to modify code (e.g. 'Add a score counter', 'Make it neon red')..." disabled={isAiForging}
                        className="w-full bg-slate-950 border-2 border-slate-800 text-white rounded-2xl p-4 text-xs outline-none font-bold focus:border-indigo-500/50 transition-all pr-12"
                      />
                      <button onClick={handleForgeGenerate} disabled={isAiForging} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:text-indigo-400 disabled:opacity-30">
                        {isAiForging ? (
                          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {isPreviewOpen && (
                <div className="flex-1 bg-white relative">
                  <iframe 
                    srcDoc={getInjectedCode()} 
                    className="w-full h-full border-none" 
                    title="Forge Preview" 
                    ref={(el) => {
                      if (el && el.contentWindow) {
                        el.contentWindow.postMessage({ type: 'NEURAL_REMOTE_STATE', state: room.cursors }, '*');
                      }
                    }}
                  />
                  <button onClick={() => setIsPreviewOpen(false)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Publish Analysis Modal */}
        {analysisResult && (
          <div className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] border dark:border-slate-800 p-8 shadow-2xl">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${analysisResult.isMultiplayer ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {analysisResult.isMultiplayer ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tight mb-2">Forge Analysis Complete</h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${analysisResult.isMultiplayer ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {analysisResult.isMultiplayer ? 'Multiplayer Capable' : 'Single Player Only'}
                </p>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">{analysisResult.reason}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAnalysisResult(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Back to Forge</button>
                <button 
                  onClick={() => {
                    const res = analysisResult;
                    setAnalysisResult(null);
                    handlePublishMultiplayer();
                  }} 
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Confirm Publish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border dark:border-slate-800 p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tight mb-2">Terminate Session?</h3>
              <p className="text-slate-500 text-xs mb-8 font-bold">This will permanently delete the collaborative frequency. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={handleDeleteRoom} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-600/20">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {isInviting && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border dark:border-slate-800 overflow-hidden">
              <header className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">Invite Collaborators</h3>
                <button onClick={() => setIsInviting(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </header>
              <div className="p-6 space-y-4">
                <input 
                  type="text" placeholder="Search by username..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-500 transition-all dark:text-white"
                />
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                          {String(u.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold dark:text-white">{u.username}</span>
                      </div>
                      <button onClick={() => handleInvite(u.id)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">Invite</button>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && <p className="text-center text-xs text-slate-500 py-4 font-bold">No units found matching frequency.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 md:p-8 pt-4 pb-4 bg-white dark:bg-slate-950 border-t dark:border-slate-800">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all px-4">
            <input
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent py-4 text-sm font-medium dark:text-white outline-none placeholder:text-slate-400"
            />
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Mention Assistant"
                onClick={() => setInputValue(prev => prev + '@assistant ')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
              <button 
                type="submit" 
                disabled={!inputValue.trim()} 
                className={`p-2 rounded-xl transition-all ${inputValue.trim() ? 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' : 'text-slate-300 dark:text-slate-700'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-slate-400 text-center font-medium">
            Tip: Mention <span className="text-indigo-500 font-bold">@assistant</span> to get AI help in this room.
          </p>
        </form>
      </div>
    </div>
  );
};
