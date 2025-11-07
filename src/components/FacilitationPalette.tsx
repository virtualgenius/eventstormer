import React from "react";
import { useBoardStore } from "@/store/useBoardStore";

const PHASE_TO_STICKIES: Record<string, Array<{ kind: string; label: string }>> = {
  events: [{ kind: "event", label: "Event" }],
  hotspots: [
    { kind: "event", label: "Event" },
    { kind: "hotspot", label: "Hotspot" }
  ],
  pivotal: [
    { kind: "event", label: "Event" }
    // vertical lines are added via canvas interaction
  ],
  lanes: [
    { kind: "event", label: "Event" },
    { kind: "hotspot", label: "Hotspot" }
  ],
  "actors-systems": [
    { kind: "event", label: "Event" },
    { kind: "actor", label: "Actor" },
    { kind: "system", label: "System" }
  ],
  opportunities: [
    { kind: "event", label: "Event" },
    { kind: "hotspot", label: "Hotspot" },
    { kind: "opportunity", label: "Opportunity" }
  ],
  glossary: [
    { kind: "event", label: "Event" },
    { kind: "glossary", label: "Glossary" }
  ]
};

export const FacilitationPalette: React.FC = () => {
  const board = useBoardStore((s) => s.board);
  const activeTool = useBoardStore((s) => s.activeTool);
  const setActiveTool = useBoardStore((s) => s.setActiveTool);
  const setPhase = useBoardStore((s) => s.setPhase);

  const items = PHASE_TO_STICKIES[board.phase] ?? [];

  return (
    <div className="flex items-center gap-2 border-b bg-white/80 dark:bg-slate-900/70 px-4 py-2">
      <div className="flex gap-1">
        {items.map((item) => (
          <button
            key={item.kind}
            onClick={() => setActiveTool(item.kind)}
            className={
              "rounded-lg px-3 py-1 text-sm " +
              (activeTool === item.kind
                ? "bg-slate-900 text-white"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200")
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="ml-auto flex gap-1 text-xs">
        {(
          [
            "events",
            "hotspots",
            "pivotal",
            "lanes",
            "actors-systems",
            "opportunities",
            "glossary"
          ] as const
        ).map((phase) => (
          <button
            key={phase}
            onClick={() => setPhase(phase)}
            className={
              "px-2 py-1 rounded " +
              (board.phase === phase
                ? "bg-slate-900 text-white"
                : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800")
            }
          >
            {phase}
          </button>
        ))}
      </div>
    </div>
  );
};
