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

export interface VerticalLine {
  id: string;
  x: number;
  label?: string;
  pivotalEventId?: string;
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
  stickyIds: string[];
}

export interface Board {
  id: string;
  name: string;
  stickies: BaseSticky[];
  verticals: VerticalLine[];
  lanes: HorizontalLane[];
  themes: ThemeArea[];
  createdAt: string;
  updatedAt: string;
  phase: FacilitationPhase;
}

export type FacilitationPhase =
  | "events"
  | "hotspots"
  | "pivotal"
  | "lanes"
  | "actors-systems"
  | "opportunities"
  | "glossary";

