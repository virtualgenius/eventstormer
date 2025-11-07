# Slice 2: Real-time Collaboration - Testing Guide

## Overview
Slice 2 implements real-time collaboration using Yjs CRDTs and PartyKit for WebSocket communication.

## Features Implemented
- ✅ Real-time board state sync across clients
- ✅ User presence (online indicator)
- ✅ Live cursor tracking with user avatars
- ✅ Conflict-free concurrent editing (Yjs CRDT)
- ✅ Automatic reconnection on network issues

## How to Test

### 1. Start the Development Servers
```bash
npm run dev
```

This starts both:
- Vite dev server on [http://localhost:5174](http://localhost:5174)
- PartyKit WebSocket server on [http://localhost:1999](http://localhost:1999)

### 2. Open Multiple Browser Windows

Open the app in multiple browser tabs/windows:
- Window 1: [http://localhost:5174](http://localhost:5174)
- Window 2: [http://localhost:5174](http://localhost:5174) (new tab/window)
- Window 3: [http://localhost:5174](http://localhost:5174) (incognito mode)

### 3. Test Scenarios

#### A. User Presence
- Open multiple windows
- **Expected**: Header shows "X online" count increments with each new window
- **Expected**: Green indicator shows connected status

#### B. Live Cursor Tracking
- Move your cursor in one window
- **Expected**: Other windows show your cursor with your name and color
- **Expected**: Each user has a different color

#### C. Real-time Sticky Creation
- Click an "Event" button in the palette (Window 1)
- Click on the canvas to create a sticky (Window 1)
- **Expected**: Sticky appears instantly in all other windows
- **Expected**: No conflicts or duplicates

#### D. Real-time Sticky Editing
- Click a sticky to edit text (Window 1)
- Type some text (Window 1)
- **Expected**: Text appears in real-time in all other windows
- **Expected**: Multiple users can edit different stickies simultaneously

#### E. Real-time Phase Changes
- Change the facilitation phase using the phase buttons (Window 1)
- **Expected**: Palette updates in all windows immediately
- **Expected**: Available sticky types reflect the new phase in all windows

#### F. Concurrent Editing (CRDT Conflict Resolution)
- Create a sticky in Window 1
- Simultaneously create another sticky in Window 2
- **Expected**: Both stickies appear in all windows
- **Expected**: No conflicts, no overwrites

#### G. Network Reconnection
- Open DevTools → Network tab
- Throttle network to "Offline"
- Create some stickies (they'll be queued locally)
- Restore network to "Online"
- **Expected**: Connection indicator turns green
- **Expected**: All queued changes sync to other clients

## Technical Implementation

### Architecture
- **State Management**: Zustand → Yjs migration (Y.Doc replaces Zustand store)
- **Collaboration**: PartyKit WebSocket server
- **CRDT**: Yjs (Y.Map for board, Y.Array for stickies/lines/lanes/themes)
- **Awareness**: Yjs Awareness protocol for cursors and presence

### Key Files
- [src/store/useCollabStore.ts](../src/store/useCollabStore.ts) - Collaborative Zustand store with Yjs
- [party/server.ts](../party/server.ts) - PartyKit WebSocket server
- [src/components/UserCursor.tsx](../src/components/UserCursor.tsx) - Remote cursor display
- [src/App.tsx](../src/App.tsx) - Connection management and presence UI
- [src/components/Canvas.tsx](../src/components/Canvas.tsx) - Cursor tracking

### Success Criteria (from PLAN.md)
- ✅ Two users can see each other's changes instantly
- ✅ No conflicts when editing simultaneously
- ✅ Cursors show where other users are working
- ✅ Works across browser tabs/windows

## Next Steps (Slice 3)
- Migrate from DOM to react-konva (canvas rendering)
- Implement viewport culling for performance
- Add native export to PNG/PDF
