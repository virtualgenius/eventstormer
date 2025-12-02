# tldraw Migration Plan

## Goal
Build feature-complete tldraw version in `tldraw-poc/`, then replace react-konva implementation once at parity.

## Current EventStormer Features to Port

### Shapes (Custom tldraw ShapeUtils)
- [x] Event sticky (orange)
- [x] Hotspot sticky (red)
- [x] Person sticky (yellow, half-height)
- [x] System sticky (purple, half-height)
- [x] Opportunity sticky (green)
- [x] Glossary sticky (gray)
- [x] Vertical line (pivotal boundaries)
- [x] Horizontal lane (swimlane with label)
- [x] Theme area (rectangular grouping zone)
- [x] Label (free-form text annotation)

### Core Interactions
- [x] Pan/zoom (built into tldraw)
- [x] Select/multi-select (built into tldraw)
- [x] Drag to move (built into tldraw)
- [x] Double-click to edit text
- [x] Tab to create next sticky (Miro-style workflow)
- [x] Keyboard delete (built into tldraw)
- [x] Duplicate (Cmd+D)

### Facilitation Features
- [x] Phase-based palette (controls which sticky types available)
- [x] Facilitation toolbar/palette
- [x] Phase progression (dropdown selector)

### Collaboration (Yjs)
- [ ] Real-time sync via Yjs
- [ ] User presence/cursors
- [ ] User colors/names

### Persistence
- [ ] IndexedDB local storage
- [ ] Import/Export JSON
- [ ] Cloudflare Durable Objects sync

### UI Chrome
- [ ] Header with board name
- [ ] Facilitation palette
- [ ] Mode indicator (pan/select/add)
- [ ] Online users count

## Implementation Order

### Phase 1: Complete Shape Types
1. Add Opportunity and Glossary stickies
2. Add Vertical line shape
3. Add Horizontal lane shape
4. Add Theme area shape
5. Add Label shape

### Phase 2: Text Editing
1. Implement double-click to edit on stickies
2. Tab-to-create-next workflow
3. Escape to cancel edit

### Phase 3: Facilitation UI
1. Port FacilitationPalette component
2. Implement phase-based tool filtering
3. Add mode switching (pan/select/add)

### Phase 4: Collaboration
1. Integrate @tldraw/yjs for real-time sync
2. Connect to existing Cloudflare Worker
3. User presence/cursors

### Phase 5: Persistence & Polish
1. IndexedDB integration
2. Import/Export
3. Undo/redo (built into tldraw)
4. Final UI polish

### Phase 6: Swap
1. Move tldraw implementation to main src/
2. Remove react-konva dependencies
3. Update imports
4. Test all features
5. Deploy

## Files to Create/Modify

### New in tldraw-poc/src/
- `shapes/VerticalLineShape.tsx`
- `shapes/HorizontalLaneShape.tsx`
- `shapes/ThemeAreaShape.tsx`
- `shapes/LabelShape.tsx`
- `components/FacilitationPalette.tsx`
- `components/Header.tsx`
- `store/useBoardStore.ts` (local state)
- `lib/yjs-sync.ts` (collaboration)

### Port from main project
- `src/types/domain.ts` → copy type definitions
- `src/lib/nanoid.ts` → copy ID generation
- Styling/colors from existing components
