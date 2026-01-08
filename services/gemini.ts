
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ChatConfig, Message } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private initPromise: Promise<Chat> | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  }

  public async startNewChat(config: ChatConfig, history: Message[] = []) {
    // We wrap the initialization in a promise so that concurrent calls to sendMessageStream can wait for it.
    this.initPromise = (async () => {
      const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      this.chatSession = this.ai.chats.create({
        model: config.model,
        config: {
          systemInstruction: config.systemInstruction,
          temperature: config.temperature,
          topP: config.topP,
          topK: config.topK,
          thinkingConfig: config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined
        },
        history: contents
      });
      return this.chatSession;
    })();
    
    return this.initPromise;
  }

  public connectLive(params: any) {
    return this.ai.live.connect(params);
  }

  public async *sendMessageStream(text: string) {
    // If a session isn't immediately available but an initialization is in progress, wait for it.
    if (!this.chatSession && this.initPromise) {
      await this.initPromise;
    }

    if (!this.chatSession) {
      throw new Error("Neural link not established. Attempting to re-initialize...");
    }

    const result = await this.chatSession.sendMessageStream({ message: text });
    
    for await (const chunk of result) {
      const response = chunk as GenerateContentResponse;
      yield response.text || "";
    }
  }

  public async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short (2-4 words) title for a chat that starts with: "${firstMessage}". Return ONLY the title text.`,
      });
      return response.text?.replace(/"/g, '') || "New Conversation";
    } catch (e) {
      return "New Conversation";
    }
  }
}

export const geminiService = new GeminiService();
