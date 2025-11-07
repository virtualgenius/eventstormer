import React, { useEffect, useRef } from "react";
import { KonvaCanvas } from "@/components/KonvaCanvas";
import { FacilitationPalette } from "@/components/FacilitationPalette";
import { useCollabStore } from "@/store/useCollabStore";
import { Users, Download } from "lucide-react";
import { exportCanvasToImage } from "@/lib/export";
import type Konva from "konva";

const App: React.FC = () => {
  const connect = useCollabStore((state) => state.connect);
  const disconnect = useCollabStore((state) => state.disconnect);
  const isConnected = useCollabStore((state) => state.isConnected);
  const usersOnline = useCollabStore((state) => state.usersOnline);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    // Connect to default room on mount
    connect("demo-room");

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const handleExport = () => {
    exportCanvasToImage(stageRef.current);
  };

  return (
    <div className="flex flex-col h-screen w-screen">
      <header className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-slate-900">
        <div className="text-sm font-semibold tracking-tight">EventStormer (MVP Scaffold)</div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
            title="Export board as PNG"
          >
            <Download className="w-3 h-3" />
            Export PNG
          </button>
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
        <KonvaCanvas stageRef={stageRef} />
      </main>
    </div>
  );
};

export default App;
