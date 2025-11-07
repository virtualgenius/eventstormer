import React from "react";
import type { BaseSticky } from "@/types/domain";
import { cn } from "@/lib/utils";

const COLOR_MAP: Record<BaseSticky["kind"], string> = {
  event: "bg-orange-200 border-orange-300",
  hotspot: "bg-red-200 border-red-300",
  actor: "bg-yellow-100 border-yellow-200",
  system: "bg-purple-100 border-purple-200",
  opportunity: "bg-green-100 border-green-200",
  glossary: "bg-slate-100 border-slate-200"
};

interface StickyProps {
  sticky: BaseSticky;
  selected?: boolean;
  onChange?: (text: string) => void;
}

export const Sticky: React.FC<StickyProps> = ({ sticky, selected, onChange }) => {
  return (
    <div
      className={cn(
        "absolute rounded-lg border shadow-sm px-3 py-2 text-sm min-w-[140px]",
        COLOR_MAP[sticky.kind],
        selected && "ring-2 ring-slate-400"
      )}
      style={{
        left: sticky.x,
        top: sticky.y
      }}
    >
      <textarea
        className="w-full bg-transparent outline-none resize-none"
        value={sticky.text}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
};
