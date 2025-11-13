import React, { useEffect, useRef, useState } from "react";
import { KonvaCanvas } from "@/components/KonvaCanvas";
import { FacilitationPalette } from "@/components/FacilitationPalette";
import { useCollabStore } from "@/store/useCollabStore";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Users, Download, Save, Upload, FileJson, Hand, MousePointer, Trash2 } from "lucide-react";
import { exportCanvasToImage } from "@/lib/export";
import { downloadBoardJSON, importBoardJSON } from "@/lib/persistence";
import type Konva from "konva";

const App: React.FC = () => {
  const connect = useCollabStore((state) => state.connect);
  const disconnect = useCollabStore((state) => state.disconnect);
  const isConnected = useCollabStore((state) => state.isConnected);
  const usersOnline = useCollabStore((state) => state.usersOnline);
  const users = useCollabStore((state) => state.users);
  const board = useCollabStore((state) => state.board);
  const interactionMode = useCollabStore((state) => state.interactionMode);
  const setInteractionMode = useCollabStore((state) => state.setInteractionMode);
  const hasUnsavedChanges = useCollabStore((state) => state.hasUnsavedChanges);
  const saveToIndexedDB = useCollabStore((state) => state.saveToIndexedDB);
  const loadFromIndexedDB = useCollabStore((state) => state.loadFromIndexedDB);
  const ydoc = useCollabStore((state) => state.ydoc);
  const stageRef = useRef<Konva.Stage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usersListRef = useRef<HTMLDivElement>(null);
  const [showUsersList, setShowUsersList] = useState(false);

  // Enable undo/redo with keyboard shortcuts
  useUndoRedo(ydoc);

  // Close users list when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (usersListRef.current && !usersListRef.current.contains(event.target as Node)) {
        setShowUsersList(false);
      }
    };

    if (showUsersList) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUsersList]);

  useEffect(() => {
    // Try to load board from IndexedDB on mount
    loadFromIndexedDB("demo-board").then(() => {
      // Connect to default room after loading
      connect("demo-room");
    });

    return () => {
      disconnect();
    };
  }, [connect, disconnect, loadFromIndexedDB]);

  const handleExportPNG = () => {
    exportCanvasToImage(stageRef.current);
  };

  const handleExportJSON = () => {
    downloadBoardJSON(board);
  };

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const importedBoard = importBoardJSON(text);
      await loadFromIndexedDB(importedBoard.id);
      window.location.reload(); // Reload to apply imported board
    } catch (error) {
      console.error('Failed to import board:', error);
      alert('Failed to import board JSON. Please check the file format.');
    }
  };

  const handleManualSave = async () => {
    await saveToIndexedDB();
  };

  const clearBoard = useCollabStore((state) => state.clearBoard);

  const handleClearBoard = async () => {
    if (confirm('Clear all data? This will delete everything from the board and storage.')) {
      // Clear the Yjs document
      clearBoard();

      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }

      // Reload to start fresh
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen">
      <header className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold tracking-tight">EventStormer</div>
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              • Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Pan/Select Mode Toggle */}
          <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setInteractionMode('pan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
                interactionMode === 'pan'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Pan Mode (Space)"
            >
              <Hand className="w-3 h-3" />
              Pan
            </button>
            <button
              onClick={() => setInteractionMode('select')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
                interactionMode === 'select'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Select Mode (V)"
            >
              <MousePointer className="w-3 h-3" />
              Select
            </button>
          </div>

          <button
            onClick={handleClearBoard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-100 rounded transition-colors"
            title="Clear all data and reload"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
            title="Save to IndexedDB"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
            title="Export board as PNG"
          >
            <Download className="w-3 h-3" />
            PNG
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
            title="Export board as JSON"
          >
            <FileJson className="w-3 h-3" />
            Export
          </button>
          <button
            onClick={handleImportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
            title="Import board from JSON"
          >
            <Upload className="w-3 h-3" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="relative" ref={usersListRef}>
            <button
              onClick={() => setShowUsersList(!showUsersList)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-1.5 rounded transition-colors"
            >
              <Users className="w-3 h-3" />
              <span>{usersOnline} online</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </button>
            {showUsersList && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 min-w-[200px] z-50">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-2 py-1 mb-1">
                  Online Users
                </div>
                {Array.from(users.values()).length === 0 ? (
                  <div className="text-xs text-slate-500 px-2 py-1">No users online</div>
                ) : (
                  <div className="space-y-1">
                    {Array.from(users.values()).map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: user.color }}
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-300">
                          {user.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <FacilitationPalette />
      <main className="flex-1">
        <KonvaCanvas stageRef={stageRef} />
      </main>
    </div>
  );
};

export default App;
