# Analysis: tldraw Sync vs Current Yjs + Durable Objects

## Context
- EventStormer is **all-in on tldraw** (migrated from Konva last week for performance)
- Commercial license ($6k/year) will be needed regardless after 100-day trial
- App is **online-only** - offline support not a priority
- Current Yjs implementation works but adds complexity

## The Real Question

Given you're committed to tldraw anyway, **should you simplify by using their sync?**

## Current Complexity Cost

Your Yjs + Cloudflare DO stack involves:

| Component | Lines | Complexity |
|-----------|-------|------------|
| [workers/server.ts](workers/server.ts) | 86 | DO lifecycle, SQLite persistence |
| [src/tldraw/useYjsStore.ts](src/tldraw/useYjsStore.ts) | 273 | Bidirectional sync, careful source tracking |
| [src/tldraw/useYjsPresence.ts](src/tldraw/useYjsPresence.ts) | 153 | Awareness protocol |
| wrangler.toml + deploy config | - | Cloudflare-specific |
| **Total custom sync code** | ~512 | Medium-high |

**Ongoing maintenance burden:**
- Yjs ↔ tldraw store sync (potential for subtle bugs)
- Cloudflare DO management (hibernation, storage, debugging)
- Two deploy targets (Vite frontend + Wrangler worker)
- Presence protocol separate from document sync

## What tldraw Sync Would Change

### Simplification
- **Delete ~512 lines** of custom sync code
- **Single mental model** - tldraw handles sync natively
- **First-party support** - bugs are their problem, not yours
- **Proven at scale** - 400k users on tldraw.com

### What Stays the Same
- **Still need Cloudflare DOs** - tldraw sync uses them too
- **Still self-hosted** - no managed service exists
- **Same basic architecture** - WebSocket rooms with server authority

### What Changes
- Architecture: CRDT → centralized server (fine for online-only)
- Your code: custom hooks → tldraw's `useSync()` hook
- Presence: custom → built-in (cursors, chat bubbles, collaborator list)

## Recommendation

**Medium-term: Migrate to tldraw sync.** Rationale:

1. **License cost is sunk** - you need commercial tldraw anyway
2. **Offline doesn't matter** - your app is online-only
3. **Less code to maintain** - ~512 lines deleted
4. **Better integration** - sync designed for tldraw's data model
5. **Future-proof** - tldraw improvements come free

### When to Migrate

Not now (POC stage). But plan for it when:
- Trial ends and you're paying for license anyway
- Current sync causes pain (bugs, edge cases)
- You want tldraw's presence UI features
- You're stabilizing for production

### Migration Scope (When Ready)

```
DELETE:
- src/tldraw/useYjsStore.ts
- src/tldraw/useYjsPresence.ts
- src/tldraw/__tests__/useYjsStore.test.ts
- workers/server.ts (replace with tldraw's template)

MODIFY:
- src/tldraw/TldrawBoard.tsx (use useSync() instead)
- wrangler.toml (use tldraw's DO pattern)
- package.json (swap yjs deps for @tldraw/sync)

EFFORT: ~3-5 days
```

## Summary

| Factor | Current (Yjs) | tldraw sync |
|--------|--------------|-------------|
| Works now? | ✅ Yes | Would need migration |
| Code to maintain | ~512 lines | ~0 (first-party) |
| Infrastructure | Cloudflare DO | Cloudflare DO (same) |
| License cost | Same | Same |
| Offline support | Good | Limited (doesn't matter) |
| Long-term maintenance | You | tldraw team |

**Bottom line:** Your current stack works fine for POC. When you move toward production and are paying for tldraw anyway, switching to their sync removes complexity you don't need to own.
