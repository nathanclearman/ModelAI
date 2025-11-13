import { GoogleGenAI, Modality } from "@google/genai";

// Using Replit's AI Integrations service (no API key needed, billed to credits)
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || "",
  },
});

export interface ImageGenerationResult {
  imageData: string; // base64 data URL
  mimeType: string;
}

export interface ImageAnalysisResult {
  analysis: string;
}

/**
 * Generate an image from a text prompt using Gemini
 * @param prompt - The text description of the image to generate
 * @returns Base64 data URL of the generated image
 */
export async function generateImage(prompt: string): Promise<ImageGenerationResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
    
    if (!imagePart?.inlineData?.data) {
      throw new Error("No image data in response");
    }

    const mimeType = imagePart.inlineData.mimeType || "image/png";
    const imageData = `data:${mimeType};base64,${imagePart.inlineData.data}`;

    return { imageData, mimeType };
  } catch (error: any) {
    console.error("Image generation error:", error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

/**
 * Analyze an image using Gemini's vision capabilities
 * @param imageData - Base64 encoded image data or data URL
 * @param prompt - Optional custom prompt for analysis
 * @returns Analysis text
 */
export async function analyzeImage(
  imageData: string,
  prompt: string = "Analyze this image in detail. Describe what you see, including objects, people, text, colors, and any other relevant information."
): Promise<ImageAnalysisResult> {
  try {
    // Extract base64 data and mime type if data URL
    let base64Data = imageData;
    let mimeType = "image/png";
    
    if (imageData.startsWith("data:")) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } }
        ]
      }]
    });

    const analysis = response.text || "Unable to analyze image";
    return { analysis };
  } catch (error: any) {
    console.error("Image analysis error:", error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Chat with image analysis capabilities (multimodal)
 * @param messages - Array of messages with text and optional images
 * @returns Response text
 */
export async function chatWithImages(messages: Array<{
  role: "user" | "assistant";
  text?: string;
  imageData?: string;
}>): Promise<string> {
  try {
    const contents = messages.map(msg => {
      const parts: any[] = [];
      
      if (msg.text) {
        parts.push({ text: msg.text });
      }
      
      if (msg.imageData && msg.role === "user") {
        let base64Data = msg.imageData;
        let mimeType = "image/png";
        
        if (msg.imageData.startsWith("data:")) {
          const match = msg.imageData.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          }
        }
        
        parts.push({ inlineData: { mimeType, data: base64Data } });
      }
      
      return { role: msg.role, parts };
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Chat with images error:", error);
    throw new Error(`Failed to process chat: ${error.message}`);
  }
}

/**
 * Stream text generation with image context
 */
export async function* streamChatWithImages(messages: Array<{
  role: "user" | "assistant";
  text?: string;
  imageData?: string;
}>): AsyncGenerator<string> {
  try {
    const contents = messages.map(msg => {
      const parts: any[] = [];
      
      if (msg.text) {
        parts.push({ text: msg.text });
      }
      
      if (msg.imageData && msg.role === "user") {
        let base64Data = msg.imageData;
        let mimeType = "image/png";
        
        if (msg.imageData.startsWith("data:")) {
          const match = msg.imageData.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          }
        }
        
        parts.push({ inlineData: { mimeType, data: base64Data } });
      }
      
      return { role: msg.role, parts };
    });

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    console.error("Stream chat error:", error);
    throw new Error(`Failed to stream chat: ${error.message}`);
  }
}
