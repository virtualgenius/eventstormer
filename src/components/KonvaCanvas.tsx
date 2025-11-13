import React, { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Line, Rect, Text } from "react-konva";
import type Konva from "konva";
import { useCollabStore } from "@/store/useCollabStore";
import { KonvaSticky } from "./KonvaSticky";
import { UserCursor } from "./UserCursor";
import type { StickyKind } from "@/types/domain";
import { debugLog } from "@/lib/debug";

const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 3000;

interface KonvaCanvasProps {
  stageRef?: React.RefObject<Konva.Stage>;
}

export const KonvaCanvas: React.FC<KonvaCanvasProps> = ({ stageRef: externalStageRef }) => {
  const board = useCollabStore((s) => s.board);
  const activeTool = useCollabStore((s) => s.activeTool);
  const interactionMode = useCollabStore((s) => s.interactionMode);
  const addSticky = useCollabStore((s) => s.addSticky);
  const addVertical = useCollabStore((s) => s.addVertical);
  const addLane = useCollabStore((s) => s.addLane);
  const addTheme = useCollabStore((s) => s.addTheme);
  const deleteSticky = useCollabStore((s) => s.deleteSticky);
  const updateVertical = useCollabStore((s) => s.updateVertical);
  const deleteVertical = useCollabStore((s) => s.deleteVertical);
  const updateLane = useCollabStore((s) => s.updateLane);
  const deleteLane = useCollabStore((s) => s.deleteLane);
  const setActiveTool = useCollabStore((s) => s.setActiveTool);
  const updateCursor = useCollabStore((s) => s.updateCursor);
  const setInteractionMode = useCollabStore((s) => s.setInteractionMode);
  const users = useCollabStore((s) => s.users);
  const userId = useCollabStore((s) => s.userId);

  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef || internalStageRef;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'sticky' | 'vertical' | 'lane' | null>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [drawingLane, setDrawingLane] = useState<{ y: number; x1: number } | null>(null);
  const [tempLaneEnd, setTempLaneEnd] = useState<number | null>(null);
  const [drawingVertical, setDrawingVertical] = useState<{ x: number; y1: number } | null>(null);
  const [tempVerticalEnd, setTempVerticalEnd] = useState<number | null>(null);
  const lastCursorUpdate = useRef<number>(0);
  const lastTempLaneUpdate = useRef<number>(0);
  const lastTempVerticalUpdate = useRef<number>(0);

  // Viewport culling: only render stickies visible in viewport
  const getVisibleStickies = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return board.stickies;

    const viewport = {
      x: -stagePos.x / scale,
      y: -stagePos.y / scale,
      width: window.innerWidth / scale,
      height: window.innerHeight / scale
    };

    // Add padding to render slightly off-screen elements (smoother panning)
    const PADDING = 200;

    const visible = board.stickies.filter((sticky) => {
      const stickyRight = sticky.x + 120; // sticky width
      const stickyBottom = sticky.y + 120; // sticky height

      return (
        stickyRight > viewport.x - PADDING &&
        sticky.x < viewport.x + viewport.width + PADDING &&
        stickyBottom > viewport.y - PADDING &&
        sticky.y < viewport.y + viewport.height + PADDING
      );
    });

    if (board.stickies.length > 100) {
      debugLog('KonvaCanvas', `Viewport culling - Rendering ${visible.length} / ${board.stickies.length} stickies`);
    }

    return visible;
  }, [board.stickies, stagePos, scale]);

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

    debugLog('KonvaCanvas', `Zoom ${direction > 0 ? 'in' : 'out'} - Scale: ${oldScale.toFixed(2)} → ${clampedScale.toFixed(2)}, Pointer: (${pointer.x}, ${pointer.y})`);

    setScale(clampedScale);
    setStagePos(newPos);
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If event was cancelled by a child (sticky, line, etc.), don't process it
    if (e.cancelBubble) {
      return;
    }

    const clickedOnStage = e.target === e.target.getStage();
    const targetType = e.target.getType();
    const clickedOnBackground = (targetType === 'Rect' || targetType === 'Shape') &&
                                  e.target.attrs.fill === 'transparent';
    const clickedOnEmpty = clickedOnStage || clickedOnBackground;

    debugLog('KonvaCanvas', `Mouse down - Target: ${targetType}, ClickedOnStage: ${clickedOnStage}, ClickedOnBackground: ${clickedOnBackground}, ClickedOnEmpty: ${clickedOnEmpty}, ActiveTool: ${activeTool}`);

    if (e.evt.button === 2) {
      debugLog('KonvaCanvas', `Right-click pan started - Position: (${stagePos.x.toFixed(1)}, ${stagePos.y.toFixed(1)})`);
      e.target.startDrag();
      return;
    }

    // Prevent dragging on left-click when drawing lane or when tool is active
    if (e.evt.button === 0 && (activeTool === 'horizontal-lane' || e.target.isDragging())) {
      e.target.stopDrag();
      setIsPanning(false);
    }

    if (clickedOnEmpty) {
      if (selectedId) {
        debugLog('KonvaCanvas', `Deselecting - ID: ${selectedId}, Type: ${selectedType}`);
      }
      setSelectedId(null);
      setSelectedType(null);

      // Handle tool placement - ONLY in Add Mode
      if (interactionMode === 'add' && activeTool) {
        const stage = stageRef.current;
        if (!stage) return;

        const pointerPosition = stage.getPointerPosition();
        if (!pointerPosition) return;

        const canvasX = (pointerPosition.x - stage.x()) / stage.scaleX();
        const canvasY = (pointerPosition.y - stage.y()) / stage.scaleY();

        if (activeTool === 'vertical-line') {
          // Start drawing vertical line - set start point
          debugLog('KonvaCanvas', `Starting vertical line - X: ${canvasX.toFixed(1)}, Y: ${canvasY.toFixed(1)}`);
          setDrawingVertical({ x: canvasX, y1: canvasY });
        } else if (activeTool === 'horizontal-lane') {
          // Start drawing lane - set start point
          debugLog('KonvaCanvas', `Starting horizontal lane - Y: ${canvasY.toFixed(1)}, X: ${canvasX.toFixed(1)}`);
          setDrawingLane({ y: canvasY, x1: canvasX });
        } else if (activeTool === 'theme-area') {
          debugLog('KonvaCanvas', `Creating theme area - Position: (${canvasX.toFixed(1)}, ${canvasY.toFixed(1)})`);
          addTheme({
            name: "New Theme",
            x: canvasX,
            y: canvasY,
            width: 400,
            height: 300
          });
        } else {
          // Handle sticky creation
          const x = canvasX - 60;
          const y = canvasY - 60;
          debugLog('KonvaCanvas', `Creating sticky - Kind: ${activeTool}, Position: (${x.toFixed(1)}, ${y.toFixed(1)}), Scale: ${scale.toFixed(2)}`);
          addSticky({
            kind: activeTool as StickyKind,
            text: "",
            x,
            y
          });
        }
        // Keep tool active for continuous creation
      }
    }
  };

  const handleStageMouseUp = () => {
    setIsPanning(false);

    // Finalize vertical line drawing
    if (drawingVertical && tempVerticalEnd !== null) {
      const y1 = Math.min(drawingVertical.y1, tempVerticalEnd);
      const y2 = Math.max(drawingVertical.y1, tempVerticalEnd);
      debugLog('KonvaCanvas', `Completing vertical line - X: ${drawingVertical.x.toFixed(1)}, Y1: ${y1.toFixed(1)}, Y2: ${y2.toFixed(1)}`);
      addVertical(drawingVertical.x, y1, y2);
      setDrawingVertical(null);
      setTempVerticalEnd(null);
    }

    // Finalize lane drawing
    if (drawingLane && tempLaneEnd !== null) {
      const x1 = Math.min(drawingLane.x1, tempLaneEnd);
      const x2 = Math.max(drawingLane.x1, tempLaneEnd);
      debugLog('KonvaCanvas', `Completing horizontal lane - Y: ${drawingLane.y.toFixed(1)}, X1: ${x1.toFixed(1)}, X2: ${x2.toFixed(1)}`);
      addLane(drawingLane.y, x1, x2);
      setDrawingLane(null);
      setTempLaneEnd(null);
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Only update stage position if the stage itself was dragged (panning)
    const stage = stageRef.current;
    if (e.target === stage) {
      const newPos = { x: e.target.x(), y: e.target.y() };
      debugLog('KonvaCanvas', `Stage drag ended - Position: (${newPos.x.toFixed(1)}, ${newPos.y.toFixed(1)})`);
      setStagePos(newPos);
    }
    setIsPanning(false);
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Only set isPanning flag once at the start of drag
    if (!isPanning) {
      setIsPanning(true);
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const canvasX = (pointer.x - stage.x()) / stage.scaleX();
    const canvasY = (pointer.y - stage.y()) / stage.scaleY();

    // Throttle cursor updates to 50ms (20fps) to reduce network traffic and re-renders
    const now = Date.now();
    if (now - lastCursorUpdate.current > 50) {
      updateCursor(canvasX, canvasY);
      lastCursorUpdate.current = now;
    }

    // Throttle temp vertical end updates to 16ms (60fps max) to reduce re-renders
    if (drawingVertical && now - lastTempVerticalUpdate.current > 16) {
      setTempVerticalEnd(canvasY);
      lastTempVerticalUpdate.current = now;
    }

    // Throttle temp lane end updates to 16ms (60fps max) to reduce re-renders
    if (drawingLane && now - lastTempLaneUpdate.current > 16) {
      setTempLaneEnd(canvasX);
      lastTempLaneUpdate.current = now;
    }
  };

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
  };

  const getCursor = () => {
    // Add Mode - show tool-specific cursor
    if (interactionMode === 'add' && activeTool) {
      // For line tools, show crosshair
      if (activeTool === 'vertical-line' || activeTool === 'horizontal-lane' || activeTool === 'theme-area') {
        return "crosshair";
      }
      // For sticky tools, show custom sticky note cursor
      const stickyColors: Record<string, string> = {
        'event': '#fed7aa',
        'hotspot': '#fecaca',
        'person': '#fef9c3',
        'system': '#e9d5ff',
        'opportunity': '#bbf7d0',
        'glossary': '#f1f5f9'
      };
      const color = stickyColors[activeTool] || '#fed7aa';
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><rect x='2' y='2' width='20' height='20' rx='2' fill='${color}' stroke='%23000' stroke-width='1.5'/></svg>`;
      const encoded = encodeURIComponent(svg);
      return `url("data:image/svg+xml,${encoded}") 12 12, auto`;
    }

    // Pan Mode - show hand cursors
    if (interactionMode === 'pan') {
      return isPanning ? "grabbing" : "grab";
    }

    // Select Mode - show default arrow cursor
    if (interactionMode === 'select') {
      return "default";
    }

    return "default";
  };

  // Handle keyboard shortcuts for Delete, Duplicate, and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      debugLog('KonvaCanvas', `Key pressed: ${e.key}, selectedId: ${selectedId}, selectedType: ${selectedType}`);

      // Ignore if user is typing in a textarea or input
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        debugLog('KonvaCanvas', `Ignoring key - target is ${target.tagName}`);
        return;
      }

      // Escape: Exit add mode, return to pan mode
      if (e.key === 'Escape') {
        if (interactionMode === 'add') {
          debugLog('KonvaCanvas', `Exiting add mode - Tool: ${activeTool}`);
          setInteractionMode('pan');
        } else if (selectedId) {
          debugLog('KonvaCanvas', `Deselecting - ID: ${selectedId}, Type: ${selectedType}`);
          setSelectedId(null);
          setSelectedType(null);
        }
      }

      // V or Space: Toggle between Pan and Select modes
      if ((e.key === 'v' || e.key === 'V' || e.key === ' ') && interactionMode !== 'add') {
        e.preventDefault();
        const newMode = interactionMode === 'pan' ? 'select' : 'pan';
        debugLog('KonvaCanvas', `Toggling mode - Old: ${interactionMode}, New: ${newMode}`);
        setInteractionMode(newMode);
      }

      // Delete: Backspace or Delete key
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
        e.preventDefault();
        if (selectedType === 'sticky') {
          debugLog('KonvaCanvas', `Deleting sticky - ID: ${selectedId}`);
          deleteSticky(selectedId);
        } else if (selectedType === 'vertical') {
          debugLog('KonvaCanvas', `Deleting vertical line - ID: ${selectedId}`);
          deleteVertical(selectedId);
        } else if (selectedType === 'lane') {
          debugLog('KonvaCanvas', `Deleting lane - ID: ${selectedId}`);
          deleteLane(selectedId);
        }
        setSelectedId(null);
        setSelectedType(null);
      }

      // Duplicate: Cmd+D or Ctrl+D
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        const sticky = board.stickies.find(s => s.id === selectedId);
        if (sticky) {
          debugLog('KonvaCanvas', `Duplicating sticky - ID: ${selectedId}`);
          // Create duplicate to the right (140px = sticky width + spacing)
          addSticky({
            kind: sticky.kind,
            text: sticky.text,
            x: sticky.x + 140,
            y: sticky.y
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedType, activeTool, interactionMode, board.stickies, deleteSticky, deleteVertical, deleteLane, addSticky, setActiveTool, setInteractionMode]);

  // Get mode display text and color
  const getModeDisplay = () => {
    if (interactionMode === 'add' && activeTool) {
      const labels: Record<string, string> = {
        'event': 'Event',
        'hotspot': 'Hotspot',
        'person': 'Person',
        'system': 'System',
        'opportunity': 'Opportunity',
        'glossary': 'Glossary',
        'vertical-line': 'Vertical Line',
        'horizontal-lane': 'Swimlane',
        'theme-area': 'Theme'
      };
      return { text: `Adding: ${labels[activeTool] || activeTool}`, color: 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100' };
    }
    if (interactionMode === 'select') {
      return { text: 'Select Mode', color: 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' };
    }
    return { text: 'Pan Mode', color: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' };
  };

  const modeDisplay = getModeDisplay();

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Floating Mode Indicator */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${modeDisplay.color}`}>
          {modeDisplay.text}
          {interactionMode === 'add' && (
            <span className="text-xs opacity-75">(Press ESC to exit)</span>
          )}
        </div>
      </div>

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={interactionMode === 'pan' && !drawingLane && !drawingVertical}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        onMouseMove={handleStageMouseMove}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
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
          {board.verticals.map((v) => {
            const lineY1 = v.y1 ?? 0;
            const lineY2 = v.y2 ?? CANVAS_HEIGHT / 2;
            return (
              <React.Fragment key={v.id}>
                <Line
                  points={[v.x, lineY1, v.x, lineY2]}
                  stroke={selectedId === v.id && selectedType === 'vertical' ? "#3b82f6" : "#cbd5e1"}
                  strokeWidth={6}
                draggable={interactionMode === 'select'}
                listening={interactionMode !== 'pan'}
                onDragEnd={(e) => {
                  if (interactionMode === 'select') {
                    const newX = e.target.x();
                    updateVertical(v.id, { x: v.x + newX });
                    e.target.x(0); // Reset position since we update the x in the data
                  }
                }}
                onClick={(e) => {
                  if (interactionMode === 'select') {
                    e.cancelBubble = true;
                    setSelectedId(v.id);
                    setSelectedType('vertical');
                    setActiveTool(null); // Deactivate tool when selecting existing line
                  }
                }}
                onTap={(e) => {
                  if (interactionMode === 'select') {
                    e.cancelBubble = true;
                    setSelectedId(v.id);
                    setSelectedType('vertical');
                    setActiveTool(null); // Deactivate tool when selecting existing line
                  }
                }}
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
            );
          })}

          {/* Horizontal lanes */}
          {board.lanes.map((l) => {
            const laneX1 = l.x1 ?? 0;
            const laneX2 = l.x2 ?? CANVAS_WIDTH;
            return (
              <React.Fragment key={l.id}>
                <Line
                  points={[laneX1, l.y, laneX2, l.y]}
                  stroke={selectedId === l.id && selectedType === 'lane' ? "#3b82f6" : "#e2e8f0"}
                  strokeWidth={6}
                  draggable={interactionMode === 'select'}
                  listening={interactionMode !== 'pan'}
                  onDragEnd={(e) => {
                    if (interactionMode === 'select') {
                      const newY = e.target.y();
                      updateLane(l.id, { y: l.y + newY });
                      e.target.y(0); // Reset position since we update the y in the data
                    }
                  }}
                  onClick={(e) => {
                    if (interactionMode === 'select') {
                      e.cancelBubble = true;
                      setSelectedId(l.id);
                      setSelectedType('lane');
                      setActiveTool(null); // Deactivate tool when selecting existing lane
                    }
                  }}
                  onTap={(e) => {
                    if (interactionMode === 'select') {
                      e.cancelBubble = true;
                      setSelectedId(l.id);
                      setSelectedType('lane');
                      setActiveTool(null); // Deactivate tool when selecting existing lane
                    }
                  }}
                />
                {l.label && (
                  <Text
                    x={laneX1 + 10}
                    y={l.y - 25}
                    text={l.label}
                    fontSize={12}
                    fill="#475569"
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Preview vertical line while drawing */}
          {drawingVertical && tempVerticalEnd !== null && (
            <Line
              points={[
                drawingVertical.x,
                Math.min(drawingVertical.y1, tempVerticalEnd),
                drawingVertical.x,
                Math.max(drawingVertical.y1, tempVerticalEnd)
              ]}
              stroke="#93c5fd"
              strokeWidth={6}
              dash={[10, 5]}
              listening={false}
            />
          )}

          {/* Preview lane while drawing */}
          {drawingLane && tempLaneEnd !== null && (
            <Line
              points={[
                Math.min(drawingLane.x1, tempLaneEnd),
                drawingLane.y,
                Math.max(drawingLane.x1, tempLaneEnd),
                drawingLane.y
              ]}
              stroke="#93c5fd"
              strokeWidth={6}
              dash={[10, 5]}
              listening={false}
            />
          )}

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

          {/* Stickies (viewport culled) */}
          {(() => {
            const visibleStickies = getVisibleStickies();
            const ids = visibleStickies.map(s => s.id);
            const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
            if (duplicates.length > 0) {
              debugLog('KonvaCanvas', `DUPLICATE STICKY IDs FOUND: ${duplicates.join(', ')}`);
              debugLog('KonvaCanvas', `Total stickies: ${board.stickies.length}, Visible: ${visibleStickies.length}`);
            }
            return visibleStickies.map((s) => (
              <KonvaSticky
                key={s.id}
                sticky={s}
                onSelect={(id) => {
                  debugLog('KonvaCanvas', `onSelect callback - ID: ${id}, Mode: ${interactionMode}, CurrentSelected: ${selectedId}`);
                  if (interactionMode === 'select') {
                    debugLog('KonvaCanvas', `Setting selected - ID: ${id}, Type: sticky`);
                    setSelectedId(id);
                    setSelectedType('sticky');
                  } else {
                    debugLog('KonvaCanvas', `Not setting selected - wrong mode: ${interactionMode}`);
                  }
                }}
                isSelected={s.id === selectedId && selectedType === 'sticky'}
                interactionMode={interactionMode}
              />
            ));
          })()}
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
