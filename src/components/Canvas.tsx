import React from "react";
import { useBoardStore } from "@/store/useBoardStore";
import { Sticky } from "./Sticky";

export const Canvas: React.FC = () => {
  const board = useBoardStore((s) => s.board);
  const updateSticky = useBoardStore((s) => s.updateSticky);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* vertical lines */}
      {board.verticals.map((v) => (
        <div key={v.id}>
          <div
            className="absolute top-0 bottom-0 w-px bg-slate-300"
            style={{ left: v.x }}
          />
          {v.label ? (
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow text-xs"
              style={{ left: v.x }}
            >
              {v.label}
            </div>
          ) : null}
        </div>
      ))}

      {/* horizontal lanes */}
      {board.lanes.map((l) => (
        <div key={l.id}>
          <div
            className="absolute left-0 right-0 h-px bg-slate-200"
            style={{ top: l.y }}
          />
          {l.label ? (
            <div
              className="absolute left-2 -top-6 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow text-xs"
              style={{ top: l.y }}
            >
              {l.label}
            </div>
          ) : null}
        </div>
      ))}

      {/* themes */}
      {board.themes.map((t) => (
        <div
          key={t.id}
          className="absolute border-2 border-sky-200 bg-sky-50/40 rounded-xl"
          style={{
            left: t.x,
            top: t.y,
            width: t.width,
            height: t.height
          }}
        >
          <div className="px-2 py-1 text-xs font-semibold text-slate-700">
            {t.name}
          </div>
        </div>
      ))}

      {/* stickies */}
      {board.stickies.map((s) => (
        <Sticky
          key={s.id}
          sticky={s}
          onChange={(text) => updateSticky(s.id, { text })}
        />
      ))}
    </div>
  );
};
