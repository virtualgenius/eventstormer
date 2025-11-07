import React from "react";
import { useCollabStore } from "@/store/useCollabStore";
import { getAvailableElements, PHASE_LABELS } from "@/lib/phase-config";
import type { FacilitationPhase, ElementType } from "@/types/domain";

const ELEMENT_LABELS: Record<ElementType, string> = {
  event: "Event",
  hotspot: "Hotspot",
  actor: "Actor",
  system: "System",
  opportunity: "Opportunity",
  glossary: "Glossary",
  "vertical-line": "Vertical Line",
  "horizontal-lane": "Lane",
  "theme-area": "Theme"
};

export const FacilitationPalette: React.FC = () => {
  const board = useCollabStore((s) => s.board);
  const activeTool = useCollabStore((s) => s.activeTool);
  const setActiveTool = useCollabStore((s) => s.setActiveTool);
  const setPhase = useCollabStore((s) => s.setPhase);

  const availableElements = getAvailableElements(board.phase) ?? [];

  return (
    <div className="flex items-center gap-2 border-b bg-white/80 dark:bg-slate-900/70 px-4 py-2">
      <div className="flex items-center gap-2">
        <label htmlFor="phase-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Phase:
        </label>
        <select
          id="phase-select"
          value={board.phase}
          onChange={(e) => setPhase(e.target.value as FacilitationPhase)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm"
        >
          {(
            [
              "chaotic-exploration",
              "enforce-timeline",
              "people-and-systems",
              "problems-and-opportunities",
              "glossary"
            ] as const
          ).map((phase) => (
            <option key={phase} value={phase}>
              {PHASE_LABELS[phase]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-1">
        {availableElements.map((elementType) => (
          <button
            key={elementType}
            onClick={() => setActiveTool(elementType)}
            className={
              "rounded-lg px-3 py-1 text-sm " +
              (activeTool === elementType
                ? "bg-slate-900 text-white"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200")
            }
          >
            {ELEMENT_LABELS[elementType]}
          </button>
        ))}
      </div>
    </div>
  );
};
