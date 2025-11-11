# AI Model Management Platform

## Overview

This is a fully functional AI Model Management Platform that enables businesses to deploy, customize, and manage multiple AI assistants. The platform provides a user-friendly interface for creating custom AI models with configurable parameters, managing conversations, and leveraging pre-built templates for common business use cases like customer support, content generation, code assistance, and data analysis.

The application is built as a full-stack TypeScript web application with a React frontend and Express backend, designed to run on Replit with real-time streaming chat capabilities powered by OpenAI.

**Status:** Production-ready with complete backend integration, database persistence, and real-time AI chat streaming.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**November 11, 2025:**
- ✅ Fully integrated PostgreSQL database with Drizzle ORM
- ✅ Complete backend API implementation with CRUD operations for models and conversations
- ✅ OpenAI streaming chat integration with Server-Sent Events
- ✅ Frontend connected to backend with real-time AI conversations
- ✅ Conversation persistence with save/load functionality
- ✅ Template system creating pre-configured AI models
- ✅ Conversation history with search and filter capabilities
- ✅ Model configuration management with custom prompts and parameters
- ✅ Conversation export feature (individual and bulk export to JSONL format)
- ✅ Fine-tuned model import with OpenAI model ID validation
- ✅ Per-user OpenAI API key support (stored in browser session)
- ✅ Settings page for API key configuration with validation
- ✅ Visual guidance for users without API keys
- ✅ Design transformation to "Warm Minimalism with Creative Energy"
  - Warm color palette with coral primary (#FF6B4A), soft beige sidebar, warm backgrounds
  - Rounder component shapes (buttons: rounded-xl, badges: rounded-full, inputs/cards: rounded-lg/2xl)
  - Gradient hero sections on Dashboard and Templates pages
  - Enhanced chat interface with organic bubble shapes and subtle shadows
  - Improved spacing and breathing room throughout the application
  - Delightful micro-interactions and smooth transitions
- ✅ **Replit Auth Integration** - Complete authentication system with Google, GitHub, and email/password login
  - Session-based authentication using Replit Auth (OpenID Connect)
  - PostgreSQL session storage for persistent login across restarts
  - All API routes protected with authentication middleware
  - Per-user data isolation - all AI models and conversations scoped to userId
  - Landing page for unauthenticated users with sign-in capability
  - User profile data (email, firstName, lastName, profileImageUrl) from auth providers
  - Secure session management with automatic token refresh
  - setupAuth initialized once at server bootstrap to prevent middleware conflicts
- ✅ End-to-end tested and verified working

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Component System:**
- Shadcn/ui component library based on Radix UI primitives
- Tailwind CSS for styling with a custom design system
- Theme provider supporting light/dark modes
- Warm Minimalism design philosophy inspired by Notion, Linear, and Figma with generous whitespace, refined typography, and delightful animations

**Design Tokens:**
- CSS custom properties for theming (HSL color system)
- Warm color palette with coral primary (#FF6B4A / 25 95% 53%), soft beige sidebar, warm neutral backgrounds
- Semantic color roles: primary (coral), secondary (warm gray), accent (amber), destructive (red)
- Organic border radius values - buttons (rounded-xl), badges (rounded-full), inputs (rounded-lg), cards (rounded-2xl)
- Geist font family for clean, modern typography with relaxed line-height for better readability
- Subtle shadows and smooth transitions for depth and interactivity
- Gradient overlays on hero sections for welcoming, warm atmosphere

**State Management:**
- React Query for server-side data fetching, caching, and synchronization
- Local component state with React hooks
- Toast notifications for user feedback
- Form state managed through React Hook Form with Zod validation

**Key Pages:**
- Landing - Public landing page with sign-in for unauthenticated users (displays app features and benefits)
- Dashboard - Overview with stats and quick access to models and conversations (protected)
- Chat - Real-time streaming chat interface with AI models, API key warning for fine-tuned models (protected)
- Import AI Models - Interface for importing fine-tuned models and uploaded pre-trained models (protected)
- Templates - Gallery of pre-configured AI assistant templates (protected)
- History - Conversation browsing, management, and export (individual or bulk) (protected)
- Settings - Account preferences and OpenAI API key configuration (protected)

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- HTTP server with middleware for JSON parsing and logging
- Request/response logging with duration tracking
- Development hot-reloading via Vite middleware integration

**API Design:**
- RESTful API endpoints under `/api` prefix
- Streaming responses for chat interactions using Server-Sent Events pattern
- CRUD operations for AI models and conversations
- JSON request/response format with Zod schema validation

**Routing Structure:**
- `/api/auth/user` - Get current authenticated user (protected)
- `/api/models` - AI model management (GET, POST, PATCH, DELETE) (protected, filtered by userId)
- `/api/models/:id` - Single model operations (protected, filtered by userId)
- `/api/conversations` - Conversation management (protected, filtered by userId)
- `/api/conversations/:id` - Single conversation operations (protected, filtered by userId)
- `/api/chat` - Streaming chat endpoint with async generators (protected)
- `/login` - Replit Auth login endpoint (redirects to auth provider)
- `/auth/callback` - OAuth callback handler for Replit Auth

**Data Validation:**
- Zod schemas for runtime type validation
- Drizzle-Zod integration for database schema validation
- Shared schema definitions between client and server

### Data Storage Solutions

**Database:**
- PostgreSQL via Neon serverless driver
- Connection pooling with WebSocket support for serverless environments
- Drizzle ORM for type-safe database queries and migrations

**Schema Design:**
- `users` table - User authentication and profile data (id, email, firstName, lastName, profileImageUrl, createdAt, updatedAt)
- `sessions` table - Session storage for Replit Auth (sid, sess, expire)
- `ai_models` table - AI model configurations with system prompts, temperature, max tokens, userId foreign key
- `conversations` table - Chat history stored as JSONB messages array, userId foreign key

**Data Models:**
- AI Models: Name, description, system prompt, OpenAI model selection, temperature (0-100), max tokens, optional template
- Conversations: Associated model ID, title, messages array (JSON), timestamps
- Messages: Role (user/assistant), content, timestamp

**Storage Layer:**
- IStorage interface defining data access contracts
- DatabaseStorage implementation with Drizzle ORM
- Repository pattern for separation of concerns

### Authentication and Authorization

**Implementation:**
- **Replit Auth** - OpenID Connect authentication supporting Google, GitHub, and email/password
- **Session Management** - PostgreSQL-backed sessions via connect-pg-simple for persistence across restarts
- **Middleware** - isAuthenticated middleware protects all API routes, extracts userId from session
- **User Model** - Users table stores profile data (email, firstName, lastName, profileImageUrl) from OAuth providers
- **Data Isolation** - All AI models and conversations are filtered by userId, ensuring complete data isolation between users
- **Frontend Auth** - useAuth hook checks authentication status, redirects to landing page if unauthenticated
- **Bootstrap Sequence** - setupAuth called once at server startup (server/index.ts) to prevent middleware conflicts

**Security Features:**
- All API endpoints protected with authentication middleware
- Session tokens stored securely in HTTP-only cookies
- Automatic token refresh for long-lived sessions
- CSRF protection via session validation
- User data scoped by userId to prevent unauthorized access

### External Dependencies

**AI Service Integration:**
- OpenAI API using user's personal API key
- Direct connection to OpenAI's API servers
- Support for all OpenAI models including GPT-4o, GPT-4o Mini, GPT-4.1, GPT-5, and fine-tuned models
- Streaming responses using async generators for real-time chat

**Third-Party Services:**
- Neon Database - Serverless PostgreSQL hosting
- Replit AI Integrations - Managed OpenAI API access
- Replit development tools (cartographer, dev banner, runtime error modal)

**NPM Packages:**
- @neondatabase/serverless - Database connectivity with WebSocket support
- drizzle-orm - Type-safe ORM and query builder
- openai - OpenAI API client
- @tanstack/react-query - Async state management
- @radix-ui/* - Unstyled, accessible UI primitives
- wouter - Minimalist routing
- zod - Schema validation
- date-fns - Date manipulation
- nanoid - Unique ID generation

**Development Dependencies:**
- TypeScript for type safety across the stack
- Vite for fast development and optimized production builds
- ESBuild for server-side bundling
- Tailwind CSS with PostCSS for styling
- Drizzle Kit for database migrations

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - (Optional) Fallback OpenAI API key when users haven't configured their own
- `NODE_ENV` - Environment mode (development/production)

**User API Key Management:**
- Users can configure their own OpenAI API keys in Settings
- API keys are stored in browser sessionStorage (cleared on browser close)
- Keys are sent via `x-openai-api-key` header with each chat request
- Backend creates per-request OpenAI clients with user's key
- Fallback to environment `OPENAI_API_KEY` if no user key provided
- Required for accessing fine-tuned models (tied to user's OpenAI account)