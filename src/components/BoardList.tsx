import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { nanoid } from "@/lib/nanoid";

interface RecentBoard {
  id: string;
  lastVisited: string;
}

function getRecentBoards(): RecentBoard[] {
  try {
    const stored = localStorage.getItem("eventstormer-recent-boards");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function removeRecentBoard(boardId: string): RecentBoard[] {
  const boards = getRecentBoards().filter((b) => b.id !== boardId);
  localStorage.setItem("eventstormer-recent-boards", JSON.stringify(boards));
  return boards;
}

export function addRecentBoard(boardId: string): void {
  const boards = getRecentBoards().filter((b) => b.id !== boardId);
  boards.unshift({ id: boardId, lastVisited: new Date().toISOString() });
  // Keep only the 10 most recent
  localStorage.setItem(
    "eventstormer-recent-boards",
    JSON.stringify(boards.slice(0, 10))
  );
}

export const BoardList: React.FC = () => {
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState("");
  const [recentBoards, setRecentBoards] = useState<RecentBoard[]>([]);

  useEffect(() => {
    setRecentBoards(getRecentBoards());
  }, []);

  const handleCreateBoard = () => {
    const newBoardId = nanoid();
    navigate(`/board/${newBoardId}`);
  };

  const handleRemoveBoard = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    setRecentBoards(removeRecentBoard(boardId));
  };

  const handleJoinBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomIdInput.trim()) {
      navigate(`/board/${roomIdInput.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            EventStormer
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Purpose-built facilitation tool for EventStorming workshops
          </p>
        </header>

        <div className="space-y-8">
          {/* Create new board */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Start a New Workshop
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Create a new board and share the link with your team
            </p>
            <button
              onClick={handleCreateBoard}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-lg"
            >
              <Plus className="w-5 h-5" />
              New Board
            </button>
          </div>

          {/* Recent boards */}
          {recentBoards.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Recent Boards
              </h2>
              <div className="space-y-2">
                {recentBoards.map((board) => (
                  <div
                    key={board.id}
                    onClick={() => navigate(`/board/${board.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate">
                        {board.id}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Last visited: {new Date(board.lastVisited).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemoveBoard(e, board.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Join existing board */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 text-center">
              Join an Existing Board
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm text-center">
              Enter a room ID to join a workshop in progress
            </p>
            <form onSubmit={handleJoinBoard} className="flex gap-3">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                placeholder="Enter room ID..."
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!roomIdInput.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Join
              </button>
            </form>
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-slate-400">
          <p>Boards are automatically saved and synced in real-time</p>
        </footer>
      </div>
    </div>
  );
};
