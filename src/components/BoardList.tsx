import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ExternalLink, Trash2, Calendar, Clock } from "lucide-react";
import { nanoid } from "@/lib/nanoid";

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

export const BoardList: React.FC = () => {
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState("");
  const [recentBoards, setRecentBoards] = useState<RecentBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRecentBoards(getRecentBoards());
    setLoading(false);
  }, []);

  const handleCreateBoard = () => {
    const newBoardId = nanoid();
    navigate(`/board/${newBoardId}`);
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

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={handleCreateBoard}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            New Board
          </button>

          <form onSubmit={handleJoinBoard} className="flex gap-2">
            <input
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="Enter room ID..."
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-40"
            />
            <button
              type="submit"
              disabled={!roomIdInput.trim()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Join
            </button>
          </form>
        </div>

        {recentBoards.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
            <div className="text-slate-500 dark:text-slate-400 mb-4">
              No boards yet. Create your first EventStorming board!
            </div>
            <button
              onClick={handleCreateBoard}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Board
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentBoards.map((board) => (
              <div
                key={board.id}
                onClick={() => navigate(`/board/${board.id}`)}
                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate flex-1 mr-2">
                    {board.name}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteBoard(e, board.id, board.name)}
                    className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Delete board"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
      </div>
    </div>
  );
};
