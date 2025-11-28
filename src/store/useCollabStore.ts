import { create } from "zustand";
import * as Y from "yjs";
import YProvider from "y-partyserver/provider";
import { nanoid } from "../lib/nanoid";
import { debugLog } from "@/lib/debug";
import { saveBoard, loadBoard } from "@/lib/persistence";
import type {
  Board,
  BaseSticky,
  FacilitationPhase,
  HorizontalLane,
  VerticalLine,
  ThemeArea,
  Label
} from "@/types/domain";

const now = () => new Date().toISOString();

interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export type InteractionMode = 'pan' | 'select' | 'add';
export type ElementType = 'sticky' | 'vertical' | 'lane' | 'label' | 'theme';

export interface SelectedElement {
  id: string;
  type: ElementType;
}

const DEFAULT_BOARD: Board = {
  id: "",
  name: "Untitled Board",
  stickies: [],
  verticals: [],
  lanes: [],
  labels: [],
  themes: [],
  phase: "chaotic-exploration",
  createdAt: now(),
  updatedAt: now()
};

interface CollabState {
  ydoc: Y.Doc | null;
  provider: YProvider | null;
  board: Board;
  currentBoardId: string | null;
  activeTool: string | null;
  interactionMode: InteractionMode;
  selectedElements: SelectedElement[];
  userColor: string;
  userId: string;
  isConnected: boolean;
  usersOnline: number;
  users: Map<number, User>;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  locallyCreatedLabelIds: Set<string>;

  // Actions
  connectToBoard: (boardId: string, userName?: string) => Promise<void>;
  disconnect: () => void;
  updateCursor: (x: number, y: number) => void;
  setPhase: (phase: FacilitationPhase) => void;
  setActiveTool: (tool: string | null) => void;
  setInteractionMode: (mode: InteractionMode) => void;
  setSelectedElements: (elements: SelectedElement[]) => void;
  addToSelection: (id: string, type: ElementType) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  toggleSelection: (id: string, type: ElementType) => void;
  isSelected: (id: string) => boolean;
  addSticky: (partial: Omit<BaseSticky, "id" | "createdAt" | "updatedAt">) => void;
  deleteSticky: (id: string) => void;
  addVertical: (x: number, y1?: number, y2?: number, label?: string) => void;
  updateVertical: (id: string, patch: Partial<Pick<VerticalLine, "x" | "y1" | "y2" | "label">>) => void;
  deleteVertical: (id: string) => void;
  addLane: (y: number, x1?: number, x2?: number, label?: string) => void;
  updateLane: (id: string, patch: Partial<Pick<HorizontalLane, "y" | "x1" | "x2" | "label">>) => void;
  deleteLane: (id: string) => void;
  addLabel: (x: number, y: number, text?: string) => void;
  updateLabel: (id: string, patch: Partial<Pick<Label, "x" | "y" | "text">>) => void;
  deleteLabel: (id: string) => void;
  clearLocalLabelTracking: (id: string) => void;
  addTheme: (area: Omit<ThemeArea, "id">) => void;
  updateTheme: (id: string, patch: Partial<Pick<ThemeArea, "name" | "x" | "y" | "width" | "height">>) => void;
  deleteTheme: (id: string) => void;
  updateSticky: (id: string, patch: Partial<BaseSticky>) => void;
  saveToIndexedDB: () => Promise<void>;
  clearBoard: () => void;
}

