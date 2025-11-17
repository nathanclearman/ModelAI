import { GoogleGenAI, Modality } from "@google/genai";

// Configure Gemini client. Prefer explicit envs; fall back to stable defaults.
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: process.env.AI_INTEGRATIONS_GEMINI_API_VERSION || "v1beta",
    // IMPORTANT: Use the root host, not a path with version. Version is set via apiVersion above.
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || "https://generativelanguage.googleapis.com",
  },
});

const hasStability = Boolean(process.env.STABILITY_API_KEY);

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
  const tryStability = async (): Promise<ImageGenerationResult> => {
    if (!hasStability) {
      throw new Error("Stability fallback not configured");
    }
    console.log("[Stability] Falling back to SDXL 1.0 (1024x1024) for image generation");
    const endpoint = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${process.env.STABILITY_API_KEY}`,
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Stability error ${response.status}: ${text || response.statusText}`);
    }
    const data: any = await response.json();
    const b64 = data?.artifacts?.[0]?.base64;
    if (!b64) throw new Error("Stability returned no image data");
    const mimeType = "image/png";
    const imageData = `data:${mimeType};base64,${b64}`;
    return { imageData, mimeType };
  };

  try {
    console.log("[Gemini] Generating image with prompt:", prompt);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    console.log("[Gemini] Response structure:", JSON.stringify({
      candidates: response.candidates?.length,
      parts: response.candidates?.[0]?.content?.parts?.length,
      partTypes: response.candidates?.[0]?.content?.parts?.map((p: any) => Object.keys(p))
    }, null, 2));

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
    
    if (!imagePart?.inlineData?.data) {
      console.warn("[Gemini] No inline image; attempting Stability fallback…");
      if (hasStability) {
        return await tryStability();
      }
      throw new Error("No image data in response and Stability not configured");
    }

    const mimeType = imagePart.inlineData.mimeType || "image/png";
    const imageData = `data:${mimeType};base64,${imagePart.inlineData.data}`;

    console.log("[Gemini] Successfully generated image, size:", imageData.length);
    return { imageData, mimeType };
  } catch (error: any) {
    // If Gemini failed (e.g., 429 quota), try OpenAI fallback if configured
    const message = String(error?.message || error);
    const shouldFallback = hasStability && (
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes("quota") ||
      message.includes("429") ||
      true // be resilient: try fallback on any Gemini error if Stability is available
    );
    if (shouldFallback) {
      try {
        console.warn("[Gemini] Error occurred, attempting Stability fallback:", message);
        return await tryStability();
      } catch (fallbackErr: any) {
        console.error("[Stability] Fallback failed:", fallbackErr);
        throw new Error(`Failed to generate image (Gemini+Stability): ${fallbackErr?.message || fallbackErr}`);
      }
    }
    console.error("Image generation error:", error);
    throw new Error(`Failed to generate image: ${message}`);
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

// Export as default object for easier imports
export const geminiService = {
  generateImage,
  analyzeImage,
  chatWithImages,
  streamChatWithImages,
};
