import React from "react";
import { useCollabStore } from "@/store/useCollabStore";
import { getAvailableElements, PHASE_LABELS } from "@/lib/phase-config";
import type { FacilitationPhase, ElementType } from "@/types/domain";

const ELEMENT_LABELS: Record<ElementType, string> = {
  event: "Event",
  hotspot: "Hotspot",
  person: "Person",
  system: "System",
  opportunity: "Opportunity",
  glossary: "Glossary",
  "vertical-line": "Vertical Line",
  "horizontal-lane": "Swimlane",
  "label": "Label",
  "theme-area": "Theme"
};

const ELEMENT_COLORS: Record<ElementType, { bg: string; hover: string; active: string }> = {
  event: { bg: "#fed7aa", hover: "#fdba74", active: "#fb923c" },
  hotspot: { bg: "#fecaca", hover: "#fca5a5", active: "#f87171" },
  person: { bg: "#fef9c3", hover: "#fef08a", active: "#fde047" },
  system: { bg: "#e9d5ff", hover: "#d8b4fe", active: "#c084fc" },
  opportunity: { bg: "#bbf7d0", hover: "#86efac", active: "#4ade80" },
  glossary: { bg: "#f1f5f9", hover: "#e2e8f0", active: "#cbd5e1" },
  "vertical-line": { bg: "#dbeafe", hover: "#bfdbfe", active: "#93c5fd" },
  "horizontal-lane": { bg: "#dbeafe", hover: "#bfdbfe", active: "#93c5fd" },
  "label": { bg: "#f9fafb", hover: "#f3f4f6", active: "#e5e7eb" },
  "theme-area": { bg: "#f0f9ff", hover: "#e0f2fe", active: "#bae6fd" }
};

export const FacilitationPalette: React.FC = () => {
  const board = useCollabStore((s) => s.board);
  const activeTool = useCollabStore((s) => s.activeTool);
  const setActiveTool = useCollabStore((s) => s.setActiveTool);
  const setPhase = useCollabStore((s) => s.setPhase);

  const availableElements = getAvailableElements(board.phase) ?? [];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-b bg-white/80 dark:bg-slate-900/70 px-3 md:px-4 py-2">
      <div className="flex items-center gap-2 flex-shrink-0">
        <label htmlFor="phase-select" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
          Phase:
        </label>
        <select
          id="phase-select"
          value={board.phase}
          onChange={(e) => setPhase(e.target.value as FacilitationPhase)}
          className="flex-1 sm:flex-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm"
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

      <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 scrollbar-thin">
        {availableElements.map((elementType) => {
          const colors = ELEMENT_COLORS[elementType];
          return (
            <button
              key={elementType}
              onClick={() => setActiveTool(elementType)}
              className="rounded-lg px-3 sm:px-3 py-2 sm:py-1 text-xs sm:text-sm font-medium text-slate-900 border-2 transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] sm:min-h-0"
              style={{
                backgroundColor: activeTool === elementType ? colors.active : colors.bg,
                borderColor: activeTool === elementType ? colors.active : colors.hover,
              }}
              onMouseEnter={(e) => {
                if (activeTool !== elementType) {
                  e.currentTarget.style.backgroundColor = colors.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTool !== elementType) {
                  e.currentTarget.style.backgroundColor = colors.bg;
                }
              }}
            >
              {ELEMENT_LABELS[elementType]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
