# AI Model Management Platform

## Overview
This AI Model Management Platform is a full-stack TypeScript web application designed to empower businesses to deploy, customize, and manage multiple AI assistants. It offers a user-friendly interface for creating custom AI models, managing conversations, and utilizing pre-built templates for common business tasks like customer support, content generation, and data analysis. The platform features a React frontend, an Express backend, and integrates real-time streaming chat capabilities via OpenAI. It aims to provide a production-ready solution for AI model deployment and management with robust backend integration, database persistence, and a focus on a "Warm Minimalism with Creative Energy" design.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform adopts a "Warm Minimalism with Creative Energy" design philosophy, inspired by modern applications like Notion and Figma. This includes a warm color palette with a coral primary (#FF6B4A), soft beige sidebar, and warm neutral backgrounds. Component shapes feature organic border radii (rounded-xl buttons, rounded-full badges, rounded-lg inputs, rounded-2xl cards). The Geist font family provides clean, modern typography. Subtle shadows, smooth transitions, and gradient overlays in hero sections contribute to a welcoming and interactive user experience.

### Technical Implementations
The frontend is built with React and TypeScript, using Vite for fast development and Wouter for routing. State management relies on TanStack Query for server-side data and React hooks for local component state. Shadcn/ui provides a robust UI component system styled with Tailwind CSS.

The backend is an Express.js application written in TypeScript, featuring RESTful API endpoints with Zod schema validation for data integrity. Streaming responses for chat interactions are implemented using Server-Sent Events. Authentication is handled via Passport Local Strategy with bcrypt for password hashing and PostgreSQL-backed sessions for persistence. All API routes are protected, and data is isolated per user. An admin dashboard provides platform administration capabilities with role-based access control.

### Feature Specifications
The platform includes:
- **Authentication:** Traditional email/password login with email verification and secure session management.
  - Email verification required: New users receive a verification email and must verify before login
  - Verification tokens expire in 24 hours for security
  - Auto-login after successful email verification
  - User menu with avatar showing user initials
  - Dropdown menu displaying name and email
  - Settings shortcut from user menu
  - Logout functionality to switch between accounts
  - All user data automatically saved and isolated per account
- **AI Model Management:** Create, view, edit, and delete AI models with custom prompts and parameters.
  - Model export/import in JSON format for backup and sharing
  - Public/private visibility toggle for marketplace sharing
  - Category and tag organization for discovery
- **Model API Access:** Generate secure API keys to integrate AI models into external applications.
  - Create API keys with custom names and optional model scoping
  - API keys hashed with SHA-256 before storage for security
  - Keys shown in full only once upon creation, then masked
  - Optional expiration dates (7, 30, 90, 365 days or never)
  - Last used timestamp tracking
  - Public API endpoint (/api/v1/chat) for programmatic access
  - API key authentication via X-API-Key header
- **Team Workspaces:** Collaborate with team members and share AI models.
  - Create workspaces for team collaboration
  - Role-based access control (owner, admin, editor, viewer)
  - Add/remove team members with specific roles
  - Owners auto-added as workspace owners upon creation
  - Models can be assigned to workspaces for team access
- **Model Marketplace:** Discover, like, and clone AI models shared by the community.
  - Browse public models from all users
  - Search and filter by name, description, category
  - Like models to show appreciation
  - Clone models to your account with one click
  - Models ranked by popularity (likes and usage)
  - Community engagement with usage statistics
- **Conversation Management:** Real-time streaming chat, conversation history, and export capabilities.
- **Templates:** Pre-configured AI assistant templates for various use cases.
- **Image Generation & Analysis:** AI-powered image generation from text prompts and image analysis using Gemini AI (available to all users).
  - Text-to-image generation with natural language prompts
  - Image upload and AI-powered analysis
  - Quota tracking (10 images for Free tier, 100 for Pro, 1000 for Enterprise)
  - Temporary local storage with 24-hour expiration
  - Available to all authenticated users with quota enforcement
- **Document Analysis:** Upload and extract text from documents and images for AI-powered analysis (development feature).
  - Support for PDF, DOCX, PNG, TXT, and Markdown files
  - PNG image analysis using Gemini AI vision (extracts text via OCR and describes visual content)
  - 10MB file size limit
  - Text extraction with automatic chunking (3000 characters per chunk)
  - Security: MIME type validation, magic byte verification, filename sanitization
  - User-scoped storage and access control
  - API endpoints: POST /api/documents/upload, GET /api/documents, GET /api/documents/:id, DELETE /api/documents/:id
  - **Production Note:** Current implementation includes basic security measures. Production deployment requires additional security layers:
    - Antivirus/malware scanning (ClamAV or cloud service)
    - Sandboxed document processing
    - Rate limiting on uploads
    - Enhanced file validation beyond magic bytes
    - Content Security Policy for served files
- **User Settings:** Account information management, personal OpenAI API key configuration, and newsletter subscription.
  - Newsletter subscription: Opt-in to receive product updates, best practices, and AI tips
  - Newsletter toggle in settings with subscription date tracking
  - Success/error feedback via toast notifications
- **Coupon Code System:** Redeem promotional codes to unlock premium subscriptions.
  - Apply coupon codes in settings to upgrade subscription tier
  - "christmas2024" coupon grants Pro tier with 1,000 message quota and 100 image generations
  - One-time redemption per user with tracking of applied coupon and date
  - Visual display of active subscription with tier badge
  - Prevents duplicate coupon usage
- **Stripe Payment Integration:** Secure one-time payment to upgrade to Pro tier.
  - $10 one-time payment for Pro tier upgrade
  - Integrated Stripe Checkout with card validation
  - Webhook-based payment verification with signature validation
  - Transactional payment processing prevents replay attacks
  - Session tracking in database (stripeCheckoutSessions table)
  - Idempotent webhook handling for duplicate events
  - Automatic account upgrade upon successful payment
  - Payment button in settings page with loading states
  - Secure redirect URLs using REPLIT_DEV_DOMAIN
  - Read-only status verification endpoint
- **Admin Dashboard:** Statistics, user management, ability to grant/revoke admin privileges, view/export user conversations, and send newsletters.
  - Auto-admin: fransantbrid@anglernook.com is automatically promoted to admin on registration
  - User conversation viewing: Click "View Conversations" to see all conversations for any user
  - Conversation export: Export individual conversations or all conversations at once in JSONL format
  - Newsletter composer: Built-in UI to compose and send newsletters to all subscribers
  - Subscriber count display: Shows real-time count of newsletter subscribers
  - Email validation: Required fields (subject, headline, content) with HTML support
  - Rate limiting: Sequential sending with delays to avoid hitting Resend limits

### System Design Choices
- **Full-Stack TypeScript:** Ensures type safety across both frontend and backend.
- **RESTful API:** Standardized communication between client and server.
- **Server-Sent Events:** Enables real-time streaming for chat interactions.
- **PostgreSQL with Drizzle ORM:** Provides robust, type-safe data persistence.
- **Modular Architecture:** Utilizes a repository pattern and clear separation of concerns.
- **Security:** Implements password hashing, HTTP-only cookies for sessions, and robust authorization.
- **Scalability:** Designed to run on Replit with an emphasis on serverless database integration.

## External Dependencies

### AI Service Integration
- **OpenAI API:** Used for powering AI models, supporting GPT-4o, GPT-4o Mini, GPT-4.1, GPT-5, GPT-5-mini, GPT-5-nano, o1, o3, and fine-tuned models. GPT-5 and newer reasoning models use max_completion_tokens parameter instead of max_tokens. User-provided API keys are prioritized, with an optional fallback to an environment variable.
- **Gemini AI:** Used for image generation and analysis features via Replit AI Integrations. No API key required (billed to Replit credits).

### Third-Party Services
- **Neon Database:** Serverless PostgreSQL hosting for data persistence.
- **Replit AI Integrations:** Managed access to OpenAI API and Replit development tools.
- **Resend:** Transactional email service for newsletters and notifications. Includes React Email templates with branded design.
- **Stripe:** Payment processing for Pro tier upgrades. Includes webhook-based fulfillment and secure checkout sessions.

### NPM Packages (Key Examples)
- **@neondatabase/serverless:** PostgreSQL connectivity.
- **drizzle-orm:** Type-safe ORM for database interactions.
- **openai:** Official OpenAI API client.
- **pdf-parse:** PDF text extraction for document analysis.
- **mammoth:** DOCX text extraction for document analysis.
- **multer:** File upload handling middleware.
- **@tanstack/react-query:** Asynchronous state management for React.
- **@radix-ui/*:** Unstyled, accessible UI primitives.
- **wouter:** Lightweight client-side routing.
- **zod:** Schema validation for runtime type checking.

### Environment Variables
- `DATABASE_URL`: Connection string for the PostgreSQL database.
- `OPENAI_API_KEY`: Optional fallback OpenAI API key.
- `NODE_ENV`: Application environment mode.