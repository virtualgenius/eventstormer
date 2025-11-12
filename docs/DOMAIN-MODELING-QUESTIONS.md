# DOMAIN-MODELING-QUESTIONS.md

## Context

Before implementing **Slice 4 (Persistence & History)**, we need to clarify the domain model to ensure we persist the correct data structures. This document captures open questions about how to model timelines, themes, and session modes.

**Current Status:** Domain model in [src/types/domain.ts](../src/types/domain.ts) treats timelines as **implicit** (derived from sticky positions). This may not be sufficient for features like sub-timelines and theme extraction.

---

## Current Domain Model

### What We Have Today

```typescript
export interface Board {
  id: string;
  name: string;
  stickies: BaseSticky[];      // All stickies on canvas
  verticals: VerticalLine[];    // Pivotal boundaries (global)
  lanes: HorizontalLane[];      // Swimlanes
  themes: ThemeArea[];          // Theme rectangles with stickyIds
  phase: FacilitationPhase;     // Big Picture phases
  createdAt: string;
  updatedAt: string;
}

export interface ThemeArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stickyIds: string[];         // Stickies in this theme
}

export interface VerticalLine {
  id: string;
  x: number;
  label?: string;
  pivotalEventId?: string;
}
```

### What's Missing

- **No Timeline entity** - timeline is implicit (stickies ordered by x-coordinate)
- **No sub-timeline concept** - themes can have sub-timelines, but not modeled
- **No session mode** - Big Picture vs Process-Level vs Design-Level not captured

---

## Key Clarifications from Discussion

### 1. Board vs Timeline vs Theme

**Corrected Understanding:**

- **Board** = Single workshop session canvas
  - Contains **one or more timelines** (main timeline + theme sub-timelines)
  - Example: "E-commerce Platform EventStorming" board

- **Timeline** = Horizontal flow of events representing a process
  - **Main timeline:** The primary Big Picture event flow
  - **Sub-timeline:** A theme-specific process flow (e.g., "User Management" timeline within the main board)
  - Timelines are **NOT separate boards**

- **Theme** = Sub-process grouping (visual + semantic)
  - Examples: "User Management", "Payments", "Marketing"
  - Themes can have **sub-timelines** on the same board
  - Theme extraction = grouping stickies into a ThemeArea, possibly with its own sub-timeline

### 2. EventStorming Session Types

**Big Picture, Process-Level, Design-Level are SESSION MODES, not board types.**

- A board can host **multiple session types** (e.g., Big Picture main timeline + Process-Level sub-timeline)
- Or separate boards for different sessions
- User choice: "Do I drill into 'Payments' on the same board or create a new board?"

---

## Open Questions

### Section A: Timeline Domain Model

#### A.1: Should Timeline Be an Explicit Entity?

**Current:** Timeline is implicit (stickies positioned on x-axis, ordered left-to-right)

**Proposed:** Add explicit `Timeline` entity

```typescript
export interface Timeline {
  id: string;
  name: string;                  // "Main Timeline" or "User Management Timeline"
  parentTimelineId?: string;     // For hierarchical sub-timelines
  x: number;                     // Starting x position
  y: number;                     // Starting y position
  orientation: "horizontal" | "vertical"; // Future: vertical timelines?
  stickyIds: string[];           // Events on this timeline
  verticalIds: string[];         // Pivotal boundaries for this timeline
}

export interface Board {
  id: string;
  name: string;
  timelines: Timeline[];         // NEW: Main + sub-timelines
  stickies: BaseSticky[];
  verticals: VerticalLine[];
  lanes: HorizontalLane[];
  themes: ThemeArea[];
  phase: FacilitationPhase;
  // ...
}
```

**Questions:**
- Should timelines be **explicit entities** or **derived from sticky positions**?
- If explicit, what properties should they have?
- Do we need to support **hierarchical timelines** (parent/child relationships)?

**Implications:**
- **Explicit Timeline:** Enables querying "all events in User Management timeline", easier to implement timeline-specific features
- **Implicit Timeline:** Simpler data model, but harder to support sub-timelines

---

#### A.2: How Do ThemeAreas and Sub-Timelines Relate?

**Current:** `ThemeArea` has `stickyIds[]` but no timeline concept

**Option A: Timeline is a property of ThemeArea**
```typescript
export interface ThemeArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stickyIds: string[];
  timelineId?: string;           // References a sub-timeline
}
```

