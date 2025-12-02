import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TldrawBoard } from "@/tldraw/TldrawBoard";
import { NamePrompt } from "@/components/NamePrompt";
import { Home } from "lucide-react";

const USER_NAME_KEY = "eventstormer-user-name";

export const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const [userName, setUserName] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Check for stored user name on mount
  useEffect(() => {
    const storedName = localStorage.getItem(USER_NAME_KEY);
    if (storedName) {
      setUserName(storedName);
    } else {
      setShowNamePrompt(true);
    }
  }, []);

  const handleNameSubmit = (name: string) => {
    localStorage.setItem(USER_NAME_KEY, name);
    setUserName(name);
    setShowNamePrompt(false);
  };

  const handleGoHome = () => {
    navigate('/');
  };

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
            EventStormer
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Welcome, {userName}</span>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <TldrawBoard roomId={boardId} />
      </main>
    </div>
  );
};
