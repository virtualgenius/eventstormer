import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";
import { getAllBoards, deleteBoard } from "@/lib/persistence";
import { nanoid } from "@/lib/nanoid";

interface BoardSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export const BoardList: React.FC = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBoards = async () => {
    const boardList = await getAllBoards();
    setBoards(boardList);
    setLoading(false);
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const handleCreateBoard = () => {
    const newBoardId = nanoid();
    navigate(`/board/${newBoardId}`);
  };

  const handleOpenBoard = (boardId: string) => {
    navigate(`/board/${boardId}`);
  };

  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string, boardName: string) => {
    e.stopPropagation();
    if (confirm(`Delete "${boardName}"? This cannot be undone.`)) {
      await deleteBoard(boardId);
      await loadBoards();
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

        <div className="mb-6">
          <button
            onClick={handleCreateBoard}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            New Board
          </button>
        </div>

        {boards.length === 0 ? (
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
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => handleOpenBoard(board.id)}
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
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(board.updatedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(board.updatedAt)}
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
