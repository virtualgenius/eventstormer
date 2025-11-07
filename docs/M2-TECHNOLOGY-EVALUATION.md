# M2 Technology Evaluation Report

**Date:** 2025-01-07
**Scope:** OSS frameworks and libraries for EventStormer M2 milestone

---

## Executive Summary

This report evaluates OSS frameworks and libraries for EventStormer's M2 milestone features: real-time collaboration, local persistence, undo/redo, import/export, and canvas/geometry capabilities. After extensive research of current (2025) options, I recommend a complementary stack that avoids reinventing core infrastructure while maintaining architectural flexibility.

---

## 1. Real-time Collaboration (Multi-user Editing)

### Top Options Evaluated

| Library | GitHub Stars | TypeScript | Bundle Size | Maturity | Maintenance |
|---------|-------------|-----------|-------------|----------|-------------|
| **Yjs** | 20.5k | ✅ Yes | ~40kb | Mature (2015+) | Active |
| Automerge | 5.7k | Partial (5.9%) | ~100kb+ (WASM) | Mature | Active |
| Loro | 5.0k | Yes (5.1%) | ~80kb (WASM) | v1.0 (2025) | Active |
| SyncedStore | N/A | ✅ Yes | Small (wraps Yjs) | Mature | Active |

### 🏆 RECOMMENDATION: **Yjs**

**Rationale:**
- **Network agnostic**: Works with WebSocket, WebRTC, or peer-to-peer
- **Rich ecosystem**: Bindings for multiple editors, persistence layers, and frameworks
- **Offline-first**: Supports offline editing with automatic conflict resolution
- **Built-in features**: Undo/redo, awareness (cursors/presence), version snapshots
- **React integration**: Multiple options (`react-yjs`, `SyncedStore`, direct hooks)
- **User validation**: Your friend specifically recommended this, and it's the industry standard

**Integration with Zustand:**

Two middleware options exist:

1. **zustand-middleware-yjs** (793 stars)
   - Turns any Zustand store into a CRDT
   - Works as standard middleware (composable with Immer, persist, etc.)
   - More flexible for existing Zustand stores
   - ⚠️ Last updated 2 years ago
   - ⚠️ No awareness protocol support

2. **zustand-yjs** (9 stars)
   - Dedicated stores for Y.Map and Y.Array
   - Requires special hooks
   - More structured but less flexible

**Recommended Integration Pattern:**

```typescript
// Option A: Direct Yjs with React hooks (recommended for greenfield)
import * as Y from 'yjs';
import { useSyncedStore } from '@syncedstore/react';

// Option B: Keep Zustand, sync with Yjs manually
// Implement custom sync layer between Zustand and Y.Doc
// Gives you full control over what syncs and when
```

**Persistence Options:**
- **y-indexeddb**: Local persistence to IndexedDB (works seamlessly with Yjs)
- Combine network provider (WebSocket/WebRTC) + persistence provider
- Must avoid multiple IndexeddbPersistence instances in React (use useRef pattern)

**Backend Options:**

See detailed analysis in section 1.1 below.

**Trade-offs:**
- ✅ Battle-tested (used by JupyterLab, Serenity Notes)
- ✅ Comprehensive feature set (undo/redo built-in)
- ✅ Works offline with automatic sync when reconnected
- ⚠️ Zustand integration requires custom work or middleware (not first-party)
- ⚠️ Learning curve for CRDT concepts
- ❌ Middleware options are unmaintained or immature

**Alternative Considered:**
- **Liveblocks**: Commercial solution with generous free tier (100 MAU)
  - First-class React support with `@liveblocks/yjs` integration
  - Ready-made components for presence, cursors, comments
  - ⚠️ Pricing scales by MAU + storage (8GB free)
  - ⚠️ No self-hosted option
  - ❌ Overkill for OSS project; creates vendor lock-in

### 1.1 Real-time Collaboration Backend Deep Dive

When using Yjs for real-time collaboration, you need a backend to synchronize state between clients. Yjs is **network-agnostic**, meaning it doesn't prescribe a specific transport mechanism. Here's a comprehensive comparison of backend options:

---

#### Option 1: PartyKit (Recommended for Hosted Solution)

**What it is:**
- Turnkey hosted solution for Yjs collaboration built on Cloudflare Workers
- Provides global edge deployment with automatic scaling
- `y-partykit` package wraps Yjs WebSocket sync in a ~5-line server

**How it works:**
```typescript
// PartyKit server (server.ts)
import type { PartyKitServer } from "partykit/server";
import { onConnect } from "y-partykit";

export default {
  onConnect(ws, room) {
    return onConnect(ws, room, { persist: true });
  }
} satisfies PartyKitServer;
```

```typescript
// Client integration
import YPartyKitProvider from 'y-partykit/provider';
import * as Y from 'yjs';

const ydoc = new Y.Doc();
const provider = new YPartyKitProvider(
  'your-party.your-account.partykit.dev',
  'board-room-id',
  ydoc
);
```

