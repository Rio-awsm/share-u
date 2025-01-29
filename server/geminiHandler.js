const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  
  class GeminiHandler {
    constructor() {
      this.apiKey = process.env.GENERATIVE_AI_API_KEY;
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.chatSessions = new Map(); 
    }
  
    async initializeChat(roomId) {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        systemInstruction: "You are an ai assistant who is available in a realtime collaborative platform where people can come and join room. You can help them with their queries specially generating code but don't explain or comment too much."
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
        history: [],
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