import { create } from "zustand";
import * as Y from "yjs";
import YPartyKitProvider from "y-partykit/provider";
import { nanoid } from "../lib/nanoid";
import { debugLog } from "@/lib/debug";
import { saveBoard, loadBoard } from "@/lib/persistence";
import type {
  Board,
  BaseSticky,
  FacilitationPhase,
  HorizontalLane,
  VerticalLine,
  ThemeArea
} from "@/types/domain";

const now = () => new Date().toISOString();

interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

interface CollabState {
  ydoc: Y.Doc;
  provider: YPartyKitProvider | null;
  board: Board;
  activeTool: string | null;
  userColor: string;
  userId: string;
  isConnected: boolean;
  usersOnline: number;
  users: Map<number, User>;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;

  // Actions
  connect: (roomId: string) => void;
  disconnect: () => void;
  updateCursor: (x: number, y: number) => void;
  setPhase: (phase: FacilitationPhase) => void;
  setActiveTool: (tool: string | null) => void;
  addSticky: (partial: Omit<BaseSticky, "id" | "createdAt" | "updatedAt">) => void;
  deleteSticky: (id: string) => void;
  addVertical: (x: number, label?: string) => void;
  addLane: (y: number, label?: string) => void;
  addTheme: (area: Omit<ThemeArea, "id">) => void;
  updateSticky: (id: string, patch: Partial<BaseSticky>) => void;
  saveToIndexedDB: () => Promise<void>;
  loadFromIndexedDB: (boardId: string) => Promise<void>;
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

export const useCollabStore = create<CollabState>((set, get) => {
  const ydoc = new Y.Doc();
  const yboard = ydoc.getMap("board");
  const userId = nanoid();
  const userColor = generateUserColor();

  // Initialize default board structure
  if (!yboard.has("id")) {
    const mainTimelineId = nanoid();

    yboard.set("id", "demo-board");
    yboard.set("name", "Untitled Board");
    yboard.set("mainTimelineId", mainTimelineId);
    yboard.set("timelines", new Y.Array());
    yboard.set("stickies", new Y.Array());
    yboard.set("verticals", new Y.Array());
    yboard.set("lanes", new Y.Array());
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

  // Subscribe to Yjs changes and mark as unsaved
  yboard.observe(() => {
    set({
      board: getBoardState(),
      hasUnsavedChanges: true
    });
  });

  // Autosave every 5 seconds
  let autosaveInterval: NodeJS.Timeout | null = null;

  const startAutosave = () => {
    if (autosaveInterval) return;

    autosaveInterval = setInterval(async () => {
      const state = get();
      if (state.hasUnsavedChanges) {
        await saveBoard(state.board);
        set({
          hasUnsavedChanges: false,
          lastSavedAt: new Date().toISOString()
        });
        debugLog('Persistence', 'Board autosaved to IndexedDB');
      }
    }, 5000); // 5 seconds
  };

  // Start autosave on store creation
  startAutosave();

  // Expose store to window for testing
  if (typeof window !== 'undefined') {
    (window as any).__testStore = { getState: get, setState: set };
  }

  return {
    ydoc,
    provider: null,
    board: getBoardState(),
    activeTool: null,
    userColor,
    userId,
    isConnected: false,
    usersOnline: 0,
    users: new Map(),
    hasUnsavedChanges: false,
    lastSavedAt: null,

    connect: (roomId: string) => {
      const host = import.meta.env.VITE_PARTYKIT_HOST || "localhost:1999";
      const provider = new YPartyKitProvider(host, roomId, ydoc);

      provider.on("status", ({ status }: { status: string }) => {
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
      provider.awareness.setLocalState({
        user: {
          id: userId,
          color: userColor,
          name: `User ${userId.slice(0, 4)}`
        }
      });

      set({ provider });
    },

    disconnect: () => {
      const { provider } = get();
      if (provider) {
        provider.disconnect();
        set({ provider: null, isConnected: false, usersOnline: 0, users: new Map() });
      }
    },

    updateCursor: (x: number, y: number) => {
      const { provider } = get();
      if (provider) {
        const currentState = provider.awareness.getLocalState();
        provider.awareness.setLocalState({
          ...currentState,
          user: {
            ...currentState.user,
            cursor: { x, y }
          }
        });
      }
    },

    setPhase: (phase) => {
      yboard.set("phase", phase);
      yboard.set("updatedAt", now());
    },

    setActiveTool: (tool) => {
      set({ activeTool: tool });
    },

    addSticky: (partial) => {
      const stickies = yboard.get("stickies") as Y.Array<any>;
      const newSticky = {
        id: nanoid(),
        createdAt: now(),
        updatedAt: now(),
        ...partial
      };
      debugLog('Store', `Adding sticky - ID: ${newSticky.id}, Kind: ${newSticky.kind}, Position: (${partial.x}, ${partial.y}), Text: "${partial.text}"`);
      stickies.push([newSticky]);
      yboard.set("updatedAt", now());
    },

    deleteSticky: (id) => {
      const stickies = yboard.get("stickies") as Y.Array<any>;
      const stickyArray = stickies.toArray();
      const index = stickyArray.findIndex((s: BaseSticky) => s.id === id);

      if (index !== -1) {
        const sticky = stickyArray[index];
        debugLog('Store', `Deleting sticky - ID: ${id}, Kind: ${sticky.kind}, Text: "${sticky.text}"`);
        stickies.delete(index, 1);
        yboard.set("updatedAt", now());
      }
    },

    addVertical: (x, label) => {
      const verticals = yboard.get("verticals") as Y.Array<any>;
      verticals.push([{
        id: nanoid(),
        x,
        label,
        pivotalEventId: undefined
      }]);
      yboard.set("updatedAt", now());
    },

    addLane: (y, label) => {
      const lanes = yboard.get("lanes") as Y.Array<any>;
      lanes.push([{ id: nanoid(), y, label }]);
      yboard.set("updatedAt", now());
    },

    addTheme: (area) => {
      const themes = yboard.get("themes") as Y.Array<any>;
      themes.push([{ id: nanoid(), ...area }]);
      yboard.set("updatedAt", now());
    },

    updateSticky: (id, patch) => {
      const stickies = yboard.get("stickies") as Y.Array<any>;
      const stickyArray = stickies.toArray();
      const index = stickyArray.findIndex((s: BaseSticky) => s.id === id);

      if (index !== -1) {
        const oldSticky = stickyArray[index];
        const updated = { ...oldSticky, ...patch, updatedAt: now() };

        const changes: string[] = [];
        if (patch.x !== undefined || patch.y !== undefined) {
          changes.push(`Position: (${oldSticky.x}, ${oldSticky.y}) → (${updated.x}, ${updated.y})`);
        }
        if (patch.text !== undefined) {
          changes.push(`Text: "${oldSticky.text}" → "${updated.text}"`);
        }
        if (patch.kind !== undefined) {
          changes.push(`Kind: ${oldSticky.kind} → ${updated.kind}`);
        }

        debugLog('Store', `Updating sticky - ID: ${id}, ${changes.join(', ')}`);

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

    loadFromIndexedDB: async (boardId: string) => {
      const loadedBoard = await loadBoard(boardId);
      if (!loadedBoard) {
        debugLog('Persistence', `Board ${boardId} not found in IndexedDB`);
        return;
      }

      // Update Yjs document with loaded data
      yboard.set("id", loadedBoard.id);
      yboard.set("name", loadedBoard.name);
      yboard.set("mainTimelineId", loadedBoard.mainTimelineId);
      yboard.set("sessionMode", loadedBoard.sessionMode || "big-picture");
      yboard.set("phase", loadedBoard.phase);
      yboard.set("createdAt", loadedBoard.createdAt);
      yboard.set("updatedAt", loadedBoard.updatedAt);

      // Clear and repopulate arrays
      const stickies = yboard.get("stickies") as Y.Array<any>;
      const verticals = yboard.get("verticals") as Y.Array<any>;
      const lanes = yboard.get("lanes") as Y.Array<any>;
      const themes = yboard.get("themes") as Y.Array<any>;
      const timelines = yboard.get("timelines") as Y.Array<any>;

      stickies.delete(0, stickies.length);
      verticals.delete(0, verticals.length);
      lanes.delete(0, lanes.length);
      themes.delete(0, themes.length);
      timelines.delete(0, timelines.length);

      if (loadedBoard.stickies.length > 0) stickies.push(loadedBoard.stickies);
      if (loadedBoard.verticals.length > 0) verticals.push(loadedBoard.verticals);
      if (loadedBoard.lanes.length > 0) lanes.push(loadedBoard.lanes);
      if (loadedBoard.themes.length > 0) themes.push(loadedBoard.themes);
      if (loadedBoard.timelines && loadedBoard.timelines.length > 0) timelines.push(loadedBoard.timelines);

      set({
        hasUnsavedChanges: false,
        lastSavedAt: loadedBoard.updatedAt
      });

      debugLog('Persistence', `Board ${boardId} loaded from IndexedDB`);
    }
  };
});
