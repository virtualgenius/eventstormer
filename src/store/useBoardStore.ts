import { create } from "zustand";
import { nanoid } from "../lib/nanoid";
import type {
  Board,
  BaseSticky,
  FacilitationPhase,
  HorizontalLane,
  VerticalLine,
  ThemeArea
} from "@/types/domain";

const now = () => new Date().toISOString();

interface BoardState {
  board: Board;
  activeTool: string | null;
  setPhase: (phase: FacilitationPhase) => void;
  setActiveTool: (tool: string | null) => void;
  addSticky: (partial: Omit<BaseSticky, "id" | "createdAt" | "updatedAt">) => void;
  addVertical: (x: number, label?: string) => void;
  addLane: (y: number, label?: string) => void;
  addTheme: (area: Omit<ThemeArea, "id">) => void;
  updateSticky: (id: string, patch: Partial<BaseSticky>) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: {
    id: "demo-board",
    name: "Untitled Timeline",
    stickies: [],
    verticals: [],
    lanes: [],
    themes: [],
    createdAt: now(),
    updatedAt: now(),
    phase: "chaotic-exploration"
  },
  activeTool: null,
  setPhase: (phase) =>
    set((state) => ({
      board: { ...state.board, phase, updatedAt: now() }
    })),
  setActiveTool: (tool) =>
    set({ activeTool: tool }),
  addSticky: (partial) =>
    set((state) => ({
      board: {
        ...state.board,
        stickies: [
          ...state.board.stickies,
          {
            id: nanoid(),
            createdAt: now(),
            updatedAt: now(),
            ...partial
          }
        ],
        updatedAt: now()
      }
    })),
  addVertical: (x, label) =>
    set((state) => ({
      board: {
        ...state.board,
        verticals: [
          ...state.board.verticals,
          { id: nanoid(), x, label, pivotalEventId: undefined }
        ],
        updatedAt: now()
      }
    })),
  addLane: (y, label) =>
    set((state) => ({
      board: {
        ...state.board,
        lanes: [...state.board.lanes, { id: nanoid(), y, label }],
        updatedAt: now()
      }
    })),
  addTheme: (area) =>
    set((state) => ({
      board: {
        ...state.board,
        themes: [...state.board.themes, { id: nanoid(), ...area }],
        updatedAt: now()
      }
    })),
  updateSticky: (id, patch) =>
    set((state) => ({
      board: {
        ...state.board,
        stickies: state.board.stickies.map((s) =>
          s.id === id ? { ...s, ...patch, updatedAt: now() } : s
        ),
        updatedAt: now()
      }
    }))
}));
