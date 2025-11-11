# Design Guidelines: AI Model Management Platform

## Design Approach

**Selected Approach:** Apple-Inspired Minimalism

**Rationale:** Creating a premium, sleek platform that feels sophisticated and effortless. Drawing inspiration from Apple's website design philosophy: generous white space, refined typography, subtle animations, and a focus on content over chrome.

**Core Principles:**
- Extreme simplicity and clarity
- Generous white space and breathing room
- Large, bold typography with refined hierarchy
- Subtle, smooth animations and transitions
- Premium feel through restraint
- Content-first approach

## Typography System

**Font Stack:**
- Primary: SF Pro Display style (Inter) - Clean, modern, highly legible
- Monospace: SF Mono style (JetBrains Mono) - for technical content

**Hierarchy (Apple-inspired scale):**
- Hero Titles: text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight
- Page Titles: text-4xl md:text-5xl font-semibold tracking-tight
- Section Headers: text-2xl md:text-3xl font-semibold tracking-tight
- Card Titles: text-xl font-semibold
- Body Text: text-lg font-normal leading-relaxed
- Labels: text-base font-medium
- Helper Text: text-sm text-muted-foreground

**Typography Principles:**
- Use larger sizes than typical - Apple goes big
- Tight letter spacing (tracking-tight) for headlines
- Generous line height (leading-relaxed) for readability

## Layout System

**Spacing Primitives (Generous Apple-style):**
- Hero sections: py-20 md:py-32 lg:py-40
- Page padding: px-6 md:px-12 lg:px-16
- Component padding: p-8 md:p-12
- Section spacing: gap-12 md:gap-16 lg:gap-24
- Card spacing: gap-6 md:gap-8
- Tight groupings: gap-4

**Container Structure:**
- Maximum content width: max-w-7xl
- Generous margins and padding everywhere
- Floating panels with backdrop blur
- Clean, spacious sidebar (w-72) with subtle dividers
- Full-bleed sections where appropriate

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