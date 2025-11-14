# AI Model Management Platform

## Overview
This AI Model Management Platform is a full-stack TypeScript web application for businesses to deploy, customize, and manage multiple AI assistants. It provides a user-friendly interface for creating custom AI models, managing conversations, and utilizing pre-built templates for tasks like customer support, content generation, and data analysis. The platform features a React frontend, an Express backend, and real-time streaming chat via OpenAI, aiming to be a production-ready solution with robust backend integration, database persistence, and a "Warm Minimalism with Creative Energy" design.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform uses a "Warm Minimalism with Creative Energy" design, inspired by Notion and Figma. It features a warm color palette (coral primary, soft beige sidebar), organic border radii, and the Geist font family. Subtle shadows, smooth transitions, and gradient overlays enhance the user experience.

### Technical Implementations
The frontend uses React, TypeScript, Vite, Wouter for routing, TanStack Query for data management, and Shadcn/ui with Tailwind CSS for UI components.

The backend is an Express.js application in TypeScript, offering RESTful API endpoints with Zod validation. Streaming responses for chat use Server-Sent Events. Authentication is via Passport Local Strategy with bcrypt and PostgreSQL-backed sessions. All API routes are protected, data is user-isolated, and an admin dashboard provides role-based access control.

### Feature Specifications
- **Authentication:** Email/password login with verification, secure sessions, and user data isolation.
- **AI Model Management:** Create, manage, and favorite AI models with custom prompts and parameters, including JSON export/import and public/private toggles.
- **Model API Access:** Generate secure API keys for integrating AI models into external applications.
- **Team Workspaces:** Collaborate with role-based access control for sharing AI models.
- **Model Marketplace:** Discover, like, and clone community-shared AI models.
- **Conversation Management:** Real-time streaming chat, conversation history, and export.
- **Templates:** Pre-configured AI assistant templates for various use cases.
- **Image Generation & Analysis:** AI-powered image generation from text prompts and image analysis using Gemini AI with quota tracking.
- **Document Analysis:** Upload and extract text from various document types for AI analysis (PDF, DOCX, PNG, TXT, Markdown) with security measures.
- **User Settings:** Account management, personal OpenAI API key configuration, and newsletter subscription.
- **Usage Dashboard Widget:** Visual quota tracking for messages and images with subscription tier display.
- **Coupon Code System:** Redeem promotional codes to unlock premium subscriptions.
- **Stripe Payment Integration:** Secure one-time payment for Pro tier upgrades via Stripe Checkout and webhooks.
- **Admin Dashboard:** Statistics, user management, admin privilege control, conversation viewing/export, and newsletter sending.
- **Workflow Automation Builder:** Chain AI tasks into automated workflows with a visual editor, variable resolution, and run history.
- **Fine-Tuning Interface:** Create and monitor OpenAI model fine-tuning jobs, including training file management, job configuration, and real-time monitoring.

### System Design Choices
- **Full-Stack TypeScript:** Type safety across frontend and backend.
- **RESTful API:** Standardized client-server communication.
- **Server-Sent Events:** Real-time chat streaming.
- **PostgreSQL with Drizzle ORM:** Robust, type-safe data persistence.
- **Modular Architecture:** Repository pattern and separation of concerns.
- **Security:** Password hashing, HTTP-only cookies, robust authorization.
- **Scalability:** Designed for Replit with serverless database integration.

## External Dependencies

### AI Service Integration
- **OpenAI API:** Powers AI models (GPT-4o, GPT-4o Mini, etc.) and fine-tuned models. Supports user-provided API keys and environment variable fallback.
- **Gemini AI:** Used for image generation and analysis via Replit AI Integrations.

### Third-Party Services
- **Neon Database:** Serverless PostgreSQL hosting.
- **Replit AI Integrations:** Managed access to OpenAI API and Replit tools.
- **Resend:** Transactional email service for newsletters and notifications, including React Email templates.
- **Stripe:** Payment processing for Pro tier upgrades.

### NPM Packages (Key Examples)
- **@neondatabase/serverless:** PostgreSQL connectivity.
- **drizzle-orm:** Type-safe ORM.
- **openai:** Official OpenAI API client.
- **pdf-parse:** PDF text extraction.
- **mammoth:** DOCX text extraction.
- **multer:** File upload handling.
- **@tanstack/react-query:** Asynchronous state management.
- **@radix-ui/*:** Accessible UI primitives.
- **wouter:** Lightweight client-side routing.
- **zod:** Schema validation.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `OPENAI_API_KEY`: Optional fallback OpenAI API key.
- `NODE_ENV`: Application environment mode.