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
  laneId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Timeline {
  id: string;
  name: string;                  // "Main Timeline" or "User Management Timeline"
  x: number;                     // Starting x position
  y: number;                     // Starting y position
  orientation: "horizontal" | "vertical"; // Future: vertical timelines
  stickyIds: string[];           // Events on this timeline
  verticalIds: string[];         // Pivotal boundaries for this timeline
}

export interface VerticalLine {
  id: string;
  x: number;
  y1?: number;                   // Optional start y position
  y2?: number;                   // Optional end y position
  label?: string;
  pivotalEventId?: string;
  timelineId?: string;           // Which timeline owns this boundary (optional for backward compat)
}

export interface HorizontalLane {
  id: string;
  y: number;
  x1?: number;  // Start x position (defaults to 0)
  x2?: number;  // End x position (defaults to canvas width)
  label?: string;
}

export interface ThemeArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stickyIds?: string[];          // DEPRECATED: Use Timeline.stickyIds instead
  timelineId?: string;           // Theme = Sub-Timeline (optional for backward compat)
}

export interface Label {
  id: string;
  text: string;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
}

export type EventStormingMode = "big-picture" | "process-level" | "design-level";

export interface Board {
  id: string;
  name: string;
  mainTimelineId?: string;       // References the primary Timeline (optional for backward compat)
  timelines?: Timeline[];        // Main + sub-timelines (themes) (optional for backward compat)
  stickies: BaseSticky[];
  verticals: VerticalLine[];
  lanes: HorizontalLane[];
  labels?: Label[];              // Optional for backward compatibility with existing boards
  themes: ThemeArea[];           // Visual bounds for sub-timelines
  sessionMode?: EventStormingMode; // Big Picture, Process-Level, Design-Level (optional, defaults to "big-picture")
  phase: FacilitationPhase;      // Current facilitation phase (board-level)
  createdAt: string;
  updatedAt: string;
}

export type FacilitationPhase =
  | "chaotic-exploration"
  | "enforce-timeline"
  | "people-and-systems"
  | "problems-and-opportunities"
  | "glossary";

export type ElementType = StickyKind | "vertical-line" | "horizontal-lane" | "label" | "theme-area";

