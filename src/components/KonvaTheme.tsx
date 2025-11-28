import React, { useRef, useState, useEffect } from "react";
import { Group, Rect, Text, Circle } from "react-konva";
import type Konva from "konva";
import { useCollabStore } from "@/store/useCollabStore";
import type { ThemeArea, BaseSticky, VerticalLine, Lane, Label } from "@/types/domain";
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

const isVerticalInsideTheme = (vertical: VerticalLine, theme: ThemeArea): boolean => {
  const midY = (vertical.y1 + vertical.y2) / 2;
  return (
    vertical.x >= theme.x &&
    vertical.x <= theme.x + theme.width &&
    midY >= theme.y &&
    midY <= theme.y + theme.height
  );
};

const isLaneInsideTheme = (lane: Lane, theme: ThemeArea): boolean => {
  const midX = (lane.x1 + lane.x2) / 2;
  return (
    midX >= theme.x &&
    midX <= theme.x + theme.width &&
    lane.y >= theme.y &&
    lane.y <= theme.y + theme.height
  );
};

const isLabelInsideTheme = (label: Label, theme: ThemeArea): boolean => {
  return (
    label.x >= theme.x &&
    label.x <= theme.x + theme.width &&
    label.y >= theme.y &&
    label.y <= theme.y + theme.height
  );
};

interface ContainedElements {
  stickies: Array<{ id: string; x: number; y: number }>;
  verticals: Array<{ id: string; x: number; y1: number; y2: number }>;
  lanes: Array<{ id: string; y: number; x1: number; x2: number }>;
  labels: Array<{ id: string; x: number; y: number }>;
}

