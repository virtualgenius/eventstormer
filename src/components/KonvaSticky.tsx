import React, { useRef, useEffect, useState } from "react";
import { Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { BaseSticky } from "@/types/domain";
import { useCollabStore } from "@/store/useCollabStore";
import { debugLog } from "@/lib/debug";

const COLOR_MAP: Record<BaseSticky["kind"], { fill: string; stroke: string }> = {
  event: { fill: "#fed7aa", stroke: "#fdba74" },
  hotspot: { fill: "#fecaca", stroke: "#fca5a5" },
  actor: { fill: "#fef9c3", stroke: "#fef08a" },
  system: { fill: "#e9d5ff", stroke: "#d8b4fe" },
  opportunity: { fill: "#bbf7d0", stroke: "#86efac" },
  glossary: { fill: "#f1f5f9", stroke: "#e2e8f0" }
};

interface KonvaStickyProps {
  sticky: BaseSticky;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

export const KonvaSticky: React.FC<KonvaStickyProps> = ({ sticky, onSelect, isSelected }) => {
  const updateSticky = useCollabStore((s) => s.updateSticky);
  const groupRef = useRef<Konva.Group>(null);
  const [isEditing, setIsEditing] = useState(false);

  const colors = COLOR_MAP[sticky.kind];
  const STICKY_SIZE = 120;

  const handleDragStart = () => {
    debugLog('KonvaSticky', `Drag started - ID: ${sticky.id}, Kind: ${sticky.kind}, Position: (${sticky.x}, ${sticky.y})`);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();
    debugLog('KonvaSticky', `Drag ended - ID: ${sticky.id}, Old: (${sticky.x}, ${sticky.y}), New: (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
    updateSticky(sticky.id, {
      x: newX,
      y: newY
    });
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    debugLog('KonvaSticky', `Clicked - ID: ${sticky.id}, Kind: ${sticky.kind}, Selected: ${isSelected}`);
    onSelect(sticky.id);
  };

  const handleDoubleClick = () => {
    debugLog('KonvaSticky', `Double-clicked (entering edit mode) - ID: ${sticky.id}, Kind: ${sticky.kind}, Text: "${sticky.text}"`);
    setIsEditing(true);
    onSelect(sticky.id);
  };

  useEffect(() => {
    if (isEditing && groupRef.current) {
      const stage = groupRef.current.getStage();
      if (!stage) return;

      const container = stage.container();
      const group = groupRef.current;

      // Get the bounding box in screen coordinates (already transformed)
      const clientRect = group.getClientRect();
      const scale = stage.scaleX();

      // Create textarea
      const textarea = document.createElement("textarea");
      textarea.value = sticky.text;
      textarea.style.position = "absolute";
      textarea.style.left = `${clientRect.x}px`;
      textarea.style.top = `${clientRect.y}px`;
      textarea.style.width = `${clientRect.width}px`;
      textarea.style.height = `${clientRect.height}px`;
      textarea.style.fontSize = `${14 * scale}px`;
      textarea.style.padding = `${8 * scale}px`;
      textarea.style.border = "2px solid #3b82f6";
      textarea.style.borderRadius = "4px";
      textarea.style.backgroundColor = colors.fill;
      textarea.style.outline = "none";
      textarea.style.resize = "none";
      textarea.style.fontFamily = "system-ui, -apple-system, sans-serif";
      textarea.style.lineHeight = "1.25";
      textarea.style.zIndex = "1000";

      container.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const handleBlur = () => {
        const newText = textarea.value;
        debugLog('KonvaSticky', `Edit completed (blur) - ID: ${sticky.id}, Old: "${sticky.text}", New: "${newText}"`);
        updateSticky(sticky.id, { text: newText });
        setIsEditing(false);
        container.removeChild(textarea);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          debugLog('KonvaSticky', `Edit cancelled (Escape) - ID: ${sticky.id}`);
          setIsEditing(false);
          container.removeChild(textarea);
        } else if (e.key === "Enter" && e.shiftKey) {
          // Shift+Enter: Save and exit edit mode
          e.preventDefault();
          const newText = textarea.value;
          debugLog('KonvaSticky', `Edit completed (Shift+Enter) - ID: ${sticky.id}, Old: "${sticky.text}", New: "${newText}"`);
          updateSticky(sticky.id, { text: newText });
          setIsEditing(false);
          container.removeChild(textarea);
        } else if (e.key === "Tab") {
          // Tab: Save current, create new sticky to the right, focus it
          e.preventDefault();
          const newText = textarea.value;
          debugLog('KonvaSticky', `Edit completed (Tab) - Creating new sticky to the right`);
          updateSticky(sticky.id, { text: newText });
          setIsEditing(false);
          container.removeChild(textarea);

          // Create new sticky to the right (120px is sticky width + some spacing)
          const newX = sticky.x + 140;
          const newY = sticky.y;

          // Trigger creation through store
          const addSticky = useCollabStore.getState().addSticky;
          addSticky({
            kind: sticky.kind,
            text: "",
            x: newX,
            y: newY
          });
        }
      };

      textarea.addEventListener("blur", handleBlur);
      textarea.addEventListener("keydown", handleKeyDown);

      return () => {
        if (container.contains(textarea)) {
          textarea.removeEventListener("blur", handleBlur);
          textarea.removeEventListener("keydown", handleKeyDown);
          container.removeChild(textarea);
        }
      };
    }
  }, [isEditing, sticky.id, sticky.text, updateSticky, colors.fill]);

  return (
    <Group
      ref={groupRef}
      x={sticky.x}
      y={sticky.y}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onDblClick={handleDoubleClick}
    >
      <Rect
        width={STICKY_SIZE}
        height={STICKY_SIZE}
        fill={colors.fill}
        stroke={isSelected ? "#3b82f6" : colors.stroke}
        strokeWidth={isSelected ? 3 : 2}
        cornerRadius={4}
        shadowColor="black"
        shadowBlur={isSelected ? 8 : 4}
        shadowOpacity={isSelected ? 0.3 : 0.15}
        shadowOffsetX={0}
        shadowOffsetY={2}
      />
      <Text
        width={STICKY_SIZE}
        height={STICKY_SIZE}
        text={sticky.text}
        fontSize={14}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#1e293b"
        padding={8}
        align="left"
        verticalAlign="top"
        wrap="word"
        lineHeight={1.25}
      />
    </Group>
  );
};
