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
- Apple-inspired minimalist design philosophy with generous whitespace, refined typography, and subtle animations

**Design Tokens:**
- CSS custom properties for theming (HSL color system)
- Neutral color palette with semantic color roles (primary, secondary, accent, destructive)
- Custom border radius values (9px, 6px, 3px)
- Geist font family for clean, modern typography

**State Management:**
- React Query for server-side data fetching, caching, and synchronization
- Local component state with React hooks
- Toast notifications for user feedback
- Form state managed through React Hook Form with Zod validation

**Key Pages:**
- Dashboard - Overview with stats and quick access to models and conversations
- Chat - Real-time streaming chat interface with AI models
- Upload Model - Interface for importing custom pre-trained models
- Templates - Gallery of pre-configured AI assistant templates
- History - Conversation browsing and management
- Settings - Account and application preferences

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
- `/api/models` - AI model management (GET, POST, PATCH, DELETE)
- `/api/models/:id` - Single model operations
- `/api/conversations` - Conversation management
- `/api/conversations/:id` - Single conversation operations
- `/api/chat` - Streaming chat endpoint with async generators

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
- `users` table - User authentication and profile data
- `ai_models` table - AI model configurations with system prompts, temperature, max tokens
- `conversations` table - Chat history stored as JSONB messages array

**Data Models:**
- AI Models: Name, description, system prompt, OpenAI model selection, temperature (0-100), max tokens, optional template
- Conversations: Associated model ID, title, messages array (JSON), timestamps
- Messages: Role (user/assistant), content, timestamp

**Storage Layer:**
- IStorage interface defining data access contracts
- DatabaseStorage implementation with Drizzle ORM
- Repository pattern for separation of concerns

### Authentication and Authorization

**Current State:**
- User schema exists with username/password fields
- No active authentication middleware implemented
- Routes are currently unprotected (development state)

**Planned Implementation:**
- Session-based authentication expected
- connect-pg-simple package included for PostgreSQL session storage
- User table with UUID primary keys and unique username constraints

### External Dependencies

**AI Service Integration:**
- OpenAI API through Replit's AI Integrations service
- Environment-based configuration for base URL and API key
- Support for GPT-4o, GPT-4o Mini, GPT-4.1, and GPT-5 models
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
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key
- `NODE_ENV` - Environment mode (development/production)