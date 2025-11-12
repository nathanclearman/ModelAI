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
- **Authentication:** Traditional email/password login with secure session management.
- **AI Model Management:** Create, view, edit, and delete AI models with custom prompts and parameters.
- **Conversation Management:** Real-time streaming chat, conversation history, and export capabilities.
- **Templates:** Pre-configured AI assistant templates for various use cases.
- **User Settings:** Account information management and personal OpenAI API key configuration.
- **Admin Dashboard:** Statistics, user management, ability to grant/revoke admin privileges, and view/export user conversations.
  - Auto-admin: fransantbrid@anglernook.com is automatically promoted to admin on registration
  - User conversation viewing: Click "View Conversations" to see all conversations for any user
  - Conversation export: Export individual conversations or all conversations at once in JSONL format

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
- **OpenAI API:** Used for powering AI models, supporting GPT-4o, GPT-4o Mini, GPT-4.1, GPT-5, and fine-tuned models. User-provided API keys are prioritized, with an optional fallback to an environment variable.

### Third-Party Services
- **Neon Database:** Serverless PostgreSQL hosting for data persistence.
- **Replit AI Integrations:** Managed access to OpenAI API and Replit development tools.

### NPM Packages (Key Examples)
- **@neondatabase/serverless:** PostgreSQL connectivity.
- **drizzle-orm:** Type-safe ORM for database interactions.
- **openai:** Official OpenAI API client.
- **@tanstack/react-query:** Asynchronous state management for React.
- **@radix-ui/*:** Unstyled, accessible UI primitives.
- **wouter:** Lightweight client-side routing.
- **zod:** Schema validation for runtime type checking.

### Environment Variables
- `DATABASE_URL`: Connection string for the PostgreSQL database.
- `OPENAI_API_KEY`: Optional fallback OpenAI API key.
- `NODE_ENV`: Application environment mode.