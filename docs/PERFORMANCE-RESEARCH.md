# Canvas Performance Research: Scaling to 3000-5000+ Elements

## Executive Summary

**react-konva is NOT viable at 3000-5000 element scale.** Benchmarks show it struggles past 500 shapes (9 FPS at 1000 items). Tools like Miro/Figma use WebGL + WebAssembly for this reason.

---

## Benchmark Data

| Source | Finding |
|--------|---------|
| [react-konva Issue #491](https://github.com/konvajs/react-konva/issues/491) | "Applications with more than 500 shapes become too slow" |
| [react-canvas-perf benchmark](https://github.com/ryohey/react-canvas-perf) | react-konva at 1000 items: **9 FPS** (26 FPS without text) |
| [Canvas Engines Comparison](https://benchmarks.slaylines.io/) | Konva: 23/7/19 FPS vs PixiJS: 60/48/24 FPS |
| [Konva Performance Docs](https://konvajs.org/docs/performance/All_Performance_Tips.html) | "More than a few hundred shapes requires optimization" |
| [Stack Overflow: Hundreds of Thousands of Circles](https://stackoverflow.com/questions/58104140/rendering-hundreds-of-thousands-of-circles-with-react-konva) | "react, konva and react-konva create huge overhead" |

---

## What Production Tools Use

### Figma

From [Building a Professional Design Tool on the Web](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/):

> "We implemented everything from scratch using WebGL. Our renderer is a highly-optimized tile-based engine with support for masking, blurring, dithered gradients, blend modes, nested layer opacity, and more. All rendering is done on the GPU and is fully anti-aliased."

From [Figma Rendering: Powered by WebGPU](https://www.figma.com/blog/figma-rendering-powered-by-webgpu/):

> "When Figma Design launched in 2015, betting on WebGL—a browser graphics API originally designed for 3D applications—was a bold move."

Architecture:
- **C++ compiled to WebAssembly** for document representation
- **WebGL/WebGPU** for rendering
- **React + TypeScript** only for UI chrome (not canvas)
- Stress tests: "thousands of layers with 50 multiplayer users"

### Miro

- [Miro Render Playground](https://github.com/miroapp/render-playground) - Their WebGL/WebGPU experimentation repo
- Uses Canvas + WebGL for GPU acceleration
- Shapes drawn imperatively, not as React components
- Level of Detail (LOD) rendering at different zoom levels

### tldraw

From [Signia Scalability Docs](https://signia.tldraw.dev/docs/scalability):

- Custom reactive state library with incremental computation
- Memoization prevents unnecessary re-renders
- CSS containment for rendering isolation
- Powers enterprise tools like ClickUp
- [Custom shapes supported](https://tldraw.dev/features/customization)

### Excalidraw

- Uses 2D Canvas via Rough.js (not WebGL)
- [Issue #8136](https://github.com/excalidraw/excalidraw/issues/8136): Reports "significant lag" at 5000+ elements
- Recommended fixes: Web Workers, spatial indexing, object pooling

---

## EventStormer Current Bottlenecks

### 1. Every Sticky Subscribes to Full Board State

**File**: `src/components/KonvaSticky.tsx:30`
```typescript
const board = useCollabStore((s) => s.board);  // Subscribes to ENTIRE board
```
**Impact**: One sticky moves → ALL stickies re-render.

### 2. Yjs Observer Triggers Full State Rebuild

**File**: `src/store/useCollabStore.ts:266-271`
```typescript
yboard.observe(() => {
  set({ board: getBoardState() });  // Rebuilds entire board object
});
```

### 3. React Reconciliation Overhead

Each `<KonvaSticky>` is a full React component with useState, useRef, useEffect. At 5000 elements, React's diffing is catastrophic.

### 4. Single Layer Architecture

All elements in one `<Layer>` - no separation of static vs interactive content.

### 5. Shadows on Every Element

**File**: `src/components/KonvaSticky.tsx:300-305`
```typescript
shadowBlur={isSelected ? 8 : 4}
shadowOpacity={isSelected ? 0.3 : 0.15}
```

---

## Viable Paths Forward

| Path | Performance Ceiling | Effort | Risk |
|------|---------------------|--------|------|
| Quick optimizations | ~500-1000 elements | Low | Low |
| **tldraw SDK** | 10,000+ elements | Medium | Low |
| Imperative Konva | ~2000-3000 elements | High | Medium |
| WebGL (Pixi.js) | 10,000+ elements | Very High | High |

### Path A: Quick Optimizations

- Granular Zustand selectors
- React.memo on all components
- Multiple Konva layers
- Shape caching
- Disable shadows at scale
- `listening={false}` for background elements

**Ceiling**: ~500-1000 elements

### Path B: tldraw SDK

- Purpose-built infinite canvas library
- Battle-tested at enterprise scale
- Custom shapes supported
- Yjs-compatible for multiplayer
- [tldraw.dev](https://tldraw.dev/)

**Ceiling**: 10,000+ elements

### Path C: Imperative Konva (Drop react-konva)

- Keep React for UI shell
- Use vanilla Konva for shapes
- Imperative updates instead of React components
- Spatial indexing (R-tree/Quadtree)

**Ceiling**: ~2000-3000 elements

### Path D: WebGL (Pixi.js or Custom)

- GPU-accelerated rendering
- Sprite batching for similar elements
- What Miro/Figma use
- [Pixi.js](https://pixijs.com/)

**Ceiling**: 10,000+ elements

---

## Konva-Specific Optimization Tips

From [Konva Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html):

1. **Shape Caching**: Cache complex shapes as bitmaps
2. **Layer Separation**: Max 3-5 layers (static, interactive, animating)
3. **listening={false}**: Disable events on non-interactive shapes
4. **Batch Draws**: Use `layer.batchDraw()` instead of individual draws
5. **transformsEnabled**: Set to `"position"` if no rotation/scale needed
6. **Avoid destroy()**: Reuse shapes instead of destroying/recreating

From [react-konva Performance Tuning](https://j5.medium.com/react-konva-performance-tuning-52e70ab15819):

> "Don't use React components for Konva.js. Using React Components for the canvas will halve your performance."

---

## Primary Resources

### Benchmarks & Performance
- [Canvas Engines Comparison](https://benchmarks.slaylines.io/)
- [react-canvas-perf](https://github.com/ryohey/react-canvas-perf)
- [Konva Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html)
- [react-konva Performance Issue #491](https://github.com/konvajs/react-konva/issues/491)

### Architecture References
- [Figma: Building a Professional Design Tool](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/)
- [Figma: WebGPU Rendering](https://www.figma.com/blog/figma-rendering-powered-by-webgpu/)
- [Figma: Keeping Figma Fast](https://www.figma.com/blog/keeping-figma-fast/)
- [Miro Render Playground (GitHub)](https://github.com/miroapp/render-playground)
- [tldraw SDK](https://tldraw.dev/)
- [Signia (tldraw's state library)](https://signia.tldraw.dev/docs/scalability)

### Tutorials & Guides
- [react-konva Performance Tuning (Medium)](https://j5.medium.com/react-konva-performance-tuning-52e70ab15819)
- [How to Create Figma-like Infinite Canvas in WebGL](https://medium.com/better-programming/how-to-create-a-figma-like-infinite-canvas-in-webgl-8be94f65674f)
- [Konva Shape Caching](https://konvajs.org/docs/performance/Shape_Caching.html)

### Alternative Libraries
- [Pixi.js](https://pixijs.com/) - WebGL 2D renderer
- [Fabric.js](http://fabricjs.com/) - Canvas library
- [tldraw](https://tldraw.dev/) - Infinite canvas SDK

---

## Recommendation

1. **Immediate**: Apply quick optimizations to measure actual ceiling
2. **Evaluate**: Test tldraw SDK for EventStorming use case
3. **Decision**: If tldraw fits, migrate. If not, consider imperative Konva or Pixi.js.

---

*Last updated: December 2024*
