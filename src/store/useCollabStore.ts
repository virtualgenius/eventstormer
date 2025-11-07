import { create } from "zustand";
import * as Y from "yjs";
import YPartyKitProvider from "y-partykit/provider";
import { nanoid } from "../lib/nanoid";
import { debugLog } from "@/lib/debug";
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

  // Actions
  connect: (roomId: string) => void;
  disconnect: () => void;
  updateCursor: (x: number, y: number) => void;
  setPhase: (phase: FacilitationPhase) => void;
  setActiveTool: (tool: string | null) => void;
  addSticky: (partial: Omit<BaseSticky, "id" | "createdAt" | "updatedAt">) => void;
  addVertical: (x: number, label?: string) => void;
  addLane: (y: number, label?: string) => void;
  addTheme: (area: Omit<ThemeArea, "id">) => void;
  updateSticky: (id: string, patch: Partial<BaseSticky>) => void;
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
    yboard.set("id", "demo-board");
    yboard.set("name", "Untitled Timeline");
    yboard.set("stickies", new Y.Array());
    yboard.set("verticals", new Y.Array());
    yboard.set("lanes", new Y.Array());
    yboard.set("themes", new Y.Array());
    yboard.set("createdAt", now());
    yboard.set("updatedAt", now());
    yboard.set("phase", "events");
  }

  // Convert Y.Doc to Board object
  const getBoardState = (): Board => {
    return yMapToObject(yboard) as Board;
  };

  // Subscribe to Yjs changes
  yboard.observe(() => {
    set({ board: getBoardState() });
  });

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
    }
  };
});
