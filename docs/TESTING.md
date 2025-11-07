# Testing Guide

## Overview

EventStormer uses **Playwright** for end-to-end testing of the Konva canvas implementation. Tests verify critical interactions including sticky creation, editing, dragging, canvas navigation, and real-time collaboration.

## Test Structure

```
tests/
├── e2e/                          # End-to-end test suites
│   ├── 01-sticky-creation.spec.ts
│   ├── 02-sticky-drag.spec.ts
│   ├── 03-sticky-edit.spec.ts
│   ├── 04-sticky-selection.spec.ts
│   ├── 05-canvas-zoom.spec.ts
│   ├── 06-canvas-pan.spec.ts
│   ├── 07-export.spec.ts
│   └── 08-collaboration.spec.ts
├── pages/                        # Page Object Models
│   └── CanvasPage.ts
└── utils/                        # Test utilities
    └── debug.ts                  # Debug logging helpers
```

## Running Tests

### Run all tests (headless)
```bash
npm run test:e2e
```

### Run with UI mode (recommended for debugging)
```bash
npm run test:e2e:ui
```

### Run specific test file
```bash
npx playwright test tests/e2e/01-sticky-creation.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

## Test Coverage

### Suite 1: Sticky Creation (`01-sticky-creation.spec.ts`)
- ✅ Select tool from palette
- ✅ Create sticky by clicking canvas
- ✅ Create all sticky types (event, hotspot, actor, system, opportunity, glossary)
- ✅ Tool deactivation after creation
- ✅ Empty text initialization

### Suite 2: Sticky Drag & Drop (`02-sticky-drag.spec.ts`)
- ✅ Drag sticky to new position
- ✅ Position change logged in store
- ✅ Multiple drags on same sticky

### Suite 3: Sticky Text Editing (`03-sticky-edit.spec.ts`)
- ✅ Enter edit mode on double-click
- ✅ Save text on blur
- ✅ Cancel edit on Escape key
- ✅ Update existing text

### Suite 4: Sticky Selection (`04-sticky-selection.spec.ts`)
- ✅ Select sticky on click
- ✅ Deselect when clicking canvas
- ✅ Switch selection between stickies

### Suite 5: Canvas Zoom (`05-canvas-zoom.spec.ts`)
- ✅ Zoom in with mouse wheel
- ✅ Zoom out with mouse wheel
- ✅ Scale changes logged
- ✅ Pointer position logged
- ✅ Zoom limits enforced (0.25x - 4x)

### Suite 6: Canvas Pan (`06-canvas-pan.spec.ts`)
- ✅ Pan canvas with right-click drag
- ✅ Position changes logged
- ✅ Multiple pan operations

### Suite 7: PNG Export (`07-export.spec.ts`)
- ✅ Export button visible
- ✅ Download initiated on click
- ✅ Valid PNG file exported
- ✅ Export works with empty canvas

### Suite 8: Real-time Collaboration (`08-collaboration.spec.ts`)
- ✅ User count increases with multiple contexts
- ✅ Sticky creation syncs across contexts
- ✅ User count decreases when context closes

## Debug Mode

All tests run with **debug mode enabled** to capture console logs for verification.

Debug is enabled via:
```ts
await page.addInitScript(() => {
  localStorage.setItem('debug', 'true');
});
```

### Console Log Assertions

Tests verify debug logs appear using `ConsoleLogCapture`:

```ts
const consoleCapture = new ConsoleLogCapture(page);

// Wait for specific log
const log = await consoleCapture.waitForLog(/\[KonvaCanvas\] Creating sticky/);
expect(log).toBeTruthy();

// Get all matching logs
const logs = consoleCapture.getLogsMatching(/\[Store\] Updating/);
expect(logs.length).toBeGreaterThan(0);

// Check if log exists
const hasLog = consoleCapture.hasLog(/Drag ended/);
expect(hasLog).toBe(true);
```

## Page Object Model

The `CanvasPage` class provides high-level methods for interacting with the canvas:

```ts
const canvasPage = new CanvasPage(page);

// Navigation
await canvasPage.goto();

// Sticky operations
await canvasPage.selectTool('event');
await canvasPage.createStickyAt('event', 300, 200);
await canvasPage.dragStickyBy(360, 260, 100, 50);
await canvasPage.doubleClickCanvasAt(360, 260);
await canvasPage.typeIntoActiveSticky('User logged in');

// Canvas navigation
await canvasPage.zoomIn(3);
await canvasPage.zoomOut(2);
await canvasPage.panCanvas(100, 50);

// Export
await canvasPage.clickExport();
const download = await canvasPage.waitForDownload();

// Collaboration
const count = await canvasPage.getOnlineCount();
```

## CI/CD Integration

Tests are configured to run in CI environments:

- **Retries**: 2 retries on CI, 0 locally
- **Workers**: 1 worker on CI, unlimited locally
- **Reporter**: HTML report generated in `playwright-report/`

### GitHub Actions Example

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run tests
  run: npm run test:e2e

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running (`npm run dev`)
- Verify PartyKit server is accessible

### Canvas interactions failing
- Konva renders to canvas, so element selectors won't work for stickies
- Use coordinate-based clicks: `await canvasPage.clickCanvasAt(x, y)`
- Ensure coordinates account for sticky centering (sticky center = position + 60px)

### Debug logs not appearing
- Verify `enableDebugMode(page)` is called in `beforeEach`
- Check browser console in headed mode
- Use `consoleCapture.getAllLogs()` to inspect all logs

### Collaboration tests flaky
- Increase wait times between context operations
- Ensure sufficient timeout for network sync (1000-1500ms)
- Check PartyKit server is running and accessible

## Best Practices

1. **Use page objects**: Interact via `CanvasPage` methods, not raw Playwright APIs
2. **Enable debug mode**: Always call `enableDebugMode(page)` for log verification
3. **Wait for state changes**: Add `page.waitForTimeout()` after state-changing operations
4. **Clear console logs**: Call `consoleCapture.clear()` before assertions to avoid false positives
5. **Test in isolation**: Each test should be independent and not rely on previous test state

## Future Improvements

- Add visual regression testing with Playwright screenshots
- Implement accessibility tests (keyboard navigation, ARIA labels)
- Add performance benchmarks (rendering speed, interaction latency)
- Test mobile/touch interactions
- Add PDF export tests when implemented