export const KonvaTheme: React.FC<KonvaThemeProps> = ({
  theme,
  onSelect,
  isSelected,
  interactionMode,
  selectedElements,
}) => {
  const updateTheme = useCollabStore((s) => s.updateTheme);
  const updateSticky = useCollabStore((s) => s.updateSticky);
  const updateVertical = useCollabStore((s) => s.updateVertical);
  const updateLane = useCollabStore((s) => s.updateLane);
  const updateLabel = useCollabStore((s) => s.updateLabel);
  const board = useCollabStore((s) => s.board);
  const groupRef = useRef<Konva.Group>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const initialSize = useRef({ width: 0, height: 0, x: 0, y: 0 });
  const containedElements = useRef<ContainedElements>({ stickies: [], verticals: [], lanes: [], labels: [] });

  const handleDragStart = () => {
    containedElements.current = {
      stickies: board.stickies
        .filter(s => isStickyInsideTheme(s, theme))
        .map(s => ({ id: s.id, x: s.x, y: s.y })),
      verticals: board.verticals
        .filter(v => isVerticalInsideTheme(v, theme))
        .map(v => ({ id: v.id, x: v.x, y1: v.y1, y2: v.y2 })),
      lanes: board.lanes
        .filter(l => isLaneInsideTheme(l, theme))
        .map(l => ({ id: l.id, y: l.y, x1: l.x1, x2: l.x2 })),
      labels: (board.labels || [])
        .filter(l => isLabelInsideTheme(l, theme))
        .map(l => ({ id: l.id, x: l.x, y: l.y }))
    };
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (isResizing) return;
    const deltaX = e.target.x() - theme.x;
    const deltaY = e.target.y() - theme.y;

    containedElements.current.stickies.forEach(({ id, x, y }) => {
      updateSticky(id, { x: x + deltaX, y: y + deltaY });
    });

    containedElements.current.verticals.forEach(({ id, x, y1, y2 }) => {
      updateVertical(id, { x: x + deltaX, y1: y1 + deltaY, y2: y2 + deltaY });
    });

    containedElements.current.lanes.forEach(({ id, y, x1, x2 }) => {
      updateLane(id, { y: y + deltaY, x1: x1 + deltaX, x2: x2 + deltaX });
    });

    containedElements.current.labels.forEach(({ id, x, y }) => {
      updateLabel(id, { x: x + deltaX, y: y + deltaY });
    });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (interactionMode === 'select' && !isResizing) {
      updateTheme(theme.id, { x: e.target.x(), y: e.target.y() });
    }
    containedElements.current = { stickies: [], verticals: [], lanes: [], labels: [] };
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (interactionMode === 'select') {
      e.cancelBubble = true;
      const shiftKey = 'shiftKey' in e.evt ? e.evt.shiftKey : false;
      onSelect(theme.id, shiftKey);
    }
  };

  const handleDblClick = () => {
    if (interactionMode === 'select' && !isEditing) {
      setIsEditing(true);
      onSelect(theme.id, false);
    }
  };

  useEffect(() => {
    if (isEditing && groupRef.current) {
      const stage = groupRef.current.getStage();
      if (!stage) return;

      const container = stage.container();
      const group = groupRef.current;
      const scale = stage.scaleX();
      const stagePos = stage.position();

      const inputX = theme.x * scale + stagePos.x + 8 * scale;
      const inputY = theme.y * scale + stagePos.y + 8 * scale;

      const input = document.createElement("input");
      input.type = "text";
      input.value = theme.name;
      input.style.position = "absolute";
      input.style.left = `${inputX}px`;
      input.style.top = `${inputY}px`;
      input.style.width = `${Math.min(theme.width - 16, 300) * scale}px`;
      input.style.fontSize = `${12 * scale}px`;
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
        const newName = input.value.trim();
        if (newName) {
          updateTheme(theme.id, { name: newName });
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
          const newName = input.value.trim();
          if (newName) {
            updateTheme(theme.id, { name: newName });
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
  }, [isEditing, theme.id, theme.name, theme.x, theme.y, theme.width, updateTheme]);

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

    const stage = e.target.getStage();
    if (!stage) return;

    const handleMouseMove = () => {
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const scale = stage.scaleX();
      const stagePos = stage.position();

      const canvasX = (pos.x - stagePos.x) / scale;
      const canvasY = (pos.y - stagePos.y) / scale;

      let newX = initialSize.current.x;
      let newY = initialSize.current.y;
      let newWidth = initialSize.current.width;
      let newHeight = initialSize.current.height;

      if (corner.includes('e')) {
        newWidth = Math.max(MIN_SIZE, canvasX - initialSize.current.x);
      }
      if (corner.includes('w')) {
        const right = initialSize.current.x + initialSize.current.width;
        newX = Math.min(canvasX, right - MIN_SIZE);
        newWidth = right - newX;
      }
      if (corner.includes('s')) {
        newHeight = Math.max(MIN_SIZE, canvasY - initialSize.current.y);
      }
      if (corner.includes('n')) {
        const bottom = initialSize.current.y + initialSize.current.height;
        newY = Math.min(canvasY, bottom - MIN_SIZE);
        newHeight = bottom - newY;
      }

      updateTheme(theme.id, { x: newX, y: newY, width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeCorner(null);
      stage.off('mousemove touchmove', handleMouseMove);
      stage.off('mouseup touchend', handleMouseUp);
    };

    stage.on('mousemove touchmove', handleMouseMove);
    stage.on('mouseup touchend', handleMouseUp);
  };

  const handlePositions = {
    nw: { x: 0, y: 0 },
    ne: { x: theme.width, y: 0 },
    sw: { x: 0, y: theme.height },
    se: { x: theme.width, y: theme.height },
  };

  const HEADER_HEIGHT = 28;

  return (
    <Group
      ref={groupRef}
      x={theme.x}
      y={theme.y}
      draggable={interactionMode === 'select' && !isResizing}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      {/* Background fill - non-interactive to allow clicking elements inside */}
      <Rect
        width={theme.width}
        height={theme.height}
        fill="#f0f9ff"
        cornerRadius={12}
        opacity={0.6}
        listening={false}
      />
      {/* Border stroke - interactive for selection */}
      <Rect
        width={theme.width}
        height={theme.height}
        stroke={isSelected ? "#3b82f6" : "#bae6fd"}
        strokeWidth={isSelected ? 3 : 2}
        cornerRadius={12}
        listening={interactionMode === 'select'}
        hitStrokeWidth={10}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
      />
      {/* Header area - interactive for dragging and title editing */}
      <Rect
        width={theme.width}
        height={HEADER_HEIGHT}
        fill="transparent"
        cornerRadius={[12, 12, 0, 0]}
        listening={interactionMode === 'select'}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
      />
      <Text
        x={8}
        y={8}
        text={theme.name}
        fontSize={12}
        fontStyle="bold"
        fill="#334155"
        listening={false}
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
              onMouseDown={handleResizeStart(corner)}
              onTouchStart={handleResizeStart(corner)}
            />
          ))}
        </>
      )}
    </Group>
  );
};