**Option B: ThemeArea and Timeline are separate, related by spatial containment**
```typescript
// Timeline positioned inside ThemeArea bounds
// No explicit reference, just check if timeline.x/y is within theme bounds
```

**Option C: ThemeArea IS a sub-timeline (no separate Timeline entity)**
```typescript
export interface ThemeArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stickyIds: string[];
  hasTimeline: boolean;          // Visual flag
  pivotalEventIds?: string[];    // Sub-timeline pivotal boundaries
}
```

**Questions:**
- What's the relationship between themes and sub-timelines?
- Can a theme exist **without** a sub-timeline? (just a visual grouping)
- Can a sub-timeline exist **without** a theme area? (timeline not bounded by rectangle)

---

#### A.3: Should Vertical Lines (Pivotal Boundaries) Be Scoped to Timelines?

**Current:** `VerticalLine` is global (spans entire canvas height, no timeline association)

**Proposed:** Scope to timelines
```typescript
export interface VerticalLine {
  id: string;
  x: number;
  label?: string;
  pivotalEventId?: string;
  timelineId?: string;           // NEW: Which timeline owns this boundary?
  // If null/undefined, it's a global boundary spanning all timelines
}
```

**Questions:**
- Should pivotal boundaries be **global** (span all timelines) or **per-timeline**?
- Can a single vertical line mark pivotal events on **multiple timelines**?
- How do we render global vs timeline-scoped boundaries?

**Use Case:**
- Main timeline has pivotals at x=500, x=1000
- "User Management" sub-timeline (y=600-900) has its own pivotals at x=300, x=700
- Should these be separate `VerticalLine` entities or share boundaries?

---

#### A.4: Is the Main Timeline Explicit or Implicit?

**Option A: Implicit main timeline**
- All stickies **not in a theme sub-timeline** belong to the main timeline
- No explicit `Timeline` entity for main timeline

**Option B: Explicit main timeline**
```typescript
export interface Board {
  id: string;
  name: string;
  mainTimelineId: string;        // References the primary Timeline
  timelines: Timeline[];         // Includes main + sub-timelines
  // ...
}
```

**Questions:**
- Should the **main timeline** be an explicit `Timeline` entity?
- Or is it just "all stickies not in a sub-timeline"?

---

#### A.5: Should We Render Timelines Explicitly?

**Current:** No visual timeline element (just stickies arranged horizontally)

**Possible:** Render timeline as a visual element
- Horizontal line/path showing the flow
- Timeline label/header
- Visual distinction between main and sub-timelines

**Questions:**
- Should timelines be **rendered as visual elements** (lines/paths)?
- Or just **implicit horizontal arrangement** of stickies?
- If rendered, what visual properties (color, thickness, style)?

**Example:**
```
Main Timeline (y=200):    ━━━━━━━━━━━━━━━━━━━━━━━━━━→
                          [Event] [Event] [Hotspot] [Event]

Sub-Timeline (y=600):     ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ →
  "User Management"       [Event] [Event] [Event]
```

---

### Section B: Session Mode (EventStorming Types)

#### B.1: Should Session Mode Be Board-Level, Timeline-Level, or Both?

**Context:** Big Picture, Process-Level, Design-Level are **session modes**, not board types.

**Option A: Board-level mode**
```typescript
export type EventStormingMode = "big-picture" | "process-level" | "design-level";

export interface Board {
  id: string;
  name: string;
  sessionMode?: EventStormingMode; // Default: "big-picture"
  // Entire board uses one mode
  // ...
}
```

**Option B: Timeline-level mode**
```typescript
export interface Timeline {
  id: string;
  name: string;
  sessionMode: EventStormingMode; // Each timeline has its own mode
  currentPhase: string;           // Phase specific to this mode
  // ...
}
```
- Main timeline: Big Picture mode
- "Payments" sub-timeline: Process-Level mode (on same board)

**Option C: Both (board default + timeline override)**
```typescript
export interface Board {
  id: string;
  sessionMode: EventStormingMode; // Default for all timelines
  // ...
}

export interface Timeline {
  id: string;
  sessionMode?: EventStormingMode; // Override board default
  // ...
}
```

**Questions:**
- Is session mode **per-board** or **per-timeline**?
- Can a single board host **mixed modes** (Big Picture + Process-Level)?
- How does this affect the palette and available sticky types?

---

#### B.2: Should Facilitation Phases Be Per-Timeline or Per-Board?

**Current:** `Board.phase: FacilitationPhase` is board-level (Big Picture phases)

