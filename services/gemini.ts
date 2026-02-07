
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ChatConfig, Message } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private initPromise: Promise<Chat> | null = null;
  private currentConfig: ChatConfig | null = null;
  private currentHistory: Message[] = [];

  constructor() {
    // Fix: Using correct initialization pattern for GoogleGenAI as per guidelines
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // Fix: Added getProvider method for consistency across services
  public getProvider(): string {
    return 'gemini';
  }

  public async startNewChat(config: ChatConfig, history: Message[] = []) {
    this.currentConfig = config;
    this.currentHistory = history;

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

  public async *sendMessageStream(text: string) {
    // If no session exists, wait for the pending init or re-init
    if (!this.chatSession) {
      if (this.initPromise) {
        await this.initPromise;
      } else if (this.currentConfig) {
        await this.startNewChat(this.currentConfig, this.currentHistory);
      } else {
        throw new Error("Neural link failed: System context lost. Refresh interface.");
      }
    }

    if (!this.chatSession) {
      throw new Error("Neural link failed: Terminal session could not be established.");
    }

    try {
      const result = await this.chatSession.sendMessageStream({ message: text });
      for await (const chunk of result) {
        // Fix: Correctly extracting text property from response chunk
        const response = chunk as GenerateContentResponse;
        yield response.text || "";
      }
    } catch (error) {
      console.error("Stream Transmission Error:", error);
      // Attempt session recovery for next call
      this.chatSession = null;
      throw error;
    }
  }

  public async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short (2-4 words) title for a chat that starts with: "${firstMessage}". Return ONLY the title text.`,
      });
      // Fix: Direct access to text property
      return response.text?.replace(/"/g, '') || "New Conversation";
    } catch (e) {
      return "New Conversation";
    }
  }

  public connectLive(params: any) {
    return this.ai.live.connect(params);
  }
}

export const geminiService = new GeminiService();
