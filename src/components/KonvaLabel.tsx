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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const dragStartPositions = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    const checkAutoEdit = () => {
      if (board.labels.length > 0) {
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
  }, [label.id, onSelect]);

  const handleDragStart = () => {
    debugLog('KonvaLabel', `Drag started - ID: ${label.id}, Position: (${label.x}, ${label.y}), Multi-select: ${selectedElements.length > 0}`);

    if (selectedElements.length > 0) {
      const positions = new Map<string, any>();
      selectedElements.forEach(el => {
        if (el.type === 'label') {
          const l = board.labels.find(lbl => lbl.id === el.id);
          if (l) {
            positions.set(el.id, { type: 'label', x: l.x, y: l.y });
          }
        } else if (el.type === 'sticky') {
          const s = board.stickies.find(sticky => sticky.id === el.id);
          if (s) {
            positions.set(el.id, { type: 'sticky', x: s.x, y: s.y });
          }
        } else if (el.type === 'vertical') {
          const v = board.verticals.find(vert => vert.id === el.id);
          if (v) {
            positions.set(el.id, { type: 'vertical', x: v.x, y1: v.y1, y2: v.y2 });
          }
        } else if (el.type === 'lane') {
          const ln = board.lanes.find(lane => lane.id === el.id);
          if (ln) {
            positions.set(el.id, { type: 'lane', y: ln.y, x1: ln.x1, x2: ln.x2 });
          }
        }
      });
      dragStartPositions.current = positions;
      debugLog('KonvaLabel', `Stored ${positions.size} initial positions for group drag`);
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
    debugLog('KonvaLabel', `Drag ended - ID: ${label.id}, New position: (${e.target.x()}, ${e.target.y()})`);
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
    if (interactionMode === 'select') {
      setIsEditing(true);
    }
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      const group = groupRef.current;

      if (group) {
        const stage = group.getStage();
        if (stage) {
          const transform = group.getAbsoluteTransform();
          const pos = transform.point({ x: label.x, y: label.y });
          const stageBox = stage.container().getBoundingClientRect();
          const scale = stage.scaleX();

          textarea.style.left = `${stageBox.left + pos.x}px`;
          textarea.style.top = `${stageBox.top + pos.y}px`;
          textarea.style.transform = `scale(${scale})`;
          textarea.style.transformOrigin = 'top left';
        }
      }

      textarea.focus();
      textarea.select();
    }
  }, [isEditing, label.x, label.y]);

  const handleTextareaBlur = () => {
    if (textareaRef.current) {
      const newText = textareaRef.current.value.trim();
      if (newText && newText !== label.text) {
        updateLabel(label.id, { text: newText });
      }
    }
    setIsEditing(false);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextareaBlur();
    }
  };

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
          text={label.text}
          fontSize={20}
          fontStyle="bold"
          fill={isSelected ? "#2563eb" : "#1f2937"}
          listening={!isEditing}
          opacity={isEditing ? 0.3 : 1}
        />
      </Group>

      {isEditing && (
        <textarea
          ref={textareaRef}
          defaultValue={label.text}
          onBlur={handleTextareaBlur}
          onKeyDown={handleTextareaKeyDown}
          style={{
            position: 'absolute',
            fontSize: '20px',
            fontWeight: 'bold',
            fontFamily: 'inherit',
            border: '2px solid #3b82f6',
            borderRadius: '4px',
            padding: '4px',
            background: 'white',
            outline: 'none',
            resize: 'none',
            minWidth: '100px',
            zIndex: 1000,
          }}
          rows={1}
        />
      )}
    </>
  );
};
