import { create } from "zustand";

interface BoardMetaState {
  boardId: string | null;
  boardName: string;
  userName: string | null;

  setBoardId: (id: string | null) => void;
  setBoardName: (name: string) => void;
  setUserName: (name: string | null) => void;
}

export const useBoardStore = create<BoardMetaState>((set) => ({
  boardId: null,
  boardName: "Untitled Board",
  userName: null,

  setBoardId: (id) => set({ boardId: id }),
  setBoardName: (name) => set({ boardName: name }),
  setUserName: (name) => set({ userName: name }),
}));
