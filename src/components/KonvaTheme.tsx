import React, { useRef, useState } from "react";
import { Group, Rect, Text, Circle } from "react-konva";
import type Konva from "konva";
import { useCollabStore } from "@/store/useCollabStore";
import type { ThemeArea, BaseSticky } from "@/types/domain";
import type { InteractionMode, SelectedElement } from "@/store/useCollabStore";

interface KonvaThemeProps {
  theme: ThemeArea;
  onSelect: (id: string, shiftKey: boolean) => void;
  isSelected: boolean;
  interactionMode: InteractionMode;
  selectedElements: SelectedElement[];
}

const MIN_SIZE = 100;
const HANDLE_SIZE = 8;
const STICKY_SIZE = 120;

const isStickyInsideTheme = (sticky: BaseSticky, theme: ThemeArea): boolean => {
  const stickyHeight = sticky.kind === 'person' ? STICKY_SIZE / 2 : STICKY_SIZE;
  const stickyCenterX = sticky.x + STICKY_SIZE / 2;
  const stickyCenterY = sticky.y + stickyHeight / 2;
  return (
    stickyCenterX >= theme.x &&
    stickyCenterX <= theme.x + theme.width &&
    stickyCenterY >= theme.y &&
    stickyCenterY <= theme.y + theme.height
  );
};

export const KonvaTheme: React.FC<KonvaThemeProps> = ({
  theme,
  onSelect,
  isSelected,
  interactionMode,
  selectedElements,
}) => {
  const updateTheme = useCollabStore((s) => s.updateTheme);
  const updateSticky = useCollabStore((s) => s.updateSticky);
  const board = useCollabStore((s) => s.board);
  const groupRef = useRef<Konva.Group>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const initialSize = useRef({ width: 0, height: 0, x: 0, y: 0 });
  const containedStickies = useRef<Array<{ id: string; x: number; y: number }>>([]);

  const handleDragStart = () => {
    containedStickies.current = board.stickies
      .filter(s => isStickyInsideTheme(s, theme))
      .map(s => ({ id: s.id, x: s.x, y: s.y }));
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (isResizing) return;
    const deltaX = e.target.x() - theme.x;
    const deltaY = e.target.y() - theme.y;
    containedStickies.current.forEach(({ id, x, y }) => {
      updateSticky(id, { x: x + deltaX, y: y + deltaY });
    });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (interactionMode === 'select' && !isResizing) {
      updateTheme(theme.id, { x: e.target.x(), y: e.target.y() });
    }
    containedStickies.current = [];
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (interactionMode === 'select') {
      e.cancelBubble = true;
      const shiftKey = 'shiftKey' in e.evt ? e.evt.shiftKey : false;
      onSelect(theme.id, shiftKey);
    }
  };

  const handleResizeStart = (corner: string) => (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setIsResizing(true);
    setResizeCorner(corner);
    initialSize.current = {
      width: theme.width,
      height: theme.height,
      x: theme.x,
      y: theme.y
    };
  };

  const handleResizeDrag = (corner: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isResizing) return;

    const node = e.target;
    const stage = node.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const scale = stage.scaleX();
    const stagePos = stage.position();

    const canvasX = (pos.x - stagePos.x) / scale;
    const canvasY = (pos.y - stagePos.y) / scale;

    let newX = theme.x;
    let newY = theme.y;
    let newWidth = theme.width;
    let newHeight = theme.height;

    if (corner.includes('e')) {
      newWidth = Math.max(MIN_SIZE, canvasX - theme.x);
    }
    if (corner.includes('w')) {
      const right = theme.x + theme.width;
      newX = Math.min(canvasX, right - MIN_SIZE);
      newWidth = right - newX;
    }
    if (corner.includes('s')) {
      newHeight = Math.max(MIN_SIZE, canvasY - theme.y);
    }
    if (corner.includes('n')) {
      const bottom = theme.y + theme.height;
      newY = Math.min(canvasY, bottom - MIN_SIZE);
      newHeight = bottom - newY;
    }

    updateTheme(theme.id, { x: newX, y: newY, width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeCorner(null);
  };

  const handlePositions = {
    nw: { x: 0, y: 0 },
    ne: { x: theme.width, y: 0 },
    sw: { x: 0, y: theme.height },
    se: { x: theme.width, y: theme.height },
  };

  return (
    <Group
      ref={groupRef}
      x={theme.x}
      y={theme.y}
      draggable={interactionMode === 'select' && !isResizing}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      <Rect
        width={theme.width}
        height={theme.height}
        fill="#f0f9ff"
        stroke={isSelected ? "#3b82f6" : "#bae6fd"}
        strokeWidth={isSelected ? 3 : 2}
        cornerRadius={12}
        opacity={0.6}
      />
      <Text
        x={8}
        y={8}
        text={theme.name}
        fontSize={12}
        fontStyle="bold"
        fill="#334155"
      />

      {isSelected && interactionMode === 'select' && (
        <>
          {Object.entries(handlePositions).map(([corner, pos]) => (
            <Circle
              key={corner}
              x={pos.x}
              y={pos.y}
              radius={HANDLE_SIZE}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={2}
              draggable
              onMouseDown={handleResizeStart(corner)}
              onDragMove={handleResizeDrag(corner)}
              onDragEnd={handleResizeEnd}
              onMouseUp={handleResizeEnd}
            />
          ))}
        </>
      )}
    </Group>
  );
};
