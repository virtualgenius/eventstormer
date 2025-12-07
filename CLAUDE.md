# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EventStormer** is an open-source, purpose-built facilitation tool for EventStorming workshops. It enables remote/hybrid teams to collaboratively visualize and understand complex socio-technical systems using EventStorming methodology.

## Development Commands

```bash
npm run dev          # Start frontend + collaboration worker locally
npm run dev:vite     # Start only Vite dev server
npm run dev:worker   # Start only Cloudflare worker locally
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy:worker # Deploy worker to Cloudflare
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Canvas**: react-konva for infinite canvas rendering
- **Styling**: TailwindCSS + PostCSS
- **State Management**: Zustand + Yjs (CRDT)
- **Real-time Sync**: Cloudflare Workers + Durable Objects via y-partyserver
- **Local Persistence**: IndexedDB via Dexie
- **UI Components**: Radix UI (tooltips), Lucide React (icons)

### Real-time Collaboration Stack

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Zustand)                         │
│  useCollabStore.ts - Yjs Y.Doc with Y.Map/Y.Array   │
└────────────────┬────────────────────────────────────┘
                 │ YProvider (y-partyserver/provider)
                 │ WebSocket connection
┌────────────────┴────────────────────────────────────┐
│  Cloudflare Worker (workers/server.ts)              │
│  YjsRoom Durable Object - room state + sync         │
└─────────────────────────────────────────────────────┘
```

Key files:
- [src/store/useCollabStore.ts](src/store/useCollabStore.ts) - Main collaboration store with Yjs integration
- [workers/server.ts](workers/server.ts) - Cloudflare Worker with Durable Objects
- [wrangler.toml](wrangler.toml) - Cloudflare deployment configuration

### Core Domain Model

The application revolves around a **Board** that contains:
- **Stickies**: Core elements representing events, hotspots, actors, systems, opportunities, and glossary terms
- **Vertical Lines**: Pivotal event boundaries between sub-processes
- **Horizontal Lanes**: User-created swimlanes with labels
- **Theme Areas**: Rectangular zones for grouping work
- **Labels**: Free-form text annotations
- **Facilitation Phase**: Controls which sticky types are available in the palette

All domain types are defined in [src/types/domain.ts](src/types/domain.ts).

### State Management

Dual-layer state management:
- **Yjs Y.Doc**: Source of truth for collaborative state ([src/store/useCollabStore.ts](src/store/useCollabStore.ts))
- **Zustand**: React state derived from Yjs via `yboard.observe()`
- **IndexedDB**: Local persistence with 5-second autosave

All mutations go through Yjs (Y.Array.push, Y.Array.delete, Y.Map.set), which automatically syncs to other clients.

### Component Architecture

**App.tsx**: Top-level layout with header, palette, and canvas.

**FacilitationPalette**: Phase-aware toolbar showing sticky types for current phase.

**KonvaCanvas**: Infinite canvas using react-konva for rendering stickies, lines, lanes.

**Sticky**: Individual sticky note component with type-specific styling.

### Visual Grammar (EventStorming Semantics)

- **🟧 Events** (orange): Past-tense domain events
- **🟥 Hotspots** (red): Problems, risks, uncertainties
- **🟦 Vertical Lines** (blue): Pivotal boundaries
- **Horizontal Lines**: Swimlanes for process separation
- **🟨 Actors** (yellow, half-height): People initiating actions
- **🟪 Systems** (lilac, half-height): External systems
- **🟩 Opportunities** (green): Improvement ideas
- **🟫 Glossary** (brown): Term definitions

### Facilitation Flow

The app implements a **guided facilitation model**:
1. Facilitator progresses through phases sequentially
2. Palette automatically updates to show only appropriate sticky types
3. Participants can create stickies once their type is introduced
4. Future: zone assignment, breakout groups, facilitator dashboard

## Design Principles

### UX Guidelines
- **Intuitive**: Minimal learning curve, immediate usability
- **Lightweight**: Frictionless creation, no ceremony
- **Professional**: Refined aesthetic for executive facilitation
- **Clarity over decoration**: Visual meaning takes precedence

### Aesthetic
- Neutral white/gray palette with muted accent hues
- Rounded corners, soft shadows, balanced spacing
- Typography: System sans-serif (Inter / SF Pro)
- Consistent Lucide React icons
- Smooth, subtle animations

