# Slice 3: Canvas Performance & Export - Testing Guide

## Implementation Summary

**Objective**: Migrate from DOM-based rendering to react-konva for improved performance and native export capabilities.

**Components Created**:
- `KonvaSticky.tsx`: Konva-based sticky note component
- `KonvaCanvas.tsx`: Konva Stage/Layer canvas with zoom/pan
- `export.ts`: Canvas export utility

**Key Features**:
1. ✅ Canvas rendering using Konva (Stage/Layer architecture)
2. ✅ Sticky drag-and-drop (native Konva draggable)
3. ✅ Double-click to edit text (DOM overlay textarea)
4. ✅ Zoom with mouse wheel (pinch-zoom around pointer)
5. ✅ Pan with right-click drag
6. ✅ Export to PNG via Download button in header
7. ✅ Real-time collaboration (user cursors synced)

## Manual Test Checklist

### Basic Interactions
- [ ] **Create sticky**: Select tool from palette, click canvas to place
- [ ] **Drag sticky**: Left-click and drag sticky to new position
- [ ] **Edit sticky**: Double-click sticky to enter edit mode, type text
- [ ] **Select sticky**: Single-click to select (blue border appears)
- [ ] **Deselect**: Click empty canvas area to deselect

### Canvas Navigation
- [ ] **Zoom in**: Scroll wheel forward to zoom in
- [ ] **Zoom out**: Scroll wheel backward to zoom out
- [ ] **Zoom centering**: Zoom should center around mouse pointer position
- [ ] **Pan canvas**: Right-click and drag to pan the canvas
- [ ] **Reset view**: Refresh page to reset to default view

### Collaboration
- [ ] **Multi-user cursors**: Open in two browser tabs, verify cursors sync
- [ ] **Multi-user stickies**: Create sticky in tab 1, verify it appears in tab 2
- [ ] **Online counter**: Verify user count updates when tabs open/close

### Export
- [ ] **Export PNG**: Click "Export PNG" button in header
- [ ] **Verify download**: Check downloaded file opens as valid PNG
- [ ] **Export quality**: Verify exported image has 2x resolution for clarity
- [ ] **Export content**: Verify all stickies, lines, themes are included

### Performance
- [ ] **Create 50+ stickies**: Verify smooth rendering and interaction
- [ ] **Drag performance**: Verify dragging remains smooth with many stickies
- [ ] **Zoom performance**: Verify zoom is smooth even with many elements

## Known Limitations

1. **Viewport culling**: Not yet implemented (renders all elements regardless of viewport)
2. **Text wrapping**: Long words may overflow sticky boundaries
3. **Accessibility**: No keyboard navigation yet
4. **Mobile**: Touch gestures not optimized

## Performance Comparison (DOM vs Konva)

**Before (DOM-based Canvas.tsx)**:
- Each sticky is a DOM element with absolute positioning
- CSS transforms for zoom/pan
- Browser reflows on every drag operation

**After (Konva-based KonvaCanvas.tsx)**:
- Single canvas element with all stickies rendered on canvas
- GPU-accelerated rendering
- Native canvas export without external libraries
- Optimized redraw regions

## Next Steps (Future Slices)

1. **Viewport culling**: Only render visible stickies for performance
2. **Batch operations**: Undo/redo support for canvas operations
3. **Advanced export**: PDF export, SVG export, selective export (crop to selection)
4. **Touch support**: Multi-touch gestures for mobile/tablet
