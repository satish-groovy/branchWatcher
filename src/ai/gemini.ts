import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

export class GeminiAI {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });
  }

  async analyze(prompt: string, context: any): Promise<any> {
    const fullPrompt = `
      ${prompt}
      
      CONTEXT:
      ${JSON.stringify(context, null, 2)}
      
      Return ONLY a valid JSON object.
    `;

    const result = await this.model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", text);
      return { error: "Invalid JSON response", raw: text };
    }
  }
}
