# Debug Logging Guide

Comprehensive console logging has been added to track all sticky note interactions in the Konva implementation.

## Console Log Prefixes

All debug logs use tagged prefixes for easy filtering:

- `[KonvaSticky]` - Sticky component interactions
- `[KonvaCanvas]` - Canvas-level interactions
- `[Store]` - Zustand store state mutations

## Logged Interactions

### Sticky Creation
**Location**: KonvaCanvas.tsx → Store

```
[KonvaCanvas] Creating sticky - Kind: event, Position: (245.3, 189.7), Scale: 1.00
[Store] Adding sticky - ID: abc123, Kind: event, Position: (245.3, 189.7), Text: ""
```

### Sticky Selection
**Location**: KonvaSticky.tsx

```
[KonvaSticky] Clicked - ID: abc123, Kind: event, Selected: false
```

### Sticky Deselection
**Location**: KonvaCanvas.tsx

```
[KonvaCanvas] Deselecting sticky - ID: abc123
```

### Sticky Drag
**Location**: KonvaSticky.tsx → Store

```
[KonvaSticky] Drag started - ID: abc123, Kind: event, Position: (245.3, 189.7)
[KonvaSticky] Drag ended - ID: abc123, Old: (245.3, 189.7), New: (312.8, 256.4)
[Store] Updating sticky - ID: abc123, Position: (245.3, 189.7) → (312.8, 256.4)
```

### Sticky Edit (Text)
**Location**: KonvaSticky.tsx → Store

```
[KonvaSticky] Double-clicked (entering edit mode) - ID: abc123, Kind: event, Text: ""
[KonvaSticky] Edit completed (blur) - ID: abc123, Old: "", New: "User logged in"
[Store] Updating sticky - ID: abc123, Text: "" → "User logged in"
```

### Sticky Edit Cancel
**Location**: KonvaSticky.tsx

```
[KonvaSticky] Edit cancelled (Escape) - ID: abc123
```

### Canvas Zoom
**Location**: KonvaCanvas.tsx

```
[KonvaCanvas] Zoom in - Scale: 1.00 → 1.05, Pointer: (512, 384)
[KonvaCanvas] Zoom out - Scale: 1.05 → 1.00, Pointer: (512, 384)
```

### Canvas Pan
**Location**: KonvaCanvas.tsx

```
[KonvaCanvas] Right-click pan started - Position: (0.0, 0.0)
[KonvaCanvas] Pan ended - Position: (125.5, 87.3)
```

## Filtering Console Output

In browser DevTools console, use filters to focus on specific interactions:

- **All Konva events**: `[Konva`
- **Only sticky interactions**: `[KonvaSticky]`
- **Only canvas events**: `[KonvaCanvas]`
- **Only state changes**: `[Store]`
- **Drag operations**: `Drag`
- **Edit operations**: `Edit`
- **Position changes**: `Position:`

## Typical Interaction Flow

### Creating and Editing a Sticky

1. Click palette tool → activeTool set
2. Click canvas → `[KonvaCanvas] Creating sticky`
3. Store creates sticky → `[Store] Adding sticky`
4. Click sticky → `[KonvaSticky] Clicked`
5. Double-click → `[KonvaSticky] Double-clicked (entering edit mode)`
6. Type text and blur → `[KonvaSticky] Edit completed (blur)` + `[Store] Updating sticky`

### Moving a Sticky

1. Mouse down on sticky → `[KonvaSticky] Drag started`
2. Mouse move (no logs during drag for performance)
3. Mouse up → `[KonvaSticky] Drag ended` + `[Store] Updating sticky`

### Navigating Canvas

1. Scroll wheel → `[KonvaCanvas] Zoom in/out`
2. Right-click drag start → `[KonvaCanvas] Right-click pan started`
3. Right-click drag end → `[KonvaCanvas] Pan ended`

## Disabling Debug Logs

To remove debug logs for production:

1. Search codebase for `console.log` with prefixes: `[KonvaSticky]`, `[KonvaCanvas]`, `[Store]`
2. Comment out or remove log statements
3. Or use a build-time strip tool like `terser` with `drop_console: true`
