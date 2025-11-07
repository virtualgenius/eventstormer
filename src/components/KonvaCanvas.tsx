import React, { useRef, useState, useCallback } from "react";
import { Stage, Layer, Line, Rect, Text } from "react-konva";
import type Konva from "konva";
import { useCollabStore } from "@/store/useCollabStore";
import { KonvaSticky } from "./KonvaSticky";
import { UserCursor } from "./UserCursor";
import type { StickyKind } from "@/types/domain";

const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 3000;

interface KonvaCanvasProps {
  stageRef?: React.RefObject<Konva.Stage>;
}

export const KonvaCanvas: React.FC<KonvaCanvasProps> = ({ stageRef: externalStageRef }) => {
  const board = useCollabStore((s) => s.board);
  const activeTool = useCollabStore((s) => s.activeTool);
  const addSticky = useCollabStore((s) => s.addSticky);
  const setActiveTool = useCollabStore((s) => s.setActiveTool);
  const updateCursor = useCollabStore((s) => s.updateCursor);
  const users = useCollabStore((s) => s.users);
  const userId = useCollabStore((s) => s.userId);

  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef || internalStageRef;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.05;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const clampedScale = Math.max(0.25, Math.min(4, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    };

    setScale(clampedScale);
    setStagePos(newPos);
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();

    if (e.evt.button === 2) {
      // Right-click to pan
      setIsPanning(true);
      return;
    }

    if (clickedOnEmpty) {
      setSelectedId(null);

      // Handle tool placement
      if (activeTool) {
        const stage = stageRef.current;
        if (!stage) return;

        const pointerPosition = stage.getPointerPosition();
        if (!pointerPosition) return;

        const x = (pointerPosition.x - stage.x()) / stage.scaleX() - 60;
        const y = (pointerPosition.y - stage.y()) / stage.scaleY() - 60;

        addSticky({
          kind: activeTool as StickyKind,
          text: "",
          x,
          y
        });
        setActiveTool(null);
      }
    }
  };

  const handleStageMouseUp = () => {
    setIsPanning(false);
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const canvasX = (pointer.x - stage.x()) / stage.scaleX();
    const canvasY = (pointer.y - stage.y()) / stage.scaleY();

    updateCursor(canvasX, canvasY);
  };

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
  };

  const getCursor = () => {
    if (activeTool) return "crosshair";
    if (isPanning) return "grabbing";
    return "default";
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={isPanning}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        onMouseMove={handleStageMouseMove}
        onContextMenu={handleContextMenu}
        style={{ cursor: getCursor() }}
      >
        <Layer>
          {/* Background (optional grid or solid color) */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="transparent"
          />

          {/* Vertical lines */}
          {board.verticals.map((v) => (
            <React.Fragment key={v.id}>
              <Line
                points={[v.x, 0, v.x, CANVAS_HEIGHT]}
                stroke="#cbd5e1"
                strokeWidth={1}
              />
              {v.label && (
                <Text
                  x={v.x - 50}
                  y={-30}
                  width={100}
                  text={v.label}
                  fontSize={12}
                  align="center"
                  fill="#475569"
                />
              )}
            </React.Fragment>
          ))}

          {/* Horizontal lanes */}
          {board.lanes.map((l) => (
            <React.Fragment key={l.id}>
              <Line
                points={[0, l.y, CANVAS_WIDTH, l.y]}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              {l.label && (
                <Text
                  x={10}
                  y={l.y - 25}
                  text={l.label}
                  fontSize={12}
                  fill="#475569"
                />
              )}
            </React.Fragment>
          ))}

          {/* Themes */}
          {board.themes.map((t) => (
            <React.Fragment key={t.id}>
              <Rect
                x={t.x}
                y={t.y}
                width={t.width}
                height={t.height}
                fill="#f0f9ff"
                stroke="#bae6fd"
                strokeWidth={2}
                cornerRadius={12}
                opacity={0.4}
              />
              <Text
                x={t.x + 8}
                y={t.y + 8}
                text={t.name}
                fontSize={12}
                fontStyle="bold"
                fill="#334155"
              />
            </React.Fragment>
          ))}

          {/* Stickies */}
          {board.stickies.map((s) => (
            <KonvaSticky
              key={s.id}
              sticky={s}
              onSelect={setSelectedId}
              isSelected={s.id === selectedId}
            />
          ))}
        </Layer>
      </Stage>

      {/* User cursors (rendered as DOM overlay) */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from(users.entries()).map(([clientId, user]) => {
          if (user.id === userId || !user.cursor) return null;
          return (
            <UserCursor
              key={clientId}
              x={user.cursor.x * scale + stagePos.x}
              y={user.cursor.y * scale + stagePos.y}
              color={user.color}
              name={user.name}
            />
          );
        })}
      </div>
    </div>
  );
};
