# New Features Implementation Guide

## Overview
Three major features have been added to differentiate your AI platform:

1. **AI Conversation Branching** - Create multiple conversation paths from any message
2. **Prompt Engineering Tools** - Prompt library, templates, and testing
3. **Multi-Model Orchestration** - Chain multiple AI models in workflows

## Database Schema Updates

### New Tables Added:
- `conversation_branches` - Stores conversation branches
- `prompt_templates` - Stores prompt templates
- `prompt_template_ratings` - Stores ratings for templates

### Updated Tables:
- `conversations` - Added `branches` and `activeBranchId` fields
- `Message` type - Added `messageId`, `parentMessageId`, `branchId` fields
- `WorkflowStep` type - Extended to support parallel execution and conditional logic

## Next Steps

1. **Run database migration:**
   ```bash
   npx drizzle-kit push
   ```

2. **Backend APIs** - Routes are being added to `server/routes.ts`

3. **Frontend Components** - Will be created in `client/src/components/`

## API Endpoints

### Conversation Branching
- `POST /api/conversations/:id/branches` - Create a new branch
- `GET /api/conversations/:id/branches` - Get all branches for a conversation
- `GET /api/branches/:id` - Get a specific branch
- `PUT /api/branches/:id` - Update a branch
- `DELETE /api/branches/:id` - Delete a branch
- `POST /api/conversations/:id/switch-branch` - Switch active branch

### Prompt Templates
- `POST /api/prompt-templates` - Create a template
- `GET /api/prompt-templates` - Get user's templates
- `GET /api/prompt-templates/public` - Get public templates
- `GET /api/prompt-templates/:id` - Get a specific template
- `PUT /api/prompt-templates/:id` - Update a template
- `DELETE /api/prompt-templates/:id` - Delete a template
- `POST /api/prompt-templates/:id/use` - Use a template (increments usage)
- `POST /api/prompt-templates/:id/rate` - Rate a template

### Multi-Model Orchestration
- `POST /api/workflows` - Create a workflow
- `GET /api/workflows` - Get user's workflows
- `GET /api/workflows/:id` - Get a specific workflow
- `PUT /api/workflows/:id` - Update a workflow
- `DELETE /api/workflows/:id` - Delete a workflow
- `POST /api/workflows/:id/run` - Execute a workflow
- `GET /api/workflows/:id/runs` - Get workflow execution history

## Implementation Status

- [x] Database schema updated
- [x] Storage methods added
- [ ] Backend API routes (in progress)
- [ ] Frontend components
- [ ] UI integration

