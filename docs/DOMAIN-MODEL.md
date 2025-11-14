# DOMAIN-MODEL.md

## Overview

This document describes the **current domain model** for EventStormer, as implemented in [src/types/domain.ts](../src/types/domain.ts). It captures key design decisions about how we model boards, timelines, themes, stickies, and facilitation concepts.

**Last Updated:** 2025-01-14

---

## Core Entities

### Board

The **Board** is the top-level container for an EventStorming workshop session.

```typescript
export interface Board {
  id: string;
  name: string;
  mainTimelineId: string;        // References the primary Timeline
  timelines: Timeline[];         // Main + sub-timelines (themes)
  stickies: BaseSticky[];
  verticals: VerticalLine[];
  lanes: HorizontalLane[];
  labels: Label[];               // Lane labels, standalone text
  themes: ThemeArea[];           // Visual bounds for sub-timelines
  sessionMode: EventStormingMode; // "big-picture" | "process-level" | "design-level"
  phase: FacilitationPhase;      // Current facilitation phase
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

**Key Characteristics:**
- Contains **one main timeline** plus zero or more **sub-timelines** (themes)
- All board elements (stickies, lines, lanes) live in flat arrays at board level
- Session mode is **board-level** (not per-timeline)
- Facilitation phase is **board-level** (not per-timeline)

---

### Timeline

A **Timeline** represents a horizontal flow of events representing a process.

```typescript
export interface Timeline {
  id: string;
  name: string;                  // "Main Timeline" or "User Management Timeline"
  x: number;                     // Starting x position
  y: number;                     // Starting y position
  orientation: "horizontal" | "vertical"; // Future: vertical timelines
  stickyIds: string[];           // Events on this timeline
  verticalIds: string[];         // Pivotal boundaries for this timeline
}
```

**Key Characteristics:**
- **Explicit entity** (not derived from sticky positions)
- **Main timeline:** The primary Big Picture event flow on a board
- **Sub-timeline:** A theme-specific process flow (e.g., "User Management" timeline)
- No hierarchical relationships (`parentTimelineId` was considered but rejected)
- Not rendered as a visual line/path—just an organizing concept
- Timelines are positioned spatially but don't have width/height bounds (those come from ThemeArea)

**Design Decisions:**
- ✅ Timelines are explicit entities (not implicit)
- ✅ Main timeline is explicit (has its own Timeline entity)
- ❌ No hierarchical/nested timelines (flat structure)
- ❌ No visual rendering of timeline as a line/path

---

### ThemeArea

A **ThemeArea** defines the visual rectangular bounds for a sub-timeline (sub-process grouping).

```typescript
export interface ThemeArea {
  id: string;
  name: string;                  // "User Management", "Payments", etc.
  x: number;                     // Top-left x
  y: number;                     // Top-left y
  width: number;                 // Rectangle width
  height: number;                // Rectangle height
  timelineId: string;            // References the sub-timeline
}
```

**Key Characteristics:**
- **Theme = Sub-Timeline** (same concept, not separate)
- A ThemeArea **cannot exist without** a sub-timeline
- A sub-timeline **cannot exist without** a ThemeArea
- ThemeArea provides visual bounds; Timeline provides event sequence
- `timelineId` links to the corresponding Timeline entity

**Design Decisions:**
- ✅ Themes ARE sub-timelines (merged concept)
- ✅ ThemeArea + Timeline are linked (not merged into single entity for now)
- ✅ ThemeArea provides geometry; Timeline provides sequencing

---

### BaseSticky

Represents individual EventStorming elements (events, hotspots, actors, systems, etc.).

```typescript
export type StickyKind =
  | "event"
  | "hotspot"
  | "person"
  | "system"
  | "opportunity"
  | "glossary";

