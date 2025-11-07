import React from "react";
import { Canvas } from "@/components/Canvas";
import { FacilitationPalette } from "@/components/FacilitationPalette";

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen">
      <header className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-slate-900">
        <div className="text-sm font-semibold tracking-tight">EventStormer (MVP Scaffold)</div>
        <div className="text-xs text-slate-500">
          Guided facilitation • Big Picture EventStorming
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
