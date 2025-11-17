import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Code, Database, Shield, Settings, Zap, Users, Image, Video, Mic, Webhook, Plug, Brain, Layers, Store, History, Key, Upload, FileText } from "lucide-react";

export default function Documentation() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">ModelAI Documentation</h1>
        <p className="text-muted-foreground text-lg">
          Complete technical documentation for every feature, API endpoint, and component
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-10 mb-6 overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="deployment">Deploy</TabsTrigger>
          <TabsTrigger value="configuration">Config</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">What is ModelAI?</h3>
                <p className="text-muted-foreground">
                  ModelAI is a comprehensive AI platform that provides a unified interface for interacting with multiple AI models,
                  managing conversations, creating custom AI assistants, and building AI-powered workflows. It supports text generation,
                  image generation, voice interactions, video analysis, and much more.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Architecture</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Frontend:</strong> React 18.3.1 with TypeScript, Vite build tool, Tailwind CSS, Radix UI components</p>
                  <p><strong>Backend:</strong> Node.js with Express.js, TypeScript, PostgreSQL database (Neon)</p>
                  <p><strong>AI Services:</strong> OpenAI API, Google Gemini API, Stability AI API</p>
                  <p><strong>Storage:</strong> Cloudflare R2 for media, PostgreSQL for structured data</p>
                  <p><strong>Authentication:</strong> Passport.js with local strategy, session-based auth</p>
                  <p><strong>Email:</strong> Resend API for transactional emails</p>
                  <p><strong>Payments:</strong> Stripe for subscription management</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Key Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge>React 18.3.1</Badge>
                  <Badge>TypeScript 5.6.3</Badge>
                  <Badge>Express.js 4.21.2</Badge>
                  <Badge>PostgreSQL</Badge>
                  <Badge>Drizzle ORM</Badge>
                  <Badge>OpenAI API</Badge>
                  <Badge>Gemini API</Badge>
                  <Badge>Stability AI</Badge>
                  <Badge>Stripe</Badge>
                  <Badge>Resend</Badge>
                  <Badge>Cloudflare R2</Badge>
                  <Badge>Tailwind CSS</Badge>
                  <Badge>Radix UI</Badge>
                  <Badge>Vite</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Core Capabilities</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Multi-model AI chat (OpenAI GPT models, Gemini, custom models)</li>
                  <li>Image generation and analysis (DALL-E, Stable Diffusion, Gemini Vision)</li>
                  <li>Voice input/output with transcription and text-to-speech</li>
                  <li>Video analysis and processing</li>
                  <li>Code execution (Python, JavaScript) with security sandboxing</li>
                  <li>Document processing (PDF, DOCX, TXT, Markdown)</li>
                  <li>Fine-tuning custom AI models</li>
                  <li>Workflow automation with multi-model orchestration</li>
                  <li>Team collaboration with workspaces</li>
                  <li>Model marketplace for sharing and discovery</li>
                  <li>Prompt engineering tools and templates</li>
                  <li>Conversation branching for exploring alternatives</li>
                  <li>Webhook integrations</li>
                  <li>Zapier/Make.com integrations</li>
                  <li>API access with key management</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
              <FeatureSection
                icon={<Layers className="h-5 w-5" />}
                title="AI Models Management"
                description="Create, configure, and manage custom AI assistants"
                details={[
                  "Create custom AI models with system prompts, temperature, and token limits",
                  "Support for OpenAI models (GPT-4, GPT-4 Turbo, GPT-3.5, GPT-5, O1, O3)",
                  "Support for Google Gemini models",
                  "Model versioning with full history and rollback capability",
                  "Model categories and tags for organization",
                  "Public/private model sharing",
                  "Model favorites and quick access",
                  "Default model seeding for new users",
                  "Model templates and presets",
                  "Model cloning from marketplace",
                ]}
              />

              <FeatureSection
                icon={<Code className="h-5 w-5" />}
                title="Chat Interface"
                description="Advanced conversational AI interface"
                details={[
                  "Real-time streaming responses with Server-Sent Events (SSE)",
                  "Message history and conversation persistence",
                  "Code block syntax highlighting and execution",
                  "Image generation directly in chat",
                  "Image upload and analysis",
                  "Voice recording and transcription",
                  "Text-to-speech for responses",
                  "Video analysis integration",
                  "Conversation branching from any message",
                  "Prompt template library integration",
                  "Markdown rendering with code blocks",
                  "Message timestamps and metadata",
                  "Conversation titles and organization",
                ]}
              />

              <FeatureSection
                icon={<Image className="h-5 w-5" />}
                title="Image Generation & Analysis"
                description="AI-powered image creation and understanding"
                details={[
                  "Image generation using Stability AI (Stable Diffusion XL)",
                  "Fallback to Gemini for image generation",
                  "Image upload and analysis with Gemini Vision",
                  "Image storage in Cloudflare R2 or local temp storage",
                  "Image expiration and automatic cleanup",
                  "Image metadata tracking (prompt, type, size)",
                  "Image quota management per user tier",
                  "Content filtering for inappropriate prompts",
                  "Support for multiple image formats (PNG, JPEG, WebP)",
                  "Public URL generation for generated images",
                ]}
              />

              <FeatureSection
                icon={<Mic className="h-5 w-5" />}
                title="Voice & Audio Features"
                description="Voice input/output and audio processing"
                details={[
                  "Voice recording with browser MediaRecorder API",
                  "Audio transcription using OpenAI Whisper API",
                  "Text-to-speech using OpenAI TTS (6 voices: alloy, echo, fable, onyx, nova, shimmer)",
                  "Support for multiple audio formats (WebM, MP3, WAV, OGG)",
                  "Audio storage and management",
                  "Transcription language detection",
                  "Duration tracking for audio files",
                  "Real-time transcription (streaming support ready)",
                  "Audio playback controls",
                ]}
              />

              <FeatureSection
                icon={<Video className="h-5 w-5" />}
                title="Video Analysis"
                description="AI-powered video content analysis"
                details={[
                  "Video upload and storage (MP4, WebM, MOV, AVI)",
                  "Video analysis using Gemini Vision API",
                  "Custom analysis prompts",
                  "Video metadata extraction",
                  "Frame extraction support (requires ffmpeg for production)",
                  "Video transcription from audio track",
                  "Key frame analysis",
                  "Video storage in Cloudflare R2",
                  "Support for videos up to 100MB",
                ]}
              />

              <FeatureSection
                icon={<Brain className="h-5 w-5" />}
                title="Fine-Tuning"
                description="Train custom AI models on your data"
                details={[
                  "Fine-tuning file upload and management",
                  "Support for OpenAI fine-tuning format",
                  "Training file validation and processing",
                  "Fine-tuning job creation and monitoring",
                  "Job status tracking (pending, running, completed, failed)",
                  "Cost estimation for fine-tuning",
                  "Fine-tuned model deployment",
                  "Training metrics and progress",
                  "Validation file support",
                  "Hyperparameter configuration",
                ]}
              />

              <FeatureSection
                icon={<Zap className="h-5 w-5" />}
                title="Workflows & Automation"
                description="Multi-model orchestration and automation"
                details={[
                  "Visual workflow builder",
                  "Multi-step AI model chaining",
                  "Conditional logic and branching",
                  "Parallel step execution",
                  "Delay steps for timing control",
                  "Webhook steps for external integrations",
                  "Workflow triggers (manual, scheduled, webhook)",
                  "Workflow execution history",
                  "Error handling and retry logic",
                  "Context passing between steps",
                ]}
              />

              <FeatureSection
                icon={<Users className="h-5 w-5" />}
                title="Workspaces & Collaboration"
                description="Team collaboration features"
                details={[
                  "Create and manage workspaces",
                  "Role-based access control (owner, admin, editor, viewer)",
                  "Workspace member management",
                  "Shared models and conversations",
                  "Workspace-level API keys",
                  "Workspace settings and configuration",
                  "Member invitations",
                  "Activity tracking",
                ]}
              />

              <FeatureSection
                icon={<Store className="h-5 w-5" />}
                title="Marketplace"
                description="Discover and share AI models"
                details={[
                  "Public model discovery",
                  "Model search and filtering",
                  "Model likes and favorites",
                  "Model cloning to your account",
                  "Model ratings and reviews",
                  "Trending models",
                  "Model categories",
                  "Creator attribution",
                ]}
              />

              <FeatureSection
                icon={<FileText className="h-5 w-5" />}
                title="Prompt Engineering Tools"
                description="Advanced prompt management and templates"
                details={[
                  "Create and manage prompt templates",
                  "Template variables and placeholders",
                  "Public and private templates",
                  "Template categories and tags",
                  "Template ratings and reviews",
                  "Template usage tracking",
                  "Template library browsing",
                  "Quick template insertion in chat",
                  "Template sharing and discovery",
                ]}
              />

              <FeatureSection
                icon={<Code className="h-5 w-5" />}
                title="Conversation Branching"
                description="Explore multiple conversation paths"
                details={[
                  "Create branches from any message",
                  "Multiple parallel conversation paths",
                  "Branch naming and organization",
                  "Switch between branches",
                  "Branch message history",
                  "Parent message tracking",
                  "Branch deletion and cleanup",
                ]}
              />

              <FeatureSection
                icon={<Webhook className="h-5 w-5" />}
                title="Webhooks"
                description="Event-driven integrations"
                details={[
                  "Create webhook configurations",
                  "HTTP method selection (GET, POST, PUT, DELETE)",
                  "Custom headers and authentication",
                  "Bearer token and API key auth",
                  "Request body templates",
                  "Webhook testing and validation",
                  "SSRF protection for webhook URLs",
                  "Webhook execution history",
                  "Error handling and retry logic",
                ]}
              />

              <FeatureSection
                icon={<Plug className="h-5 w-5" />}
                title="Third-Party Integrations"
                description="Connect with automation platforms"
                details={[
                  "Zapier integration with API key authentication",
                  "Make.com (Integromat) integration",
                  "n8n integration support",
                  "Custom integration support",
                  "Pre-built triggers (new message, model created, image generated)",
                  "Pre-built actions (send message, generate image, list models)",
                  "Webhook URL configuration",
                  "Integration API key management",
                  "Event queuing and delivery",
                  "Integration usage tracking",
                ]}
              />

              <FeatureSection
                icon={<Key className="h-5 w-5" />}
                title="API Keys & Access"
                description="Programmatic access to the platform"
                details={[
                  "User API key generation and management",
                  "Model-specific API keys",
                  "API key expiration dates",
                  "API key usage tracking",
                  "Last used timestamp",
                  "API key deletion and rotation",
                  "Integration API keys",
                  "Workspace API keys",
                ]}
              />

              <FeatureSection
                icon={<History className="h-5 w-5" />}
                title="History & Analytics"
                description="Usage tracking and insights"
                details={[
                  "Conversation history",
                  "Usage logs with token tracking",
                  "Cost calculation per request",
                  "Model performance metrics",
                  "User analytics dashboard",
                  "Admin statistics",
                  "Cost tracking per user",
                  "Message quota tracking",
                  "Image quota tracking",
                ]}
              />

              <FeatureSection
                icon={<Upload className="h-5 w-5" />}
                title="Document Processing"
                description="AI-powered document analysis"
                details={[
                  "Upload PDF, DOCX, TXT, and Markdown files",
                  "Document text extraction",
                  "Document analysis with AI",
                  "Document storage and management",
                  "Document metadata tracking",
                  "Support for files up to 10MB",
                  "Document deletion and cleanup",
                ]}
              />

              <FeatureSection
                icon={<Shield className="h-5 w-5" />}
                title="Security Features"
                description="Enterprise-grade security"
                details={[
                  "Password hashing with bcrypt",
                  "Session-based authentication",
                  "Email verification",
                  "API key authentication",
                  "Rate limiting for code execution",
                  "Input validation and sanitization",
                  "Content filtering",
                  "SSRF protection",
                  "SQL injection prevention (parameterized queries)",
                  "XSS protection",
                  "CSRF protection",
                  "Secure cookie settings",
                ]}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
              <APISection />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
              <DatabaseSection />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
              <SecuritySection />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
              <DeploymentSection />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
              <ConfigurationSection />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
              <ComponentsSection />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
              <ServicesSection />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
              <UsageSection />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureSection({ icon, title, description, details }: { icon: React.ReactNode; title: string; description: string; details: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {details.map((detail, i) => (
            <li key={i}>{detail}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function APISection() {
  const apiEndpoints = [
    { method: "GET", path: "/api/auth/user", desc: "Get current authenticated user", auth: true, body: null, response: "User object" },
    { method: "PATCH", path: "/api/auth/user", desc: "Update user profile (firstName, lastName, companyName)", auth: true, body: "UpdateUserProfile", response: "Updated user" },
    { method: "DELETE", path: "/api/auth/user", desc: "Delete user account (requires password)", auth: true, body: "{ password: string }", response: "{ success: true }" },
    { method: "GET", path: "/api/auth/verify-email", desc: "Verify email address with token", auth: false, body: null, response: "Redirect or JSON" },
    { method: "PATCH", path: "/api/auth/newsletter", desc: "Update newsletter subscription", auth: true, body: "{ subscribed: boolean }", response: "Updated user" },
    { method: "POST", path: "/api/auth/apply-coupon", desc: "Apply coupon code to subscription", auth: true, body: "{ couponCode: string }", response: "Subscription update" },
    { method: "POST", path: "/api/create-checkout-session", desc: "Create Stripe checkout session for subscription", auth: true, body: "{ planId: string, couponCode?: string }", response: "{ sessionId: string, url: string }" },
    { method: "POST", path: "/api/webhook/stripe", desc: "Stripe webhook handler for payment events", auth: false, body: "Stripe event", response: "200 OK" },
    { method: "GET", path: "/api/verify-payment", desc: "Verify payment status by session ID", auth: true, body: null, response: "{ verified: boolean }" },
    { method: "GET", path: "/api/models", desc: "Get all user's AI models (auto-seeds defaults if empty)", auth: true, body: null, response: "AIModel[]" },
    { method: "GET", path: "/api/models/:id", desc: "Get specific AI model by ID", auth: true, body: null, response: "AIModel" },
    { method: "POST", path: "/api/models", desc: "Create new AI model", auth: true, body: "InsertAIModel", response: "AIModel" },
    { method: "PATCH", path: "/api/models/:id", desc: "Update AI model (creates version snapshot)", auth: true, body: "Partial<InsertAIModel>", response: "AIModel" },
    { method: "DELETE", path: "/api/models/:id", desc: "Delete AI model", auth: true, body: null, response: "{ success: true }" },
    { method: "POST", path: "/api/models/:id/restore", desc: "Restore model from version history", auth: true, body: "{ versionId: string }", response: "AIModel" },
    { method: "GET", path: "/api/models/:id/versions", desc: "Get model version history", auth: true, body: null, response: "ModelVersion[]" },
    { method: "POST", path: "/api/chat", desc: "Stream chat completion (SSE)", auth: true, body: "{ modelId: string, message: string, conversationId?: string }", response: "text/event-stream" },
    { method: "POST", path: "/api/v1/chat", desc: "Public API chat endpoint (non-streaming)", auth: "api_key", body: "{ modelId: string, message: string }", response: "{ response: string, usage: object }" },
    { method: "POST", path: "/api/generate-image", desc: "Generate AI image", auth: true, body: "{ modelId: string, prompt: string, conversationId?: string }", response: "{ imageUrl: string, conversationId: string }" },
    { method: "POST", path: "/api/chat/analyze-image", desc: "Analyze uploaded image with AI", auth: true, body: "{ modelId: string, imageData: string, prompt?: string, conversationId?: string }", response: "{ analysis: string, conversationId: string }" },
    { method: "POST", path: "/api/execute-code", desc: "Execute Python/JavaScript code (sandboxed)", auth: true, body: "{ code: string, language: 'python' | 'javascript' }", response: "{ output: string, error?: string, executionTime: number }" },
    { method: "POST", path: "/api/documents/upload", desc: "Upload document for analysis (multipart)", auth: true, body: "FormData with 'document' file", response: "{ id: string, extractedText: string, summary?: string }" },
    { method: "GET", path: "/api/documents", desc: "Get user's documents", auth: true, body: null, response: "Document[]" },
    { method: "DELETE", path: "/api/documents/:id", desc: "Delete document", auth: true, body: null, response: "{ success: true }" },
    { method: "GET", path: "/api/conversations", desc: "Get user's conversations", auth: true, body: null, response: "Conversation[]" },
    { method: "GET", path: "/api/conversations/:id", desc: "Get specific conversation with messages", auth: true, body: null, response: "Conversation" },
    { method: "POST", path: "/api/conversations", desc: "Create new conversation", auth: true, body: "InsertConversation", response: "Conversation" },
    { method: "PATCH", path: "/api/conversations/:id", desc: "Update conversation (title, messages)", auth: true, body: "Partial<InsertConversation>", response: "Conversation" },
    { method: "DELETE", path: "/api/conversations/:id", desc: "Delete conversation", auth: true, body: null, response: "{ success: true }" },
    { method: "POST", path: "/api/conversations/:id/branches", desc: "Create conversation branch from message", auth: true, body: "{ parentMessageId: string, branchName?: string, initialMessage?: Message }", response: "ConversationBranch" },
    { method: "GET", path: "/api/conversations/:id/branches", desc: "Get all branches for conversation", auth: true, body: null, response: "ConversationBranch[]" },
    { method: "GET", path: "/api/branches/:id", desc: "Get specific branch with messages", auth: true, body: null, response: "ConversationBranch" },
    { method: "POST", path: "/api/conversations/:id/switch-branch", desc: "Switch active branch in conversation", auth: true, body: "{ branchId: string | null }", response: "{ success: true }" },
    { method: "POST", path: "/api/prompt-templates", desc: "Create prompt template", auth: true, body: "InsertPromptTemplate", response: "PromptTemplate" },
    { method: "GET", path: "/api/prompt-templates", desc: "Get user's prompt templates", auth: true, body: null, response: "PromptTemplate[]" },
    { method: "GET", path: "/api/prompt-templates/public", desc: "Get public templates (optionally filtered by category)", auth: true, body: null, response: "PromptTemplate[]" },
    { method: "GET", path: "/api/prompt-templates/:id", desc: "Get specific template (user's or public)", auth: true, body: null, response: "PromptTemplate" },
    { method: "PUT", path: "/api/prompt-templates/:id", desc: "Update prompt template", auth: true, body: "Partial<InsertPromptTemplate>", response: "PromptTemplate" },
    { method: "DELETE", path: "/api/prompt-templates/:id", desc: "Delete prompt template", auth: true, body: null, response: "{ success: true }" },
    { method: "POST", path: "/api/prompt-templates/:id/use", desc: "Use template (increments usage counter)", auth: true, body: null, response: "{ success: true }" },
    { method: "POST", path: "/api/prompt-templates/:id/rate", desc: "Rate template (1-5 stars)", auth: true, body: "{ rating: number }", response: "Rating result" },
    { method: "GET", path: "/api/workflows", desc: "Get user's workflows", auth: true, body: null, response: "Workflow[]" },
    { method: "POST", path: "/api/workflows", desc: "Create workflow", auth: true, body: "InsertWorkflow", response: "Workflow" },
    { method: "GET", path: "/api/workflows/:id", desc: "Get specific workflow", auth: true, body: null, response: "Workflow" },
    { method: "PATCH", path: "/api/workflows/:id", desc: "Update workflow", auth: true, body: "Partial<InsertWorkflow>", response: "Workflow" },
    { method: "DELETE", path: "/api/workflows/:id", desc: "Delete workflow", auth: true, body: null, response: "{ success: true }" },
    { method: "POST", path: "/api/workflows/:id/run", desc: "Execute workflow with input", auth: true, body: "{ input: object }", response: "WorkflowRun" },
    { method: "GET", path: "/api/workflows/:id/runs", desc: "Get workflow execution history", auth: true, body: null, response: "WorkflowRun[]" },
    { method: "GET", path: "/api/marketplace/models", desc: "Get all public marketplace models", auth: true, body: null, response: "AIModel[]" },
    { method: "POST", path: "/api/marketplace/models/:id/like", desc: "Like a marketplace model", auth: true, body: null, response: "{ success: true }" },
    { method: "DELETE", path: "/api/marketplace/models/:id/like", desc: "Unlike a marketplace model", auth: true, body: null, response: "{ success: true }" },
    { method: "GET", path: "/api/marketplace/models/:id/liked", desc: "Check if model is liked by user", auth: true, body: null, response: "{ liked: boolean }" },
    { method: "POST", path: "/api/marketplace/models/:id/clone", desc: "Clone a marketplace model to your account", auth: true, body: null, response: "AIModel" },
    { method: "GET", path: "/api/workspaces", desc: "Get user's workspaces (owned and member)", auth: true, body: null, response: "Workspace[]" },
    { method: "POST", path: "/api/workspaces", desc: "Create new workspace", auth: true, body: "InsertWorkspace", response: "Workspace" },
    { method: "GET", path: "/api/workspaces/:id", desc: "Get workspace (must be member)", auth: true, body: null, response: "Workspace" },
    { method: "PATCH", path: "/api/workspaces/:id", desc: "Update workspace (must be owner/admin)", auth: true, body: "Partial<InsertWorkspace>", response: "Workspace" },
    { method: "DELETE", path: "/api/workspaces/:id", desc: "Delete workspace (owner only)", auth: true, body: null, response: "{ success: true }" },
    { method: "GET", path: "/api/workspaces/:id/members", desc: "Get workspace members", auth: true, body: null, response: "WorkspaceMember[]" },
    { method: "POST", path: "/api/workspaces/:id/members", desc: "Add workspace member (owner/admin only)", auth: true, body: "InsertWorkspaceMember", response: "WorkspaceMember" },
    { method: "PATCH", path: "/api/workspaces/:id/members/:userId", desc: "Update member role (owner/admin only)", auth: true, body: "{ role: WorkspaceRole }", response: "WorkspaceMember" },
    { method: "DELETE", path: "/api/workspaces/:id/members/:userId", desc: "Remove member (owner/admin only)", auth: true, body: null, response: "{ success: true }" },
    { method: "GET", path: "/api/keys", desc: "Get user's API keys", auth: true, body: null, response: "ApiKey[]" },
    { method: "POST", path: "/api/keys", desc: "Create API key", auth: true, body: "InsertApiKey", response: "{ ...ApiKey, key: string }" },
    { method: "DELETE", path: "/api/keys/:id", desc: "Delete API key", auth: true, body: null, response: "{ success: true }" },
    { method: "POST", path: "/api/webhooks", desc: "Create webhook configuration", auth: true, body: "InsertWebhookConfiguration", response: "WebhookConfiguration" },
    { method: "GET", path: "/api/webhooks", desc: "Get user's webhook configurations", auth: true, body: null, response: "WebhookConfiguration[]" },
    { method: "GET", path: "/api/webhooks/:id", desc: "Get specific webhook", auth: true, body: null, response: "WebhookConfiguration" },
    { method: "PATCH", path: "/api/webhooks/:id", desc: "Update webhook configuration", auth: true, body: "Partial<InsertWebhookConfiguration>", response: "WebhookConfiguration" },
    { method: "DELETE", path: "/api/webhooks/:id", desc: "Delete webhook", auth: true, body: null, response: "{ success: true }" },
    { method: "POST", path: "/api/webhooks/:id/test", desc: "Test webhook with sample data", auth: true, body: "{ testData?: object }", response: "{ success: boolean, response: object }" },
    { method: "POST", path: "/api/integrations", desc: "Create integration (returns API key)", auth: true, body: "InsertIntegration", response: "{ ...Integration, apiKey: string }" },
    { method: "GET", path: "/api/integrations", desc: "Get user's integrations (API keys hidden)", auth: true, body: null, response: "Integration[]" },
    { method: "GET", path: "/api/integrations/:id", desc: "Get integration (with API key if owned)", auth: true, body: null, response: "Integration" },
    { method: "PATCH", path: "/api/integrations/:id", desc: "Update integration", auth: true, body: "Partial<InsertIntegration>", response: "Integration" },
    { method: "DELETE", path: "/api/integrations/:id", desc: "Delete integration", auth: true, body: null, response: "{ success: true }" },
    { method: "GET", path: "/api/integrations/triggers", desc: "Get available trigger types", auth: "api_key", body: null, response: "Trigger[]" },
    { method: "GET", path: "/api/integrations/triggers/:key", desc: "Poll for trigger events (Zapier-style)", auth: "api_key", body: null, response: "EventData[]" },
    { method: "GET", path: "/api/integrations/actions", desc: "Get available action types", auth: "api_key", body: null, response: "Action[]" },
    { method: "POST", path: "/api/integrations/actions/send_message", desc: "Send message to AI model", auth: "api_key", body: "{ modelId: string, message: string, conversationId?: string }", response: "{ success: true, response: string, conversationId: string }" },
    { method: "POST", path: "/api/integrations/actions/generate_image", desc: "Generate image with AI", auth: "api_key", body: "{ modelId: string, prompt: string }", response: "{ success: true, imageUrl: string, imageType: string }" },
    { method: "POST", path: "/api/integrations/actions/list_models", desc: "List available AI models", auth: "api_key", body: null, response: "{ success: true, models: AIModel[] }" },
    { method: "POST", path: "/api/audio/transcribe", desc: "Transcribe audio to text (Whisper)", auth: true, body: "{ audioData: string (base64), language?: string, conversationId?: string }", response: "{ text: string, language: string, duration?: number, audioUrl: string }" },
    { method: "POST", path: "/api/audio/speak", desc: "Convert text to speech (OpenAI TTS)", auth: true, body: "{ text: string, voice?: string, model?: string, conversationId?: string }", response: "{ audioUrl: string, mimeType: string }" },
    { method: "POST", path: "/api/video/analyze", desc: "Analyze video content (base64)", auth: true, body: "{ videoData: string (base64), prompt?: string, conversationId?: string }", response: "{ description: string, transcription?: string, keyFrames?: array, metadata?: object, videoUrl: string }" },
    { method: "POST", path: "/api/video/upload", desc: "Upload video file (multipart)", auth: true, body: "FormData with 'video' file, prompt?, conversationId?", response: "{ description: string, videoUrl: string, metadata?: object }" },
    { method: "GET", path: "/api/media", desc: "Get user's media assets (audio/video)", auth: true, body: null, response: "MediaAsset[]" },
    { method: "GET", path: "/tmp-media/:filename", desc: "Serve media files from storage", auth: false, body: null, response: "File stream" },
    { method: "GET", path: "/api/analytics/usage", desc: "Get user usage analytics", auth: true, body: null, response: "UsageStats" },
    { method: "GET", path: "/api/analytics/models/:id", desc: "Get model-specific analytics", auth: true, body: null, response: "ModelAnalytics" },
    { method: "GET", path: "/api/admin/stats", desc: "Get admin dashboard statistics", auth: "admin", body: null, response: "AdminStats" },
    { method: "GET", path: "/api/admin/cost-stats", desc: "Get cost statistics per user", auth: "admin", body: null, response: "UserCostStat[]" },
    { method: "GET", path: "/api/admin/users", desc: "Get all users (admin only)", auth: "admin", body: null, response: "User[]" },
    { method: "PATCH", path: "/api/admin/users/:userId/admin-status", desc: "Update user admin status", auth: "admin", body: "{ isAdmin: boolean }", response: "User" },
    { method: "GET", path: "/api/admin/users/:userId/conversations", desc: "Get all conversations for a user", auth: "admin", body: null, response: "Conversation[]" },
    { method: "GET", path: "/api/admin/newsletter/subscribers", desc: "Get newsletter subscribers", auth: "admin", body: null, response: "User[]" },
    { method: "POST", path: "/api/admin/newsletter/send", desc: "Send newsletter email", auth: "admin", body: "{ subject: string, headline: string, content: string, ctaText?: string, ctaUrl?: string }", response: "{ success: true }" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Endpoints Reference</CardTitle>
        <CardDescription>Complete list of all API endpoints with authentication requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap mb-4">
            <Badge variant="outline">GET</Badge>
            <Badge variant="outline">POST</Badge>
            <Badge variant="outline">PATCH</Badge>
            <Badge variant="outline">PUT</Badge>
            <Badge variant="outline">DELETE</Badge>
            <Badge>Auth Required</Badge>
            <Badge variant="secondary">API Key</Badge>
            <Badge variant="destructive">Admin Only</Badge>
          </div>
          <div className="space-y-3">
            {apiEndpoints.map((endpoint, i) => (
              <div key={i} className="p-4 border rounded-md space-y-2">
                <div className="flex items-start gap-4">
                  <Badge variant={endpoint.method === "GET" ? "outline" : endpoint.method === "POST" ? "default" : "secondary"}>
                    {endpoint.method}
                  </Badge>
                  <code className="flex-1 text-sm font-mono font-semibold">{endpoint.path}</code>
                  <Badge variant={endpoint.auth === "admin" ? "destructive" : endpoint.auth === "api_key" ? "secondary" : endpoint.auth === true ? "default" : "outline"}>
                    {endpoint.auth === true ? "Auth" : endpoint.auth === "admin" ? "Admin" : endpoint.auth === "api_key" ? "API Key" : "Public"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground ml-12">{endpoint.desc}</div>
                {endpoint.body && (
                  <div className="ml-12 text-xs">
                    <span className="font-semibold">Request Body: </span>
                    <code className="text-muted-foreground">{endpoint.body}</code>
                  </div>
                )}
                {endpoint.response && (
                  <div className="ml-12 text-xs">
                    <span className="font-semibold">Response: </span>
                    <code className="text-muted-foreground">{endpoint.response}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DatabaseSection() {
  const tables = [
    { 
      name: "users", 
      desc: "User accounts, authentication, subscriptions, quotas",
      fields: ["id", "email", "password (hashed)", "firstName", "lastName", "companyName", "profileImageUrl", "isAdmin", "stripeCustomerId", "stripeSubscriptionId", "subscriptionTier", "subscriptionStatus", "billingPeriodEnd", "messageQuota", "messagesUsed", "imageQuota", "imagesUsed", "newsletterSubscribed", "emailVerified", "verificationToken", "couponCode", "createdAt", "updatedAt"]
    },
    { 
      name: "sessions", 
      desc: "Express session storage for authentication",
      fields: ["sid (primary key)", "sess (JSONB)", "expire (timestamp)"]
    },
    { 
      name: "ai_models", 
      desc: "AI model configurations and settings",
      fields: ["id", "userId", "workspaceId", "modelType", "name", "description", "systemPrompt", "model", "temperature", "maxTokens", "template", "isPublic", "isFavorite", "category", "tags (array)", "likesCount", "usageCount", "createdAt"]
    },
    { 
      name: "conversations", 
      desc: "Chat conversations with message history",
      fields: ["id", "userId", "modelId", "title", "messages (JSONB)", "branches (JSONB)", "activeBranchId", "createdAt", "updatedAt"]
    },
    { 
      name: "image_assets", 
      desc: "Generated and uploaded images metadata",
      fields: ["id", "userId", "storageKey", "publicUrl", "mimeType", "byteSize", "imageType", "prompt", "expiresAt", "createdAt"]
    },
    { 
      name: "documents", 
      desc: "Uploaded documents for analysis",
      fields: ["id", "userId", "conversationId", "fileName", "fileType", "mimeType", "byteSize", "storageKey", "publicUrl", "extractedText", "textChunks (JSONB)", "summary", "createdAt", "expiresAt"]
    },
    { 
      name: "usage_logs", 
      desc: "Token usage and cost tracking",
      fields: ["id", "userId", "modelId", "conversationId", "promptTokens", "completionTokens", "totalTokens", "model", "costUsd", "createdAt"]
    },
    { 
      name: "model_likes", 
      desc: "User likes on marketplace models",
      fields: ["id", "userId", "modelId", "createdAt"]
    },
    { 
      name: "workspaces", 
      desc: "Team workspaces",
      fields: ["id", "name", "description", "ownerId", "createdAt", "updatedAt"]
    },
    { 
      name: "workspace_members", 
      desc: "Workspace membership and roles",
      fields: ["id", "workspaceId", "userId", "role (owner/admin/editor/viewer)", "createdAt"]
    },
    { 
      name: "api_keys", 
      desc: "User API keys for programmatic access",
      fields: ["id", "userId", "modelId", "name", "key (hashed)", "lastUsed", "expiresAt", "createdAt"]
    },
    { 
      name: "model_versions", 
      desc: "Version history for AI models",
      fields: ["id", "modelId", "versionNumber", "name", "description", "systemPrompt", "model", "temperature", "maxTokens", "template", "category", "tags", "changeDescription", "createdBy", "createdAt"]
    },
    { 
      name: "generated_images", 
      desc: "Generated image records",
      fields: ["id", "userId", "modelId", "prompt", "imageUrl", "imageType", "createdAt"]
    },
    { 
      name: "workflows", 
      desc: "Multi-model workflow definitions",
      fields: ["id", "userId", "workspaceId", "name", "description", "steps (JSONB)", "triggerType", "enabled", "createdAt", "updatedAt"]
    },
    { 
      name: "workflow_runs", 
      desc: "Workflow execution history",
      fields: ["id", "workflowId", "userId", "status", "input (JSONB)", "output (JSONB)", "error", "startedAt", "completedAt"]
    },
    { 
      name: "webhook_configurations", 
      desc: "Webhook endpoint configurations",
      fields: ["id", "userId", "workspaceId", "name", "description", "url", "method", "headers (JSONB)", "bodyTemplate (JSONB)", "authType", "authConfig (JSONB)", "createdAt", "updatedAt"]
    },
    { 
      name: "fine_tuning_files", 
      desc: "Fine-tuning training files",
      fields: ["id", "userId", "openaiFileId", "fileName", "fileSize", "purpose", "exampleCount", "status", "createdAt"]
    },
    { 
      name: "fine_tuning_jobs", 
      desc: "Fine-tuning job tracking",
      fields: ["id", "userId", "openaiJobId", "trainingFileId", "validationFileId", "baseModel", "fineTunedModel", "suffix", "hyperparameters (JSONB)", "status", "trainedTokens", "estimatedCost", "error", "createdAt", "updatedAt", "finishedAt"]
    },
    { 
      name: "conversation_branches", 
      desc: "Conversation branch data",
      fields: ["id", "conversationId", "parentMessageId", "branchName", "messages (JSONB)", "createdAt", "updatedAt"]
    },
    { 
      name: "prompt_templates", 
      desc: "Prompt template library",
      fields: ["id", "userId", "workspaceId", "name", "description", "category", "prompt", "variables (JSONB)", "modelId", "isPublic", "isFavorite", "usageCount", "rating", "ratingCount", "tags (JSONB)", "createdAt", "updatedAt"]
    },
    { 
      name: "prompt_template_ratings", 
      desc: "Template ratings and reviews",
      fields: ["id", "templateId", "userId", "rating (1-5)", "createdAt"]
    },
    { 
      name: "integrations", 
      desc: "Third-party integration connections",
      fields: ["id", "userId", "workspaceId", "type", "name", "description", "apiKey", "webhookUrl", "config (JSONB)", "enabled", "lastUsed", "createdAt", "updatedAt"]
    },
    { 
      name: "integration_events", 
      desc: "Integration event queue",
      fields: ["id", "integrationId", "eventType", "eventData (JSONB)", "delivered", "deliveredAt", "error", "createdAt"]
    },
    { 
      name: "media_assets", 
      desc: "Audio and video file metadata",
      fields: ["id", "userId", "conversationId", "mediaType", "contentType", "storageKey", "publicUrl", "byteSize", "duration", "transcription", "transcriptionLanguage", "metadata (JSONB)", "expiresAt", "createdAt"]
    },
    { 
      name: "stripe_checkout_sessions", 
      desc: "Stripe payment session tracking",
      fields: ["sessionId (primary key)", "userId", "processed", "processedAt", "createdAt"]
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Schema</CardTitle>
        <CardDescription>Complete PostgreSQL database schema with all tables and fields</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tables.map((table, i) => (
            <div key={i} className="p-4 border rounded-md space-y-2">
              <div className="font-mono font-semibold text-lg mb-1">{table.name}</div>
              <div className="text-sm text-muted-foreground mb-2">{table.desc}</div>
              {table.fields && (
                <div>
                  <div className="text-xs font-semibold mb-1">Fields:</div>
                  <div className="flex flex-wrap gap-1">
                    {table.fields.map((field, j) => (
                      <Badge key={j} variant="outline" className="text-xs font-mono">{field}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Authentication & Authorization</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Password hashing with bcrypt (10 rounds)</li>
            <li>Session-based authentication with secure cookies</li>
            <li>Email verification required for account activation</li>
            <li>API key authentication for programmatic access</li>
            <li>Role-based access control (admin, user)</li>
            <li>Workspace role permissions (owner, admin, editor, viewer)</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Code Execution Security</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Rate limiting: 10 executions per user per minute</li>
            <li>Code length limit: 5,000 characters</li>
            <li>Dangerous pattern detection and blocking</li>
            <li>Python: Restricted builtins, process isolation, 3-second timeout</li>
            <li>JavaScript: VM sandbox, restricted context, code generation disabled</li>
            <li>Output limits: 512KB for Python, 10KB for JavaScript</li>
            <li>Can be disabled via ENABLE_CODE_EXECUTION environment variable</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Input Validation</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Zod schema validation for all API inputs</li>
            <li>Content filtering for image prompts</li>
            <li>File type validation for uploads</li>
            <li>File size limits (10MB documents, 100MB videos)</li>
            <li>SSRF protection for webhook URLs</li>
            <li>SQL injection prevention with parameterized queries</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Data Protection</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>API keys stored as SHA-256 hashes</li>
            <li>Passwords never stored in plaintext</li>
            <li>Secure session cookies (httpOnly, secure in production)</li>
            <li>HTTPS required in production</li>
            <li>Environment variable protection</li>
            <li>Automatic cleanup of expired temporary files</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function DeploymentSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Guide</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Prerequisites</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Node.js 18+ installed</li>
            <li>PostgreSQL database (Neon recommended)</li>
            <li>Cloudflare R2 account for media storage</li>
            <li>Resend account for email</li>
            <li>Stripe account for payments (optional)</li>
            <li>OpenAI API key</li>
            <li>Stability AI API key (for image generation)</li>
            <li>Google Gemini API key (optional)</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Environment Variables</h3>
          <p className="text-sm text-muted-foreground mb-2">See Configuration tab for complete list</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Build & Deploy</h3>
          <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-1">
            <div>npm install</div>
            <div>npm run build</div>
            <div>npm run db:push</div>
            <div>npm start</div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Supported Platforms</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Railway - Automatic deployment from GitHub</li>
            <li>Render - Web service with build commands</li>
            <li>Fly.io - CLI-based deployment</li>
            <li>Vercel - Frontend + serverless functions</li>
            <li>Any Node.js hosting platform</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigurationSection() {
  const envVars = [
    { name: "NODE_ENV", required: true, desc: "Environment: development or production" },
    { name: "PORT", required: false, desc: "Server port (default: 5000)" },
    { name: "DATABASE_URL", required: true, desc: "PostgreSQL connection string" },
    { name: "SESSION_SECRET", required: true, desc: "Random secret for session encryption" },
    { name: "OPENAI_API_KEY", required: false, desc: "OpenAI API key for chat and TTS" },
    { name: "STABILITY_API_KEY", required: false, desc: "Stability AI key for image generation" },
    { name: "AI_INTEGRATIONS_GEMINI_API_KEY", required: false, desc: "Google Gemini API key" },
    { name: "AI_INTEGRATIONS_GEMINI_BASE_URL", required: false, desc: "Gemini API base URL" },
    { name: "RESEND_API_KEY", required: true, desc: "Resend API key for emails" },
    { name: "RESEND_FROM", required: true, desc: "Sender email address" },
    { name: "STRIPE_SECRET_KEY", required: false, desc: "Stripe secret key for payments" },
    { name: "VITE_STRIPE_PUBLIC_KEY", required: false, desc: "Stripe public key for frontend" },
    { name: "R2_ACCOUNT_ID", required: false, desc: "Cloudflare R2 account ID" },
    { name: "R2_ACCESS_KEY_ID", required: false, desc: "R2 access key" },
    { name: "R2_SECRET_ACCESS_KEY", required: false, desc: "R2 secret key" },
    { name: "R2_BUCKET_NAME", required: false, desc: "R2 bucket name" },
    { name: "R2_PUBLIC_DOMAIN", required: false, desc: "Custom domain for R2" },
    { name: "ENABLE_CODE_EXECUTION", required: false, desc: "Enable code execution (true/false)" },
    { name: "IMAGE_BASE_URL", required: false, desc: "Base URL for image serving" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>Environment variables and configuration options</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {envVars.map((env, i) => (
            <div key={i} className="p-3 border rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <code className="font-mono font-semibold">{env.name}</code>
                {env.required && <Badge variant="destructive">Required</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">{env.desc}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ComponentsSection() {
  const components = [
    { 
      name: "ChatInterface", 
      desc: "Main chat component with streaming, voice, video, images",
      props: ["modelName", "conversationId", "onSendMessage", "onGenerateImage", "onAnalyzeImage", "initialMessages", "isLoading", "canUseImages", "disabled", "disabledMessage", "onMessagesUpdated"],
      features: ["Real-time streaming", "Voice recording", "Video analysis", "Image upload", "Code execution", "Conversation branching", "Prompt templates"]
    },
    { 
      name: "VoiceRecorder", 
      desc: "Audio recording and transcription component",
      props: ["onTranscriptionComplete", "conversationId", "language"],
      features: ["Browser MediaRecorder API", "WebM audio format", "OpenAI Whisper transcription", "Automatic transcription"]
    },
    { 
      name: "TextToSpeechPlayer", 
      desc: "Text-to-speech audio player",
      props: ["text", "voice", "conversationId"],
      features: ["OpenAI TTS", "6 voice options", "Auto-play support", "Audio controls"]
    },
    { 
      name: "VideoAnalyzer", 
      desc: "Video upload and analysis component",
      props: ["onAnalysisComplete", "conversationId"],
      features: ["File upload", "Video preview", "AI analysis", "Custom prompts", "Metadata extraction"]
    },
    { 
      name: "CodeBlock", 
      desc: "Syntax-highlighted code blocks with execution",
      props: ["code", "language"],
      features: ["Syntax highlighting", "Code execution", "Output display", "Error handling", "Rate limiting"]
    },
    { 
      name: "ConversationBranching", 
      desc: "Conversation branch management UI",
      props: ["conversationId", "messageId", "onBranchSwitched"],
      features: ["Create branches", "Switch branches", "Branch visualization", "Message history"]
    },
    { 
      name: "PromptTemplateLibrary", 
      desc: "Prompt template browser and selector",
      props: ["onSelectTemplate"],
      features: ["Template browsing", "Search and filter", "Public/private templates", "Quick insertion"]
    },
    { 
      name: "WorkflowBuilder", 
      desc: "Visual workflow creation interface",
      props: ["workflowId", "onSave"],
      features: ["Drag-and-drop", "Step configuration", "Conditional logic", "Parallel execution"]
    },
    { 
      name: "ModelConfigPanel", 
      desc: "AI model configuration form",
      props: ["model", "onSave", "onCancel"],
      features: ["System prompt editor", "Temperature slider", "Token limits", "Model selection", "Category/tags"]
    },
    { 
      name: "ModelVersionHistory", 
      desc: "Model version timeline and restore",
      props: ["modelId"],
      features: ["Version timeline", "Change descriptions", "Rollback capability", "Version comparison"]
    },
    { 
      name: "AppSidebar", 
      desc: "Main navigation sidebar",
      props: [],
      features: ["Navigation menu", "Quick actions", "System status", "Theme support"]
    },
    { 
      name: "UserMenu", 
      desc: "User profile dropdown menu",
      props: [],
      features: ["Profile access", "Settings link", "Logout", "Subscription status"]
    },
    { 
      name: "ThemeToggle", 
      desc: "Dark/light mode switcher",
      props: [],
      features: ["Theme switching", "Persistent preference", "System preference detection"]
    },
    { 
      name: "StatsCard", 
      desc: "Dashboard statistics display",
      props: ["title", "value", "icon", "trend"],
      features: ["Metric display", "Trend indicators", "Icon support"]
    },
    { 
      name: "ConversationCard", 
      desc: "Conversation preview card",
      props: ["conversation", "onDelete"],
      features: ["Preview", "Delete action", "Timestamp", "Model info"]
    },
    { 
      name: "ModelCard", 
      desc: "AI model display card",
      props: ["model", "onEdit", "onDelete"],
      features: ["Model info", "Quick actions", "Public/private badge", "Usage stats"]
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>React Components</CardTitle>
        <CardDescription>Complete frontend component library with props and features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {components.map((comp, i) => (
            <div key={i} className="p-4 border rounded-md space-y-2">
              <div className="font-mono font-semibold text-lg">{comp.name}</div>
              <div className="text-sm text-muted-foreground">{comp.desc}</div>
              {comp.props && comp.props.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-1">Props:</div>
                  <div className="flex flex-wrap gap-1">
                    {comp.props.map((prop, j) => (
                      <Badge key={j} variant="outline" className="text-xs">{prop}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {comp.features && (
                <div>
                  <div className="text-xs font-semibold mb-1">Features:</div>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                    {comp.features.map((feature, j) => (
                      <li key={j}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ServicesSection() {
  const services = [
    {
      name: "geminiService",
      file: "server/services/geminiService.ts",
      desc: "Google Gemini API integration for image generation and analysis",
      methods: [
        "generateImage(prompt: string) - Generate images using Gemini or Stability AI fallback",
        "analyzeImage(imageData: string, prompt?: string) - Analyze images with Gemini Vision",
      ],
      features: ["Image generation", "Image analysis", "Fallback to Stability AI", "Error handling"]
    },
    {
      name: "audioService",
      file: "server/services/audioService.ts",
      desc: "Audio processing with OpenAI Whisper and TTS",
      methods: [
        "transcribeAudio(audioBuffer: Buffer, language?: string) - Transcribe audio to text",
        "textToSpeech(text: string, voice?: string, model?: string) - Convert text to speech",
        "transcribeAudioStream(audioChunks: AsyncIterable<Buffer>) - Stream transcription (future)",
      ],
      features: ["Whisper transcription", "OpenAI TTS", "Language detection", "Multiple voices", "Streaming support"]
    },
    {
      name: "videoService",
      file: "server/services/videoService.ts",
      desc: "Video analysis and processing",
      methods: [
        "analyzeVideo(videoUrl: string, prompt?: string) - Analyze video content",
        "transcribeVideoAudio(videoUrl: string) - Extract and transcribe audio",
        "extractVideoFrames(videoBuffer: Buffer, frameCount: number) - Extract key frames",
      ],
      features: ["Video analysis", "Frame extraction", "Audio transcription", "Gemini Vision integration"]
    },
    {
      name: "imageStore",
      file: "server/services/imageStore.ts",
      desc: "Image storage abstraction with R2 and local support",
      methods: [
        "store(imageData: string, userId: string, imageType: string, prompt?: string) - Store image",
        "delete(storageKey: string) - Delete image",
        "cleanup() - Remove expired images",
      ],
      implementations: ["LocalTempImageStore - Local /tmp storage", "CloudflareR2ImageStore - R2 cloud storage"],
      features: ["Automatic fallback", "Expiration handling", "Size validation", "Public URL generation"]
    },
    {
      name: "mediaStore",
      file: "server/services/mediaStore.ts",
      desc: "Audio/video storage with R2 and local support",
      methods: [
        "store(mediaData: Buffer, userId: string, mediaType: string, mimeType: string) - Store media",
        "delete(storageKey: string) - Delete media",
        "cleanup() - Remove expired media",
      ],
      implementations: ["LocalTempMediaStore", "CloudflareR2MediaStore"],
      features: ["Audio/video support", "Format validation", "Size limits", "Automatic cleanup"]
    },
    {
      name: "documentService",
      file: "server/services/documentService.ts",
      desc: "Document processing and text extraction",
      methods: [
        "processDocument(file: Express.Multer.File) - Extract text from documents",
      ],
      features: ["PDF parsing", "DOCX parsing", "TXT/Markdown support", "Text chunking", "AI summarization"]
    },
    {
      name: "documentStore",
      file: "server/services/documentStore.ts",
      desc: "Document storage and management",
      methods: [
        "storeDocument(file: Express.Multer.File, userId: string) - Store document",
        "deleteDocument(storageKey: string) - Delete document",
      ],
      features: ["File storage", "Metadata tracking", "Text extraction storage", "Cleanup"]
    },
  ];

  return (
    <div className="space-y-6">
      {services.map((service, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {service.name}
            </CardTitle>
            <CardDescription>{service.desc}</CardDescription>
            <div className="text-xs font-mono text-muted-foreground mt-1">{service.file}</div>
          </CardHeader>
          <CardContent className="space-y-3">
            {service.methods && (
              <div>
                <div className="text-sm font-semibold mb-2">Methods:</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {service.methods.map((method, j) => (
                    <li key={j} className="font-mono text-xs">{method}</li>
                  ))}
                </ul>
              </div>
            )}
            {service.implementations && (
              <div>
                <div className="text-sm font-semibold mb-2">Implementations:</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {service.implementations.map((impl, j) => (
                    <li key={j}>{impl}</li>
                  ))}
                </ul>
              </div>
            )}
            {service.features && (
              <div>
                <div className="text-sm font-semibold mb-2">Features:</div>
                <div className="flex flex-wrap gap-1">
                  {service.features.map((feature, j) => (
                    <Badge key={j} variant="secondary" className="text-xs">{feature}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UsageSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Account Setup</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Register a new account with email and password</li>
              <li>Verify your email address via the verification link</li>
              <li>Complete your profile (optional)</li>
              <li>Configure your OpenAI API key in Settings (optional, uses server key if not set)</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Create Your First Model</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Click "New Model" in the sidebar or dashboard</li>
              <li>Enter a name and description</li>
              <li>Write a system prompt to define the AI's behavior</li>
              <li>Select an OpenAI model (GPT-4, GPT-3.5, etc.)</li>
              <li>Adjust temperature (0-100) and max tokens</li>
              <li>Save the model</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. Start Chatting</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Select a model from "My Models"</li>
              <li>Type your message in the chat input</li>
              <li>Watch the AI respond in real-time</li>
              <li>Use voice recording for hands-free input</li>
              <li>Generate images directly in chat</li>
              <li>Upload and analyze images/videos</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="workflows">
              <AccordionTrigger>Creating Workflows</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>Workflows allow you to chain multiple AI models and actions together:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to Workflows page</li>
                  <li>Click "Create Workflow"</li>
                  <li>Add steps: AI Chat, Condition, Delay, Webhook, Parallel</li>
                  <li>Configure each step with model, prompt, or conditions</li>
                  <li>Connect steps to create a flow</li>
                  <li>Test and run the workflow</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="fine-tuning">
              <AccordionTrigger>Fine-Tuning Models</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>Train custom AI models on your data:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Prepare training data in OpenAI fine-tuning format (JSONL)</li>
                  <li>Go to Fine-Tuning page</li>
                  <li>Upload your training file</li>
                  <li>Optionally upload a validation file</li>
                  <li>Select base model (gpt-3.5-turbo, gpt-4, etc.)</li>
                  <li>Configure hyperparameters</li>
                  <li>Start the fine-tuning job</li>
                  <li>Monitor progress and deploy when complete</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="integrations">
              <AccordionTrigger>Setting Up Integrations</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>Connect ModelAI with Zapier, Make.com, or custom integrations:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to Integrations page</li>
                  <li>Click "New Integration"</li>
                  <li>Select platform (Zapier, Make.com, n8n, or Custom)</li>
                  <li>Name your integration</li>
                  <li>Copy the API key (shown only once!)</li>
                  <li>Optionally configure a webhook URL for events</li>
                  <li>Use the API key in your automation platform</li>
                  <li>Set up triggers and actions using the API endpoints</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="workspaces">
              <AccordionTrigger>Team Collaboration</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>Collaborate with your team using workspaces:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Create a workspace from the Workspaces page</li>
                  <li>Invite team members by email</li>
                  <li>Assign roles: Owner, Admin, Editor, or Viewer</li>
                  <li>Share models and conversations within the workspace</li>
                  <li>Use workspace-level API keys for team access</li>
                  <li>Manage permissions and access control</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="marketplace">
              <AccordionTrigger>Using the Marketplace</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>Discover and share AI models:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Browse public models in the Marketplace</li>
                  <li>Search and filter by category, tags, or popularity</li>
                  <li>Like models you find useful</li>
                  <li>Clone models to your account to customize them</li>
                  <li>Make your models public to share with others</li>
                  <li>Rate and review models</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="prompt-templates">
              <AccordionTrigger>Prompt Engineering</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>Create and use prompt templates:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to Templates page or use the template library in chat</li>
                  <li>Browse public templates or create your own</li>
                  <li>Use variables in templates: {"{{variableName}}"}</li>
                  <li>Define default values for variables</li>
                  <li>Share templates publicly or keep them private</li>
                  <li>Rate and review templates</li>
                  <li>Quick-insert templates into chat conversations</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="branching">
              <AccordionTrigger>Conversation Branching</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>Explore multiple conversation paths:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>During a conversation, hover over any assistant message</li>
                  <li>Click "Create Branch" to start a new path</li>
                  <li>Name your branch for easy identification</li>
                  <li>Continue the conversation in the new branch</li>
                  <li>Switch between branches to compare responses</li>
                  <li>Delete branches you no longer need</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="api">
              <AccordionTrigger>Using the API</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>Programmatic access to ModelAI:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to API Keys page</li>
                  <li>Create a new API key</li>
                  <li>Copy the key (shown only once!)</li>
                  <li>Use the key in API requests: Header: X-API-Key</li>
                  <li>Access all endpoints programmatically</li>
                  <li>Create model-specific keys for granular access</li>
                  <li>Set expiration dates for security</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Model Configuration</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Use clear, specific system prompts for better results</li>
              <li>Start with lower temperature (50-70) for factual tasks</li>
              <li>Use higher temperature (80-90) for creative tasks</li>
              <li>Set appropriate max tokens based on expected response length</li>
              <li>Use categories and tags to organize models</li>
              <li>Version your models before major changes</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Conversation Management</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Use conversation titles to organize your chats</li>
              <li>Create branches to explore different approaches</li>
              <li>Use prompt templates for repetitive tasks</li>
              <li>Attach documents for context-aware responses</li>
              <li>Use voice input for longer messages</li>
              <li>Generate images directly in conversations when relevant</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Security</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Never share your API keys</li>
              <li>Use model-specific keys when possible</li>
              <li>Set expiration dates on API keys</li>
              <li>Review workspace member permissions regularly</li>
              <li>Keep sensitive data out of public models</li>
              <li>Use private workspaces for confidential projects</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Performance</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Monitor your usage and costs in Analytics</li>
              <li>Use appropriate models for tasks (GPT-3.5 for simple, GPT-4 for complex)</li>
              <li>Optimize prompts to reduce token usage</li>
              <li>Use workflows for repetitive multi-step tasks</li>
              <li>Cache frequently used templates</li>
              <li>Clean up old conversations and unused models</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold mb-2 text-foreground">Common Issues</h3>
            <Accordion type="single" collapsible>
              <AccordionItem value="chat-not-working">
                <AccordionTrigger>Chat not responding</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check your OpenAI API key is configured in Settings</li>
                    <li>Verify you haven't exceeded your message quota</li>
                    <li>Check browser console for errors</li>
                    <li>Ensure your model is saved and selected</li>
                    <li>Try refreshing the page</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="images-not-generating">
                <AccordionTrigger>Image generation failing</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check Stability AI API key is configured</li>
                    <li>Verify you haven't exceeded image quota</li>
                    <li>Check prompt doesn't violate content policy</li>
                    <li>Try a simpler prompt</li>
                    <li>Check API key has sufficient credits</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="voice-not-working">
                <AccordionTrigger>Voice recording issues</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Grant microphone permissions in browser</li>
                    <li>Check browser supports MediaRecorder API</li>
                    <li>Use Chrome or Edge for best compatibility</li>
                    <li>Check OpenAI API key for transcription</li>
                    <li>Ensure stable internet connection</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="api-errors">
                <AccordionTrigger>API errors</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Verify API key is correct and not expired</li>
                    <li>Check request format matches API documentation</li>
                    <li>Verify authentication headers are included</li>
                    <li>Check rate limits haven't been exceeded</li>
                    <li>Review error message for specific issue</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

