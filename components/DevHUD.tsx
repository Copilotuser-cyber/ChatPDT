
import React, { useState, useEffect } from 'react';

export const DevHUD: React.FC = () => {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const update = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
        
        // Memory is only available in Chrome
        if ((performance as any).memory) {
          setMemory((performance as any).memory);
        }
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[800] bg-black/80 backdrop-blur-md border border-emerald-500/50 p-4 rounded-2xl shadow-2xl shadow-emerald-500/20 pointer-events-none select-none animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">System FPS</div>
          <div className={`text-xl font-black ${fps < 30 ? 'text-red-500' : fps < 50 ? 'text-yellow-500' : 'text-white'}`}>{fps}</div>
        </div>
        
        {memory && (
          <div className="flex flex-col border-l border-emerald-500/20 pl-4">
            <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Memory Heap</div>
            <div className="text-xl font-black text-white">
              {Math.round(memory.usedJSHeapSize / 1048576)}MB
            </div>
          </div>
        )}

        <div className="flex flex-col border-l border-emerald-500/20 pl-4">
          <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Core Status</div>
          <div className="text-xl font-black text-emerald-500 animate-pulse">STABLE</div>
        </div>
      </div>
    </div>
  );
};
