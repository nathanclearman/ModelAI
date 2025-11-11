# Design Guidelines: AI Model Management Platform

## Design Approach

**Selected Approach:** Design System-Based (Linear/Notion-inspired SaaS)

**Rationale:** This is a utility-focused productivity platform requiring efficient workflows, clear data presentation, and professional aesthetics. Drawing from modern SaaS tools like Linear, Notion, and Vercel's dashboard patterns for their exceptional information hierarchy and workspace design.

**Core Principles:**
- Clarity over decoration
- Information density without clutter
- Scannable interfaces with strong visual hierarchy
- Professional, focused workspace design

## Typography System

**Font Stack:**
- Primary: Inter (via Google Fonts) - for UI elements, labels, body text
- Monospace: JetBrains Mono - for code snippets, model IDs, API responses

**Hierarchy:**
- Page Titles: text-3xl font-semibold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Labels/Metadata: text-sm font-medium
- Helper Text: text-xs

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 or p-6
- Section spacing: gap-6 or gap-8
- Page margins: p-6 or p-8
- Tight groupings: gap-2 or gap-4

**Container Structure:**
- Dashboard uses sidebar + main content layout (sidebar width: w-64)
- Main content area: max-w-7xl with responsive padding
- Cards and panels: rounded-lg with consistent padding (p-6)

## Component Library

### Navigation
**Sidebar (Primary Navigation):**
- Fixed left sidebar (w-64) with vertical nav links
- Icons from Heroicons (outline style) paired with labels
- Active state: slightly different background treatment
- Sections: Models, Templates, History, Settings

**Top Bar:**
- Breadcrumb navigation for context
- User profile/actions on the right
- Height: h-16 with px-6 padding

### Core UI Elements

**Cards/Panels:**
- Rounded corners: rounded-lg
- Consistent padding: p-6
- Subtle border treatment
- Used for: model configurations, chat containers, comparison views

**Buttons:**
- Primary: px-4 py-2 rounded-md font-medium
- Secondary: Similar sizing with border treatment
- Icon buttons: p-2 rounded-md with just icon
- CTA buttons over images: backdrop-blur-md bg-white/10 border border-white/20

**Form Inputs:**
- Text inputs: h-10 px-3 rounded-md border
- Textareas: p-3 rounded-md border (min-h-32 for chat input)
- Select dropdowns: h-10 px-3 rounded-md border
- Labels: text-sm font-medium mb-2 block
- Consistent focus states across all inputs

**Chat Interface:**
- Messages alternate alignment (user: right-aligned, AI: left-aligned)
- Message bubbles: max-w-3xl rounded-2xl p-4
- User messages: rounded-br-sm (sharp bottom-right corner)
- AI messages: rounded-bl-sm (sharp bottom-left corner)
- Timestamp: text-xs opacity-70 below messages

### Data Display Components

**Model Configuration Panel:**
- Two-column layout (lg:grid-cols-2) for configuration options
- Slider controls for temperature, max tokens
- Dropdown for model selection (GPT-4o, Claude Sonnet, etc.)
- Real-time preview of settings
- Save/Reset buttons at bottom

**Comparison View:**
- Split screen layout (grid-cols-2 on desktop)
- Side-by-side model responses
- Synchronized scrolling
- Visual separator (border-r)
- Headers showing model names and configurations

**Template Cards:**
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Card structure: Icon at top, title, description, "Use Template" button
- Templates: Customer Support Bot, Content Generator, Code Assistant, Data Analyst, Sales Assistant, HR Assistant

**Conversation History:**
- List view with: title, timestamp, model used, snippet preview
- Search/filter bar at top
- Click to load conversation
- Export button for each conversation
- Delete/archive actions

### Overlays

**Modal Dialogs:**
- Centered overlay with backdrop (bg-black/50)
- Content container: max-w-2xl rounded-lg p-6
- Header with close button
- Used for: creating new models, editing configurations, export options

**Toast Notifications:**
- Bottom-right positioning (fixed bottom-4 right-4)
- Temporary appearance (auto-dismiss after 3s)
- Success, error, info variants

## Page Layouts

### Dashboard Home
- Welcome header with quick stats (models created, conversations, API usage)
- Recent conversations (4-6 items)
- Template suggestions below
- "Create New Model" prominent CTA

### Model Chat Interface
- Full-height layout with fixed chat input at bottom
- Message history: scrollable middle section
- Model selector and config shortcut in top-right
- Chat input: sticky bottom bar with textarea and send button

### Configuration Dashboard
- Left: Model list (scrollable sidebar within main content)
- Right: Selected model's configuration panel
- Top: Model name and status indicator
- Tabs for: Settings, Prompts, Performance Analytics

### Comparison View
- Top controls: Select models to compare, input prompt
- Main area: Two-column response display
- Bottom: Detailed metrics comparison (tokens used, response time, cost)

## Accessibility
- All interactive elements have clear focus states (ring-2 ring-offset-2)
- Sufficient contrast ratios for text
- Keyboard navigation throughout
- ARIA labels for icon-only buttons
- Form inputs have associated labels
- Error states clearly communicated

## Images

This application does not require hero images or decorative photography. Focus on:
- Icon library: Heroicons for all UI icons
- Empty states: Simple illustrations or icon-based graphics when no data exists
- Profile avatars: Circular, 40px diameter for user/AI representations in chat