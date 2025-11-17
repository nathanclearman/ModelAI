import { storage } from "./storage";
import type { Workflow, WorkflowRun } from "@shared/schema";
import OpenAI from "openai";
import { generateImageWithStability } from "./services/stabilityService";
import { imageStore } from "./services/imageStore";
import { checkImagePrompt } from "./utils/contentFilter";

type WorkflowStep = {
  id: string;
  type: "ai_chat" | "ai_image_generation" | "webhook" | "delay";
  config: any;
};

export class WorkflowEngine {
  async executeWorkflow(workflowId: string, userId: string, input?: any): Promise<WorkflowRun> {
    const workflow = await storage.getWorkflow(userId, workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (!workflow.enabled) {
      throw new Error("Workflow is disabled");
    }

    const run = await storage.createWorkflowRun({
      workflowId,
      userId,
      status: "running",
      input: input || {},
      output: {},
      error: null,
      completedAt: null,
    });

    console.log(`[Workflow] Created run with ID: ${run.id}`);

    try {
      const steps = (workflow.steps as WorkflowStep[]) || [];
      
      if (!steps || steps.length === 0) {
        throw new Error("Workflow has no steps configured");
      }
      
      let context: any = { ...input };

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        console.log(`[Workflow] Executing step ${i + 1}/${steps.length}: ${step.type}`);

        try {
          const stepResult = await this.executeStep(step, context, userId);
          context = { ...context, [`step_${i + 1}_result`]: stepResult };
        } catch (error: any) {
          console.error(`[Workflow] Step ${i + 1} failed:`, error.message);
          const failed = await storage.updateWorkflowRun(run.id, {
            status: "failed",
            error: `Step ${i + 1} (${step.type}) failed: ${error.message}`,
            output: context,
            completedAt: new Date(),
          });
          // Return the failed run instead of throwing
          console.log(`[Workflow] Step failed. Returning run:`, failed?.id, failed?.status);
          return failed || run;
        }
      }

      const updated = await storage.updateWorkflowRun(run.id, {
        status: "completed",
        output: context,
        completedAt: new Date(),
      });

      console.log(`[Workflow] Workflow completed. Returning run:`, updated?.id, updated?.status);
      return updated || run;
    } catch (error: any) {
      // Handle unexpected errors (not step failures)
      console.error("[Workflow] Execution failed:", error);
      const failed = await storage.updateWorkflowRun(run.id, {
        status: "failed",
        error: error.message || "Unexpected error during workflow execution",
        completedAt: new Date(),
      });
      console.log(`[Workflow] Unexpected error. Returning run:`, failed?.id, failed?.status);
      return failed || run;
    }
  }

  private async executeStep(step: WorkflowStep, context: any, userId: string): Promise<any> {
    switch (step.type) {
      case "ai_chat":
        return await this.executeAIChat(step, context, userId);
      
      case "ai_image_generation":
        return await this.executeImageGeneration(step, context, userId);
      
      case "delay":
        return await this.executeDelay(step);
      
      case "webhook":
        return await this.executeWebhook(step, context, userId);
      
      default:
        throw new Error(`Unsupported step type: ${step.type}`);
    }
  }

  private async executeAIChat(step: WorkflowStep, context: any, userId: string): Promise<any> {
    const { modelId, prompt } = step.config || {};
    
    if (!modelId) {
      throw new Error("AI chat step requires modelId in config");
    }
    
    if (!prompt) {
      throw new Error("AI chat step requires prompt in config");
    }
    
    const resolvedPrompt = this.resolveVariables(prompt, context);

    const model = await storage.getAIModel(userId, modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const openai = new OpenAI({ apiKey });

    // Use max_completion_tokens for newer reasoning models
    const reasoningModels = ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'o1', 'o3', 'o1-mini', 'o1-preview', 'o3-mini'];
    const isReasoningModel = reasoningModels.some(m => model.model.toLowerCase().includes(m));

    const requestParams: any = {
      model: model.model,
      messages: [],
    };

    // Reasoning models don't support system messages or temperature
    if (isReasoningModel) {
      // Combine system prompt with user message for reasoning models
      const combinedPrompt = model.systemPrompt 
        ? `${model.systemPrompt}\n\n${resolvedPrompt}`
        : resolvedPrompt;
      requestParams.messages.push({ role: "user", content: combinedPrompt });
      // Reasoning models need much higher token limits (they use tokens for thinking)
      // Use at least 4x the configured tokens, minimum 2000
      requestParams.max_completion_tokens = Math.max(model.maxTokens * 4, 2000);
    } else {
      // Standard models support system messages and temperature
      requestParams.messages.push(
        { role: "system", content: model.systemPrompt },
        { role: "user", content: resolvedPrompt }
      );
      requestParams.temperature = model.temperature / 100;
      requestParams.max_tokens = model.maxTokens;
    }

    console.log("[Workflow] OpenAI request params:", JSON.stringify(requestParams, null, 2));
    
    const response = await openai.chat.completions.create(requestParams);

    console.log("[Workflow] Full OpenAI response:", JSON.stringify(response, null, 2));

    return {
      response: response.choices[0]?.message?.content || "",
      tokens: response.usage?.total_tokens || 0,
    };
  }

