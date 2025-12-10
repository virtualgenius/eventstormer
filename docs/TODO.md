# TODO

## In Progress

(nothing currently in progress)

## Backlog

### Infrastructure / Cost Control

- [ ] Add idle timeout to disconnect inactive WebSocket clients (prevents Durable Object duration accumulation)
- [ ] Add exponential backoff for WebSocket reconnection attempts (prevents reconnection storms)
- [ ] Set up Cloudflare billing alerts at $10, $25, $50 thresholds
- [ ] Add connection health monitoring/logging
- [ ] Use tldraw sync instead of my own (docs/TLDRAW-SYNC-ANALYSIS.md)

### Features

- [ ] Different background colors for themes (not sure how to define this - settings? choose at placement?)
- [ ] Bounded context shapes. Do we use themes for this, but enable user to mark as a bounded context, or some other method?
- [ ] Multiple room support
- [ ] Export/import functionality
- [ ] Facilitator dashboard

### UX/Polish

- [ ] Accessibility checks
- [ ] Responsive design
- [ ] Mobile support

### Docs

- [ ] Update README with deployment instructions
- [ ] Add contributing guide

## Done

- [x] Real-time collaboration via Cloudflare Workers + Durable Objects
- [x] Phase-based facilitation system
- [x] Canvas rendering with react-konva (migrated from tldraw)
- [x] User presence tracking
- [x] Local persistence (IndexedDB)
- [x] Undo/redo via Yjs UndoManager
- [x] Software Design mode with aggregates, commands, policies, read models
- [x] Sample templates (Big Picture, Software Design Example)
