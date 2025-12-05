import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { TldrawBoard } from "@/tldraw/TldrawBoard";
import { NamePrompt } from "@/components/NamePrompt";
import { addRecentBoard, getBoardName } from "@/components/BoardList";
import { Home, Download, Upload } from "lucide-react";

const USER_NAME_KEY = "eventstormer-user-name";
const BOARD_ID_DISPLAY_LENGTH = 6;

function getConnectionStatusColor(status: string): string {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'offline': return 'bg-red-500';
    case 'loading': return 'bg-yellow-500';
    default: return 'bg-slate-400';
  }
}

function getConnectionStatusText(status: string): string {
  switch (status) {
    case 'online': return 'Connected';
    case 'offline': return 'Offline';
    case 'loading': return 'Connecting...';
    case 'not-synced': return 'Syncing...';
    default: return 'Loading...';
  }
}

interface ConnectionStatusIndicatorProps {
  status: string;
}

function ConnectionStatusIndicator({ status }: ConnectionStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor(status)}`} />
      <span>{getConnectionStatusText(status)}</span>
    </div>
  );
}

interface ImportExportButtonsProps {
  onExport: () => void;
  onImport: () => void;
}

function ImportExportButtons({ onExport, onImport }: ImportExportButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
        title="Export board as JSON"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>
      <button
        onClick={onImport}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
        title="Import board from JSON"
      >
        <Upload className="w-3.5 h-3.5" />
        Import
      </button>
    </div>
  );
}

interface BoardHeaderProps {
  boardId: string;
  boardName: string | null;
  connectionStatus: string;
  boardHandlers: { onExport: () => void; onImport: () => void } | null;
  userName: string;
  onGoHome: () => void;
}

function BoardHeader({ boardId, boardName, connectionStatus, boardHandlers, userName, onGoHome }: BoardHeaderProps) {
  return (
    <header className="flex items-center justify-between px-3 py-2 md:px-4 border-b bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button
          onClick={onGoHome}
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title="Back to boards"
        >
          <Home className="w-4 h-4" />
        </button>
        <span className="text-sm md:text-base font-semibold tracking-tight">
          {boardName || `Board ${boardId.slice(0, BOARD_ID_DISPLAY_LENGTH)}`}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <ConnectionStatusIndicator status={connectionStatus} />
        <span className="text-slate-400">Room: {boardId}</span>
        {boardHandlers && (
          <ImportExportButtons
            onExport={boardHandlers.onExport}
            onImport={boardHandlers.onImport}
          />
        )}
        <span>Welcome, {userName}</span>
      </div>
    </header>
  );
}

interface UseUserNameResult {
  userName: string | null;
  showNamePrompt: boolean;
  handleNameSubmit: (name: string) => void;
}

function useUserName(): UseUserNameResult {
  const [userName, setUserName] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem(USER_NAME_KEY);
    if (storedName) {
      setUserName(storedName);
    } else {
      setShowNamePrompt(true);
    }
  }, []);

  const handleNameSubmit = useCallback((name: string) => {
    localStorage.setItem(USER_NAME_KEY, name);
    setUserName(name);
    setShowNamePrompt(false);
  }, []);

  return { userName, showNamePrompt, handleNameSubmit };
}

function useBoardTracking(boardId: string | undefined, templateName: string | null) {
  const [boardName, setBoardName] = useState<string | null>(null);

  useEffect(() => {
    if (boardId) {
      const name = templateName || getBoardName(boardId);
      addRecentBoard(boardId, name || undefined);
      setBoardName(name);
    }
  }, [boardId, templateName]);

  return boardName;
}

export const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const templateFile = searchParams.get('template');
  const templateName = searchParams.get('name');

  const { userName, showNamePrompt, handleNameSubmit } = useUserName();
  const boardName = useBoardTracking(boardId, templateName);

  const [connectionStatus, setConnectionStatus] = useState<string>('loading');
  const [boardHandlers, setBoardHandlers] = useState<{ onExport: () => void; onImport: () => void } | null>(null);

  const handleGoHome = () => navigate('/');

  const handleBoardReady = useCallback((props: {
    connectionStatus: string;
    roomId: string;
    onExport: () => void;
    onImport: () => void;
  }) => {
    setConnectionStatus(props.connectionStatus);
    setBoardHandlers({ onExport: props.onExport, onImport: props.onImport });
    return null;
  }, []);

  if (showNamePrompt) return <NamePrompt onSubmit={handleNameSubmit} />;
  if (!boardId) return <div>Board not found</div>;

  return (
    <div className="flex flex-col h-screen w-screen">
      <BoardHeader
        boardId={boardId}
        boardName={boardName}
        connectionStatus={connectionStatus}
        boardHandlers={boardHandlers}
        userName={userName!}
        onGoHome={handleGoHome}
      />
      <main className="flex-1 overflow-hidden">
        <TldrawBoard
          roomId={boardId}
          userName={userName!}
          templateFile={templateFile || undefined}
          renderHeaderRight={handleBoardReady}
        />
      </main>
    </div>
  );
};
