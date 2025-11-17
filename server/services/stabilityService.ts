/**
 * Stability AI Service for Image Generation
 * Uses Stability AI's Stable Diffusion XL for high-quality image generation
 */

export interface StabilityImageResult {
  imageData: string; // base64 data URL
  mimeType: string;
}

export interface StabilityImageOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  cfgScale?: number;
  steps?: number;
  samples?: number;
  seed?: number;
}

/**
 * Generate an image using Stability AI's Stable Diffusion XL
 */
export async function generateImageWithStability(
  options: StabilityImageOptions
): Promise<StabilityImageResult> {
  const apiKey = process.env.STABILITY_API_KEY;
  
  if (!apiKey) {
    throw new Error("Stability AI API key not configured. Set STABILITY_API_KEY environment variable.");
  }

  const {
    prompt,
    negativePrompt = "",
    width = 1024,
    height = 1024,
    cfgScale = 7,
    steps = 30,
    samples = 1,
    seed,
  } = options;

  const endpoint = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";

  console.log("[Stability] Generating image:", { prompt, width, height, steps });

  const requestBody: any = {
    text_prompts: [
      { text: prompt, weight: 1.0 },
      ...(negativePrompt ? [{ text: negativePrompt, weight: -1.0 }] : []),
    ],
    cfg_scale: cfgScale,
    height,
    width,
    samples,
    steps,
  };

  if (seed !== undefined) {
    requestBody.seed = seed;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    let errorMessage = `Stability AI error ${response.status}: ${response.statusText}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) {
        errorMessage = errorJson.message;
      } else if (errorJson.errors) {
        errorMessage = errorJson.errors.map((e: any) => e.message || e).join(", ");
      }
    } catch {
      if (errorText) {
        errorMessage += ` - ${errorText}`;
      }
    }
    
    throw new Error(errorMessage);
  }

  const data: any = await response.json();
  const artifact = data?.artifacts?.[0];
  
  if (!artifact?.base64) {
    throw new Error("Stability AI returned no image data");
  }

  const mimeType = "image/png";
  const imageData = `data:${mimeType};base64,${artifact.base64}`;

  console.log("[Stability] Successfully generated image");
  return { imageData, mimeType };
}

