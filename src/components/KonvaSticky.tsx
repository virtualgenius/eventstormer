import React, { useRef, useEffect, useState } from "react";
import { Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { BaseSticky } from "@/types/domain";
import { useCollabStore } from "@/store/useCollabStore";

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

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    updateSticky(sticky.id, {
      x: e.target.x(),
      y: e.target.y()
    });
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Single click to select
    onSelect(sticky.id);
  };

  const handleDoubleClick = () => {
    // Double click to edit
    setIsEditing(true);
    onSelect(sticky.id);
  };

  useEffect(() => {
    if (isEditing && groupRef.current) {
      const stage = groupRef.current.getStage();
      if (!stage) return;

      const container = stage.container();
      const group = groupRef.current;
      const position = group.getAbsolutePosition();
      const stageBox = container.getBoundingClientRect();
      const scale = stage.scaleX();

      // Create textarea
      const textarea = document.createElement("textarea");
      textarea.value = sticky.text;
      textarea.style.position = "absolute";
      textarea.style.left = `${stageBox.left + position.x * scale}px`;
      textarea.style.top = `${stageBox.top + position.y * scale}px`;
      textarea.style.width = `${STICKY_SIZE * scale}px`;
      textarea.style.height = `${STICKY_SIZE * scale}px`;
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
        updateSticky(sticky.id, { text: textarea.value });
        setIsEditing(false);
        container.removeChild(textarea);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsEditing(false);
          container.removeChild(textarea);
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