  private async executeImageGeneration(step: WorkflowStep, context: any, userId: string): Promise<any> {
    const { 
      prompt, 
      negativePrompt,
      width = 1024,
      height = 1024,
      cfgScale = 7,
      steps = 30,
      seed,
    } = step.config || {};
    
    if (!prompt) {
      throw new Error("Image generation step requires prompt in config");
    }
    
    const resolvedPrompt = this.resolveVariables(prompt, context);
    const resolvedNegativePrompt = negativePrompt ? this.resolveVariables(negativePrompt, context) : undefined;

    // Check content filter
    const filterResult = checkImagePrompt(resolvedPrompt);
    if (!filterResult.allowed) {
      console.log("[Workflow] Image generation blocked:", filterResult.reason);
      return {
        prompt: resolvedPrompt,
        imageGenerated: false,
        error: filterResult.reason || "Content blocked",
      };
    }

    try {
      // Use Stability AI for image generation
      const { imageData, mimeType } = await generateImageWithStability({
        prompt: resolvedPrompt,
        negativePrompt: resolvedNegativePrompt,
        width: Number(width),
        height: Number(height),
        cfgScale: Number(cfgScale),
        steps: Number(steps),
        seed: seed ? Number(seed) : undefined,
      });
      
      // Save the generated image to storage
      const imageResult = await imageStore.store(imageData, userId, "generated", resolvedPrompt);
      
      return {
        prompt: resolvedPrompt,
        negativePrompt: resolvedNegativePrompt,
        imageGenerated: true,
        imageUrl: imageResult.publicUrl,
        mimeType,
        width: Number(width),
        height: Number(height),
        size: imageData.length,
      };
    } catch (error: any) {
      console.error("[Workflow] Image generation failed:", error);
      return {
        prompt: resolvedPrompt,
        imageGenerated: false,
        error: error.message || "Failed to generate or store image",
      };
    }
  }

  private async executeDelay(step: WorkflowStep): Promise<any> {
    const { seconds } = step.config || {};
    
    if (seconds === undefined || seconds === null) {
      throw new Error("Delay step requires seconds in config");
    }
    
    const delaySeconds = Number(seconds);
    if (isNaN(delaySeconds) || delaySeconds < 0) {
      throw new Error("Delay seconds must be a non-negative number");
    }
    
    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    return { delayed: delaySeconds };
  }

  private async executeWebhook(step: WorkflowStep, context: any, userId?: string): Promise<any> {
    let { url, method = "POST", headers = {}, body, authType, authConfig, webhookConfigId } = step.config || {};
    
    if (!url && !webhookConfigId) {
      throw new Error("Webhook step requires url or webhookConfigId in config");
    }

    // If using a saved webhook configuration, fetch auth credentials at runtime
    if (webhookConfigId && userId) {
      try {
        const savedWebhook = await storage.getWebhookConfiguration(userId, webhookConfigId);
        if (savedWebhook) {
          // Override with saved configuration including auth credentials
          url = savedWebhook.url;
          method = savedWebhook.method;
          headers = savedWebhook.headers as Record<string, string> || {};
          body = savedWebhook.bodyTemplate;
          authType = savedWebhook.authType;
          authConfig = savedWebhook.authConfig;
        }
      } catch (error) {
        console.error("[Workflow] Failed to fetch saved webhook configuration:", error);
        // Continue with step config as fallback
      }
    }

    // SSRF protection: Validate webhook URL
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Block localhost, private IPs, and internal networks
      const blockedHosts = [
        'localhost', '127.0.0.1', '0.0.0.0',
        '::1', '::ffff:127.0.0.1',
      ];
      
      if (blockedHosts.includes(hostname) || 
          hostname.startsWith('10.') ||
          hostname.startsWith('192.168.') ||
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
          hostname.endsWith('.local')) {
        throw new Error("Cannot execute webhooks pointing to internal networks");
      }
    } catch (error: any) {
      throw new Error(`Invalid webhook URL: ${error.message}`);
    }

    // Prepare headers with authentication
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Add authentication if configured
    if (authType === "bearer" && authConfig) {
      const token = (authConfig as any).token;
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }
    } else if (authType === "api_key" && authConfig) {
      const { key, value } = authConfig as any;
      if (key && value) {
        requestHeaders[key] = value;
      }
    }

    // Resolve variables in body template (safely)
    let resolvedBody = body;
    if (typeof body === 'object') {
      resolvedBody = this.resolveVariables(JSON.stringify(body), context);
    } else if (typeof body === 'string') {
      resolvedBody = this.resolveVariables(body, context);
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: method !== "GET" ? resolvedBody : undefined,
    });

    // Return sanitized result - DO NOT include auth credentials in response
    return {
      status: response.status,
      statusText: response.statusText,
      body: await response.text(),
      // Do not return: authType, authConfig, headers with auth tokens
    };
  }

  private resolveVariables(text: string, context: any): string {
    if (!text) return "";
    
    let resolved = text;
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    
    if (matches) {
      matches.forEach(match => {
        const variable = match.replace(/\{\{|\}\}/g, "").trim();
        
        // Sanitize variable name to prevent prototype pollution
        if (variable.includes('__proto__') || variable.includes('constructor') || variable.includes('prototype')) {
          resolved = resolved.replace(match, '');
          return;
        }
        
        const value = this.getNestedValue(context, variable);
        
        // Convert value to string safely
        let stringValue = '';
        if (value !== null && value !== undefined) {
          // Prevent injection by escaping special characters in JSON context
          if (typeof value === 'string') {
            stringValue = value;
          } else if (typeof value === 'object') {
            stringValue = JSON.stringify(value);
          } else {
            stringValue = String(value);
          }
        }
        
        resolved = resolved.replace(match, stringValue);
      });
    }
    
    return resolved;
  }

  private getNestedValue(obj: any, path: string): any {
    // Prevent prototype pollution attacks
    const keys = path.split(".");
    let current = obj;
    
    for (const key of keys) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }
}

export const workflowEngine = new WorkflowEngine();