// Generate random user color
const generateUserColor = () => {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
    "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Convert Y.Map to plain object
const yMapToObject = (ymap: Y.Map<any>): any => {
  const obj: any = {};
  ymap.forEach((value, key) => {
    if (value instanceof Y.Array) {
      obj[key] = value.toArray();
    } else if (value instanceof Y.Map) {
      obj[key] = yMapToObject(value);
    } else {
      obj[key] = value;
    }
  });
  return obj;
};

// Persistent user identity
const userId = nanoid();
const userColor = generateUserColor();

// Autosave interval reference
let autosaveInterval: NodeJS.Timeout | null = null;

export const useCollabStore = create<CollabState>((set, get) => {
  // Start autosave
  const startAutosave = () => {
    if (autosaveInterval) return;

    autosaveInterval = setInterval(async () => {
      const state = get();
      if (state.hasUnsavedChanges && state.currentBoardId) {
        await saveBoard(state.board);
        set({
          hasUnsavedChanges: false,
          lastSavedAt: new Date().toISOString()
        });
        debugLog('Persistence', 'Board autosaved to IndexedDB');
      }
    }, 5000);
  };

  startAutosave();

  // Expose store to window for testing
  if (typeof window !== 'undefined') {
    (window as any).__testStore = { getState: get, setState: set };
  }

  return {
    ydoc: null,
    provider: null,
    board: DEFAULT_BOARD,
    currentBoardId: null,
    activeTool: null,
    interactionMode: 'pan' as InteractionMode,
    selectedElements: [],
    userColor,
    userId,
    isConnected: false,
    usersOnline: 0,
    users: new Map(),
    hasUnsavedChanges: false,
    lastSavedAt: null,
    locallyCreatedLabelIds: new Set<string>(),

    connectToBoard: async (boardId: string, userName?: string) => {
      const state = get();

      // If already connected to this board, do nothing
      if (state.currentBoardId === boardId && state.provider) {
        debugLog('Connection', `Already connected to board ${boardId}`);
        return;
      }

      // Disconnect from previous board if any
      if (state.provider) {
        debugLog('Connection', `Disconnecting from previous board ${state.currentBoardId}`);
        state.provider.disconnect();
      }

      // Try to load existing board from IndexedDB
      const savedBoard = await loadBoard(boardId);

      // Create fresh Y.Doc for this board
      const ydoc = new Y.Doc();
      const yboard = ydoc.getMap("board");

      if (savedBoard) {
        // Load saved board data into Yjs
        debugLog('Connection', `Loading board ${boardId} from IndexedDB`);
        yboard.set("id", savedBoard.id);
        yboard.set("name", savedBoard.name);
        yboard.set("mainTimelineId", savedBoard.mainTimelineId);
        yboard.set("sessionMode", savedBoard.sessionMode || "big-picture");
        yboard.set("phase", savedBoard.phase);
        yboard.set("createdAt", savedBoard.createdAt);
        yboard.set("updatedAt", savedBoard.updatedAt);

        // Initialize arrays
        const stickies = new Y.Array();
        const verticals = new Y.Array();
        const lanes = new Y.Array();
        const labels = new Y.Array();
        const themes = new Y.Array();
        const timelines = new Y.Array();

        yboard.set("stickies", stickies);
        yboard.set("verticals", verticals);
        yboard.set("lanes", lanes);
        yboard.set("labels", labels);
        yboard.set("themes", themes);
        yboard.set("timelines", timelines);

        // Populate arrays with saved data
        savedBoard.stickies.forEach(s => stickies.push([s]));
        savedBoard.verticals.forEach(v => verticals.push([v]));
        savedBoard.lanes.forEach(l => lanes.push([l]));
        if (savedBoard.labels) {
          savedBoard.labels.forEach(l => labels.push([l]));
        }
        savedBoard.themes.forEach(t => themes.push([t]));
        if (savedBoard.timelines) {
          savedBoard.timelines.forEach(t => timelines.push([t]));
        }
      } else {
        // Initialize new board with defaults
        debugLog('Connection', `Creating new board ${boardId}`);
        const mainTimelineId = nanoid();
        yboard.set("id", boardId);
        yboard.set("name", "Untitled Board");
        yboard.set("mainTimelineId", mainTimelineId);
        yboard.set("timelines", new Y.Array());
        yboard.set("stickies", new Y.Array());
        yboard.set("verticals", new Y.Array());
        yboard.set("lanes", new Y.Array());
        yboard.set("labels", new Y.Array());
        yboard.set("themes", new Y.Array());
        yboard.set("sessionMode", "big-picture");
        yboard.set("phase", "chaotic-exploration");
        yboard.set("createdAt", now());
        yboard.set("updatedAt", now());

        // Create main timeline
        const timelines = yboard.get("timelines") as Y.Array<any>;
        timelines.push([{
          id: mainTimelineId,
          name: "Main Timeline",
          x: 0,
          y: 200,
          orientation: "horizontal",
          stickyIds: [],
          verticalIds: []
        }]);
      }

      // Convert Y.Doc to Board object
      const getBoardState = (): Board => {
        return yMapToObject(yboard) as Board;
      };

      // Subscribe to Yjs changes
      yboard.observe(() => {
        set({
          board: getBoardState(),
          hasUnsavedChanges: true
        });
      });

      // Connect to collaboration server
      const host = import.meta.env.VITE_COLLAB_HOST || "localhost:8787";
      debugLog('Connection', `Connecting to board ${boardId} at ${host}`);

      const provider = new YProvider(host, boardId, ydoc, {
        connect: true,
        party: "yjs-room",
      });

      provider.on("status", ({ status }: { status: string }) => {
        debugLog('Connection', `Connection status: ${status}`);
        set({ isConnected: status === "connected" });
      });

      provider.awareness.on("change", () => {
        const states = provider.awareness.getStates();
        const users = new Map<number, User>();

        states.forEach((state, clientId) => {
          if (state.user) {
            users.set(clientId, state.user);
          }
        });

        set({ usersOnline: states.size, users });
      });

      // Set local user info
      const displayName = userName || `User ${userId.slice(0, 4)}`;
      provider.awareness.setLocalState({
        user: {
          id: userId,
          color: userColor,
          name: displayName
        }
      });

      set({
        ydoc,
        provider,
        currentBoardId: boardId,
        board: getBoardState(),
        selectedElements: [],
        locallyCreatedLabelIds: new Set<string>(),
        hasUnsavedChanges: false
      });
    },

    disconnect: () => {
      const { provider } = get();
      if (provider) {
        provider.disconnect();
        set({
          provider: null,
          ydoc: null,
          currentBoardId: null,
          isConnected: false,
          usersOnline: 0,
          users: new Map(),
          board: DEFAULT_BOARD
        });
      }
    },

    updateCursor: (x: number, y: number) => {
      const { provider } = get();
      if (provider) {
        const currentState = provider.awareness.getLocalState();
        provider.awareness.setLocalState({
          ...currentState,
          user: {
            ...currentState?.user,
            cursor: { x, y }
          }
        });
      }
    },

    setPhase: (phase) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      yboard.set("phase", phase);
      yboard.set("updatedAt", now());
    },

    setActiveTool: (tool) => {
      set({
        activeTool: tool,
        interactionMode: tool ? 'add' : get().interactionMode
      });
    },

    setInteractionMode: (mode) => {
      const currentState = get();
      if (currentState.interactionMode === 'add' && mode !== 'add') {
        set({ interactionMode: mode, activeTool: null });
      } else {
        set({ interactionMode: mode });
      }
    },

    setSelectedElements: (elements) =>
      set({ selectedElements: elements }),

    addToSelection: (id, type) =>
      set((state) => {
        const exists = state.selectedElements.some(el => el.id === id);
        if (exists) return state;
        return { selectedElements: [...state.selectedElements, { id, type }] };
      }),

    removeFromSelection: (id) =>
      set((state) => ({
        selectedElements: state.selectedElements.filter(el => el.id !== id)
      })),

    clearSelection: () =>
      set({ selectedElements: [] }),

    toggleSelection: (id, type) =>
      set((state) => {
        const exists = state.selectedElements.some(el => el.id === id);
        if (exists) {
          return { selectedElements: state.selectedElements.filter(el => el.id !== id) };
        } else {
          return { selectedElements: [...state.selectedElements, { id, type }] };
        }
      }),

    isSelected: (id) => {
      const state = get();
      return state.selectedElements.some(el => el.id === id);
    },

    addSticky: (partial) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const stickies = yboard.get("stickies") as Y.Array<any>;
      const newSticky = {
        id: nanoid(),
        createdAt: now(),
        updatedAt: now(),
        ...partial
      };
      debugLog('Store', `Adding sticky - ID: ${newSticky.id}, Kind: ${newSticky.kind}`);
      stickies.push([newSticky]);
      yboard.set("updatedAt", now());
    },

    deleteSticky: (id) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const stickies = yboard.get("stickies") as Y.Array<any>;
      const stickyArray = stickies.toArray();
      const index = stickyArray.findIndex((s: BaseSticky) => s.id === id);

      if (index !== -1) {
        stickies.delete(index, 1);
        yboard.set("updatedAt", now());
      }
    },

    addVertical: (x, y1, y2, label) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const verticals = yboard.get("verticals") as Y.Array<any>;
      verticals.push([{
        id: nanoid(),
        x,
        y1,
        y2,
        label,
        pivotalEventId: undefined
      }]);
      yboard.set("updatedAt", now());
    },

    updateVertical: (id, patch) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const verticals = yboard.get("verticals") as Y.Array<any>;
      const verticalArray = verticals.toArray();
      const idx = verticalArray.findIndex((v: VerticalLine) => v.id === id);
      if (idx !== -1) {
        verticals.delete(idx, 1);
        verticals.insert(idx, [{ ...verticalArray[idx], ...patch }]);
        yboard.set("updatedAt", now());
      }
    },

    deleteVertical: (id) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const verticals = yboard.get("verticals") as Y.Array<any>;
      const verticalArray = verticals.toArray();
      const idx = verticalArray.findIndex((v: VerticalLine) => v.id === id);
      if (idx !== -1) {
        verticals.delete(idx, 1);
        yboard.set("updatedAt", now());
      }
    },

    addLane: (y, x1, x2, label) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const lanes = yboard.get("lanes") as Y.Array<any>;
      lanes.push([{ id: nanoid(), y, x1, x2, label }]);
      yboard.set("updatedAt", now());
    },

    updateLane: (id, patch) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const lanes = yboard.get("lanes") as Y.Array<any>;
      const laneArray = lanes.toArray();
      const idx = laneArray.findIndex((l: HorizontalLane) => l.id === id);
      if (idx !== -1) {
        lanes.delete(idx, 1);
        lanes.insert(idx, [{ ...laneArray[idx], ...patch }]);
        yboard.set("updatedAt", now());
      }
    },

    deleteLane: (id) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const lanes = yboard.get("lanes") as Y.Array<any>;
      const laneArray = lanes.toArray();
      const idx = laneArray.findIndex((l: HorizontalLane) => l.id === id);
      if (idx !== -1) {
        lanes.delete(idx, 1);
        yboard.set("updatedAt", now());
      }
    },

    addLabel: (x, y, text = "Label") => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const labels = yboard.get("labels") as Y.Array<any>;
      const id = nanoid();
      labels.push([{
        id,
        text,
        x,
        y,
        createdAt: now(),
        updatedAt: now()
      }]);
      yboard.set("updatedAt", now());
      set(state => ({
        locallyCreatedLabelIds: new Set([...state.locallyCreatedLabelIds, id])
      }));
    },

    updateLabel: (id, patch) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const labels = yboard.get("labels") as Y.Array<any>;
      const labelArray = labels.toArray();
      const idx = labelArray.findIndex((l: Label) => l.id === id);
      if (idx !== -1) {
        labels.delete(idx, 1);
        labels.insert(idx, [{ ...labelArray[idx], ...patch, updatedAt: now() }]);
        yboard.set("updatedAt", now());
      }
    },

    deleteLabel: (id) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const labels = yboard.get("labels") as Y.Array<any>;
      const labelArray = labels.toArray();
      const idx = labelArray.findIndex((l: Label) => l.id === id);
      if (idx !== -1) {
        labels.delete(idx, 1);
        yboard.set("updatedAt", now());
      }
    },

    clearLocalLabelTracking: (id) => {
      set(state => {
        const newSet = new Set(state.locallyCreatedLabelIds);
        newSet.delete(id);
        return { locallyCreatedLabelIds: newSet };
      });
    },

    addTheme: (area) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const themes = yboard.get("themes") as Y.Array<any>;
      themes.push([{ id: nanoid(), ...area }]);
      yboard.set("updatedAt", now());
    },

    updateTheme: (id, patch) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const themes = yboard.get("themes") as Y.Array<any>;
      const themeArray = themes.toArray();
      const idx = themeArray.findIndex((t: ThemeArea) => t.id === id);
      if (idx !== -1) {
        themes.delete(idx, 1);
        themes.insert(idx, [{ ...themeArray[idx], ...patch }]);
        yboard.set("updatedAt", now());
      }
    },

    deleteTheme: (id) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const themes = yboard.get("themes") as Y.Array<any>;
      const themeArray = themes.toArray();
      const idx = themeArray.findIndex((t: ThemeArea) => t.id === id);
      if (idx !== -1) {
        themes.delete(idx, 1);
        yboard.set("updatedAt", now());
      }
    },

    updateSticky: (id, patch) => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");
      const stickies = yboard.get("stickies") as Y.Array<any>;
      const stickyArray = stickies.toArray();
      const index = stickyArray.findIndex((s: BaseSticky) => s.id === id);

      if (index !== -1) {
        const oldSticky = stickyArray[index];
        const updated = { ...oldSticky, ...patch, updatedAt: now() };
        stickies.delete(index, 1);
        stickies.insert(index, [updated]);
        yboard.set("updatedAt", now());
      }
    },

    saveToIndexedDB: async () => {
      const state = get();
      await saveBoard(state.board);
      set({
        hasUnsavedChanges: false,
        lastSavedAt: new Date().toISOString()
      });
      debugLog('Persistence', 'Board manually saved to IndexedDB');
    },

    clearBoard: () => {
      const { ydoc } = get();
      if (!ydoc) return;
      const yboard = ydoc.getMap("board");

      const stickies = yboard.get("stickies") as Y.Array<any>;
      const verticals = yboard.get("verticals") as Y.Array<any>;
      const lanes = yboard.get("lanes") as Y.Array<any>;
      const labels = yboard.get("labels") as Y.Array<any>;
      const themes = yboard.get("themes") as Y.Array<any>;
      const timelines = yboard.get("timelines") as Y.Array<any>;

      stickies.delete(0, stickies.length);
      verticals.delete(0, verticals.length);
      lanes.delete(0, lanes.length);
      labels.delete(0, labels.length);
      themes.delete(0, themes.length);
      timelines.delete(0, timelines.length);

      yboard.set("updatedAt", now());
      debugLog('Store', 'Board cleared');
    }
  };
});
