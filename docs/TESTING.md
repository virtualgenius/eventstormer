# Testing Guide

## Overview

EventStormer uses a layered testing approach:
- **Unit tests (Vitest)**: Pure functions, business logic, format parsing
- **E2E tests (Playwright)**: User interactions that require browser/tldraw rendering

## Unit Tests

Fast tests (~700ms for 200 tests) covering:
- `src/lib/__tests__/` - Workshop config, flow sequences, shape layout calculations
- `src/tldraw/__tests__/` - Board format parsing, keyboard handlers, Yjs sync, editor helpers

Run with: `npm run test`

## E2E Test Scenarios

These scenarios require browser-based testing because they involve tldraw canvas rendering, real user interactions, or multi-client collaboration.

### Shape Creation & Editing
- Click palette tool → shape appears on canvas
- Double-click shape → enters edit mode with cursor
- Type text → text visible on shape
- Press Escape → exits edit mode, text saved
- Press Tab while editing → creates next sticky, moves to edit mode

### Shape Selection & Manipulation
- Click shape → shows selection handles
- Drag shape → moves to new position
- Select + press D → duplicates shape
- Multi-select with Shift+click → selects multiple shapes

### Canvas Navigation
- Mouse wheel → zooms in/out
- Pan with hand tool or middle-click drag
- Zoom limits enforced (not too far in/out)

### Workshop Mode & Phase Filtering
- Switch workshop mode → palette updates
- Switch phase → available tools change
- Only expected tools visible per phase

### Import/Export
- Export button → downloads JSON file
- Import valid JSON → shapes appear on canvas
- Import EventStormer format → converts and displays correctly

### Real-time Collaboration
- Two browser contexts join same room
- Shape created in one → appears in other
- Shape moved in one → position updates in other
- User presence indicators visible

### Keyboard Shortcuts (Flow Mode)
- Arrow keys in flow mode → creates connected shapes
- Up/Down arrows → cycles through alternatives
- Shift+Arrow → creates branch

## Running Tests

```bash
npm run test           # Unit tests
npm run test:e2e       # E2E tests (headless)
npm run test:e2e:ui    # E2E with interactive UI
npm run test:e2e:headed # E2E with visible browser
```
