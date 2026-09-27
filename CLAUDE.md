# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EventStormer** is an open-source, purpose-built facilitation tool for EventStorming workshops. It enables remote/hybrid teams to collaboratively visualize and understand complex socio-technical systems using EventStorming methodology.

Live at https://eventstormer.virtualgenius.com (GitHub Pages). Public repo, MIT licensed.

## Development Commands

```bash
npm run dev          # Start frontend (localhost:5273) + collaboration worker (localhost:8800)
npm run dev:vite     # Start only the Vite dev server
npm run dev:worker   # Start only the Cloudflare worker locally
npm run build        # Build for production
npm run preview      # Preview production build (localhost:4273)
npm run deploy:worker # Deploy worker to Cloudflare
npm test             # Vitest unit tests
npm run test:e2e     # Playwright e2e tests (starts npm run dev itself)
npm run lint         # ESLint (also runs on staged files at pre-commit)
npm run lint:deadcode # knip: unused exports, files, dependencies
```

Ports live in one place, [dev-ports.ts](dev-ports.ts), imported by `vite.config.ts` and `playwright.config.ts`. Vite runs with `strictPort`, so a collision fails instead of sliding to the next free port. `predev` frees 5273 and 8800 before starting.

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Canvas**: tldraw 4.x with custom `ShapeUtil`s for every EventStorming element ([src/tldraw/shapes/](src/tldraw/shapes/))
- **Styling**: TailwindCSS + PostCSS
- **Routing**: react-router-dom. `/` is the board list, `/board/:boardId` is a board ([src/main.tsx](src/main.tsx))
- **Real-time sync**: Yjs CRDT over y-partyserver to a Cloudflare Worker with Durable Objects
- **UI**: Radix UI tooltips, Lucide React icons
- **Zustand**: one small UI store only ([src/tldraw/pivotalPreviewStore.ts](src/tldraw/pivotalPreviewStore.ts))

### Real-time Collaboration Stack

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + tldraw)                              │
│  useYjsStore.ts mirrors the tldraw TLStore into a       │
│  Y.Doc (Y.Map 'tldraw-records'); useYjsPresence.ts      │
│  carries cursors and names                              │
└────────────────┬────────────────────────────────────────┘
                 │ YProvider (y-partyserver/provider), party 'yjs-room'
                 │ WebSocket to VITE_COLLAB_HOST
