import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { KonvaCanvas } from "@/components/KonvaCanvas";
import { FacilitationPalette } from "@/components/FacilitationPalette";
import { NamePrompt } from "@/components/NamePrompt";
import { useCollabStore } from "@/store/useCollabStore";
import { useBoardStore } from "@/store/useBoardStore";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Users, Download, Save, Upload, FileJson, Hand, MousePointer, Menu, X, Home, Edit2 } from "lucide-react";
import { exportCanvasToImage } from "@/lib/export";
import { downloadBoardJSON, importBoardJSON } from "@/lib/persistence";
import type Konva from "konva";

const USER_NAME_KEY = "eventstormer-user-name";

export const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const connectToBoard = useCollabStore((state) => state.connectToBoard);
  const disconnect = useCollabStore((state) => state.disconnect);
  const isConnected = useCollabStore((state) => state.isConnected);
  const usersOnline = useCollabStore((state) => state.usersOnline);
  const users = useCollabStore((state) => state.users);
  const board = useCollabStore((state) => state.board);
  const interactionMode = useCollabStore((state) => state.interactionMode);
  const setInteractionMode = useCollabStore((state) => state.setInteractionMode);
  const hasUnsavedChanges = useCollabStore((state) => state.hasUnsavedChanges);
  const saveToIndexedDB = useCollabStore((state) => state.saveToIndexedDB);
  const ydoc = useCollabStore((state) => state.ydoc);
  const setBoardId = useBoardStore((state) => state.setBoardId);
  const setBoardName = useBoardStore((state) => state.setBoardName);
  const setUserName = useBoardStore((state) => state.setUserName);
  const userName = useBoardStore((state) => state.userName);

  const stageRef = useRef<Konva.Stage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usersListRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showUsersList, setShowUsersList] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedBoardName, setEditedBoardName] = useState("");
  const boardNameInputRef = useRef<HTMLInputElement>(null);

  // Enable undo/redo with keyboard shortcuts
  useUndoRedo(ydoc);

  // Check for stored user name on mount
  useEffect(() => {
    const storedName = localStorage.getItem(USER_NAME_KEY);
    if (storedName) {
      setUserName(storedName);
    } else {
      setShowNamePrompt(true);
    }
  }, [setUserName]);

  // Close users list and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (usersListRef.current && !usersListRef.current.contains(event.target as Node)) {
        setShowUsersList(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showUsersList || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUsersList, showMobileMenu]);

  // Connect to collaboration room when boardId changes
  useEffect(() => {
    if (!boardId) return;
    if (showNamePrompt) return; // Wait for name prompt to complete

    setBoardId(boardId);
    connectToBoard(boardId, userName || undefined);

    return () => {
      disconnect();
    };
  }, [boardId, connectToBoard, disconnect, setBoardId, showNamePrompt, userName]);

  // Update awareness with user name when it changes
  useEffect(() => {
    if (userName && isConnected) {
      const provider = useCollabStore.getState().provider;
      if (provider) {
        const currentState = provider.awareness.getLocalState();
        provider.awareness.setLocalState({
          ...currentState,
          user: {
            ...currentState?.user,
            name: userName
          }
        });
      }
    }
  }, [userName, isConnected]);

  const handleNameSubmit = (name: string) => {
    localStorage.setItem(USER_NAME_KEY, name);
    setUserName(name);
    setShowNamePrompt(false);
  };

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

      // Confirm import will replace current board content
      const confirmImport = confirm(
        `Import "${importedBoard.name}"? This will replace the current board content with ${importedBoard.stickies.length} stickies.`
      );
      if (!confirmImport) return;
      if (!ydoc) return;

      // Load imported board data into Yjs document
      const yboard = ydoc.getMap("board");

      // Use transact to batch all changes
      ydoc.transact(() => {
        // Update board metadata (keep current board ID to stay in same room)
        yboard.set("name", importedBoard.name);
        yboard.set("mainTimelineId", importedBoard.mainTimelineId);
        yboard.set("sessionMode", importedBoard.sessionMode || "big-picture");
        yboard.set("phase", importedBoard.phase);
        yboard.set("updatedAt", new Date().toISOString());

        // Get or create arrays
        let stickies = yboard.get("stickies") as any;
        let verticals = yboard.get("verticals") as any;
        let lanes = yboard.get("lanes") as any;
        let labels = yboard.get("labels") as any;
        let themes = yboard.get("themes") as any;
        let timelines = yboard.get("timelines") as any;

        // Clear existing content
        if (stickies) stickies.delete(0, stickies.length);
        if (verticals) verticals.delete(0, verticals.length);
        if (lanes) lanes.delete(0, lanes.length);
        if (labels) labels.delete(0, labels.length);
        if (themes) themes.delete(0, themes.length);
        if (timelines) timelines.delete(0, timelines.length);

        // Add imported content
        importedBoard.stickies.forEach((s: any) => stickies.push([s]));
        importedBoard.verticals.forEach((v: any) => verticals.push([v]));
        importedBoard.lanes.forEach((l: any) => lanes.push([l]));
        if (importedBoard.labels) {
          importedBoard.labels.forEach((l: any) => labels.push([l]));
        }
        importedBoard.themes.forEach((t: any) => themes.push([t]));
        if (importedBoard.timelines) {
          importedBoard.timelines.forEach((t: any) => timelines.push([t]));
        }
      });

      // Save to IndexedDB
      await saveToIndexedDB();

      alert(`Imported "${importedBoard.name}" with ${importedBoard.stickies.length} stickies.`);
    } catch (error) {
      console.error('Failed to import board:', error);
      alert('Failed to import board JSON. Please check the file format.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualSave = async () => {
    await saveToIndexedDB();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleStartEditName = () => {
    setEditedBoardName(board.name);
    setIsEditingName(true);
    setTimeout(() => boardNameInputRef.current?.select(), 0);
  };

  const handleSaveBoardName = () => {
    if (editedBoardName.trim() && ydoc) {
      setBoardName(editedBoardName.trim());
      const yboard = ydoc.getMap("board");
      yboard.set("name", editedBoardName.trim());
    }
    setIsEditingName(false);
  };

  const handleBoardNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveBoardName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  if (showNamePrompt) {
    return <NamePrompt onSubmit={handleNameSubmit} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen">
      <header className="flex items-center justify-between px-3 py-2 md:px-4 border-b bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={handleGoHome}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Back to boards"
          >
            <Home className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            {isEditingName ? (
              <input
                ref={boardNameInputRef}
                type="text"
                value={editedBoardName}
                onChange={(e) => setEditedBoardName(e.target.value)}
                onBlur={handleSaveBoardName}
                onKeyDown={handleBoardNameKeyDown}
                className="text-sm md:text-base font-semibold tracking-tight bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            ) : (
              <button
                onClick={handleStartEditName}
                className="group flex items-center gap-1.5 text-sm md:text-base font-semibold tracking-tight truncate hover:text-blue-600 dark:hover:text-blue-400"
                title="Click to edit board name"
              >
                <span className="truncate">{board.name}</span>
                <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
          {hasUnsavedChanges && (
            <span className="hidden sm:inline text-xs text-amber-600 dark:text-amber-400">
              • Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Pan/Select Mode Toggle */}
          <div className="flex items-center gap-0.5 md:gap-1 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 md:p-1">
            <button
              onClick={() => setInteractionMode('pan')}
              className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 text-xs rounded transition-colors ${
                interactionMode === 'pan'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Pan Mode (Space)"
            >
              <Hand className="w-3.5 h-3.5 md:w-3 md:h-3" />
              <span className="hidden sm:inline">Pan</span>
            </button>
            <button
              onClick={() => setInteractionMode('select')}
              className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 text-xs rounded transition-colors ${
                interactionMode === 'select'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Select Mode (V)"
            >
              <MousePointer className="w-3.5 h-3.5 md:w-3 md:h-3" />
              <span className="hidden sm:inline">Select</span>
            </button>
          </div>

          {/* Desktop buttons - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2">
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
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Mobile menu button */}
          <div className="lg:hidden relative" ref={menuRef}>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center justify-center w-9 h-9 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {showMobileMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 min-w-[180px] z-50">
                <button
                  onClick={() => { handleManualSave(); setShowMobileMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => { handleExportPNG(); setShowMobileMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export PNG
                </button>
                <button
                  onClick={() => { handleExportJSON(); setShowMobileMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <FileJson className="w-4 h-4" />
                  Export JSON
                </button>
                <button
                  onClick={() => { handleImportJSON(); setShowMobileMenu(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Import JSON
                </button>
              </div>
            )}
          </div>
          <div className="relative" ref={usersListRef}>
            <button
              onClick={() => setShowUsersList(!showUsersList)}
              className="flex items-center gap-1.5 md:gap-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 md:px-3 py-1.5 rounded transition-colors"
            >
              <Users className="w-3.5 h-3.5 md:w-3 md:h-3" />
              <span className="hidden sm:inline">{usersOnline} online</span>
              <span className="sm:hidden">{usersOnline}</span>
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