**Pros:**
- ✅ **Zero infrastructure**: No servers to manage, deploy, or scale
- ✅ **Global edge**: Cloudflare's 300+ edge locations mean low latency worldwide
- ✅ **Automatic scaling**: Handles 10 users or 10,000 users transparently
- ✅ **Built-in persistence**: Optional SQLite persistence on Cloudflare Durable Objects
- ✅ **Fast setup**: From zero to deployed in <10 minutes
- ✅ **WebSocket + HTTP**: Supports both protocols (fallback for restrictive networks)
- ✅ **OSS-friendly**: Generous free tier (50,000 requests/month, 10GB bandwidth)

**Cons:**
- ❌ **Vendor lock-in**: Tied to PartyKit/Cloudflare infrastructure
- ❌ **Pricing uncertainty**: Beyond free tier, costs scale with usage (unknown for EventStormer workload)
- ❌ **Less control**: Can't customize low-level WebSocket behavior
- ⚠️ **Relatively new**: PartyKit launched in 2023 (less battle-tested than y-websocket)

**Cost Model:**
- **Free tier**: 50k requests/month, 10GB bandwidth, 1M WebSocket messages
- **Pro tier**: $10/month + usage-based pricing for exceeding limits
- **Estimate for EventStormer**: Small workshops (5-10 users, 1-2 hours) likely stay within free tier

**Best for:**
- Rapid prototyping and MVP launches
- Projects with unpredictable traffic (auto-scaling)
- Teams without DevOps resources
- Global user base (edge latency matters)

---

#### Option 2: y-websocket (Self-Hosted)

**What it is:**
- Official Yjs WebSocket server package
- Node.js server you deploy and manage yourself
- Industry standard, used in production by many Yjs apps

**How it works:**
```typescript
// Server (Node.js)
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';

const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
});
```

```typescript
// Client
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

const ydoc = new Y.Doc();
const provider = new WebsocketProvider(
  'wss://your-server.com',
  'board-room-id',
  ydoc
);
```

**Pros:**
- ✅ **Full control**: Customize authentication, rate limiting, logging, metrics
- ✅ **No vendor lock-in**: Deploy anywhere (AWS, DigitalOcean, Railway, Fly.io)
- ✅ **Battle-tested**: Most mature Yjs backend (used since 2016)
- ✅ **Cost-effective at scale**: Fixed server costs (vs. per-request pricing)
- ✅ **Privacy**: Data stays on your infrastructure
- ✅ **Extensible**: Add custom middleware (e.g., board access control)

**Cons:**
- ❌ **DevOps overhead**: Must manage servers, deployments, monitoring, scaling
- ❌ **Scaling complexity**: Requires Redis or similar for multi-server coordination
- ❌ **No built-in persistence**: Need to add y-leveldb or database integration
- ❌ **Single region by default**: Must architect multi-region yourself for global latency

**Infrastructure Requirements:**
- **Minimal**: Single Node.js server (e.g., DigitalOcean Droplet $6/month)
- **Production**: Load balancer + 2+ servers + Redis (for pub/sub) (~$50-100/month)
- **Scaling**: Horizontal scaling requires shared state (Redis, PostgreSQL LISTEN/NOTIFY)

**Persistence Options:**
- **y-leveldb**: Persist Y.Doc updates to LevelDB (file-based)
- **y-redis**: Use Redis as persistence layer (good for distributed setups)
- **Custom**: Store snapshots in PostgreSQL/MySQL (requires middleware)

**Best for:**
- OSS projects wanting full control
- Teams with existing infrastructure (Kubernetes, etc.)
- Privacy-sensitive use cases (healthcare, legal, internal tools)
- Cost-conscious projects at scale (predictable server costs)

---

#### Option 3: y-webrtc (Peer-to-Peer)

**What it is:**
- Browser-to-browser (peer-to-peer) collaboration via WebRTC
- No central server for data synchronization (only signaling server for discovery)
- Uses public signaling servers by default (or you can self-host)

**How it works:**
```typescript
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';

const ydoc = new Y.Doc();
const provider = new WebrtcProvider(
  'board-room-id',
  ydoc,
  { signaling: ['wss://signaling.yjs.dev'] } // Optional: use public signaling servers
);
```

**Pros:**
- ✅ **No backend required**: Data syncs directly between browsers
- ✅ **Zero infrastructure costs**: No servers to pay for or manage
- ✅ **Low latency**: Direct peer connections (no server round-trip)
- ✅ **Privacy-first**: Data never touches a server (end-to-end encrypted by WebRTC)
- ✅ **Simple setup**: Works out-of-the-box with public signaling servers