┌────────────────┴────────────────────────────────────────┐
│  Cloudflare Worker (workers/server.ts)                  │
│  YjsRoom Durable Object: one per board, document saved  │
│  to Durable Object storage, destroyed when the last     │
│  client leaves                                          │
└─────────────────────────────────────────────────────────┘
```

Key files:
- [src/tldraw/useYjsStore.ts](src/tldraw/useYjsStore.ts) - tldraw store <-> Y.Doc sync, custom shape util registration
- [src/tldraw/TldrawBoard.tsx](src/tldraw/TldrawBoard.tsx) - the board: composes the hooks below around `<Tldraw>`
- [workers/server.ts](workers/server.ts) - Cloudflare Worker with the `YjsRoom` Durable Object
- [wrangler.toml](wrangler.toml) - Cloudflare deployment configuration

Persistence is server-side, in the Durable Object. There is no local IndexedDB. `localStorage` holds only the recent-boards list ([src/components/BoardList.tsx](src/components/BoardList.tsx)) and the participant name ([src/pages/BoardPage.tsx](src/pages/BoardPage.tsx)). Undo/redo is tldraw's built-in.

### Board Composition

[TldrawBoard.tsx](src/tldraw/TldrawBoard.tsx) owns workshop mode, phase, and the active palette tool, and wires these hooks:
- `useYjsStore` / `useYjsPresence` - sync and presence
- `useCanvasClickPlacement` - palette tool + canvas click places a shape, then starts editing it
- `useKeyboardShortcuts` - single-letter shortcuts place a shape at the cursor directly (see `SHAPE_SHORTCUTS`); arrow keys in flow mode create the next shape in sequence ([src/lib/flowSequence.ts](src/lib/flowSequence.ts))
- `usePlacementCursor` - custom cursor previewing the selected tool ([src/lib/cursorGeneration.ts](src/lib/cursorGeneration.ts))
- `usePivotalPreview` - live detection of pivotal events near vertical lines ([src/tldraw/pivotalDetection.ts](src/tldraw/pivotalDetection.ts))
- `useFileOperations` - JSON export and import ([src/tldraw/boardFormat.ts](src/tldraw/boardFormat.ts))
- `useTemplateLoader` - loads a sample board from [public/samples/](public/samples/) when the URL carries `?template=<file>`, once the store reports `synced-remote` and only if the page has no shapes yet

Palette, mode selector, phase selector, and connection status live in [src/tldraw/BoardComponents.tsx](src/tldraw/BoardComponents.tsx). Every palette button carries `data-tool="<type>"` and `data-active`; tests rely on these.

### Core Domain Model

[src/lib/workshopConfig.ts](src/lib/workshopConfig.ts) is the single source of truth for what can be placed and when:
- **14 tool types** (`TOOLS`): ten stickies (`event`, `hotspot`, `person`, `system`, `opportunity`, `glossary`, `command`, `policy`, `aggregate`, `readmodel`, each suffixed `-sticky`) plus `vertical-line`, `horizontal-lane`, `theme-area`, `label`
- **4 workshop modes** (`WORKSHOP_MODES`): `process` (default), `design`, `big-picture`, `team-flow`. Each tool lists the modes it appears in
- **5 facilitation phases** (`ALL_PHASES`): `chaotic-exploration`, `enforce-timeline`, `people-and-systems`, `problems-and-opportunities`, `next-steps`. Phases only gate tools in Big Picture and Team Flow (`usesPhases`); the phase selector is not rendered in Process or Design
- `isToolAvailable(tool, mode, phase)` drives the palette; `getDefaultProps(type)` supplies size and empty text/name at placement (it overrides each `ShapeUtil`'s own `getDefaultProps`)
- `SHAPE_SHORTCUTS` maps keys to tools; `EDITABLE_TYPES` lists what enters edit mode on placement (everything except the two lines)

Shape colors for the ten stickies come from [src/lib/shapeColors.ts](src/lib/shapeColors.ts). Theme areas, lines, and labels hardcode their colors in their own component files.

### Visual Grammar (EventStorming Semantics)

- **Events** (orange): past-tense domain events
- **Hotspots** (white, red hand-drawn stroke, rotated): problems, risks, uncertainties
- **Person** (yellow, half-height): people initiating actions
- **System** (pink, double-wide): external systems
- **Opportunity** (green): improvement ideas
- **Glossary** (dark): term definitions
- **Command** (blue), **Policy** (purple, double-wide), **Aggregate** (yellow, double-wide), **Read model** (green): Process and Design mode elements
- **Vertical line**: pivotal boundary between sub-processes; events placed on one render as pivotal squares
- **Horizontal lane**: swimlane
- **Theme area**: dashed rectangle grouping related elements; shapes dragged in are reparented to it
- **Label**: free text

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
New board ids come from [src/lib/nanoid.ts](src/lib/nanoid.ts) (used by `BoardList`) and are validated by [src/lib/roomId.ts](src/lib/roomId.ts) before a room is joined. tldraw shape ids come from `createShapeId()`.

### Environment Variables
- `VITE_COLLAB_HOST`: collaboration worker host (`localhost:8800` in `.env.local`; the deployed worker in `.env.production` and the deploy workflow)
- `VITE_TLDRAW_LICENSE_KEY`: tldraw hobby license, domain-locked to `*.eventstormer.virtualgenius.com`. Lives in the gitignored `.env.local` / `.env.production` for local use and in the GitHub Actions secret `TLDRAW_LICENSE_KEY` for the production build. The hobby tier shows tldraw's small watermark even when valid; that is not an expiry.

### Deployment
Push to `main` builds and deploys the frontend to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml). The worker deploys separately with `npm run deploy:worker`. Details in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Documentation

- [VISION.md](docs/VISION.md): product vision, target audience, guiding principles
- [PLAN.md](docs/PLAN.md): milestones, roadmap, differentiators backlog
- [FEATURE_IDEAS.md](docs/FEATURE_IDEAS.md): differentiation brainstorm with priority assessment
- [TODO.md](docs/TODO.md): near-term backlog
- [DEPLOYMENT.md](docs/DEPLOYMENT.md): Cloudflare Workers and GitHub Pages deployment
- [DEBUG-LOGGING.md](docs/DEBUG-LOGGING.md): `?debug=true` logging
- [TESTING.md](docs/TESTING.md): testing notes

## Code Clarity (Enforced by ESLint)

Pre-commit hooks (husky + lint-staged) block commits with ESLint warnings on staged `.ts`/`.tsx` files. Root-level config files (`*.config.ts`) are excluded from lint; anything else outside `src/` and `tests/` must be added to `tsconfig.json` `include` or the typed parser rejects it. Claude should proactively fix these patterns:

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

**Unit tests** (Vitest) sit beside the code in `__tests__` folders under `src/lib/` and `src/tldraw/`, covering the pure modules: `workshopConfig`, `flowSequence`, `shapeLayout`, `shapeColors`, `cursorGeneration`, `roomId`, `boardFormat`, `pivotalDetection`, `keyboardHandlers`, `editorHelpers`, `useYjsStore`, `placementCursor`.

**E2E tests** (Playwright) in [tests/e2e/](tests/e2e/), with the page object [tests/pages/CanvasPage.ts](tests/pages/CanvasPage.ts) (`goto`, `selectTool`, `createShapeAt`, `selectWorkshopMode`, `selectPhase`, zoom and pan) and store helpers in [tests/utils/tldraw.ts](tests/utils/tldraw.ts) (`getShapesByType`, `waitForShapeCount`, `clearAllShapes`). The Playwright `webServer` runs `npm run dev`, so the worker is up for sync tests; each run uses a fresh board id.

tldraw renders every shape inside `.tl-shape[data-shape-type="<type>"][data-shape-id]`. A shape util with a `backgroundComponent` (currently only `theme-area`) gets a second wrapper with class `tl-shape-background`, so locate rendered content with `.tl-shape:not(.tl-shape-background)[data-shape-type="<type>"] .tl-html-container`.

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
