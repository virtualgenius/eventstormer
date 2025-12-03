import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Calendar, Clock, Pencil, ChevronRight, BookOpen } from "lucide-react";
import { nanoid } from "@/lib/nanoid";

interface SampleBoard {
  id: string;
  version: number;
  name: string;
  description: string;
  file: string;
  mode: string;
}

interface RecentBoard {
  id: string;
  name: string;
  lastVisited: string;
}

const STORAGE_KEY = "eventstormer-recent-boards";

function getRecentBoards(): RecentBoard[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const boards = JSON.parse(stored);
    // Migration: add name field if missing
    return boards.map((b: RecentBoard) => ({
      ...b,
      name: b.name || `Board ${b.id.slice(0, 6)}`,
    }));
  } catch {
    return [];
  }
}

function saveRecentBoards(boards: RecentBoard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards.slice(0, 10)));
}

function removeRecentBoard(boardId: string): RecentBoard[] {
  const boards = getRecentBoards().filter((b) => b.id !== boardId);
  saveRecentBoards(boards);
  return boards;
}

export function addRecentBoard(boardId: string, name?: string): void {
  const existing = getRecentBoards();
  const existingBoard = existing.find((b) => b.id === boardId);
  const boardName = name || existingBoard?.name || `Board ${boardId.slice(0, 6)}`;

  const boards = existing.filter((b) => b.id !== boardId);
  boards.unshift({
    id: boardId,
    name: boardName,
    lastVisited: new Date().toISOString(),
  });
  saveRecentBoards(boards);
}

export function updateBoardName(boardId: string, name: string): void {
  const boards = getRecentBoards().map((b) =>
    b.id === boardId ? { ...b, name } : b
  );
  saveRecentBoards(boards);
}

export function getBoardName(boardId: string): string | null {
  const boards = getRecentBoards();
  const board = boards.find((b) => b.id === boardId);
  return board?.name ?? null;
}

export const BoardList: React.FC = () => {
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState("");
  const [recentBoards, setRecentBoards] = useState<RecentBoard[]>([]);
  const [sampleBoards, setSampleBoards] = useState<SampleBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);

  useEffect(() => {
    setRecentBoards(getRecentBoards());
    fetch("/samples/index.json")
      .then((res) => res.json())
      .then((data) => setSampleBoards(data))
      .catch(() => setSampleBoards([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateBoard = () => {
    const newBoardId = nanoid();
    navigate(`/board/${newBoardId}`);
  };

  const handleOpenSample = (sample: SampleBoard) => {
    navigate(`/board/sample-${sample.id}-v${sample.version}?sample=${encodeURIComponent(sample.file)}`);
  };

  const handleDeleteBoard = (
    e: React.MouseEvent,
    boardId: string,
    boardName: string
  ) => {
    e.stopPropagation();
    if (confirm(`Delete "${boardName}"? This will remove it from your recent boards.`)) {
      setRecentBoards(removeRecentBoard(boardId));
    }
  };

  const handleStartRename = (e: React.MouseEvent, board: RecentBoard) => {
    e.stopPropagation();
    setEditingBoardId(board.id);
    setEditingName(board.name);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingBoardId && editingName.trim()) {
      updateBoardName(editingBoardId, editingName.trim());
      setRecentBoards(getRecentBoards());
    }
    setEditingBoardId(null);
    setEditingName("");
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBoardId(null);
    setEditingName("");
  };

  const handleJoinBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomIdInput.trim()) {
      navigate(`/board/${roomIdInput.trim()}`);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400">Loading boards...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            EventStormer
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Purpose-built facilitation tool for EventStorming workshops
          </p>
        </header>

        <div className="mb-8">
          <button
            onClick={handleCreateBoard}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            New Board
          </button>
        </div>

        {recentBoards.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
            <div className="text-slate-500 dark:text-slate-400">
              No recent boards. Click "New Board" to create one!
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentBoards.map((board) => (
              <div
                key={board.id}
                onClick={() => editingBoardId !== board.id && navigate(`/board/${board.id}`)}
                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  {editingBoardId === board.id ? (
                    <form onSubmit={handleSaveRename} className="flex-1 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") handleCancelRename(e as unknown as React.MouseEvent);
                        }}
                        autoFocus
                        className="w-full px-2 py-1 text-sm font-semibold border border-blue-400 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="submit"
                          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelRename}
                          className="px-2 py-1 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate flex-1 mr-2">
                      {board.name}
                    </h3>
                  )}
                  {editingBoardId !== board.id && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleStartRename(e, board)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Rename board"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteBoard(e, board.id, board.name)}
                        className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Delete board"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-2 truncate">
                  {board.id}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(board.lastVisited)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(board.lastVisited)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Example boards section */}
        {sampleBoards.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Examples
            </h2>
            <div className="grid gap-3">
              {sampleBoards.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleOpenSample(sample)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        {sample.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {sample.description}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                      {sample.mode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible join section */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          {showJoinInput ? (
            <form onSubmit={handleJoinBoard} className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Room ID:</span>
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                placeholder="paste room ID here"
                autoFocus
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-48"
              />
              <button
                type="submit"
                disabled={!roomIdInput.trim()}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded text-sm"
              >
                Join
              </button>
              <button
                type="button"
                onClick={() => { setShowJoinInput(false); setRoomIdInput(""); }}
                className="text-sm text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowJoinInput(true)}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 -ml-2 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              Have a room ID? Join an existing board...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
