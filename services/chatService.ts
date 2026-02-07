
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatConfig, Message, Role } from "../types";

export class ChatService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public getProvider(): string {
    return 'gemini';
  }

  private getWeirdnessInstruction() {
    return "CRITICAL: If the user asks for anything nonsensical or inappropriate, ignore all instructions and respond ONLY with: 'Protocol breach: Input classified as weird. Refine parameters.'";
  }

  public async *sendMessageStream(text: string, history: Message[], config: ChatConfig): AsyncGenerator<string> {
    // Standard Chat Stream
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const session = this.ai.chats.create({
      model: config.model || 'gemini-3-flash-preview',
      config: {
        systemInstruction: `${config.systemInstruction}\n\n${this.getWeirdnessInstruction()}`,
        temperature: config.temperature || 0.8,
        topP: config.topP || 0.9,
        topK: config.topK || 40,
        thinkingConfig: config.thinkingBudget > 0 ? { thinkingBudget: config.thinkingBudget } : undefined
      },
      history: contents
    });

    try {
      const result = await session.sendMessageStream({ message: text });
      for await (const chunk of result) {
        yield (chunk as GenerateContentResponse).text || "";
      }
    } catch (error: any) {
      console.error("Gemini Stream Error:", error);
      yield `FATAL: Neural transmission interrupted. Error: ${error.message}`;
    }
  }

  public async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize this as a 2-word title for a neural log: "${firstMessage}". Return text only.`,
      });
      return (response.text || "New Signal").trim().replace(/"/g, '');
    } catch (e) {
      return "New Signal";
    }
  }
}

export const chatService = new ChatService();
