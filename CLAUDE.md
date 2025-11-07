# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EventStormer** is an open-source, purpose-built facilitation tool for Big Picture EventStorming workshops. It enables remote/hybrid teams to collaboratively visualize and understand complex socio-technical systems using EventStorming methodology.

## Development Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + PostCSS
- **State Management**: Zustand (centralized board state)
- **UI Components**: Radix UI (tooltips), Lucide React (icons)

### Core Domain Model

The application revolves around a **Board** that contains:
- **Stickies**: Core elements representing events, hotspots, actors, systems, opportunities, and glossary terms
- **Vertical Lines**: Pivotal event boundaries between sub-processes
- **Horizontal Lanes**: User-created swimlanes with labels
- **Theme Areas**: Rectangular zones for grouping work
- **Facilitation Phase**: Controls which sticky types are available in the palette

All domain types are defined in [src/types/domain.ts](src/types/domain.ts).

### State Management

Single Zustand store ([src/store/useBoardStore.ts](src/store/useBoardStore.ts)) manages:
- Board state (stickies, lines, lanes, themes)
- Phase transitions (events → hotspots → pivotal → lanes → actors-systems → opportunities → glossary)
- CRUD operations for all board elements

Each state mutation updates `updatedAt` timestamps using ISO format.

### Component Architecture

**App.tsx**: Top-level layout with header, palette, and canvas.

**FacilitationPalette**: Phase-aware toolbar that shows only sticky types available in the current facilitation phase.

**Canvas**: Infinite canvas rendering board elements (implementation in progress).

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
- `events`: Only event stickies
- `hotspots`: Events + hotspots
- `pivotal`: Events + hotspots + vertical lines
- `lanes`: All previous + horizontal lanes
- `actors-systems`: All previous + actors + systems
- `opportunities`: All previous + opportunities
- `glossary`: All elements available

### Future Milestones
- **M1 (Current)**: MVP with basic canvas, real-time collaboration, guided palette
- **M2**: Local persistence (IndexedDB), checkpoints, theme extraction
- **M3**: Breakout groups, participant expertise tagging, export to image/PDF
- **M4**: Process-level support (Commands, Policies)
- **M5**: AI assistance (glossary generation, past-tense validation, clustering)

## Documentation

Comprehensive documentation in [docs/](docs/):
- [VISION.md](docs/VISION.md): Product vision, target audience, guiding principles
- [SPEC.md](docs/SPEC.md): Core behavior, visual grammar, semantic validation
- [PLAN.md](docs/PLAN.md): Milestone breakdown and roadmap
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): Technical architecture decisions

## Current State

This is an early-stage MVP scaffold. Core infrastructure is in place:
- ✅ Type definitions for domain model
- ✅ Zustand store with basic CRUD operations
- ✅ Phase-based facilitation system
- ✅ Component structure (App, Palette, Canvas, Sticky)
- 🚧 Canvas rendering and interaction
- 🚧 Real-time collaboration
- 🚧 Undo/redo system
- 🚧 Export/import functionality

No test suite exists yet. When adding tests, prefer testing pure business logic functions separately from React components.
