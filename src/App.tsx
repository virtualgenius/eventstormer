import React, { useEffect } from "react";
import { Canvas } from "@/components/Canvas";
import { FacilitationPalette } from "@/components/FacilitationPalette";
import { useCollabStore } from "@/store/useCollabStore";
import { Users } from "lucide-react";

const App: React.FC = () => {
  const connect = useCollabStore((state) => state.connect);
  const disconnect = useCollabStore((state) => state.disconnect);
  const isConnected = useCollabStore((state) => state.isConnected);
  const usersOnline = useCollabStore((state) => state.usersOnline);

  useEffect(() => {
    // Connect to default room on mount
    connect("demo-room");

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <div className="flex flex-col h-screen w-screen">
      <header className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-slate-900">
        <div className="text-sm font-semibold tracking-tight">EventStormer (MVP Scaffold)</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="w-3 h-3" />
            <span>{usersOnline} online</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>
          <div className="text-xs text-slate-500">
            Guided facilitation • Big Picture EventStorming
          </div>
        </div>
      </header>
      <FacilitationPalette />
      <main className="flex-1">
        <Canvas />
      </main>
    </div>
  );
};

export default App;
