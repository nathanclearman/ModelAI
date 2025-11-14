import { storage } from "./storage";
import type { Workflow, WorkflowRun } from "@shared/schema";
import OpenAI from "openai";
import { geminiService } from "./services/geminiService";
import { imageStore } from "./services/imageStore";

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
        return await this.executeImageGeneration(step, context);
      
      case "delay":
        return await this.executeDelay(step);
      
      case "webhook":
        return await this.executeWebhook(step, context);
      
      default:
        throw new Error(`Unsupported step type: ${step.type}`);
    }
  }

  private async executeAIChat(step: WorkflowStep, context: any, userId: string): Promise<any> {
    const { modelId, prompt } = step.config;
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

    const response = await openai.chat.completions.create({
      model: model.model,
      messages: [
        { role: "system", content: model.systemPrompt },
        { role: "user", content: resolvedPrompt },
      ],
      temperature: model.temperature / 100,
      max_tokens: model.maxTokens,
    });

    return {
      response: response.choices[0]?.message?.content || "",
      tokens: response.usage?.total_tokens || 0,
    };
  }

  private async executeImageGeneration(step: WorkflowStep, context: any): Promise<any> {
    const { prompt } = step.config;
    const resolvedPrompt = this.resolveVariables(prompt, context);

    const { imageData } = await geminiService.generateImage(resolvedPrompt);
    
    return {
      prompt: resolvedPrompt,
      imageGenerated: true,
      size: imageData.length,
    };
  }

  private async executeDelay(step: WorkflowStep): Promise<any> {
    const { seconds } = step.config;
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    return { delayed: seconds };
  }

  private async executeWebhook(step: WorkflowStep, context: any): Promise<any> {
    const { url, method = "POST", headers = {}, body } = step.config;
    const resolvedBody = this.resolveVariables(JSON.stringify(body), context);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: method !== "GET" ? resolvedBody : undefined,
    });

    return {
      status: response.status,
      body: await response.text(),
    };
  }

  private resolveVariables(text: string, context: any): string {
    if (!text) return "";
    
    let resolved = text;
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    
    if (matches) {
      matches.forEach(match => {
        const variable = match.replace(/\{\{|\}\}/g, "").trim();
        const value = this.getNestedValue(context, variable);
        resolved = resolved.replace(match, String(value || ""));
      });
    }
    
    return resolved;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }
}

export const workflowEngine = new WorkflowEngine();