**Cons:**
- ❌ **Network requirements**: Requires UDP ports (blocked by some firewalls/corporate networks)
- ❌ **Unreliable discovery**: Peers must be online simultaneously to sync
- ❌ **No persistence**: When last user leaves, state is lost (unless combined with y-indexeddb)
- ❌ **Poor for async workflows**: Facilitator creates board → participants join later = no sync
- ❌ **Scaling limits**: Performance degrades with >10-15 simultaneous peers
- ⚠️ **NAT traversal issues**: May fail in restrictive networks (needs TURN server fallback)

**Hybrid Approach (P2P + IndexedDB):**
- Combine `y-webrtc` + `y-indexeddb` for offline persistence
- First peer to join "seeds" the board from IndexedDB
- Solves async problem, but still requires at least one peer online

**Best for:**
- Maximum privacy use cases (zero-trust architecture)
- Small, synchronous workshops (all users online together)
- Prototyping and demos
- Offline-first apps with occasional sync

**NOT suitable for:**
- Facilitator pre-creates board, sends link to participants later
- Large workshops (>15 participants)
- Enterprise environments with strict firewall rules

---

#### Option 4: Hybrid Architectures

**A. WebSocket + WebRTC Fallback**
- Primary: y-websocket (reliable, works everywhere)
- Fallback: y-webrtc (peer-to-peer if WebSocket unavailable)
- Best of both worlds, but added complexity

**B. PartyKit + IndexedDB**
- PartyKit for live sync
- y-indexeddb for offline caching
- Recommended approach for production EventStormer

**C. WebRTC + Relay Server**
- Use WebRTC for data, but fallback to TURN relay for NAT traversal
- Requires TURN server infrastructure (Twilio, Cloudflare Calls)

---

#### Comparison Matrix

| Factor | PartyKit | y-websocket | y-webrtc |
|--------|----------|-------------|----------|
| **Setup Complexity** | ⭐⭐⭐⭐⭐ (5 min) | ⭐⭐⭐ (1-2 hours) | ⭐⭐⭐⭐ (10 min) |
| **DevOps Overhead** | ✅ None | ❌ High | ✅ None |
| **Latency** | ⭐⭐⭐⭐ (edge) | ⭐⭐⭐ (single region) | ⭐⭐⭐⭐⭐ (P2P) |
| **Scaling** | ✅ Automatic | ⚠️ Manual | ❌ Limited (~15 peers) |
| **Reliability** | ✅ High | ✅ High | ⚠️ Medium (NAT issues) |
| **Offline Support** | ⚠️ Requires y-indexeddb | ⚠️ Requires y-indexeddb | ⚠️ Requires y-indexeddb |
| **Cost (10 users)** | $0 (free tier) | $6-12/month (VPS) | $0 |
| **Cost (1000 users)** | ~$50-100/month | ~$50-100/month | $0 (infeasible) |
| **Vendor Lock-in** | ❌ PartyKit-specific | ✅ Deploy anywhere | ✅ No vendor |
| **Privacy** | ⚠️ Data on Cloudflare | ✅ Self-hosted | ✅ Peer-to-peer |
| **Firewall Friendly** | ✅ WebSocket/HTTP | ✅ WebSocket/HTTP | ❌ Requires UDP |
| **Best for Workshops** | ✅ Async (pre-create boards) | ✅ Async | ❌ Sync only |

---

#### Decision Framework for EventStormer

**Choose PartyKit if:**
- ✅ You want to ship M2 collaboration fast (MVP mindset)
- ✅ You don't have DevOps expertise or infrastructure
- ✅ You expect unpredictable traffic (some boards have 5 users, others 50)
- ✅ Global user base (latency matters)
- ✅ Free tier is acceptable for initial launch

**Choose y-websocket if:**
- ✅ You want zero vendor lock-in (future-proof)
- ✅ You have DevOps skills or existing infrastructure
- ✅ Privacy/compliance requires self-hosted data
- ✅ You need custom auth/access control per board
- ✅ You expect consistent, predictable traffic (cost-effective at scale)

**Choose y-webrtc if:**
- ✅ Maximum privacy is a hard requirement (zero-trust)
- ✅ All participants join synchronously (live workshop)
- ✅ Workshops are small (<15 people)
- ❌ **DO NOT choose** if facilitators pre-create boards for async participation

---

#### Recommended Approach for EventStormer

**Phase 1 (M2 MVP): PartyKit**
- **Rationale**: Ship collaboration in days, not weeks
- Zero infrastructure setup
- Validates market fit before investing in self-hosted infrastructure
- Can always migrate to y-websocket later (same protocol, different server)

**Phase 2 (Post-M2): Evaluate Migration to y-websocket**
- **Trigger**: If costs exceed $50/month OR need custom access control
- Migration path: Update WebSocket URL, deploy y-websocket server
- Yjs protocol is standardized (minimal client changes)

**Hybrid (Best of Both Worlds):**
- Use PartyKit for **public demos and free tier users**
- Offer y-websocket **self-hosted option** for enterprises/privacy-focused orgs
- Same client code, different provider URL (configuration flag)

---

#### Migration Path