export interface BaseSticky {
  id: string;
  kind: StickyKind;
  text: string;
  x: number;
  y: number;
  laneId?: string;               // Which horizontal lane (if any)
  createdAt: string;
  updatedAt: string;
}
```

**Key Characteristics:**
- Flat structure (no inheritance hierarchy)
- All stickies stored in `Board.stickies[]`
- Position is absolute canvas coordinates
- No `timelineId` on sticky—timeline membership tracked in `Timeline.stickyIds[]`

---

### VerticalLine

Represents pivotal event boundaries (vertical lines on canvas).

```typescript
export interface VerticalLine {
  id: string;
  x: number;                     // Horizontal position
  y1?: number;                   // Optional start y position
  y2?: number;                   // Optional end y position
  label?: string;
  pivotalEventId?: string;       // Which event triggered this boundary
  timelineId: string;            // Which timeline owns this boundary
}
```

**Key Characteristics:**
- **Scoped to timelines** (not global across entire canvas)
- A single vertical line belongs to **one timeline** (cannot span multiple)
- Different timelines need separate VerticalLine entities for their pivotal events
- `y1/y2` define the vertical span (defaults to full canvas height if omitted)

**Design Decisions:**
- ✅ Vertical lines are scoped to timelines
- ❌ A single line cannot mark pivotal events on multiple timelines

---

### HorizontalLane

Represents swimlanes (horizontal dividers for process separation).

```typescript
export interface HorizontalLane {
  id: string;
  y: number;                     // Vertical position
  x1?: number;                   // Start x position (defaults to 0)
  x2?: number;                   // End x position (defaults to canvas width)
  label?: string;
  timelineId: string;            // Which timeline owns this lane
}
```

**Key Characteristics:**
- **Scoped to timelines** (same as vertical lines)
- User-defined start (`x1`) and end (`x2`) positions
- A single horizontal lane belongs to **one timeline** (cannot span multiple)
- Stickies reference lanes via `BaseSticky.laneId`

---

### Label

Standalone text labels (e.g., lane headers, annotations).

```typescript
export interface Label {
  id: string;
  text: string;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
}
```

**Key Characteristics:**
- Simple positioned text elements
- Used for lane headers, annotations, etc.

---

## Session Mode & Facilitation

### EventStormingMode

Defines the **type of EventStorming session** the board is hosting.

```typescript
export type EventStormingMode = "big-picture" | "process-level" | "design-level";
```

**Key Characteristics:**
- **Board-level** (not per-timeline)
- Functions as a guide for participants
- Defines the subset of available element types
- Helps avoid overwhelming new participants with full color syntax

**Design Decisions:**
- ✅ Session mode is board-level
- ❌ Not per-timeline (a board has one mode, even if it has sub-timelines)

---

### FacilitationPhase

Defines the **current phase** within a Big Picture EventStorming session.

```typescript
export type FacilitationPhase =
  | "chaotic-exploration"
  | "enforce-timeline"
  | "people-and-systems"
  | "problems-and-opportunities"
  | "glossary";
