import React, { useRef, useState, useEffect } from "react";
import { Group, Text } from "react-konva";
import type Konva from "konva";
import { useCollabStore } from "@/store/useCollabStore";
import type { Label } from "@/types/domain";
import type { InteractionMode, SelectedElement } from "@/store/useCollabStore";
import { debugLog } from "@/lib/debug";

interface KonvaLabelProps {
  label: Label;
  onSelect: (id: string, shiftKey: boolean) => void;
  isSelected: boolean;
  interactionMode: InteractionMode;
  selectedElements: SelectedElement[];
}

export const KonvaLabel: React.FC<KonvaLabelProps> = ({
  label,
  onSelect,
  isSelected,
  interactionMode,
  selectedElements,
}) => {
  const updateLabel = useCollabStore((s) => s.updateLabel);
  const board = useCollabStore((s) => s.board);
  const groupRef = useRef<Konva.Group>(null);
  const [isEditing, setIsEditing] = useState(false);
  const dragStartPositions = useRef<Map<string, any>>(new Map());

  // Auto-edit on creation
  useEffect(() => {
    const checkAutoEdit = () => {
      if (board.labels && board.labels.length > 0) {
        const sortedLabels = [...board.labels].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        if (sortedLabels[0].id === label.id && label.text === "Label") {
          setTimeout(() => {
            setIsEditing(true);
            onSelect(label.id, false);
          }, 100);
        }
      }
    };

    checkAutoEdit();
  }, [label.id, board.labels, label.text, onSelect]);

  const handleDragStart = () => {
    debugLog('KonvaLabel', `Drag started - ID: ${label.id}, Position: (${label.x}, ${label.y}), Multi-select: ${selectedElements.length > 0}`);

    if (selectedElements.length > 0) {
      const positions = new Map<string, any>();
      selectedElements.forEach(el => {
        if (el.type === 'label') {
          const l = board.labels?.find(lbl => lbl.id === el.id);
          if (l) positions.set(el.id, { type: 'label', x: l.x, y: l.y });
        } else if (el.type === 'sticky') {
          const s = board.stickies.find(sticky => sticky.id === el.id);
          if (s) positions.set(el.id, { type: 'sticky', x: s.x, y: s.y });
        } else if (el.type === 'vertical') {
          const v = board.verticals.find(vert => vert.id === el.id);
          if (v) positions.set(el.id, { type: 'vertical', x: v.x, y1: v.y1, y2: v.y2 });
        } else if (el.type === 'lane') {
          const ln = board.lanes.find(lane => lane.id === el.id);
          if (ln) positions.set(el.id, { type: 'lane', y: ln.y, x1: ln.x1, x2: ln.x2 });
        }
      });
      dragStartPositions.current = positions;
    }
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const isThisLabelSelected = selectedElements.some(el => el.id === label.id && el.type === 'label');
    if (selectedElements.length > 0 && isThisLabelSelected) {
      const deltaX = e.target.x() - label.x;
      const deltaY = e.target.y() - label.y;

      const updateSticky = useCollabStore.getState().updateSticky;
      const updateVertical = useCollabStore.getState().updateVertical;
      const updateLane = useCollabStore.getState().updateLane;

      selectedElements.forEach(el => {
        if (el.id !== label.id) {
          const startPos = dragStartPositions.current.get(el.id);
          if (startPos) {
            if (startPos.type === 'label') {
              updateLabel(el.id, { x: startPos.x + deltaX, y: startPos.y + deltaY });
            } else if (startPos.type === 'sticky') {
              updateSticky(el.id, { x: startPos.x + deltaX, y: startPos.y + deltaY });
            } else if (startPos.type === 'vertical') {
              const updates: any = { x: startPos.x + deltaX };
              if (startPos.y1 !== undefined) updates.y1 = startPos.y1 + deltaY;
              if (startPos.y2 !== undefined) updates.y2 = startPos.y2 + deltaY;
              updateVertical(el.id, updates);
            } else if (startPos.type === 'lane') {
              const updates: any = { y: startPos.y + deltaY };
              if (startPos.x1 !== undefined) updates.x1 = startPos.x1 + deltaX;
              if (startPos.x2 !== undefined) updates.x2 = startPos.x2 + deltaX;
              updateLane(el.id, updates);
            }
          }
        }
      });
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (interactionMode === 'select') {
      updateLabel(label.id, { x: e.target.x(), y: e.target.y() });
    }
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (interactionMode === 'select') {
      e.cancelBubble = true;
      if (e.evt.shiftKey) {
        onSelect(label.id, true);
      } else {
        onSelect(label.id, false);
      }
    }
  };

  const handleDblClick = () => {
    if (interactionMode === 'select' && !isEditing) {
      setIsEditing(true);
      onSelect(label.id, false);
    }
  };

  // Handle textarea editing - same approach as KonvaSticky
  useEffect(() => {
    if (isEditing && groupRef.current) {
      const stage = groupRef.current.getStage();
      if (!stage) return;

      const container = stage.container();
      const group = groupRef.current;

      // Get the bounding box in screen coordinates
      const clientRect = group.getClientRect();
      const scale = stage.scaleX();

      // Create input element
      const input = document.createElement("input");
      input.type = "text";
      input.value = label.text;
      input.style.position = "absolute";
      input.style.left = `${clientRect.x}px`;
      input.style.top = `${clientRect.y}px`;
      input.style.width = `${Math.max(clientRect.width, 200)}px`;
      input.style.height = `${clientRect.height}px`;
      input.style.fontSize = `${20 * scale}px`;
      input.style.fontWeight = "bold";
      input.style.padding = `${4 * scale}px`;
      input.style.border = "2px solid #3b82f6";
      input.style.borderRadius = "4px";
      input.style.backgroundColor = "white";
      input.style.outline = "none";
      input.style.fontFamily = "system-ui, -apple-system, sans-serif";
      input.style.zIndex = "1000";

      container.appendChild(input);
      input.focus();
      input.select();

      const handleBlur = () => {
        const newText = input.value.trim();
        if (newText) {
          updateLabel(label.id, { text: newText });
        }
        setIsEditing(false);
        container.removeChild(input);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          input.removeEventListener("blur", handleBlur);
          input.removeEventListener("keydown", handleKeyDown);
          setIsEditing(false);
          if (container.contains(input)) {
            container.removeChild(input);
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          const newText = input.value.trim();
          if (newText) {
            updateLabel(label.id, { text: newText });
          }
          setIsEditing(false);
          container.removeChild(input);
        }
      };

      input.addEventListener("blur", handleBlur);
      input.addEventListener("keydown", handleKeyDown);

      return () => {
        if (container.contains(input)) {
          input.removeEventListener("blur", handleBlur);
          input.removeEventListener("keydown", handleKeyDown);
          container.removeChild(input);
        }
      };
    }
  }, [isEditing, label.id, label.text, updateLabel]);

  return (
    <Group
      ref={groupRef}
      x={label.x}
      y={label.y}
      draggable={interactionMode === 'select' && !isEditing}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
    >
      <Text
        text={label.text}
        fontSize={20}
        fontStyle="bold"
        fill={isSelected ? "#2563eb" : "#1f2937"}
      />
    </Group>
  );
};
