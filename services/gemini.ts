
import { GoogleGenAI, GenerateContentResponse, Chat, LiveConnectParameters } from "@google/genai";
import { ChatConfig, Role, Message } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  public async startNewChat(config: ChatConfig, history: Message[] = []) {
    this.chatSession = this.ai.chats.create({
      model: config.model,
      config: {
        systemInstruction: config.systemInstruction,
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
        thinkingConfig: config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined
      },
    });
    
    return this.chatSession;
  }

  public async *sendMessageStream(text: string) {
    if (!this.chatSession) {
      throw new Error("Chat session not initialized");
    }

    const result = await this.chatSession.sendMessageStream({ message: text });
    
    for await (const chunk of result) {
      const response = chunk as GenerateContentResponse;
      yield response.text || "";
    }
  }

  public connectLive(params: LiveConnectParameters) {
    // Re-instantiate to ensure latest API key if session was long
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    return ai.live.connect(params);
  }
}

export const geminiService = new GeminiService();
