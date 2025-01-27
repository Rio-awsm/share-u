const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  
  class GeminiHandler {
    constructor() {
      this.apiKey = "";
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.chatSessions = new Map(); 
    }
  
    async initializeChat(roomId) {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });
  
      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      };
  
      const chatSession = model.startChat({
        generationConfig,
        history: [
          {
            role: "user",
            parts: [
              { text: "you are an ai assistant available in a realtime text sharing platform whenever an user ping you and give you some command you will help him with the suitable response" },
            ],
          },
          {
            role: "model",
            parts: [
              { text: "I understand. I'm ready to help as an AI assistant in this text sharing platform. Just ping me with your questions or commands!" },
            ],
          }
        ],
      });
  
      this.chatSessions.set(roomId, chatSession);
      return chatSession;
    }
  
    async getResponse(roomId, prompt) {
      let chatSession = this.chatSessions.get(roomId);
      if (!chatSession) {
        chatSession = await this.initializeChat(roomId);
      }
  
      try {
        const result = await chatSession.sendMessage(prompt);
        return result.response.text();
      } catch (error) {
        console.error('Gemini AI Error:', error);
        return "Sorry, I encountered an error processing your request.";
      }
    }
  }
  
  module.exports = new GeminiHandler();