**With multiple session modes:**
- Big Picture phases: chaotic-exploration → enforce-timeline → people-and-systems → problems-and-opportunities → glossary
- Process-Level phases: (different flow? e.g., commands → policies → aggregates?)
- Design-Level phases: (different flow?)

**Option A: Board-level phase (current)**
```typescript
export interface Board {
  phase: FacilitationPhase; // Applies to entire board
}
```

**Option B: Timeline-level phase**
```typescript
export interface Timeline {
  sessionMode: EventStormingMode;
  currentPhase: string; // Phase specific to session mode
}
```
- Main timeline (Big Picture): currently in "enforce-timeline" phase
- Sub-timeline (Process-Level): currently in "commands" phase

**Questions:**
- Should phase be **per-board** or **per-timeline**?
- If per-timeline, how does the palette UI work? (show tools for all active timelines?)
- Can different timelines be in different phases simultaneously?

---

## Impact on Slice 4 (Persistence)

### Why These Questions Matter Now

**Slice 4 deliverables:**
- IndexedDB persistence (Dexie.js)
- Autosave every 5 seconds
- Undo/redo system (Y.UndoManager)
- Export/import board JSON
- "Unsaved changes" indicator

**Impact of domain model decisions:**
- **IndexedDB schema** must match the final domain model
- **JSON export format** must include timelines (if explicit)
- **Undo/redo** must handle timeline operations (create/delete/modify sub-timelines)
- **Migration path** if we change the model later

**Recommendation:**
- Answer domain modeling questions **before** implementing Slice 4
- Ensures we persist the right data structures from the start
- Avoids complex schema migrations later

---

## Decisions (Answered)

### A1: Timeline as Explicit Entity
**DECISION:** ✅ Yes, explicit `Timeline` entity with the proposed properties. No hierarchical relationships for now.

### A2: Theme-Timeline Relationship
**DECISION:** ✅ Themes ARE sub-timelines. A theme is a sub-timeline extracted from the main timeline.
- A theme **cannot exist without** a sub-timeline (they are the same concept)
- A sub-timeline **cannot exist without** a theme area (they are bound together)
- ThemeArea should reference its Timeline (or be merged into one entity)

### A3: Vertical Line Scoping
**DECISION:** ✅ Yes, scoped to timelines. Pivotal boundaries relate to pivotal events within a specific timeline/sub-timeline.
- A single vertical line **cannot** mark pivotal events on multiple timelines
- Different timelines need separate VerticalLine entities for their pivotal events
- Rendering approach: Let users draw them (details TBD)

### A4: Main Timeline
**DECISION:** ✅ Option B - Explicit main timeline entity

### A5: Timeline Rendering
**DECISION:** ✅ No explicit lines/paths. A timeline is just:
- A sequence of events
- Related elements (actors, pivotal event lines, swimlanes, etc.)
- Implicit visual arrangement, not a drawn line

### B1: Session Mode Location
**DECISION:** ✅ Board-level. Session mode defines the subset of available elements (events, hotspots, glossary, actors, systems, etc.).
- Functions as a guide for participants
- Facilitator chooses workshop stage (e.g., chaotic exploration)
- Avoids overwhelming participants new to EventStorming color syntax

### B2: Facilitation Phase Location
**DECISION:** ✅ Per-board (keep current `Board.phase` approach)

---

## Implementation Notes

**Key Insight:** Theme = Sub-Timeline (same concept, not separate)

**Proposed approach:**
- Keep `ThemeArea` entity (visual bounds + name)
- Add `Timeline` entity for both main and sub-timelines
- Link them: `ThemeArea.timelineId` references the sub-timeline
- Or merge: ThemeArea becomes Timeline with geometry properties

**DDD Evolution:** Domain model will evolve iteratively. Complex schema migrations are acceptable during pre-release.

---

## Next Steps

1. ✅ **Questions answered**
2. 🎯 **Update `src/types/domain.ts`** based on decisions
3. **Update SPEC.md** to reflect timeline and session mode concepts
4. **Implement Slice 4** with correct domain model
5. **Update PLAN.md** to include timeline/mode features in appropriate slices

---

## Related Documents

- [src/types/domain.ts](../src/types/domain.ts) - Current domain model
- [docs/SPEC.md](SPEC.md) - Product specification
- [docs/PLAN.md](PLAN.md) - Implementation roadmap
- [docs/VISION.md](VISION.md) - Product vision
