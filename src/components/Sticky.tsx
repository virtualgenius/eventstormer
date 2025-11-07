import React, { useState, useRef } from "react";
import type { BaseSticky } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/store/useBoardStore";

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
  scale: number;
}

export const Sticky: React.FC<StickyProps> = ({ sticky, selected, onChange, scale }) => {
  const updateSticky = useBoardStore((s) => s.updateSticky);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, stickyX: 0, stickyY: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle left-click (button 0)
    if (e.button !== 0) return;

    if ((e.target as HTMLElement).tagName === 'TEXTAREA') {
      setIsSelected(true);
      e.stopPropagation();
      return;
    }

    // Allow dragging by left-clicking on sticky background
    setIsDragging(true);
    setIsSelected(false);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      stickyX: sticky.x,
      stickyY: sticky.y
    };
    e.preventDefault();
    e.stopPropagation();
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;

      updateSticky(sticky.id, {
        x: dragStart.current.stickyX + dx,
        y: dragStart.current.stickyY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, sticky.id, updateSticky, scale]);

  return (
    <div
      data-sticky
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute rounded border-2 shadow-md px-2 py-2 text-sm w-[120px] h-[120px]",
        COLOR_MAP[sticky.kind],
        isSelected ? "ring-2 ring-blue-400" : "cursor-grab hover:shadow-lg",
        isDragging && "opacity-80 cursor-grabbing"
      )}
      style={{
        left: sticky.x,
        top: sticky.y
      }}
    >
      <textarea
        ref={textareaRef}
        className="w-full h-full bg-transparent outline-none resize-none cursor-text leading-tight"
        value={sticky.text}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Type here..."
        readOnly={!isSelected}
      />
    </div>
  );
};
