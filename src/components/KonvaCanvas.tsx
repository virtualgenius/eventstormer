import React, { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Line, Rect, Text } from "react-konva";
import type Konva from "konva";
import { useCollabStore } from "@/store/useCollabStore";
import { KonvaSticky } from "./KonvaSticky";
import { KonvaLabel } from "./KonvaLabel";
import { KonvaTheme } from "./KonvaTheme";
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
  const addLabel = useCollabStore((s) => s.addLabel);
  const addTheme = useCollabStore((s) => s.addTheme);
  const deleteSticky = useCollabStore((s) => s.deleteSticky);
  const updateSticky = useCollabStore((s) => s.updateSticky);
  const updateVertical = useCollabStore((s) => s.updateVertical);
  const deleteVertical = useCollabStore((s) => s.deleteVertical);
  const updateLane = useCollabStore((s) => s.updateLane);
  const deleteLane = useCollabStore((s) => s.deleteLane);
  const updateLabel = useCollabStore((s) => s.updateLabel);
  const deleteLabel = useCollabStore((s) => s.deleteLabel);
  const updateTheme = useCollabStore((s) => s.updateTheme);
  const deleteTheme = useCollabStore((s) => s.deleteTheme);
  const setActiveTool = useCollabStore((s) => s.setActiveTool);
  const updateCursor = useCollabStore((s) => s.updateCursor);
  const setInteractionMode = useCollabStore((s) => s.setInteractionMode);
  const users = useCollabStore((s) => s.users);
  const userId = useCollabStore((s) => s.userId);

  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef || internalStageRef;
  const selectedElements = useCollabStore((s) => s.selectedElements);
  const setSelectedElements = useCollabStore((s) => s.setSelectedElements);
  const toggleSelection = useCollabStore((s) => s.toggleSelection);
  const clearSelection = useCollabStore((s) => s.clearSelection);
  const isSelected = useCollabStore((s) => s.isSelected);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'sticky' | 'vertical' | 'lane' | 'label' | 'theme' | null>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [drawingLane, setDrawingLane] = useState<{ y: number; x1: number } | null>(null);
  const [tempLaneEnd, setTempLaneEnd] = useState<number | null>(null);
  const [drawingVertical, setDrawingVertical] = useState<{ x: number; y1: number } | null>(null);
  const [tempVerticalEnd, setTempVerticalEnd] = useState<number | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const lastCursorUpdate = useRef<number>(0);
  const lastTempLaneUpdate = useRef<number>(0);
  const lastTempVerticalUpdate = useRef<number>(0);
  const lastTouchDistance = useRef<number | null>(null);

  // Viewport culling: only render stickies visible in viewport
  const getVisibleStickies = useCallback(() => {
    if (!board.stickies) return [];

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

  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return null;
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Pinch to zoom with two fingers
    if (e.evt.touches.length === 2) {
      e.evt.preventDefault();

      const currentDistance = getTouchDistance(e.evt.touches);
      if (currentDistance === null) return;

      if (lastTouchDistance.current !== null) {
        const oldScale = stage.scaleX();
        const scaleFactor = currentDistance / lastTouchDistance.current;
        const newScale = oldScale * scaleFactor;
        const clampedScale = Math.max(0.25, Math.min(4, newScale));

        // Get midpoint between touches for zoom center
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;

        const mousePointTo = {
          x: (centerX - stage.x()) / oldScale,
          y: (centerY - stage.y()) / oldScale
        };

        const newPos = {
          x: centerX - mousePointTo.x * clampedScale,
          y: centerY - mousePointTo.y * clampedScale
        };

        debugLog('KonvaCanvas', `Pinch zoom - Scale: ${oldScale.toFixed(2)} → ${clampedScale.toFixed(2)}`);

        setScale(clampedScale);
        setStagePos(newPos);
      }

      lastTouchDistance.current = currentDistance;
      return;
    }

    // Reset touch distance if not pinching
    lastTouchDistance.current = null;

    // Single touch - handle normally
    handlePointerMove(e);
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    lastTouchDistance.current = null;
    handleStageMouseUp();
  };

  const handlePointerDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // If event was cancelled by a child (sticky, line, etc.), don't process it
    if (e.cancelBubble) {
      return;
    }

    const clickedOnStage = e.target === e.target.getStage();
    const targetType = e.target.getType();
    const clickedOnBackground = (targetType === 'Rect' || targetType === 'Shape') &&
                                  e.target.attrs.fill === 'transparent';
    const clickedOnEmpty = clickedOnStage || clickedOnBackground;

    debugLog('KonvaCanvas', `Pointer down - Target: ${targetType}, ClickedOnStage: ${clickedOnStage}, ClickedOnBackground: ${clickedOnBackground}, ClickedOnEmpty: ${clickedOnEmpty}, ActiveTool: ${activeTool}, InteractionMode: ${interactionMode}`);

    // Check if it's a mouse event with right-click
    const isMouseEvent = 'button' in e.evt;
    if (isMouseEvent && e.evt.button === 2) {
      debugLog('KonvaCanvas', `Right-click pan started - Position: (${stagePos.x.toFixed(1)}, ${stagePos.y.toFixed(1)})`);
      e.target.startDrag();
      return;
    }

    // In add mode, prevent any stage dragging
    if (interactionMode === 'add') {
      e.target.stopDrag();
      setIsPanning(false);
    }

    // Prevent dragging on left-click/touch when drawing lane or when tool is active
    if ((!isMouseEvent || e.evt.button === 0) && (activeTool === 'horizontal-lane' || e.target.isDragging())) {
      e.target.stopDrag();
      setIsPanning(false);
    }

    if (clickedOnEmpty) {
      // Clear single selection
      if (selectedId) {
        debugLog('KonvaCanvas', `Deselecting - ID: ${selectedId}, Type: ${selectedType}`);
      }
      setSelectedId(null);
      setSelectedType(null);

      // In select mode, start selection box (only if not shift-clicking)
      const shiftKey = isMouseEvent ? e.evt.shiftKey : false;
      if (interactionMode === 'select' && !shiftKey) {
        const stage = stageRef.current;
        if (!stage) return;

        const pointerPosition = stage.getPointerPosition();
        if (!pointerPosition) return;

        const canvasX = (pointerPosition.x - stage.x()) / stage.scaleX();
        const canvasY = (pointerPosition.y - stage.y()) / stage.scaleY();

        setSelectionBox({ x1: canvasX, y1: canvasY, x2: canvasX, y2: canvasY });
        clearSelection();
        debugLog('KonvaCanvas', `Starting selection box - Position: (${canvasX.toFixed(1)}, ${canvasY.toFixed(1)})`);
        return;
      }

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
        } else if (activeTool === 'label') {
          debugLog('KonvaCanvas', `Creating label - Position: (${canvasX.toFixed(1)}, ${canvasY.toFixed(1)})`);
          addLabel(canvasX, canvasY, "Label");
        } else {
          const x = canvasX - 60;
          const yOffset = activeTool === 'person' ? 30 : 60;
          const y = canvasY - yOffset;
          debugLog('KonvaCanvas', `Creating sticky - Kind: ${activeTool}, Position: (${x.toFixed(1)}, ${y.toFixed(1)}), Scale: ${scale.toFixed(2)}`);
          addSticky({
            kind: activeTool as StickyKind,
            text: "",
            x,
            y
          });
          // Trigger auto-edit for newly created sticky (with small delay to ensure it's in the array)
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('auto-edit-newest-sticky'));
          }, 50);
        }
        // Keep tool active for continuous creation
      }
    }
  };

  const handleStageMouseUp = () => {
    setIsPanning(false);

    // Finalize selection box
    if (selectionBox) {
      debugLog('KonvaCanvas', `Completed selection box - Selected ${selectedElements.length} items`);
      setSelectionBox(null);
    }

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

  const handlePointerMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
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

    // Update selection box while dragging
    if (selectionBox) {
      setSelectionBox({ ...selectionBox, x2: canvasX, y2: canvasY });

      // Calculate which elements are in the selection box
      const minX = Math.min(selectionBox.x1, canvasX);
      const maxX = Math.max(selectionBox.x1, canvasX);
      const minY = Math.min(selectionBox.y1, canvasY);
      const maxY = Math.max(selectionBox.y1, canvasY);

      const selected: Array<{ id: string; type: 'sticky' | 'vertical' | 'lane' | 'label' }> = [];

      board.stickies?.forEach((sticky) => {
        const stickyWidth = 120;
        const stickyHeight = sticky.kind === 'person' ? 60 : 120;

        if (
          sticky.x < maxX &&
          sticky.x + stickyWidth > minX &&
          sticky.y < maxY &&
          sticky.y + stickyHeight > minY
        ) {
          selected.push({ id: sticky.id, type: 'sticky' });
        }
      });

      // Check vertical lines
      board.verticals?.forEach((v) => {
        const lineY1 = v.y1 ?? 0;
        const lineY2 = v.y2 ?? CANVAS_HEIGHT / 2;
        const lineMinY = Math.min(lineY1, lineY2);
        const lineMaxY = Math.max(lineY1, lineY2);

        // Line intersects if x is in range and y ranges overlap
        if (v.x >= minX && v.x <= maxX && lineMinY < maxY && lineMaxY > minY) {
          selected.push({ id: v.id, type: 'vertical' });
        }
      });

      // Check horizontal lanes
      board.lanes?.forEach((l) => {
        const laneX1 = l.x1 ?? 0;
        const laneX2 = l.x2 ?? CANVAS_WIDTH;
        const laneMinX = Math.min(laneX1, laneX2);
        const laneMaxX = Math.max(laneX1, laneX2);

        // Lane intersects if y is in range and x ranges overlap
        if (l.y >= minY && l.y <= maxY && laneMinX < maxX && laneMaxX > minX) {
          selected.push({ id: l.id, type: 'lane' });
        }
      });

      // Check labels (approximate with 100px width, 30px height for selection)
      board.labels?.forEach((label) => {
        if (
          label.x < maxX &&
          label.x + 100 > minX &&
          label.y < maxY &&
          label.y + 30 > minY
        ) {
          selected.push({ id: label.id, type: 'label' });
        }
      });

      setSelectedElements(selected);
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
      // For label tool, show text cursor
      if (activeTool === 'label') {
        return "text";
      }
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

      // Escape: Exit add mode, return to pan mode, or clear selection
      if (e.key === 'Escape') {
        if (interactionMode === 'add') {
          debugLog('KonvaCanvas', `Exiting add mode - Tool: ${activeTool}`);
          setInteractionMode('pan');
        } else if (selectedElements.length > 0) {
          debugLog('KonvaCanvas', `Clearing multi-selection - Count: ${selectedElements.length}`);
          clearSelection();
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
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();

        // Delete multi-selected elements first
        if (selectedElements.length > 0) {
          debugLog('KonvaCanvas', `Deleting multi-selected elements - Count: ${selectedElements.length}`);
          selectedElements.forEach(el => {
            if (el.type === 'sticky') {
              deleteSticky(el.id);
            } else if (el.type === 'vertical') {
              deleteVertical(el.id);
            } else if (el.type === 'lane') {
              deleteLane(el.id);
            } else if (el.type === 'label') {
              deleteLabel(el.id);
            } else if (el.type === 'theme') {
              deleteTheme(el.id);
            }
          });
          clearSelection();
        } else if (selectedId) {
          // Delete single selected item
          if (selectedType === 'sticky') {
            debugLog('KonvaCanvas', `Deleting sticky - ID: ${selectedId}`);
            deleteSticky(selectedId);
          } else if (selectedType === 'vertical') {
            debugLog('KonvaCanvas', `Deleting vertical line - ID: ${selectedId}`);
            deleteVertical(selectedId);
          } else if (selectedType === 'lane') {
            debugLog('KonvaCanvas', `Deleting lane - ID: ${selectedId}`);
            deleteLane(selectedId);
          } else if (selectedType === 'label') {
            debugLog('KonvaCanvas', `Deleting label - ID: ${selectedId}`);
            deleteLabel(selectedId);
          } else if (selectedType === 'theme') {
            debugLog('KonvaCanvas', `Deleting theme - ID: ${selectedId}`);
            deleteTheme(selectedId);
          }
          setSelectedId(null);
          setSelectedType(null);
        }
      }

      // Duplicate: Cmd+D or Ctrl+D
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        const sticky = board.stickies?.find(s => s.id === selectedId);
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
  }, [selectedId, selectedType, selectedElements, activeTool, interactionMode, board.stickies, deleteSticky, deleteVertical, deleteLane, deleteLabel, deleteTheme, addSticky, setActiveTool, setInteractionMode, clearSelection]);

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
        'label': 'Label',
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
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
        <div className={`flex items-center gap-1.5 md:gap-2 px-2 py-1.5 md:px-3 md:py-2 rounded-lg shadow-lg text-xs md:text-sm font-medium ${modeDisplay.color}`}>
          {modeDisplay.text}
          {interactionMode === 'add' && (
            <span className="hidden sm:inline text-xs opacity-75">(Press ESC to exit)</span>
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
        draggable={interactionMode === 'pan' && !drawingLane && !drawingVertical && !selectionBox}
        onWheel={handleWheel}
        onMouseDown={handlePointerDown}
        onMouseUp={handleStageMouseUp}
        onMouseMove={handlePointerMove}
        onTouchStart={handlePointerDown}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
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
          {board.verticals?.map((v) => {
            const lineY1 = v.y1 ?? 0;
            const lineY2 = v.y2 ?? CANVAS_HEIGHT / 2;
            return (
              <React.Fragment key={v.id}>
                <Line
                  points={[v.x, lineY1, v.x, lineY2]}
                  stroke={isSelected(v.id) || (selectedId === v.id && selectedType === 'vertical') ? "#3b82f6" : "#cbd5e1"}
                  strokeWidth={isSelected(v.id) || (selectedId === v.id && selectedType === 'vertical') ? 8 : 6}
                draggable={interactionMode === 'select'}
                listening={interactionMode !== 'pan'}
                onDragStart={(e) => {
                  debugLog('KonvaCanvas', `Vertical line drag start - ID: ${v.id}, selectedElements: ${selectedElements.length}, types: ${selectedElements.map(e => e.type).join(', ')}`);
                  // Store initial positions for group drag
                  const dragData = new Map<string, any>();
                  selectedElements.forEach(el => {
                    if (el.type === 'vertical') {
                      const vert = board.verticals.find(v => v.id === el.id);
                      if (vert) dragData.set(el.id, { x: vert.x, y1: vert.y1, y2: vert.y2 });
                    } else if (el.type === 'lane') {
                      const lane = board.lanes.find(l => l.id === el.id);
                      if (lane) dragData.set(el.id, { y: lane.y, x1: lane.x1, x2: lane.x2 });
                    } else if (el.type === 'sticky') {
                      const sticky = board.stickies.find(s => s.id === el.id);
                      if (sticky) dragData.set(el.id, { x: sticky.x, y: sticky.y });
                    } else if (el.type === 'label') {
                      const label = board.labels.find(l => l.id === el.id);
                      if (label) dragData.set(el.id, { x: label.x, y: label.y });
                    }
                  });
                  (e.target as any)._dragStartData = dragData;
                  (e.target as any)._initialX = v.x;
                  (e.target as any)._initialY1 = v.y1;
                  (e.target as any)._initialY2 = v.y2;
                  debugLog('KonvaCanvas', `Stored ${dragData.size} elements in drag data`);
                }}
                onDragMove={(e) => {
                  const isThisSelected = selectedElements.some(el => el.id === v.id && el.type === 'vertical');
                  if (selectedElements.length > 0 && isThisSelected) {
                    const deltaX = e.target.x();
                    const deltaY = e.target.y();
                    debugLog('KonvaCanvas', `Vertical line drag move - ID: ${v.id}, deltaX: ${deltaX.toFixed(1)}, deltaY: ${deltaY.toFixed(1)}, selectedCount: ${selectedElements.length}`);
                    const dragData = (e.target as any)._dragStartData as Map<string, any>;
                    if (dragData) {
                      debugLog('KonvaCanvas', `Updating ${selectedElements.length - 1} other elements in group`);
                      selectedElements.forEach(el => {
                        if (el.id !== v.id) {
                          const startPos = dragData.get(el.id);
                          if (!startPos) return;
                          if (el.type === 'vertical') {
                            const updates: any = { x: startPos.x + deltaX };
                            if (startPos.y1 !== undefined) updates.y1 = startPos.y1 + deltaY;
                            if (startPos.y2 !== undefined) updates.y2 = startPos.y2 + deltaY;
                            updateVertical(el.id, updates);
                          } else if (el.type === 'sticky') {
                            updateSticky(el.id, {
                              x: startPos.x + deltaX,
                              y: startPos.y + deltaY
                            });
                          } else if (el.type === 'lane') {
                            const updates: any = { y: startPos.y + deltaY };
                            if (startPos.x1 !== undefined) updates.x1 = startPos.x1 + deltaX;
                            if (startPos.x2 !== undefined) updates.x2 = startPos.x2 + deltaX;
                            updateLane(el.id, updates);
                          } else if (el.type === 'label') {
                            updateLabel(el.id, {
                              x: startPos.x + deltaX,
                              y: startPos.y + deltaY
                            });
                          }
                        }
                      });
                    }
                  }
                }}
                onDragEnd={(e) => {
                  if (interactionMode === 'select') {
                    const newX = e.target.x();
                    const newY = e.target.y();

                    // Update this vertical line
                    const updates: any = { x: v.x + newX };
                    if (v.y1 !== undefined) updates.y1 = (v.y1 ?? 0) + newY;
                    if (v.y2 !== undefined) updates.y2 = (v.y2 ?? 0) + newY;
                    updateVertical(v.id, updates);

                    e.target.x(0); // Reset position since we update the x in the data
                    e.target.y(0);
                    delete (e.target as any)._dragStartData;
                    delete (e.target as any)._dragStartX;
                  }
                }}
                onClick={(e) => {
                  if (interactionMode === 'select') {
                    e.cancelBubble = true;
                    if (e.evt.shiftKey) {
                      // Shift-click: toggle selection
                      toggleSelection(v.id, 'vertical');
                      setSelectedId(null);
                      setSelectedType(null);
                    } else {
                      // Regular click: single select
                      clearSelection();
                      setSelectedId(v.id);
                      setSelectedType('vertical');
                    }
                    setActiveTool(null); // Deactivate tool when selecting existing line
                  }
                }}
                onTap={(e) => {
                  if (interactionMode === 'select') {
                    e.cancelBubble = true;
                    if (e.evt.shiftKey) {
                      toggleSelection(v.id, 'vertical');
                      setSelectedId(null);
                      setSelectedType(null);
                    } else {
                      clearSelection();
                      setSelectedId(v.id);
                      setSelectedType('vertical');
                    }
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
          {board.lanes?.map((l) => {
            const laneX1 = l.x1 ?? 0;
            const laneX2 = l.x2 ?? CANVAS_WIDTH;
            return (
              <React.Fragment key={l.id}>
                <Line
                  points={[laneX1, l.y, laneX2, l.y]}
                  stroke={isSelected(l.id) || (selectedId === l.id && selectedType === 'lane') ? "#3b82f6" : "#e2e8f0"}
                  strokeWidth={isSelected(l.id) || (selectedId === l.id && selectedType === 'lane') ? 8 : 6}
                  draggable={interactionMode === 'select'}
                  listening={interactionMode !== 'pan'}
                  onDragStart={(e) => {
                    // Store initial positions for group drag
                    const dragData = new Map<string, any>();
                    selectedElements.forEach(el => {
                      if (el.type === 'vertical') {
                        const vert = board.verticals.find(v => v.id === el.id);
                        if (vert) dragData.set(el.id, { x: vert.x, y1: vert.y1, y2: vert.y2 });
                      } else if (el.type === 'lane') {
                        const lane = board.lanes.find(ln => ln.id === el.id);
                        if (lane) dragData.set(el.id, { y: lane.y, x1: lane.x1, x2: lane.x2 });
                      } else if (el.type === 'sticky') {
                        const sticky = board.stickies.find(s => s.id === el.id);
                        if (sticky) dragData.set(el.id, { x: sticky.x, y: sticky.y });
                      } else if (el.type === 'label') {
                        const label = board.labels.find(lbl => lbl.id === el.id);
                        if (label) dragData.set(el.id, { x: label.x, y: label.y });
                      }
                    });
                    (e.target as any)._dragStartData = dragData;
                    (e.target as any)._initialY = l.y;
                    (e.target as any)._initialX1 = l.x1;
                    (e.target as any)._initialX2 = l.x2;
                  }}
                  onDragMove={(e) => {
                    const isThisSelected = selectedElements.some(el => el.id === l.id && el.type === 'lane');
                    if (selectedElements.length > 0 && isThisSelected) {
                      const deltaY = e.target.y();
                      const deltaX = e.target.x();
                      const dragData = (e.target as any)._dragStartData as Map<string, any>;
                      if (dragData) {
                        selectedElements.forEach(el => {
                          if (el.id !== l.id) {
                            const startPos = dragData.get(el.id);
                            if (!startPos) return;
                            if (el.type === 'lane') {
                              const updates: any = { y: startPos.y + deltaY };
                              if (startPos.x1 !== undefined) updates.x1 = startPos.x1 + deltaX;
                              if (startPos.x2 !== undefined) updates.x2 = startPos.x2 + deltaX;
                              updateLane(el.id, updates);
                            } else if (el.type === 'sticky') {
                              updateSticky(el.id, {
                                x: startPos.x + deltaX,
                                y: startPos.y + deltaY
                              });
                            } else if (el.type === 'vertical') {
                              const updates: any = { x: startPos.x + deltaX };
                              if (startPos.y1 !== undefined) updates.y1 = startPos.y1 + deltaY;
                              if (startPos.y2 !== undefined) updates.y2 = startPos.y2 + deltaY;
                              updateVertical(el.id, updates);
                            } else if (el.type === 'label') {
                              updateLabel(el.id, {
                                x: startPos.x + deltaX,
                                y: startPos.y + deltaY
                              });
                            }
                          }
                        });
                      }
                    }
                  }}
                  onDragEnd={(e) => {
                    if (interactionMode === 'select') {
                      const newY = e.target.y();
                      const newX = e.target.x();

                      // Update this horizontal lane
                      const updates: any = { y: l.y + newY };
                      if (l.x1 !== undefined) updates.x1 = (l.x1 ?? 0) + newX;
                      if (l.x2 !== undefined) updates.x2 = (l.x2 ?? 0) + newX;
                      updateLane(l.id, updates);

                      e.target.y(0); // Reset position since we update the y in the data
                      e.target.x(0);
                      delete (e.target as any)._dragStartData;
                      delete (e.target as any)._dragStartY;
                    }
                  }}
                  onClick={(e) => {
                    if (interactionMode === 'select') {
                      e.cancelBubble = true;
                      if (e.evt.shiftKey) {
                        toggleSelection(l.id, 'lane');
                        setSelectedId(null);
                        setSelectedType(null);
                      } else {
                        clearSelection();
                        setSelectedId(l.id);
                        setSelectedType('lane');
                      }
                      setActiveTool(null); // Deactivate tool when selecting existing lane
                    }
                  }}
                  onTap={(e) => {
                    if (interactionMode === 'select') {
                      e.cancelBubble = true;
                      if (e.evt.shiftKey) {
                        toggleSelection(l.id, 'lane');
                        setSelectedId(null);
                        setSelectedType(null);
                      } else {
                        clearSelection();
                        setSelectedId(l.id);
                        setSelectedType('lane');
                      }
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
          {board.themes?.map((theme) => (
            <KonvaTheme
              key={theme.id}
              theme={theme}
              onSelect={(id, shiftKey) => {
                if (interactionMode === 'select') {
                  if (shiftKey) {
                    toggleSelection(id, 'theme');
                    setSelectedId(null);
                    setSelectedType(null);
                  } else {
                    clearSelection();
                    setSelectedId(id);
                    setSelectedType('theme');
                  }
                }
              }}
              isSelected={isSelected(theme.id) || (theme.id === selectedId && selectedType === 'theme')}
              selectedElements={selectedElements}
              interactionMode={interactionMode}
            />
          ))}

          {/* Selection box preview */}
          {selectionBox && (
            <Rect
              x={Math.min(selectionBox.x1, selectionBox.x2)}
              y={Math.min(selectionBox.y1, selectionBox.y2)}
              width={Math.abs(selectionBox.x2 - selectionBox.x1)}
              height={Math.abs(selectionBox.y2 - selectionBox.y1)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
            />
          )}

          {/* Stickies (viewport culled) */}
          {(() => {
            const visibleStickies = getVisibleStickies();
            const ids = visibleStickies?.map(s => s.id) || [];
            const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
            if (duplicates.length > 0) {
              debugLog('KonvaCanvas', `DUPLICATE STICKY IDs FOUND: ${duplicates.join(', ')}`);
              debugLog('KonvaCanvas', `Total stickies: ${board.stickies.length}, Visible: ${visibleStickies.length}`);
            }
            return visibleStickies.map((s) => (
              <KonvaSticky
                key={s.id}
                sticky={s}
                onSelect={(id, shiftKey) => {
                  debugLog('KonvaCanvas', `onSelect callback - ID: ${id}, Mode: ${interactionMode}, ShiftKey: ${shiftKey}, CurrentMultiSelect: ${selectedElements.length}`);
                  if (interactionMode === 'select') {
                    if (shiftKey) {
                      // Shift-click: toggle selection
                      debugLog('KonvaCanvas', `Toggling selection - ID: ${id}`);
                      toggleSelection(id, 'sticky');
                      setSelectedId(null);
                      setSelectedType(null);
                    } else {
                      // Regular click: single select
                      debugLog('KonvaCanvas', `Setting selected - ID: ${id}, Type: sticky`);
                      clearSelection();
                      setSelectedId(id);
                      setSelectedType('sticky');
                    }
                  } else {
                    debugLog('KonvaCanvas', `Not setting selected - wrong mode: ${interactionMode}`);
                  }
                }}
                isSelected={isSelected(s.id) || (s.id === selectedId && selectedType === 'sticky')}
                selectedElements={selectedElements}
                interactionMode={interactionMode}
              />
            ));
          })()}

          {/* Labels */}
          {board.labels?.map((label) => (
            <KonvaLabel
              key={label.id}
              label={label}
              onSelect={(id, shiftKey) => {
                debugLog('KonvaCanvas', `Label onSelect - ID: ${id}, Mode: ${interactionMode}, ShiftKey: ${shiftKey}`);
                if (interactionMode === 'select') {
                  if (shiftKey) {
                    toggleSelection(id, 'label');
                    setSelectedId(null);
                    setSelectedType(null);
                  } else {
                    clearSelection();
                    setSelectedId(id);
                    setSelectedType('label');
                  }
                }
              }}
              isSelected={isSelected(label.id) || (label.id === selectedId && selectedType === 'label')}
              selectedElements={selectedElements}
              interactionMode={interactionMode}
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
