# M2 Excalidraw Architecture Evaluation

**Date:** 2025-01-07
**Status:** ❌ **NOT RECOMMENDED FOR EVENTSTORMER**

---

## Executive Summary

**Excalidraw's Approach:** Simple last-write-wins (LWW) conflict resolution with Socket.IO relay server, version numbering, and no server-side state.

**Verdict for EventStormer:** ❌ **Not recommended** due to:
- Inadequate conflict resolution for structured domain relationships
- No collaborative undo/redo (critical for facilitated workshops)
- Difficult to enforce facilitator controls and semantic validation
- Poor fit for EventStormer's guided facilitation model

**Recommendation:** Stick with **Yjs (CRDT)** as outlined in [M2-TECHNOLOGY-EVALUATION.md](M2-TECHNOLOGY-EVALUATION.md).

---

## Table of Contents

1. [Excalidraw Architecture Overview](#excalidraw-architecture-overview)
2. [EventStormer Requirements Analysis](#eventstormer-requirements-analysis)
3. [Detailed Fit Analysis](#detailed-fit-analysis)
4. [Key Architectural Differences](#key-architectural-differences)
5. [EventStormer-Specific Concerns](#eventstormer-specific-concerns)
6. [Could EventStormer Use Excalidraw's Approach?](#could-eventstormer-use-excalidraws-approach)
7. [Trade-offs Summary](#trade-offs-summary)
8. [Final Recommendation](#final-recommendation)

---

## Excalidraw Architecture Overview

### Core Design

**Pseudo-P2P Model:**
- Central Socket.IO server relays encrypted messages between clients
- Server stores **zero state** (pure relay)
- All coordination happens client-side
- End-to-end encryption

**Conflict Resolution:**
```typescript
// Simplified Excalidraw approach
interface Element {
  id: string;
  version: number;        // Incremented on every edit
  versionNonce: number;   // Random number for tie-breaking
  // ... element data
}

// When merging two versions of same element:
function resolveConflict(localElement, remoteElement) {
  if (remoteElement.version > localElement.version) {
    return remoteElement; // Remote wins
  } else if (localElement.version > remoteElement.version) {
    return localElement; // Local wins
  } else {
    // Versions equal - use nonce for deterministic tie-breaking
    return remoteElement.versionNonce < localElement.versionNonce
      ? remoteElement
      : localElement;
  }
}
```

**State Synchronization:**
1. User edits element → increment `version`
2. Broadcast element to all peers via Socket.IO
3. Each peer merges using version comparison
4. Deletions use tombstoning (`isDeleted: true`)
5. Client-specific properties (selection, canvas) excluded from sync

**Undo/Redo:**
- ❌ No collaborative undo
- Clears local undo stack when receiving peer updates
- Acknowledged as a limitation by Excalidraw team

**Technical Stack:**
- **Frontend:** Socket.IO client, version-based state merging
- **Backend:** Socket.IO server (Node.js), room-based message relay
- **Bundle Size:** ~30kb (client-side libraries)
- **Server Requirements:** Minimal (just relay, no database)

---

## EventStormer Requirements Analysis

### Critical Requirements

From [SPEC.md](SPEC.md) and [VISION.md](VISION.md):

1. **Guided Facilitation Flow**
   - Facilitator controls phase progression (events → hotspots → pivotal → ...)
   - Palette updates based on current phase
   - Only facilitator can advance phases

2. **Semantic Validation**
   - Pivotal events must have ≥1 actor
   - Events should be past-tense
   - Commands not visible in Big Picture mode

3. **Structured Domain Model**
   - Relationships: `pivotalEventId` → `VerticalLine`, `stickyIds` → `ThemeArea`, `laneId` → `HorizontalLane`
   - Arrays: `stickies[]`, `verticals[]`, `lanes[]`, `themes[]`
   - Nested structures matter

4. **Collaborative Undo/Redo**
   - Facilitator needs to undo mistakes during live sessions
   - Checkpointing for workshop stages
   - Not just local-only undo

5. **Role-Based Permissions**
   - Facilitator: Full control, phase advancement, zone assignment
   - Participants: Can create/edit within current phase constraints
   - Read-only mode during demos

6. **Zone Management**
   - Facilitator creates zones for breakout work
   - Participants self-assign to zones
   - Consistent participant state across all clients

---

## Detailed Fit Analysis

### ✅ What Works

| Feature | Analysis |
|---------|----------|
| **Simple Implementation** | Much easier than CRDTs. Could ship in 1-2 weeks. |
| **Proven at Scale** | 100k+ GitHub stars, used by thousands. |
| **Lightweight** | Smaller bundle than Yjs (~30kb vs ~40kb). |
| **Good for Unstructured Data** | Position, text edits work fine with LWW. |
| **No Complex Backend** | Just relay server (Socket.IO), easy to self-host. |

### ❌ What Doesn't Work

#### 1. **Last-Write-Wins Breaks Semantic Relationships**

**Problem:** EventStormer has structured relationships (e.g., actor → event, stickies → theme).

**Example Conflict Scenario:**
```typescript
// Initial state
theme = { id: "t1", stickyIds: ["s1", "s2", "s3"] }

// User A: Remove s2 from theme
theme = { id: "t1", stickyIds: ["s1", "s3"], version: 2 }

// User B: (simultaneously) Remove s3 from theme
theme = { id: "t1", stickyIds: ["s1", "s2"], version: 2 }

// LWW resolution: One user's array wins entirely
// Result: Either ["s1", "s3"] OR ["s1", "s2"]
// Expected (CRDT): ["s1"] (both removals applied)
```

**With Yjs (CRDT):**
```typescript
// Yjs Y.Array intelligently merges concurrent edits
// Result: ["s1"] ✅
```

#### 2. **No Collaborative Undo**

**Problem:** Excalidraw explicitly states they don't have robust multiplayer undo. Their approach: **clear local undo stack when peer updates arrive**.

**EventStormer Use Case:**
- Facilitator demonstrates creating pivotal event + actor
- Participant accidentally creates wrong sticky
- Facilitator tries to undo
- ❌ Undo stack cleared because participant's edit came in

**Yjs Solution:**
```typescript
const undoManager = new Y.UndoManager(yboard, {
  trackedOrigins: new Set([ydoc.clientID]), // Only track local changes
});

undoManager.undo(); // Works even with peer updates
```

#### 3. **Facilitator Control Requires Server-Side Validation**

**Problem:** Excalidraw's "no server state" model breaks when you need **authoritative** decisions.

**EventStormer Scenario:**
```typescript
// Facilitator (Client A): "Phase is 'events'"
board.phase = "events";

// Malicious participant (Client B): "Actually, phase is 'glossary'"
board.phase = "glossary"; // version = 2

// LWW: Client B wins (higher version)
// All clients now think phase is "glossary" ❌
```

**Solutions:**
1. **Server-side validation** → Breaks "no state" model
2. **"Facilitator always wins" client logic** → Requires role awareness, can be bypassed
3. **Separate authoritative channel** → More complexity

**With Yjs + Custom Types:**
```typescript
// Yjs allows custom conflict resolvers
// Can implement "facilitator-only" fields that reject non-facilitator edits
```

#### 4. **Tombstoning Grows Unbounded**

**Problem:** Excalidraw uses `isDeleted: true` instead of removing elements.

**EventStormer Impact:**
- Long workshop (2-3 hours)
- 500 stickies created, 200 deleted, recreated, moved
- Element list: 700+ items (500 active + 200 tombstones)
- Every merge checks all 700 items

**Excalidraw's Mitigation:** Clean tombstones on persistent save (but EventStormer wants live collaboration).

**Yjs Solution:** Tombstones are compacted automatically.

#### 5. **Phase-Based Palette Enforcement is Client-Side Only**

**Problem:** Can't **guarantee** participants only create stickies available in current phase.

**Attack/Bug Scenario:**
```typescript
// Client A: Phase = "events", can only create event stickies
// Client B: Has old state, thinks phase = "glossary"
// Client B creates glossary sticky
// Client A receives it → now has glossary sticky in "events" phase

// How to handle?
// 1. Reject on client? → Sticky disappears only for some users (inconsistent)
// 2. Accept? → Invalid state (glossary in events phase)
// 3. Validate on server? → Breaks "no state" model
```

---

## Key Architectural Differences

| Aspect | Excalidraw (LWW) | Yjs (CRDT) | Winner for EventStormer |
|--------|------------------|------------|------------------------|
| **Conflict Resolution** | Last write wins (crude) | Intelligent merging | 🏆 Yjs |
| **Array Edits** | Entire array replaced | Per-element merge | 🏆 Yjs |
| **Undo/Redo** | ❌ Local only, clears on peer update | ✅ Collaborative | 🏆 Yjs |
| **Complexity** | ⭐⭐ Simple | ⭐⭐⭐⭐ Complex | 🏆 Excalidraw |
| **Bundle Size** | ~30kb | ~40kb | 🏆 Excalidraw |
| **Server Requirements** | Relay only | Relay + optional persistence | 🏆 Excalidraw |
| **Offline Support** | ⚠️ Limited | ✅ Excellent | 🏆 Yjs |
| **Semantic Validation** | ⚠️ Client-only (unenforceable) | ✅ Custom types possible | 🏆 Yjs |
| **Role-Based Control** | ❌ Requires workarounds | ✅ Custom conflict resolvers | 🏆 Yjs |
| **Learning Curve** | ⭐ Minimal | ⭐⭐⭐⭐ Steep | 🏆 Excalidraw |
| **Time to Ship** | 1-2 weeks | 3-5 weeks | 🏆 Excalidraw |

---

## EventStormer-Specific Concerns

### 1. **Theme Area Extraction**

**Operation:** Select stickies → create theme area with `stickyIds: [...]`

**Excalidraw Problem:**
```typescript
// Facilitator creates theme with 10 stickies
theme.stickyIds = ["s1", "s2", ..., "s10"]

// Participant (simultaneously) moves s5 to new lane
// Doesn't know about theme being created

// LWW: Theme either includes s5 or doesn't (random)
// Yjs: Theme includes s5, and s5 is in lane (both applied)
```

### 2. **Pivotal Event Snapping**

**Operation:** Pivotal event snaps to vertical line, updates `VerticalLine.pivotalEventId`

**Excalidraw Problem:**
```typescript
// User A: Snap event "e1" to line "v1"
verticalLine.pivotalEventId = "e1"

// User B: (simultaneously) Snap event "e2" to line "v1"
verticalLine.pivotalEventId = "e2"

// LWW: One event "wins" arbitrarily
// Expected: Error or queue (only one pivotal event per line)
```

### 3. **Breakout Zone Assignment**

**Operation:** Participant self-assigns to zone

**Excalidraw Problem:**
- Need consistent participant list across all clients
- LWW might cause "flapping" (participant appears in two zones briefly)
- Yjs Awareness protocol handles presence better

---

## Could EventStormer Use Excalidraw's Approach?

### Short Answer: **Yes, but with major compromises and workarounds.**

### What You'd Need to Add

#### 1. **Hybrid Architecture: Separate Authoritative State**

```typescript
// Use LWW for collaborative state (positions, text)
interface CollaborativeState {
  stickies: Sticky[];
  lines: VerticalLine[];
  lanes: HorizontalLane[];
}

// Use separate system for authoritative state (facilitator-only)
interface AuthoritativeState {
  phase: FacilitationPhase;  // Only facilitator can change
  zones: Zone[];              // Only facilitator creates
  participantAssignments: Map<UserId, ZoneId>;
}

// Sync collaborative state with LWW
// Sync authoritative state with... what? CRDTs? Server authority?
```

**Problem:** Now you have two state systems. Why not just use Yjs for both?

#### 2. **Server-Side Validation**

Add validation to Socket.IO server:
```typescript
// Server validates phase changes
socket.on('updatePhase', (newPhase, userId) => {
  if (!isFacilitator(userId)) {
    socket.emit('error', 'Only facilitator can change phase');
    return;
  }
  io.to(roomId).emit('phaseChanged', newPhase);
});
```

**Problem:** Now server has state (user roles). Breaks "no server state" model.

#### 3. **Accept Undo/Redo Limitations**

**Options:**
- **Local-only undo** (like Excalidraw) → Bad UX for facilitators
- **Checkpoints instead of undo** → Snapshot every 5 minutes, restore on request
  - Loses granularity
  - Hard to undo "just one sticky"
- **Custom collaborative undo** → Essentially reinventing Yjs.UndoManager

#### 4. **Client-Side Conflict Heuristics**

```typescript
// On merge, validate semantic rules
function mergeBoard(localBoard, remoteBoard) {
  const merged = lastWriteWins(localBoard, remoteBoard);

  // Validate pivotal events have actors
  merged.verticals.forEach(line => {
    if (line.pivotalEventId) {
      const event = merged.stickies.find(s => s.id === line.pivotalEventId);
      const hasActor = merged.stickies.some(s =>
        s.kind === 'actor' && s.x < event.x && /* ... */
      );
      if (!hasActor) {
        // What now?
        // - Remove pivotal event? (bad UX)
        // - Show warning? (inconsistent state)
        // - Reject merge? (clients diverge)
      }
    }
  });

  return merged;
}
```

**Problem:** Gets complex fast. Edge cases everywhere.

---

## Trade-offs Summary

### If You Choose Excalidraw's Approach

**Gains:**
- ✅ Ship in 1-2 weeks (vs 3-5 weeks with Yjs)
- ✅ Simpler codebase (easier to maintain)
- ✅ Smaller bundle size
- ✅ "Good enough" for basic use cases

**Losses:**
- ❌ No collaborative undo (dealbreaker for facilitated workshops?)
- ❌ Semantic validation is unenforceable
- ❌ Facilitator control requires workarounds (server validation, hybrid state)
- ❌ Array/relationship conflicts are crude (entire array replaced)
- ❌ Tombstone growth over long workshops

**Risk:**
- Technical debt accumulates
- Might need to migrate to Yjs later anyway (more work than doing it now)

### If You Stick with Yjs (Current Plan)

**Gains:**
- ✅ Collaborative undo/redo (critical for EventStormer)
- ✅ Intelligent conflict resolution (arrays, relationships)
- ✅ Can enforce facilitator control with custom types
- ✅ Excellent offline support
- ✅ Battle-tested for structured collaboration

**Losses:**
- ⏰ Takes 3-5 weeks to implement (vs 1-2 weeks)
- 📚 Steeper learning curve
- 🔧 More complex to debug

**Future-proof:**
- No migration needed later
- Supports M2+ features (checkpointing, theme extraction)

---

## Final Recommendation

### **Stick with Yjs (CRDT) as planned in M2 Technology Evaluation**

**Rationale:**

1. **Collaborative Undo is Non-Negotiable**
   - EventStormer is a **facilitated** tool
   - Facilitators need to demonstrate, experiment, and undo
   - Excalidraw's "clear undo stack on peer update" is unacceptable

2. **Facilitator Control Requires Authority**
   - Phase progression must be reliable
   - LWW can't guarantee this without server state
   - Yjs allows custom conflict resolvers for authoritative fields

3. **Semantic Relationships Matter**
   - Theme areas, pivotal events, lane assignments are structured
   - LWW treats them as flat replacements
   - CRDTs preserve relationships

4. **Long-Term Sustainability**
   - Implementing Excalidraw's approach now = technical debt
   - Likely migration to Yjs later (M3-M4 features need it)
   - Better to invest in Yjs upfront

5. **Timeline is Acceptable**
   - 3-5 weeks for Yjs integration (Slice 2 in PLAN.md)
   - You're not time-constrained (no external deadline)
   - Quality > speed for this project

---

## Alternative: Hybrid Approach (Not Recommended)

**If you absolutely need to ship fast:**

### Phase 1 (M1): Simple Broadcast (No Excalidraw, No Yjs)
```typescript
// Just broadcast state changes via Socket.IO
socket.emit('boardUpdate', board);

// No conflict resolution
// Last message wins (TCP ordering)
// Good enough for 1-2 users testing
```

### Phase 2 (M2): Migrate to Yjs
- Replace broadcast with Yjs
- Add collaborative undo
- Add facilitator controls

**Rationale:** Don't invest in Excalidraw's LWW if you'll migrate to Yjs anyway.

---

## Summary

**Excalidraw's approach works well for:**
- Unstructured drawing/whiteboard tools
- Simple object manipulation (move, resize, delete)
- Applications where conflicts are rare or acceptable
- Projects prioritizing simplicity over correctness

**EventStormer requires:**
- Structured domain relationships
- Authoritative facilitator control
- Collaborative undo/redo
- Semantic validation enforcement
- Long workshop sessions without state corruption

**Decision:** Use **Yjs + PartyKit** (or self-hosted y-websocket) as outlined in [M2-TECHNOLOGY-EVALUATION.md](M2-TECHNOLOGY-EVALUATION.md).

---

## References

- **Excalidraw Blog:** [Building Excalidraw's P2P Collaboration Feature](https://plus.excalidraw.com/blog/building-excalidraw-p2p-collaboration-feature)
- **Excalidraw GitHub:** https://github.com/excalidraw/excalidraw
- **Excalidraw Room Server:** https://github.com/excalidraw/excalidraw-room
- **Yjs Documentation:** https://docs.yjs.dev/
- **EventStormer M2 Tech Evaluation:** [M2-TECHNOLOGY-EVALUATION.md](M2-TECHNOLOGY-EVALUATION.md)