If you start with PartyKit and later want to migrate:

**Client code (stays mostly the same):**
```typescript
// Before (PartyKit)
const provider = new YPartyKitProvider('party.host', 'room', ydoc);

// After (y-websocket)
const provider = new WebsocketProvider('wss://your-server.com', 'room', ydoc);
```

**Minimal code changes** - same Yjs API, same Y.Doc structure. Migration is mostly infrastructure (deploy y-websocket server, update env var).

---

## 2. Local Persistence (IndexedDB)

### Top Options Evaluated

| Library | GitHub Stars | TypeScript | Bundle Size | React Integration | Maintenance |
|---------|-------------|-----------|-------------|-------------------|-------------|
| **Dexie.js** | 13.7k | ✅ Yes | ~20kb | `dexie-react-hooks` | Active |
| **idb** | 7.1k | ✅ Yes | ~1.19kb | Manual | Active |

### 🏆 RECOMMENDATION: **Dexie.js**

**Rationale:**
- **React-first**: `useLiveQuery` hook for reactive queries (re-renders on DB changes)
- **Developer experience**: Much simpler API than raw IndexedDB
- **Performance**: Bulk operations optimized for IndexedDB's quirks
- **TypeScript**: Full type support with `EntityTable` types
- **Battle-tested**: Used by 100,000+ websites/apps
- **Comprehensive**: Migrations, transactions, queries, indexes all built-in
- **Framework support**: Official tutorials for React, Vue, Svelte, Angular

**Integration Pattern:**

```typescript
// Define schema
import Dexie, { type EntityTable } from 'dexie';

interface BoardSnapshot {
  id: string;
  timestamp: string;
  data: Board;
}

const db = new Dexie('EventStormerDB') as Dexie & {
  boards: EntityTable<Board, 'id'>;
  snapshots: EntityTable<BoardSnapshot, 'id'>;
};

db.version(1).stores({
  boards: 'id, updatedAt',
  snapshots: 'id, timestamp',
});

// React hook
import { useLiveQuery } from 'dexie-react-hooks';

function BoardComponent() {
  const board = useLiveQuery(() => db.boards.get(boardId));
  // Component re-renders automatically when board changes in DB
}
```

**Integration with Zustand:**
- Use Zustand's `persist` middleware with Dexie as custom storage
- Auto-save on state changes (debounced)
- Load from Dexie on app initialization

**Integration with Yjs:**
- Yjs already has `y-indexeddb` for CRDT persistence
- Use Dexie for **checkpoints** and **board metadata** (separate from CRDT state)
- Keeps concerns separated: Yjs handles collaborative state, Dexie handles snapshots

