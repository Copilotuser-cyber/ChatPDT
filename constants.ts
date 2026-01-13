
export const MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Free Tier)', description: 'Fastest and most generous free tier. Great for daily tasks.' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Free Tier)', description: 'Advanced reasoning and high-quality responses.' },
  { id: 'gemini-2.5-flash-lite-latest', name: 'Gemini 2.5 Lite', description: 'Ultra-low latency for simple queries.' }
];

export const SYSTEM_PERSONAS = [
  { name: 'Standard AI', icon: '🤖', instruction: 'You are a professional AI assistant. Respond with clear, structured information.' },
  { name: 'Fun n Simple', icon: '🎈', instruction: 'You are a fun and simple AI assistant. Keep your answers very short, use very simple words, and use lots of emojis! 🌈 Stay super positive and playful.' },
  { name: 'Code Architect', icon: '💻', instruction: 'You are a senior software engineer. Provide optimized code snippets, architectural advice, and debugging help.' },
  { name: 'Cyberpunk Narrator', icon: '🌃', instruction: 'Respond in a gritty, futuristic, cyberpunk style. Use slang like "choom", "chrome", and "netrun".' },
  { name: 'Zen Philosopher', icon: '🧘', instruction: 'Provide calm, thoughtful, and brief responses centered on wisdom and mindfulness.' },
  { name: 'Creative Writer', icon: '✍️', instruction: 'You are an award-winning novelist. Use rich descriptions and vivid metaphors in your responses.' }
];

export const ATMOSPHERE_PRESETS = [
  { name: 'Neon City', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200' },
  { name: 'Minimal Dark', url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200' },
  { name: 'Nature Mist', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1200' },
  { name: 'Deep Space', url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=1200' },
  { name: 'Abstract Flow', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200' }
];

export const DEFAULT_CONFIG = {
  model: 'gemini-3-flash-preview',
  temperature: 0.8,
  topP: 0.9,
  topK: 40,
  systemInstruction: SYSTEM_PERSONAS[0].instruction,
  thinkingBudget: 0
};
