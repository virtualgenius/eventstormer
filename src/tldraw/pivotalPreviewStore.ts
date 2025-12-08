import { create } from 'zustand'

interface PivotalPreviewState {
  previewId: string | null
  setPreviewId: (id: string | null) => void
}

export const usePivotalPreviewStore = create<PivotalPreviewState>((set) => ({
  previewId: null,
  setPreviewId: (id) => set({ previewId: id }),
}))
