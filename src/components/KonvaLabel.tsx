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
  const [editValue, setEditValue] = useState(label.text);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragStartPositions = useRef<Map<string, any>>(new Map());

  // Auto-edit on creation
  useEffect(() => {
    const checkAutoEdit = () => {
      if (board.labels.length > 0) {
        const sortedLabels = [...board.labels].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        if (sortedLabels[0].id === label.id && label.text === "Label") {
          setTimeout(() => {
            setEditValue(label.text);
            setIsEditing(true);
            onSelect(label.id, false);
          }, 100);
        }
      }
    };

    checkAutoEdit();
  }, [label.id, board.labels.length, label.text, onSelect]);

  // Handle input element lifecycle
  useEffect(() => {
    if (isEditing) {
      // Use setTimeout to ensure input is mounted in DOM
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const handleDragStart = () => {
    debugLog('KonvaLabel', `Drag started - ID: ${label.id}, Position: (${label.x}, ${label.y}), Multi-select: ${selectedElements.length > 0}`);

    if (selectedElements.length > 0) {
      const positions = new Map<string, any>();
      selectedElements.forEach(el => {
        if (el.type === 'label') {
          const l = board.labels.find(lbl => lbl.id === el.id);
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
      setEditValue(label.text);
      setIsEditing(true);
    }
  };

  const finishEditing = () => {
    const newText = editValue.trim();
    if (newText && newText !== label.text) {
      updateLabel(label.id, { text: newText });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(label.text);
      setIsEditing(false);
    }
  };

  // Get absolute position for input overlay
  const getInputPosition = () => {
    const group = groupRef.current;
    if (!group) return { left: 0, top: 0, scale: 1 };

    const stage = group.getStage();
    if (!stage) return { left: 0, top: 0, scale: 1 };

    const transform = group.getAbsoluteTransform();
    const pos = transform.point({ x: 0, y: 0 });
    const stageBox = stage.container().getBoundingClientRect();
    const scale = stage.scaleX();

    return {
      left: stageBox.left + pos.x,
      top: stageBox.top + pos.y,
      scale
    };
  };

  const inputPos = isEditing ? getInputPosition() : { left: 0, top: 0, scale: 1 };

  return (
    <>
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
          text={isEditing ? editValue : label.text}
          fontSize={20}
          fontStyle="bold"
          fill={isSelected ? "#2563eb" : "#1f2937"}
          opacity={isEditing ? 0.3 : 1}
        />
      </Group>

      {isEditing && (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={finishEditing}
          onKeyDown={handleKeyDown}
          style={{
            position: 'fixed',
            left: `${inputPos.left}px`,
            top: `${inputPos.top}px`,
            fontSize: '20px',
            fontWeight: 'bold',
            fontFamily: 'inherit',
            border: '2px solid #3b82f6',
            borderRadius: '4px',
            padding: '2px 4px',
            background: 'white',
            outline: 'none',
            minWidth: '100px',
            transform: `scale(${inputPos.scale})`,
            transformOrigin: 'top left',
            zIndex: 10000,
          }}
        />
      )}
    </>
  );
};
