## PLAN.md

## Implementation Strategy

EventStormer follows a **slice-based delivery model** where each slice delivers a complete user-facing feature rather than building by technical layer. Slices are organized into milestones for production-ready releases.

### Technical Foundation Decisions

Based on [M2-TECHNOLOGY-EVALUATION.md](M2-TECHNOLOGY-EVALUATION.md):

**Phase 1 (M1): DOM-based MVP**
- **State Management**: Zustand (migrate to Yjs in Phase 2)
- **Rendering**: DOM (React divs with absolute positioning)
- **Pan/Zoom**: react-zoom-pan-pinch
- **Rationale**: Speed to market, validate product-market fit first

**Phase 2 (M2): Canvas Migration**
- **Rendering**: Migrate to react-konva (canvas-based)
- **Collaboration**: Yjs + PartyKit
- **Rationale**: Performance for large boards, native export support

**Technical Debt Markers:**
- 🔴 **DOM → Canvas migration planned** (Slice 3) - before export/performance becomes critical
- 🔴 **Zustand → Yjs migration** (Slice 2) - when adding real-time collaboration

---

## Milestone 1 — MVP Validation (DOM-based)

**Goal:** Validate core value proposition with real-time collaboration.

### Slice 1: Basic Canvas Interaction ✅ COMPLETE
**Status:** Shipped (commit 04deb84)

**Delivered:**
- Infinite canvas with pan/zoom (react-zoom-pan-pinch)
- Miro-style controls (right-click to pan, scroll to zoom)
- Click-to-create stickies centered under cursor
- Left-click to select and drag stickies
- Inline text editing with selection indicator
- Square sticky proportions (120x120px)
- Phase-based palette (events → hotspots → pivotal → lanes → actors-systems → opportunities → glossary)

**Technical Approach:**
- DOM rendering with absolute positioning
- Zustand for centralized state
- Transform-aware coordinate conversion
- Scale-adjusted dragging

---

### Slice 2: Real-time Collaboration 🎯 NEXT
**Goal:** Multi-user workshop sessions with live presence.

**User Value:** Teams can collaborate on EventStorming sessions remotely with instant updates.

**Deliverables:**
- Real-time board state sync across clients
- User presence (avatars + cursor positions)
- Conflict-free concurrent editing
- Automatic reconnection on network issues
- "Users online" indicator

**Technical Approach:**
- **Option A (Recommended):** Migrate Zustand → Yjs for native CRDT support
  - Y.Doc replaces Zustand store
  - Y.Map for board state
  - Y.Array for stickies/lines/themes
  - PartyKit for WebSocket server (or y-websocket)
- **Option B:** Sync Zustand ↔ Yjs manually
  - Keep Zustand for local state
  - Sync to Yjs for network layer
  - More complexity, but keeps existing code

**Implementation Steps:**
1. Choose collaboration backend (PartyKit vs y-websocket)
2. Integrate Yjs CRDT library
3. Add user awareness (cursors/avatars)
4. Implement presence UI
5. Test with multiple browser windows

**Success Criteria:**
- Two users can see each other's changes instantly
- No conflicts when editing simultaneously
- Cursors show where other users are working
- Works across browser tabs/windows

---

### Slice 3: Canvas Performance & Export
**Goal:** Handle large boards (500+ stickies) and export to images.

**User Value:** Workshops with many stickies don't lag; outputs can be shared as images.

**Deliverables:**
- Migrate from DOM to react-konva (canvas rendering)
- Viewport culling (only render visible elements)
- Native export to PNG/PDF
- Maintained Miro-style interaction model
- All existing features work with canvas

**Technical Approach:**
- Replace `<div>` stickies with Konva.Rect + Konva.Text
- Verify react-zoom-pan-pinch works with Konva
- Implement canvas-to-image export (native, no html-to-image)
- Add viewport bounds checking for culling

**Migration Risk Mitigation:**
- Keep DOM implementation in `feature/dom-rendering` branch
- Test thoroughly before merging to main
- Verify all interactions (drag, select, edit) work identically

**Success Criteria:**
- Board with 1000 stickies maintains 60fps
- Export generates high-quality PNG
- No regressions in interaction UX

---

### Slice 4: Persistence & History
**Goal:** Local autosave and undo/redo for resilience.

**User Value:** Work is never lost; mistakes can be undone.

**Deliverables:**
- IndexedDB persistence (Dexie.js)
- Autosave every 5 seconds
- Undo/redo system (Y.UndoManager if using Yjs, or Zundo)
- Export/import board JSON
- "Unsaved changes" indicator

