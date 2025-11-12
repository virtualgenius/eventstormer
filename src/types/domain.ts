export type StickyKind =
  | "event"
  | "hotspot"
  | "actor"
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
  label?: string;
  pivotalEventId?: string;
  timelineId: string;            // Which timeline owns this boundary
}

export interface HorizontalLane {
  id: string;
  y: number;
  label?: string;
}

export interface ThemeArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  timelineId: string;            // Theme = Sub-Timeline (bound together)
}

export type EventStormingMode = "big-picture" | "process-level" | "design-level";

export interface Board {
  id: string;
  name: string;
  mainTimelineId: string;        // References the primary Timeline
  timelines: Timeline[];         // Main + sub-timelines (themes)
  stickies: BaseSticky[];
  verticals: VerticalLine[];
  lanes: HorizontalLane[];
  themes: ThemeArea[];           // Visual bounds for sub-timelines
  sessionMode: EventStormingMode; // Big Picture, Process-Level, Design-Level
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

export type ElementType = StickyKind | "vertical-line" | "horizontal-lane" | "theme-area";

