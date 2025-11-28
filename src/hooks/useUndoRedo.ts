import { useEffect } from 'react';
import { UndoManager } from 'yjs';
import * as Y from 'yjs';
import { debugLog } from '@/lib/debug';

export function useUndoRedo(ydoc: Y.Doc | null) {
  useEffect(() => {
    if (!ydoc) return;

    const yboard = ydoc.getMap('board');
    const undoManager = new UndoManager([yboard], {
      trackedOrigins: new Set([null]), // Track all origins
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a textarea or input
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (undoManager.canUndo()) {
          undoManager.undo();
          debugLog('UndoRedo', 'Undo performed');
        }
      }

      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        if (undoManager.canRedo()) {
          undoManager.redo();
          debugLog('UndoRedo', 'Redo performed');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      undoManager.destroy();
    };
  }, [ydoc]);
}
