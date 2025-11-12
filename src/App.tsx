import React, { useEffect, useRef } from "react";
import { KonvaCanvas } from "@/components/KonvaCanvas";
import { FacilitationPalette } from "@/components/FacilitationPalette";
import { useCollabStore } from "@/store/useCollabStore";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Users, Download, Save, Upload, FileJson } from "lucide-react";
import { exportCanvasToImage } from "@/lib/export";
import { downloadBoardJSON, importBoardJSON } from "@/lib/persistence";
import type Konva from "konva";

const App: React.FC = () => {
  const connect = useCollabStore((state) => state.connect);
  const disconnect = useCollabStore((state) => state.disconnect);
  const isConnected = useCollabStore((state) => state.isConnected);
  const usersOnline = useCollabStore((state) => state.usersOnline);
  const board = useCollabStore((state) => state.board);
  const hasUnsavedChanges = useCollabStore((state) => state.hasUnsavedChanges);
  const saveToIndexedDB = useCollabStore((state) => state.saveToIndexedDB);
  const loadFromIndexedDB = useCollabStore((state) => state.loadFromIndexedDB);
  const ydoc = useCollabStore((state) => state.ydoc);
  const stageRef = useRef<Konva.Stage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enable undo/redo with keyboard shortcuts
  useUndoRedo(ydoc);

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
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="w-3 h-3" />
            <span>{usersOnline} online</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
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