**Trade-offs:**
- ✅ Much better DX than raw IndexedDB or `idb`
- ✅ Reactive queries integrate seamlessly with React
- ✅ Works around IndexedDB browser bugs
- ✅ Active maintenance and documentation
- ⚠️ Larger bundle than `idb` (~20kb vs 1.2kb)
- ⚠️ Commercial "Dexie Cloud" offering (you won't need it)

**Alternative Considered:**
- **idb**: Minimal promise wrapper for IndexedDB
  - Only 1.19kb (17x smaller than Dexie)
  - No React integration (manual `useEffect` patterns)
  - ✅ Good choice if bundle size is critical
  - ❌ More boilerplate, no live queries

---

## 3. Undo/Redo System

### Top Options Evaluated

| Library | GitHub Stars | TypeScript | Bundle Size | Zustand Native | Maintenance |
|---------|-------------|-----------|-------------|----------------|-------------|
| **Zundo** | 793 | ✅ Yes | <700 bytes | ✅ Yes | Active |
| zustand-travel | 9 | ✅ Yes | Unknown | ✅ Yes | Unknown |
| Yjs (built-in) | 20.5k | ✅ Yes | Included | ❌ No | Active |

### 🏆 RECOMMENDATION: **Yjs built-in undo/redo** (with Zundo as fallback)

**Rationale:**

**If using Yjs for collaboration:**
- Yjs includes `Y.UndoManager` for time-travel
- Works with collaborative state (merges undo/redo across users)
- Scoped to specific shared types
- Handles complex CRDT undo scenarios correctly
- **No additional dependency**

**If NOT using Yjs / for local-only undo:**
- **Zundo**: Tiny (<700 bytes), official Zustand middleware
- Temporal middleware pattern
- Configurable history limits, partial state tracking, custom equality
- Works with `persist` middleware for undo/redo persistence

**Integration Pattern (Yjs):**

```typescript
import * as Y from 'yjs';

const ydoc = new Y.Doc();
const yboard = ydoc.getMap('board');

const undoManager = new Y.UndoManager(yboard, {
  captureTimeout: 500, // Group changes within 500ms
  trackedOrigins: new Set([ydoc.clientID]), // Only track local changes
});

undoManager.undo();
undoManager.redo();
undoManager.clear();
```

**Integration Pattern (Zundo with Zustand):**

```typescript
import { temporal } from 'zundo';

export const useBoardStore = create<BoardState>()(
  temporal(
    (set) => ({
      board: initialBoard,
      // ... actions
    }),
    {
      limit: 100, // Keep last 100 states
      partialize: (state) => ({
        board: state.board, // Only track board changes
      }),
    }
  )
);

// Usage
const { undo, redo, clear } = useTemporalStore((state) => state);
```

**Trade-offs:**
- ✅ Yjs undo handles collaborative edge cases (what happens if user A undoes user B's change?)
- ✅ Zundo is incredibly lightweight
- ✅ Both integrate with React Flow (React Flow uses Zundo for undo/redo)
- ⚠️ Yjs undo only works with Yjs state (not Zustand)
- ⚠️ Zundo doesn't handle collaborative undo (local-only)

**Architectural Decision:**
- **Phase 1 (M2)**: Use Zundo for local undo/redo (simple, works with Zustand)
- **Phase 2 (post-M2)**: If you adopt Yjs, migrate to Y.UndoManager for collaborative undo

---

## 4. Import/Export

### Features Needed:
1. **Board state serialization** (JSON)
2. **Export to image** (PNG)
3. **Export to PDF**

### Top Options Evaluated

| Library | GitHub Stars | Purpose | TypeScript | Bundle Size | Maintenance |
|---------|-------------|---------|-----------|-------------|-------------|
| **Zod** | High | Schema validation | ✅ Yes | ~45kb | Active |
| **html-to-image** | 1.6M DL/mo | DOM → Image | ✅ Yes | ~15kb | Active (2025) |
| html2canvas | 2.6M DL/mo | DOM → Canvas | Partial | ~30kb | Active |
| jsPDF | High | PDF generation | ✅ Yes | ~100kb | Active |

### 🏆 RECOMMENDATIONS:

**4.1 JSON Import/Export**

**Use Zod for schema validation:**

```typescript
import { z } from 'zod';

const BoardSchema = z.object({
  id: z.string(),
  name: z.string(),
  stickies: z.array(StickySchema),
  verticals: z.array(VerticalSchema),
  lanes: z.array(LaneSchema),
  themes: z.array(ThemeSchema),
  phase: z.enum(['events', 'hotspots', 'pivotal', 'lanes', 'actors-systems', 'opportunities', 'glossary']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Export
const json = JSON.stringify(board);

// Import with validation
const imported = BoardSchema.parse(JSON.parse(json));
```

**Rationale:**
- TypeScript-first (infers static types from schemas)
- Zero dependencies
- Smaller than Yup (~45kb vs 60kb)
- Better TypeScript integration than AJV (which is fastest but lacks TS inference)
- Industry standard for React apps in 2025

**4.2 Export to PNG/Image**

**Use html-to-image:**

```typescript
import { toPng, toJpeg, toBlob, toSvg } from 'html-to-image';

const exportToPng = async (canvasRef: HTMLElement) => {
  const dataUrl = await toPng(canvasRef, {
    cacheBust: true,
    pixelRatio: 2, // Retina quality
  });

  // Download
  const link = document.createElement('a');
  link.download = 'board.png';
  link.href = dataUrl;
  link.click();
};
```

**Rationale:**
- Fork of dom-to-image with better maintenance
- Multiple formats: PNG, JPEG, SVG, Blob
- Modern build system (ESM + CommonJS)
- TypeScript support
- 1.6M monthly downloads (2025 momentum)
- Faster than html2canvas for many use cases
- **Direct to PNG** (no intermediate canvas step)

**Alternative:**
- **html2canvas**: More popular (2.6M DL/mo) but slower
- ✅ Better for complex DOM rendering
- ❌ Rasterizes text (not crisp at high zoom)

**4.3 Export to PDF**

**Use html-to-image + jsPDF:**

```typescript
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const exportToPdf = async (canvasRef: HTMLElement) => {
  const imgData = await toPng(canvasRef, { pixelRatio: 2 });

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvasRef.offsetWidth, canvasRef.offsetHeight],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvasRef.offsetWidth, canvasRef.offsetHeight);
  pdf.save('board.pdf');
};
```

**Trade-offs:**
- ✅ Simple, works for most use cases
- ⚠️ Rasterized (text becomes pixels, not searchable)
- ❌ Not ideal for very large canvases (memory limits)
- ✅ Good enough for M2; can improve later with server-side rendering

**Canvas-Native Export (if using Konva/Fabric):**
- Konva: `stage.toDataURL()` or `stage.toImage()`
- Fabric: `canvas.toDataURL()` or `canvas.toSVG()`
- These are much more performant than DOM-to-image approaches

---

## 5. Canvas & Geometry Libraries

### Top Options Evaluated

| Library | GitHub Stars | Purpose | TypeScript | React Bindings | Bundle Size | Maintenance |
|---------|-------------|---------|-----------|---------------|-------------|-------------|
| **react-konva** | 6.2k | Canvas (Konva wrapper) | ✅ Yes | Native | ~50kb | Active |
| fabric.js | 30.6k | Canvas (object-oriented) | ✅ Yes | Examples | ~200kb | Active |
| React Flow | 33.6k | Node-based UI | ✅ Yes (85.4%) | Native | ~100kb | Active |
| tldraw | 43.7k | Whiteboard SDK | ✅ Yes (93.8%) | Native | Large | Active |
| **RBush** | 2.7k | Spatial indexing (R-tree) | Partial | N/A | ~5kb | Active |

### 🏆 RECOMMENDATIONS:

**5.1 Canvas Rendering: react-konva**

**Rationale:**
- **Declarative React API**: Stage, Layer, Shape components
- **Performance**: Canvas-based (not DOM), handles thousands of objects
- **Event handling**: Full support for mouse/touch events on shapes
- **Infinite canvas**: Well-suited with pan/zoom (existing `react-zoom-pan-pinch` integration)
- **Export**: Built-in `toDataURL()` and `toImage()` methods (no html2canvas needed!)
- **TypeScript**: Full .d.ts support
- **Lightweight**: Smaller than Fabric.js (~50kb vs 200kb)
- **Active**: Next.js compatible, modern build system

**Integration Pattern:**

```typescript
import { Stage, Layer, Rect, Text } from 'react-konva';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

function Canvas() {
  const stickies = useBoardStore((state) => state.board.stickies);

  return (
    <TransformWrapper>
      <TransformComponent>
        <Stage width={window.innerWidth} height={window.innerHeight}>
          <Layer>
            {stickies.map((sticky) => (
              <StickyShape key={sticky.id} sticky={sticky} />
            ))}
          </Layer>
        </Stage>
      </TransformComponent>
    </TransformWrapper>
  );
}
```

**Trade-offs:**
- ✅ Canvas-based (performant for infinite canvas with many objects)
- ✅ Declarative React patterns
- ✅ Native export (no DOM-to-image hacks)
- ✅ Event system works well for drag-and-drop
- ⚠️ React-specific (not framework-agnostic like Fabric.js)
- ❌ Not suitable for React Native

**Alternatives Considered:**

1. **fabric.js** (30.6k stars)
   - More feature-rich (SVG import/export, filters, animations)
   - Object-oriented API (not declarative)
   - Larger bundle (~200kb)
   - React integration requires manual reconciliation
   - ✅ Best if you need SVG import/export
   - ❌ Overkill for sticky notes

2. **React Flow** (33.6k stars)
   - Built for node-and-wire diagrams
   - Excellent TypeScript support (85.4%)
   - Built-in minimap, controls, background grid
   - Uses Zustand internally + Zundo for undo/redo
   - ⚠️ Opinionated for "nodes and edges" model
   - ❌ Not flexible enough for EventStorming semantics (stickies, lanes, themes)

3. **tldraw** (43.7k stars)
   - Full-featured whiteboard SDK
   - Infinite canvas, multiplayer, shapes, drawing
   - 93.8% TypeScript
   - ⚠️ Requires watermark or commercial license
   - ❌ Too heavyweight; you'd be fighting the framework
   - ❌ Vendor lock-in

**5.2 Spatial Indexing: RBush**

**Rationale:**
- **Performance**: 30x faster than looping for small-area queries
- **R-tree**: Optimized for bounding box queries ("what's in this region?")
- **Use cases**:
  - Theme area extraction (find all stickies in rectangle)
  - Click detection (find sticky at cursor position)
  - Viewport culling (only render visible stickies)
- **Tiny**: ~5kb minified
- **Simple API**: insert, remove, search

**Integration Pattern:**

```typescript
import RBush from 'rbush';

interface StickyBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string;
}

const tree = new RBush<StickyBox>();

// Insert stickies
stickies.forEach((sticky) => {
  tree.insert({
    minX: sticky.x,
    minY: sticky.y,
    maxX: sticky.x + STICKY_WIDTH,
    maxY: sticky.y + STICKY_HEIGHT,
    id: sticky.id,
  });
});

// Find stickies in viewport
const visibleStickies = tree.search({
  minX: viewportX,
  minY: viewportY,
  maxX: viewportX + viewportWidth,
  maxY: viewportY + viewportHeight,
});

// Theme extraction: find stickies in selection rectangle
const selectedStickies = tree.search({
  minX: selectionRect.x,
  minY: selectionRect.y,
  maxX: selectionRect.x + selectionRect.width,
  maxY: selectionRect.y + selectionRect.height,
});
```

**When to Use:**
- **> 1000 stickies**: Performance becomes noticeable
- **Theme extraction**: Avoid the "ContextFlow bounding shape algorithm" trap
- **Viewport culling**: Only render what's visible (critical for large boards)

**Trade-offs:**
- ✅ Battle-tested (used by Mapbox, Leaflet)
- ✅ Tiny bundle size
- ✅ Simple API
- ⚠️ Need to manually sync with Zustand state (rebuild tree on changes)
- ⚠️ Partial TypeScript (not TypeScript-first)

**Alternative Considered:**
- **quadtree-js** (Lightweight quadtree)
  - Faster for uniform-size objects
  - ⚠️ Quadtrees less efficient for window queries than R-trees
  - ❌ RBush is better for rectangle queries (theme extraction)

---

## Integration Architecture: Putting It All Together

### Recommended Stack

```
┌─────────────────────────────────────────────────────────┐
│                     React + TypeScript                  │
├─────────────────────────────────────────────────────────┤
│  State Management: Zustand (current)                    │
│  ├─ Middleware: zundo (local undo/redo)                 │
│  └─ Middleware: persist + Dexie (checkpoints)           │
├─────────────────────────────────────────────────────────┤
│  Collaboration: Yjs (M2 Phase 2)                        │
│  ├─ Persistence: y-indexeddb                            │
│  ├─ Backend: PartyKit (y-partykit) or self-hosted      │
│  └─ Undo: Y.UndoManager                                 │
├─────────────────────────────────────────────────────────┤
│  Canvas: react-konva                                    │
│  ├─ Pan/Zoom: react-zoom-pan-pinch (current)           │
│  └─ Spatial Index: RBush (theme extraction, culling)    │
├─────────────────────────────────────────────────────────┤
│  Import/Export                                          │
│  ├─ JSON: Zod validation                               │
│  ├─ PNG: html-to-image or konva.toDataURL()           │
│  └─ PDF: jsPDF + html-to-image                         │
└─────────────────────────────────────────────────────────┘
```

### Phased Adoption Strategy

**Phase 1: Local-First (M2 MVP)**
1. **Canvas**: Migrate from current setup to `react-konva`
   - Replace `react-zoom-pan-pinch` + custom rendering with Konva Stage/Layer
   - Implement sticky, line, lane, theme rendering as Konva shapes
   - Keep `react-zoom-pan-pinch` for pan/zoom (works with Konva Stage)

2. **Persistence**: Add Dexie.js
   - Auto-save board state every 5 seconds (debounced)
   - Manual "Save Checkpoint" action
   - Load last saved board on app start

3. **Undo/Redo**: Add Zundo middleware
   - Limit to 100 history states
   - Persist undo history to Dexie (optional)

4. **Export**: Add export buttons
   - JSON: `JSON.stringify(board)` + download
   - PNG: `konva.toDataURL()` or `html-to-image`
   - PDF: `jsPDF` + PNG image

5. **Import**: Add JSON import with Zod validation
   - File upload → parse → validate → load into Zustand

**Phase 2: Collaborative (M2 Complete)**
1. **Adopt Yjs**: Migrate Zustand state to Y.Doc
   - Keep Zustand for UI state (activeTool, selected elements)
   - Move board state to Yjs shared types (Y.Map for board, Y.Array for stickies)
   - Sync Zustand ↔ Yjs manually (custom hooks)

2. **Add Persistence**: y-indexeddb for offline support

3. **Add Backend**: Deploy PartyKit server with `y-partykit`
   - 5-line WebSocket server
   - Automatic scaling, connection management

4. **Migrate Undo**: Replace Zundo with Y.UndoManager

5. **Add Awareness**: Yjs Awareness for cursors/presence

**Phase 3: Performance (Post-M2)**
1. **Add RBush**: Spatial indexing for large boards
   - Viewport culling (only render visible stickies)
   - Click detection optimization
   - Theme extraction (no manual bounding calculation)

---

## Key Trade-offs & Risks

### 1. Zustand vs. Yjs State Management
**Trade-off:**
- Zustand is simple, local-first, React-friendly
- Yjs is complex but necessary for real-time collaboration

**Mitigation:**
- Phase 1: Keep Zustand for local MVP
- Phase 2: Gradually migrate to Yjs, keep Zustand for UI state
- Use custom sync layer (don't force everything into Yjs)

### 2. React-Konva vs. Build Your Own Canvas
**Trade-off:**
- Konva is a framework (some overhead, learning curve)
- Custom canvas gives full control but requires building primitives

**Mitigation:**
- Konva is lightweight (~50kb) and React-friendly
- Avoids reinventing event handling, hit detection, transforms
- Can always drop down to raw Konva API if needed

**Risk:**
- Not "build from scratch" like you avoided in ContextFlow
- But Konva is a thin layer, not a heavyweight framework like tldraw

### 3. Bundle Size Budget
**Current stack:**
- React + Zustand + TailwindCSS: ~100kb

**Added (M2):**
```
+ react-konva: ~50kb
+ Dexie.js: ~20kb
+ Zundo: <1kb
+ Zod: ~45kb
+ html-to-image: ~15kb
+ jsPDF: ~100kb (lazy loaded)
────────────────────
  Subtotal: ~230kb
```

**Added (Collaboration):**
```
+ Yjs: ~40kb
+ y-indexeddb: ~10kb
+ PartyKit client: ~20kb
────────────────────
  Subtotal: ~70kb
```

**Total M2 bundle: ~400kb minified**
- Acceptable for a collaborative whiteboard tool
- PDF export can be lazy-loaded (reduce initial bundle to ~300kb)

### 4. Avoiding "ContextFlow Trap"
**Lesson learned:** Don't build complex algorithms (bounding shape detection) from scratch

**Applied here:**
- ✅ Use RBush for spatial queries (battle-tested R-tree)
- ✅ Use Yjs for CRDT conflict resolution (don't build your own)
- ✅ Use Konva for canvas primitives (event handling, transforms)
- ✅ Use Dexie for IndexedDB (browser bug workarounds)

**Where you still build custom:**
- EventStorming domain logic (facilitation phases, sticky semantics)
- Theme extraction UX (but use RBush for geometry)
- Export formatting (but use libraries for rendering)

---

## Summary: Technology Recommendations

| Feature | Library | Stars | Bundle | Rationale |
|---------|---------|-------|--------|-----------|
| **Real-time Collaboration** | **Yjs** | 20.5k | ~40kb | Industry standard, offline-first, rich ecosystem |
| Backend (optional) | **PartyKit** | N/A | ~20kb | Turnkey Yjs backend, Cloudflare edge |
| **Local Persistence** | **Dexie.js** | 13.7k | ~20kb | React hooks, DX, performance, migrations |
| **Undo/Redo (local)** | **Zundo** | 793 | <1kb | Zustand middleware, tiny, simple |
| **Undo/Redo (collab)** | **Yjs UndoManager** | (built-in) | 0kb | Handles collaborative edge cases |
| **JSON Validation** | **Zod** | High | ~45kb | TypeScript-first, zero deps, smaller than Yup |
| **Export to PNG** | **html-to-image** | 1.6M DL | ~15kb | Modern, fast, multiple formats |
| **Export to PDF** | **jsPDF** | High | ~100kb | Industry standard, lazy-loadable |
| **Canvas Rendering** | **react-konva** | 6.2k | ~50kb | Declarative React, performant, export built-in |
| **Pan/Zoom** | **react-zoom-pan-pinch** | 317 projects | ~10kb | Already in use, works with Konva |
| **Spatial Indexing** | **RBush** | 2.7k | ~5kb | R-tree, theme extraction, viewport culling |

---

## Final Recommendations

### Immediate Next Steps (M2 Phase 1)

1. **Spike: react-konva Canvas** (2-3 days)
   - Migrate one sticky type to Konva rendering
   - Verify pan/zoom works with `react-zoom-pan-pinch`
   - Test export with `konva.toDataURL()`
   - Decision point: Commit to Konva or explore alternatives

2. **Add Dexie.js Persistence** (1-2 days)
   - Set up database schema
   - Auto-save every 5 seconds
   - Load on app start

3. **Add Zundo Undo/Redo** (1 day)
   - Wrap Zustand store with `temporal` middleware
   - Add undo/redo buttons to UI

4. **Add Export** (2-3 days)
   - JSON export/import with Zod validation
   - PNG export (try Konva first, fallback to html-to-image)
   - PDF export (lazy-loaded jsPDF)

### M2 Phase 2: Collaboration (Future)

1. **Spike: Yjs Integration** (3-5 days)
   - Proof-of-concept with Y.Doc + y-indexeddb
   - Decide: Migrate Zustand to Yjs, or sync Zustand ↔ Yjs?
   - Test with two browser tabs (local sync)

2. **Deploy PartyKit Backend** (1-2 days)
   - Use `y-partykit` starter
   - Test multi-user sync

3. **Add Awareness** (1-2 days)
   - User cursors
   - Active user list

### Optional Enhancements (Post-M2)

1. **RBush Spatial Indexing** (2-3 days)
   - Add when board has >500 stickies
   - Viewport culling for performance

2. **Better PDF Export** (Future)
   - Server-side rendering with Puppeteer (crisp text)
   - Multi-page PDF for large boards

---

**Total Estimated Effort (M2):**
- Phase 1 (Local): 6-9 days
- Phase 2 (Collaboration): 5-8 days
- **Total: 11-17 days** (2-3 weeks)

---

## References

- **Yjs**: https://github.com/yjs/yjs
- **PartyKit**: https://www.partykit.io/
- **Dexie.js**: https://dexie.org/
- **Zundo**: https://github.com/charkour/zundo
- **react-konva**: https://github.com/konvajs/react-konva
- **RBush**: https://github.com/mourner/rbush
- **Zod**: https://github.com/colinhacks/zod
- **html-to-image**: https://github.com/bubkoo/html-to-image
- **jsPDF**: https://github.com/parallax/jsPDF
