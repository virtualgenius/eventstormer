import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { TldrawBoard } from "@/tldraw/TldrawBoard";
import { NamePrompt } from "@/components/NamePrompt";
import { addRecentBoard, getBoardName } from "@/components/BoardList";
import { Home, Download, Upload } from "lucide-react";

const USER_NAME_KEY = "eventstormer-user-name";

export const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sampleFile = searchParams.get('sample');
  const isSampleBoard = boardId?.startsWith('sample-');

  const [userName, setUserName] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [boardName, setBoardName] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('loading');
  const [boardHandlers, setBoardHandlers] = useState<{
    onExport: () => void;
    onImport: () => void;
  } | null>(null);

  useEffect(function loadStoredUserName() {
    const storedName = localStorage.getItem(USER_NAME_KEY);
    if (storedName) {
      setUserName(storedName);
    } else {
      setShowNamePrompt(true);
    }
  }, []);

  useEffect(function trackRecentBoardVisit() {
    if (boardId && !isSampleBoard) {
      addRecentBoard(boardId);
      setBoardName(getBoardName(boardId));
    }
  }, [boardId, isSampleBoard]);

  const handleNameSubmit = (name: string) => {
    localStorage.setItem(USER_NAME_KEY, name);
    setUserName(name);
    setShowNamePrompt(false);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleBoardReady = useCallback((props: {
    connectionStatus: string;
    roomId: string;
    onExport: () => void;
    onImport: () => void;
  }) => {
    setConnectionStatus(props.connectionStatus);
    setBoardHandlers({
      onExport: props.onExport,
      onImport: props.onImport,
    });
    return null;
  }, []);

  if (showNamePrompt) {
    return <NamePrompt onSubmit={handleNameSubmit} />;
  }

  if (!boardId) {
    return <div>Board not found</div>;
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
          <span className="text-sm md:text-base font-semibold tracking-tight">
            {boardName || `Board ${boardId?.slice(0, 6)}`}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'online' ? 'bg-green-500' :
                connectionStatus === 'offline' ? 'bg-red-500' :
                connectionStatus === 'loading' ? 'bg-yellow-500' : 'bg-slate-400'
              }`}
            />
            <span>
              {connectionStatus === 'online' ? 'Connected' :
               connectionStatus === 'offline' ? 'Offline' :
               connectionStatus === 'loading' ? 'Connecting...' :
               connectionStatus === 'not-synced' ? 'Syncing...' : 'Loading...'}
            </span>
          </div>

          {/* Room ID */}
          <span className="text-slate-400">
            Room: {boardId}
          </span>

          {/* Import/Export Buttons */}
          {boardHandlers && (
            <div className="flex items-center gap-2">
              <button
                onClick={boardHandlers.onExport}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                title="Export board as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <button
                onClick={boardHandlers.onImport}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                title="Import board from JSON"
              >
                <Upload className="w-3.5 h-3.5" />
                Import
              </button>
            </div>
          )}

          <span>Welcome, {userName}</span>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <TldrawBoard
          roomId={boardId}
          sampleFile={sampleFile || undefined}
          renderHeaderRight={handleBoardReady}
        />
      </main>
    </div>
  );
};