## Implementation Notes

### ID Generation
Use [src/lib/nanoid.ts](src/lib/nanoid.ts) for generating unique IDs for all entities.

### Timestamps
All timestamps use ISO 8601 format via `new Date().toISOString()`.

### Facilitation Phases
Phase progression is linear and controlled. The palette component filters available sticky types based on current phase:
- `chaotic-exploration`: Events + hotspots
- `enforce-timeline`: Events + hotspots + vertical lines
- `people-and-systems`: All previous + actors + systems + lanes
- `problems-and-opportunities`: All previous + opportunities
- `glossary`: All elements available

### Environment Variables
- `VITE_COLLAB_HOST`: Collaboration server URL (default: `localhost:8800` for dev)

## Documentation

Comprehensive documentation in [docs/](docs/):
- [VISION.md](docs/VISION.md): Product vision, target audience, guiding principles
- [SPEC.md](docs/SPEC.md): Core behavior, visual grammar, semantic validation
- [PLAN.md](docs/PLAN.md): Milestone breakdown and roadmap
- [DEPLOYMENT.md](docs/DEPLOYMENT.md): Cloudflare Workers deployment guide

## Current State

Core infrastructure complete:
- ✅ Type definitions for domain model
- ✅ Zustand + Yjs store with CRDT sync
- ✅ Real-time collaboration via Cloudflare Workers
- ✅ Phase-based facilitation system
- ✅ Canvas rendering with react-konva
- ✅ User presence tracking
- ✅ Local persistence (IndexedDB)
- ✅ Undo/redo via Yjs UndoManager
- 🚧 Export/import functionality
- 🚧 Multiple room support

## Code Clarity (Enforced by ESLint)

Pre-commit hooks block commits with ESLint warnings. Claude should proactively fix these patterns:

### Timing Workarounds

```typescript
// ❌ Anonymous callback hides intent
setTimeout(() => editor.sendToBack([shape.id]), 0)

// ✅ Named function reveals intent
const sendToBackAfterCreation = () => editor.sendToBack([shape.id])
setTimeout(sendToBackAfterCreation, 0)
```

### Inline Callbacks > 4 Lines

```typescript
// ❌ Long inline callback
array.map((item) => {
  const processed = transform(item)
  const validated = validate(processed)
  return format(validated)
})

// ✅ Extracted to named function
const processItem = (item: Item) => {
  const processed = transform(item)
  const validated = validate(processed)
  return format(validated)
}
array.map(processItem)
```

### Magic Numbers

```typescript
// ❌ Unnamed literals
setTimeout(fn, 200)
const dims = { w: 120, h: 100 }

// ✅ Named constants
const ANIMATION_DURATION_MS = 200
const DEFAULT_STICKY_DIMENSIONS = { w: 120, h: 100 }
```

### Complex Conditions (> 2 clauses)

```typescript
// ❌ Complex inline condition
if (isFlowModeActive(mode) && isUnmodifiedArrowKey(e, keys) && !isEditing) { ... }

// ✅ Extracted predicate
const shouldNavigateFlow = (e: KeyboardEvent, mode: WorkshopMode, isEditing: boolean) =>
  isFlowModeActive(mode) && isUnmodifiedArrowKey(e, ['ArrowRight', 'ArrowLeft']) && !isEditing

if (shouldNavigateFlow(e, workshopMode, isEditing)) { ... }
```

### Function Length (max 25 lines)

Extract when functions exceed 25 lines. Each extracted function should have a descriptive name.

## Testing

E2E tests using Playwright in [tests/e2e/](tests/e2e/):
```bash
npm run test:e2e        # Run all tests
npm run test:e2e:ui     # Interactive UI mode
npm run test:e2e:headed # Run with browser visible
```

## Dead Code Prevention

When replacing functionality with new code, **delete the old code immediately** - don't leave it "for reference" or "in case we need it". Version control preserves history.

Run dead code detection periodically:
```bash
npm run lint:deadcode   # Check for unused exports, files, and dependencies
```

**Replacement checklist:**

- [ ] New function/module works and has tests
- [ ] Old function/module is deleted (not just unused)
- [ ] Tests for old function are deleted
- [ ] No orphaned constants or types remain