**Technical Approach:**
- Dexie.js for IndexedDB wrapper
- If using Yjs: Y.UndoManager (built-in)
- If using Zustand: Zundo middleware
- Save board snapshots to IndexedDB
- JSON export via download

**Success Criteria:**
- Refresh browser → board state restored
- Ctrl+Z/Ctrl+Y work for undo/redo
- Export JSON works across browsers

---

### Slice 5: Visual Grammar Completeness
**Goal:** All EventStorming sticky types and structural elements.

**User Value:** Full visual vocabulary for Big Picture EventStorming.

**Deliverables:**
- All sticky types with correct colors
  - 🟧 Events (orange)
  - 🟥 Hotspots (red)
  - 🟨 Actors (yellow, half-height)
  - 🟪 Systems (lilac, half-height)
  - 🟩 Opportunities (green)
  - 🟫 Glossary (brown)
- Vertical lines (pivotal boundaries)
- Horizontal lanes (swimlanes with labels)
- Theme areas (rectangular zones)
- Palette respects phase constraints
- Keyboard shortcuts for common actions

**Technical Approach:**
- Add line creation tools
- Add lane creation tools
- Add theme area drag-to-select
- Implement color palette from spec
- Add keyboard shortcut handlers

**Success Criteria:**
- All 6 sticky types render with correct colors
- Lines and lanes can be added and labeled
- Theme areas can be created by drag-selecting

---

### Slice 6: Facilitation Features
**Goal:** Tools for facilitators to guide workshop flow.

**User Value:** Facilitators can organize breakout work and control workshop phases.

**Deliverables:**
- Zone creation (rectangular regions for breakout work)
- Participant self-assignment to zones
- Phase progression controls (facilitator advances phases)
- Facilitator dashboard (see who's working where)
- Read-only mode for non-facilitators during demos

**Technical Approach:**
- Add zone concept to domain model
- UI for zone creation/editing
- Participant assignment UI
- Role-based permissions (facilitator vs participant)
- Dashboard view showing zone assignments

**Success Criteria:**
- Facilitator can create zones and assign participants
- Participants can self-assign to zones
- Dashboard shows real-time zone activity

---

## Milestone 2 — Production Ready

**Goal:** Polish for real-world workshop use.

### Enhanced Collaboration
- Breakout group balancing view
- Participant expertise tagging
- Facilitator dashboard enhancements
- Session recording/playback

### Structure Tools
- Checkpoints (snapshot and rollback specific workshop stages)
- Theme extraction (select stickies → create sub-board)
- Font themes and facilitator control
- Glossary term highlighting (hover to show definition)

### Polish & UX
- Light/dark mode
- Framer Motion animations
- Keyboard shortcuts cheat sheet
- Onboarding tutorial

---

## Milestone 3 — Process-Level Support

**Goal:** Expand beyond Big Picture to Process-Level EventStorming.

### Process-Level Elements
- Commands (blue)
- Policies (lilac)
- Read models
- Process swimlane semantics

### Enhanced Validation
- Past-tense event checking
- Command/event relationship validation
- Policy trigger validation

---

## Milestone 4 — AI Assistance & Automation

**Goal:** Optional AI helpers for common facilitation tasks.

### AI Features
- Glossary generation from acronyms
- Past-tense correction suggestions
- Hotspot clustering recommendations
- Theme extraction suggestions
- Pattern recognition (temporal coupling, scatter-gather)

**Note:** AI is **optional** and **assistive**, not core to product.

---

## Future Considerations

**Post-M4 Enhancements:**
- CSV/Figma integration
- Optional cloud sync (Open Host model)
- Sandbox mode (unguided exploration)
- Versioned workshop history timeline
- Mobile/tablet optimization

---

## Outstanding Questions

- Should facilitator settings (palette control, font theme, color scheme) persist globally or per board?
- Should Open Host deployment include a minimal cloud relay service?
- When to migrate Zustand → Yjs? (During Slice 2 vs keep both?)

---

## Slice Progress Tracker

| Slice | Status | Commits | Next Action |
|-------|--------|---------|-------------|
| **1: Basic Canvas** | ✅ Complete | 04deb84 | - |
| **2: Real-time Collab** | ✅ Complete | 4db1bd1 | - |
| **3: Canvas Migration** | ✅ Complete | 28ad383, dd5b035, 83f8e0a | - |
| **4: Persistence** | ✅ Complete | 6560cb7 | - |
| **5: Visual Grammar** | 🎯 Next | - | All sticky types, lines, lanes, themes |
| **6: Facilitation** | 📝 Planned | - | After Slice 5 complete |
