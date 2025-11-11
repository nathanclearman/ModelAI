# Design Guidelines: AI Model Management Platform

## Design Approach

**Selected Approach:** Warm Minimalism with Creative Energy

**Rationale:** Inspired by Notion's approachable warmth, Linear's polished refinement, and Figma's creative confidence. Creating a platform that feels like a thoughtfully crafted creative tool—professional yet inviting, cutting-edge yet human.

**Core Principles:**
- Warmth over sterility: Soft, organic shapes with personality
- Progressive disclosure: Information reveals naturally through interaction
- Delightful details: Micro-interactions that spark joy
- Spatial rhythm: Dynamic layouts that breathe and flow
- Human-first: Make AI feel approachable, not intimidating

## Typography System

**Font Stack:**
- Primary: Inter (warm, approachable, highly readable)
- Accent Headings: Spline Sans (rounded, friendly geometry)
- Monospace: JetBrains Mono (technical content)

**Hierarchy:**
- Hero Titles: text-5xl md:text-6xl font-bold tracking-tight (Spline Sans)
- Page Titles: text-4xl md:text-5xl font-semibold tracking-tight
- Section Headers: text-2xl md:text-3xl font-semibold
- Card Titles: text-xl font-semibold
- Body Text: text-base leading-relaxed
- Labels: text-sm font-medium
- Helper Text: text-sm opacity-70

**Typography Principles:**
- Mix rounded accent fonts for headers with clean body text
- Generous line height for breathing room
- Tight tracking on large display text

## Layout System

**Spacing Primitives:**
Core units: 4, 6, 8, 12, 16, 24 (as in p-4, gap-6, py-8, space-y-12)

**Container Structure:**
- Max content width: max-w-7xl
- Page padding: px-6 md:px-8 lg:px-12
- Section spacing: space-y-16 md:space-y-24
- Card grids: gap-6 md:gap-8
- Component padding: p-6 md:p-8

**Layout Philosophy:**
- Asymmetric layouts for visual interest
- Varied content densities create rhythm
- Generous whitespace balanced with rich content zones
- Floating panels with soft shadows, not stark borders

## Component Library

### Navigation

**Sidebar:**
- Width: w-64, soft rounded corners (rounded-r-2xl)
- Vertical nav with icons (Heroicons) + labels
- Active states: filled background with gentle color
- Grouped sections: Models, Templates, History, Settings
- User profile at bottom with avatar and quick settings

**Top Bar:**
- Height: h-16, subtle border-b
- Breadcrumbs on left, search + actions on right
- Search bar: rounded-full with icon, expands on focus

### Core UI Elements

**Cards:**
- Rounded: rounded-2xl (softer than standard)
- Padding: p-6 md:p-8
- Subtle shadow elevation, hover lift effect
- Used everywhere: model configs, chat containers, templates

**Buttons:**
- Primary: px-6 py-3 rounded-xl font-medium (warm accent color)
- Secondary: same sizing with border, transparent background
- Icon buttons: p-2.5 rounded-lg
- CTA on images: backdrop-blur-md bg-white/10 border border-white/20 rounded-xl

**Form Inputs:**
- Text inputs: h-11 px-4 rounded-lg border
- Textareas: p-4 rounded-xl (min-h-32 for chat)
- Select dropdowns: h-11 px-4 rounded-lg
- Sliders: custom styled with warm accent fill
- Labels: text-sm font-medium mb-2 block
- Focus states: ring-2 with warm accent color

**Chat Interface:**
- Messages: max-w-2xl with alternating alignment
- User bubbles: rounded-2xl rounded-br-md, right-aligned
- AI bubbles: rounded-2xl rounded-bl-md, left-aligned
- Message padding: p-4 md:p-5
- Typing indicator: animated dots with warm color
- Timestamps: text-xs opacity-60

### Data Display

**Model Configuration Panel:**
- Grid layout: lg:grid-cols-2 gap-8
- Sections grouped with subtle background cards
- Sliders with value preview bubbles
- Dropdown model selector with visual icons
- Preset buttons: quick-select common configurations
- Save button: prominent with success feedback animation

**Comparison View:**
- Split layout: grid-cols-1 lg:grid-cols-2 gap-6
- Model cards elevated with soft shadows
- Response areas: scrollable with synchronized scroll option
- Visual separator with gradient fade
- Metrics footer: tokens, time, cost side-by-side

**Template Gallery:**
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Cards: illustration icon top, title, description, CTA
- Hover: lift effect with glow
- Templates: Customer Support, Content Generator, Code Assistant, Data Analyst, Creative Writer, Research Assistant, Sales Bot, HR Helper

**History List:**
- Timeline-style layout with connecting lines
- Each item: title, timestamp, model badge, preview snippet
- Search/filter bar with tag chips
- Batch actions: export, archive, delete
- Infinite scroll with skeleton loading

### Overlays

**Modals:**
- Centered: max-w-2xl rounded-2xl
- Backdrop: bg-black/40 backdrop-blur-sm
- Padding: p-8, header with close button
- Slide-in animation from bottom
- Used for: new model creation, advanced settings

**Toast Notifications:**
- Position: fixed bottom-6 right-6
- Rounded: rounded-xl with icon + message
- Auto-dismiss: 4s with progress bar
- Success/error/info variants with warm color coding

## Page Layouts

### Dashboard Home
- Hero section: Welcome message with user name, gradient background treatment (not image)
- Stats cards: 3-column grid (models, conversations, tokens used) with icons
- Recent activity timeline below
- Template suggestions: 6-card grid
- Floating "New Model" FAB (bottom-right)

### Model Chat Interface
- Full-height: chat history scrollable center
- Sticky input: bottom bar with rounded-2xl textarea, send button
- Model switcher: top-right dropdown with config preview
- Suggested prompts: pill buttons above input when empty
- Smooth message append animations

### Configuration Dashboard
- Two-column: model list sidebar (w-80) + config panel
- Model cards: preview of settings, status badge
- Config panel: tabbed interface (Settings, Prompts, Analytics)
- Live preview window showing sample output
- Version history timeline

### Comparison View
- Top controls: model selectors (2-4 models), shared prompt input
- Response grid: even columns with headers
- Expandable metrics drawer at bottom
- Export comparison button: PDF/CSV options
- Side-by-side scrolling with sync toggle

## Images

**Hero Sections:**
- Dashboard welcome area: abstract gradient mesh background (generative art style, warm tones)
- Marketing pages (if added): AI-themed abstract illustrations, neural network visualizations

**Throughout App:**
- Empty states: friendly illustrations (abstract shapes, not literal)
- Template cards: unique icon illustrations for each category
- Profile avatars: 48px circular for users, 40px for AI in chat
- Model icons: distinctive badge designs per model type

## Micro-Interactions

- Button press: subtle scale down (scale-95) on active
- Card hover: lift shadow with 200ms transition
- Input focus: gentle grow effect
- Message send: slide-up animation with fade-in
- Model switch: crossfade transition (300ms)
- Success actions: confetti or checkmark animation
- Loading states: skeleton screens with shimmer effect
- Scroll reveals: subtle fade-in for cards entering viewport

## Accessibility

- Focus states: ring-2 ring-offset-2 with warm accent
- Color contrast: WCAG AA minimum for all text
- Keyboard navigation: full app traversal
- Screen reader: ARIA labels on all icon buttons
- Form validation: inline errors with icons
- Reduced motion: respect prefers-reduced-motion