```

**Key Characteristics:**
- **Board-level** (not per-timeline)
- Controls which sticky types are available in the palette
- Linear progression through phases

**Design Decisions:**
- ✅ Phase is per-board
- ❌ Not per-timeline (all timelines on a board share the same phase)
- Future: Different phase flows for Process-Level and Design-Level modes

---

## Relationships & Invariants

### Board ↔ Timeline

- Board has **one main timeline** (referenced by `Board.mainTimelineId`)
- Board has **zero or more sub-timelines** (in `Board.timelines[]`, excluding main)
- All timelines (main + sub) are stored in `Board.timelines[]`

### Timeline ↔ ThemeArea

- **Theme = Sub-Timeline** (same concept)
- Each sub-timeline has **exactly one** ThemeArea (linked via `ThemeArea.timelineId`)
- Main timeline has **no** ThemeArea (it spans the full canvas implicitly)

### Timeline ↔ Sticky

- Stickies belong to timelines via `Timeline.stickyIds[]`
- Stickies do **not** have a `timelineId` field (membership is one-way reference)

### Timeline ↔ VerticalLine

- Vertical lines belong to timelines via `VerticalLine.timelineId`
- Each timeline tracks its boundaries via `Timeline.verticalIds[]`

### Sticky ↔ HorizontalLane

- Stickies reference lanes via `BaseSticky.laneId`
- Lanes are scoped to timelines via `HorizontalLane.timelineId`

---

## Key Design Decisions

### Timeline Modeling

**Question:** Should timelines be explicit entities or derived from sticky positions?

**Decision:** ✅ **Explicit Timeline entity**

**Rationale:**
- Enables querying "all events in User Management timeline"
- Easier to implement timeline-specific features (sub-timeline pivotals, ordering)
- Supports future features (timeline export, timeline-level permissions)

---

### Theme vs Sub-Timeline

**Question:** Are themes and sub-timelines separate concepts or the same?

**Decision:** ✅ **Theme = Sub-Timeline** (same concept)

**Rationale:**
- A theme **cannot exist without** a sub-timeline (they are bound together)
- A sub-timeline **cannot exist without** a theme area (visual bounds required)
- Keeps domain model simpler (no orphaned themes or unbounded sub-timelines)

**Implementation:**
- Kept as separate linked entities (`ThemeArea` + `Timeline`) for now
- May merge into single entity in future refactoring

---

### Vertical Line Scoping

**Question:** Should pivotal boundaries be global or per-timeline?

**Decision:** ✅ **Per-timeline** (scoped via `VerticalLine.timelineId`)

**Rationale:**
- Pivotal events are timeline-specific (boundary between sub-processes)
- Different sub-timelines may have pivotal events at different x-positions
- Single line cannot mark pivotal events on multiple timelines

---

### Main Timeline

**Question:** Should the main timeline be implicit or explicit?

**Decision:** ✅ **Explicit main timeline entity**

**Rationale:**
- Consistency (main timeline and sub-timelines modeled the same way)
- Explicit reference (`Board.mainTimelineId`) makes it easy to find
- Simplifies timeline-related queries and operations

---

### Timeline Rendering

**Question:** Should timelines be rendered as visual lines/paths?

**Decision:** ❌ **No explicit rendering**

**Rationale:**
- A timeline is just a sequence of events + related elements
- Visual arrangement is implicit (horizontal left-to-right flow)
- No need for drawn line/path element on canvas

---

### Session Mode Location

**Question:** Should session mode be board-level or timeline-level?

**Decision:** ✅ **Board-level** (`Board.sessionMode`)

**Rationale:**
- Session mode defines available element types (guide for participants)
- Facilitator chooses workshop stage for entire session
- Avoids complexity of mixed modes on same board
- Simpler palette UI (one mode, one set of tools)

---

### Facilitation Phase Location

**Question:** Should phase be board-level or timeline-level?

**Decision:** ✅ **Board-level** (`Board.phase`)

**Rationale:**
- Facilitation phase controls palette (which tools are available)
- All participants work in the same phase at the same time
- Linear progression through phases (no parallel phasing)
- Simpler UX (one phase indicator, one palette state)

---

## Future Considerations

### Potential Enhancements

- **Merge ThemeArea + Timeline** into single entity (reduce duplication)
- **Process-Level phase flow** (different from Big Picture phases)
- **Design-Level phase flow** (different from Big Picture phases)
- **Hierarchical timelines** (parent/child relationships for drill-down)
- **Vertical timeline orientation** (already in type, not implemented)
- **Timeline-level permissions** (who can edit which timeline)
- **Timeline export** (export single sub-timeline as separate board)

### Not Planned

- ❌ Global vertical lines (all lines are timeline-scoped)
- ❌ Mixed session modes on same board (one mode per board)
- ❌ Per-timeline facilitation phases (one phase per board)
- ❌ Visual timeline rendering (timelines remain implicit)

---

## Related Documents

- [src/types/domain.ts](../src/types/domain.ts) — TypeScript domain model implementation
- [docs/SPEC.md](SPEC.md) — Product specification
- [docs/PLAN.md](PLAN.md) — Implementation roadmap
- [docs/VISION.md](VISION.md) — Product vision
- [docs/DOMAIN-MODELING-QUESTIONS.md](DOMAIN-MODELING-QUESTIONS.md) — Original questions and discussion

---

## Changelog

### 2025-01-14
- Initial version based on decisions from domain modeling discussion
- Documented current state of domain.ts implementation
- Captured key design decisions and rationale
