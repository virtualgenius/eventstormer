import React, { useRef } from "react";
import { TransformWrapper, TransformComponent, useTransformContext } from "react-zoom-pan-pinch";
import { useCollabStore } from "@/store/useCollabStore";
import { Sticky } from "./Sticky";
import { UserCursor } from "./UserCursor";
import type { StickyKind } from "@/types/domain";
import { cn } from "@/lib/utils";

interface CanvasContentProps {
  setTransform: (newPositionX: number, newPositionY: number, newScale: number, animationTime?: number) => void;
}

const CanvasContent: React.FC<CanvasContentProps> = ({ setTransform }) => {
  const board = useCollabStore((s) => s.board);
  const activeTool = useCollabStore((s) => s.activeTool);
  const addSticky = useCollabStore((s) => s.addSticky);
  const setActiveTool = useCollabStore((s) => s.setActiveTool);
  const updateSticky = useCollabStore((s) => s.updateSticky);
  const updateCursor = useCollabStore((s) => s.updateCursor);
  const users = useCollabStore((s) => s.users);
  const userId = useCollabStore((s) => s.userId);
  const { transformState } = useTransformContext();
  const [isRightDragging, setIsRightDragging] = React.useState(false);
  const rightDragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTool) return;
    if ((e.target as HTMLElement).closest('[data-sticky]')) return;

    // The transform wrapper applies: translate(positionX, positionY) scale(scale)
    // So to get canvas coordinates from screen coordinates:
    // 1. Get click position relative to the wrapper
    // 2. Subtract the pan offset (because canvas is translated)
    // 3. Divide by scale (because canvas is scaled)

    const wrapperRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - wrapperRect.left;
    const clickY = e.clientY - wrapperRect.top;

    // Convert from viewport coordinates to canvas coordinates
    const canvasX = (clickX - transformState.positionX) / transformState.scale;
    const canvasY = (clickY - transformState.positionY) / transformState.scale;

    // Center the sticky under the cursor (sticky is 120x120)
    const STICKY_SIZE = 120;
    const x = canvasX - STICKY_SIZE / 2;
    const y = canvasY - STICKY_SIZE / 2;

    addSticky({
      kind: activeTool as StickyKind,
      text: "",
      x,
      y
    });
    setActiveTool(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const wrapperRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - wrapperRect.left;
    const clickY = e.clientY - wrapperRect.top;

    const canvasX = (clickX - transformState.positionX) / transformState.scale;
    const canvasY = (clickY - transformState.positionY) / transformState.scale;

    updateCursor(canvasX, canvasY);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore if clicking on sticky
    if ((e.target as HTMLElement).closest('[data-sticky]')) return;

    // Right-click to pan
    if (e.button === 2) {
      setIsRightDragging(true);
      rightDragStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: transformState.positionX,
        panY: transformState.positionY
      };
      e.preventDefault();
      e.stopPropagation();
    }
  };

  React.useEffect(() => {
    if (!isRightDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - rightDragStart.current.x;
      const dy = e.clientY - rightDragStart.current.y;

      const newX = rightDragStart.current.panX + dx;
      const newY = rightDragStart.current.panY + dy;

      setTransform(newX, newY, transformState.scale, 0);
    };

    const handleMouseUp = () => {
      setIsRightDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isRightDragging, transformState.scale, setTransform]);

  return (
    <div
      className={cn(
        "relative h-[3000px] w-[5000px]",
        activeTool ? "cursor-crosshair" : isRightDragging ? "cursor-grabbing" : "cursor-default"
      )}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* vertical lines */}
      {board.verticals.map((v) => (
        <div key={v.id}>
          <div
            className="absolute top-0 bottom-0 w-px bg-slate-300"
            style={{ left: v.x }}
          />
          {v.label ? (
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow text-xs"
              style={{ left: v.x }}
            >
              {v.label}
            </div>
          ) : null}
        </div>
      ))}

      {/* horizontal lanes */}
      {board.lanes.map((l) => (
        <div key={l.id}>
          <div
            className="absolute left-0 right-0 h-px bg-slate-200"
            style={{ top: l.y }}
          />
          {l.label ? (
            <div
              className="absolute left-2 -top-6 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow text-xs"
              style={{ top: l.y }}
            >
              {l.label}
            </div>
          ) : null}
        </div>
      ))}

      {/* themes */}
      {board.themes.map((t) => (
        <div
          key={t.id}
          className="absolute border-2 border-sky-200 bg-sky-50/40 rounded-xl"
          style={{
            left: t.x,
            top: t.y,
            width: t.width,
            height: t.height
          }}
        >
          <div className="px-2 py-1 text-xs font-semibold text-slate-700">
            {t.name}
          </div>
        </div>
      ))}

      {/* stickies */}
      {board.stickies.map((s) => (
        <Sticky
          key={s.id}
          sticky={s}
          onChange={(text) => updateSticky(s.id, { text })}
          scale={transformState.scale}
        />
      ))}

      {/* user cursors */}
      {Array.from(users.entries()).map(([clientId, user]) => {
        if (user.id === userId || !user.cursor) return null;
        return (
          <UserCursor
            key={clientId}
            x={user.cursor.x}
            y={user.cursor.y}
            color={user.color}
            name={user.name}
          />
        );
      })}
    </div>
  );
};

export const Canvas: React.FC = () => {
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      <TransformWrapper
        initialScale={1}
        minScale={0.25}
        maxScale={4}
        limitToBounds={false}
        centerOnInit={false}
        wheel={{ smoothStep: 0.01 }}
        panning={{ disabled: true }}
        doubleClick={{ disabled: true }}
      >
        {({ setTransform }) => (
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full !h-full"
          >
            <CanvasContent setTransform={setTransform} />
          </TransformComponent>
        )}
      </TransformWrapper>
    </div>
  );
};
