
export const MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Free Tier)', description: 'Fastest and most generous free tier. Great for daily tasks.' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Free Tier)', description: 'Advanced reasoning and high-quality responses.' },
  { id: 'gemini-2.5-flash-lite-latest', name: 'Gemini 2.5 Lite', description: 'Ultra-low latency for simple queries.' }
];

export const DEFAULT_CONFIG = {
  model: 'gemini-3-flash-preview',
  temperature: 0.8,
  topP: 0.9,
  topK: 40,
  systemInstruction: 'You are a professional AI assistant. Respond with clear, structured information. Use bolding (like **this**) for key points and backticks (like `this`) for code or commands. Avoid excessive technical jargon unless asked.',
  thinkingBudget: 0
};
