import React, { useRef, useEffect, useState } from "react";
import { Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { BaseSticky } from "@/types/domain";
import type { InteractionMode } from "@/store/useCollabStore";
import { useCollabStore } from "@/store/useCollabStore";
import { debugLog } from "@/lib/debug";

const COLOR_MAP: Record<BaseSticky["kind"], { fill: string; stroke: string }> = {
  event: { fill: "#fed7aa", stroke: "#fdba74" },
  hotspot: { fill: "#fecaca", stroke: "#fca5a5" },
  person: { fill: "#fef9c3", stroke: "#fef08a" },
  system: { fill: "#e9d5ff", stroke: "#d8b4fe" },
  opportunity: { fill: "#bbf7d0", stroke: "#86efac" },
  glossary: { fill: "#f1f5f9", stroke: "#e2e8f0" }
};

interface KonvaStickyProps {
  sticky: BaseSticky;
  onSelect: (id: string) => void;
  isSelected: boolean;
  interactionMode: InteractionMode;
}

export const KonvaSticky: React.FC<KonvaStickyProps> = ({ sticky, onSelect, isSelected, interactionMode }) => {
  const updateSticky = useCollabStore((s) => s.updateSticky);
  const groupRef = useRef<Konva.Group>(null);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const colors = COLOR_MAP[sticky.kind] || { fill: "#f1f5f9", stroke: "#e2e8f0" };
  const STICKY_SIZE = 120;
  const width = sticky.kind === 'person' ? STICKY_SIZE / 2 : STICKY_SIZE;
  const height = sticky.kind === 'person' ? STICKY_SIZE / 2 : STICKY_SIZE;

  // Listen for auto-edit event (triggered by Tab key from another sticky)
  useEffect(() => {
    const handleAutoEdit = () => {
      const board = useCollabStore.getState().board;
      const newestSticky = board.stickies[board.stickies.length - 1];
      if (newestSticky && newestSticky.id === sticky.id) {
        // This is the newest sticky, auto-enter edit mode
        setTimeout(() => {
          setIsEditing(true);
          onSelect(sticky.id);
        }, 100);
      }
    };

    window.addEventListener('auto-edit-newest-sticky', handleAutoEdit);
    return () => window.removeEventListener('auto-edit-newest-sticky', handleAutoEdit);
  }, [sticky.id, onSelect]);

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
    e.cancelBubble = true;
    debugLog('KonvaSticky', `Clicked - ID: ${sticky.id}, Kind: ${sticky.kind}, Selected: ${isSelected}, InteractionMode: ${interactionMode}`);
    if (interactionMode === 'select') {
      onSelect(sticky.id);
      debugLog('KonvaSticky', `Selection callback called for ID: ${sticky.id}`);
    } else {
      debugLog('KonvaSticky', `Not selecting - wrong interaction mode: ${interactionMode}`);
    }
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
          textarea.removeEventListener("blur", handleBlur);
          textarea.removeEventListener("keydown", handleKeyDown);
          setIsEditing(false);
          if (container.contains(textarea)) {
            container.removeChild(textarea);
          }
        } else if (e.key === "Enter" && e.shiftKey) {
          // Shift+Enter: Save and exit edit mode
          e.preventDefault();
          const newText = textarea.value;
          debugLog('KonvaSticky', `Edit completed (Shift+Enter) - ID: ${sticky.id}, Old: "${sticky.text}", New: "${newText}"`);
          updateSticky(sticky.id, { text: newText });
          setIsEditing(false);
          container.removeChild(textarea);
        } else if (e.key === "Tab") {
          // Tab: Save current, create new sticky to the right, auto-edit it
          e.preventDefault();
          const newText = textarea.value;
          debugLog('KonvaSticky', `Tab pressed - Saving current sticky and creating new one to the right`);
          updateSticky(sticky.id, { text: newText });

          // Clean up current editor FIRST
          textarea.removeEventListener("blur", handleBlur);
          textarea.removeEventListener("keydown", handleKeyDown);
          setIsEditing(false);
          if (container.contains(textarea)) {
            container.removeChild(textarea);
          }

          // Create new sticky to the right (140px = sticky width + spacing)
          const newX = sticky.x + 140;
          const newY = sticky.y;

          const addSticky = useCollabStore.getState().addSticky;
          addSticky({
            kind: sticky.kind,
            text: "",
            x: newX,
            y: newY
          });

          // Dispatch custom event to trigger auto-edit on new sticky
          window.dispatchEvent(new CustomEvent('auto-edit-newest-sticky'));
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
  }, [isEditing, sticky.id, sticky.text, sticky.kind, sticky.x, sticky.y, updateSticky, colors.fill, height]);

  return (
    <Group
      ref={groupRef}
      x={sticky.x}
      y={sticky.y}
      draggable={interactionMode === 'select'}
      listening={interactionMode !== 'pan'}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onDblClick={handleDoubleClick}
    >
      <Rect
        width={width}
        height={height}
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
        width={width}
        height={height}
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
