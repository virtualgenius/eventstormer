import { Page, Locator } from '@playwright/test';

export type StickyKind = 'event' | 'hotspot' | 'actor' | 'system' | 'opportunity' | 'glossary';

export class CanvasPage {
  readonly page: Page;
  readonly palette: Locator;
  readonly canvas: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.palette = page.locator('[class*="facilitation"]').first();
    this.canvas = page.locator('canvas').first();
    this.exportButton = page.getByRole('button', { name: /export png/i });
  }

  /**
   * Navigate to the app
   */
  async goto() {
    await this.page.goto('/?debug=true');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500); // Give time for app to initialize
  }

  /**
   * Select a tool from the facilitation palette
   */
  async selectTool(kind: StickyKind) {
    // Find button in the facilitation palette with exact match (capitalize first letter)
    const capitalizedKind = kind.charAt(0).toUpperCase() + kind.slice(1);
    const button = this.page.getByRole('button', { name: capitalizedKind, exact: true });
    await button.click();
  }

  /**
   * Click on the canvas at specific coordinates
   */
  async clickCanvasAt(x: number, y: number) {
    const canvasBox = await this.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    await this.canvas.click({
      position: { x, y }
    });
  }

  /**
   * Create a sticky at specific canvas coordinates
   */
  async createStickyAt(kind: StickyKind, x: number, y: number) {
    await this.selectTool(kind);
    await this.clickCanvasAt(x, y);
  }

  /**
   * Get the number of stickies on the canvas
   * Note: Konva renders to canvas, so we check via store/DOM elements
   */
  async getStickyCount(): Promise<number> {
    // Since stickies are rendered on canvas, we'll count via textareas or other markers
    // For now, we'll use a different approach - checking the store via evaluation
    return await this.page.evaluate(() => {
      // Access the Zustand store - this is a hack for testing
      const store = (window as any).__testStore;
      if (store) {
        return store.getState().board.stickies.length;
      }
      return 0;
    });
  }

  /**
   * Drag from one point to another on canvas
   */
  async dragCanvasFrom(fromX: number, fromY: number, toX: number, toY: number) {
    const canvasBox = await this.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    await this.page.mouse.move(canvasBox.x + fromX, canvasBox.y + fromY);
    await this.page.mouse.down();
    await this.page.mouse.move(canvasBox.x + toX, canvasBox.y + toY, { steps: 10 });
    await this.page.mouse.up();
  }

  /**
   * Drag a sticky (assumes sticky is at fromX, fromY)
   */
  async dragStickyBy(fromX: number, fromY: number, dx: number, dy: number) {
    await this.dragCanvasFrom(fromX, fromY, fromX + dx, fromY + dy);
  }

  /**
   * Double-click on canvas to edit sticky
   */
  async doubleClickCanvasAt(x: number, y: number) {
    const canvasBox = await this.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    await this.canvas.dblclick({
      position: { x, y }
    });
  }

  /**
   * Type into active textarea (edit mode)
   */
  async typeIntoActiveSticky(text: string) {
    const textarea = this.page.locator('textarea').first();
    await textarea.fill(text);
  }

  /**
   * Press Escape to cancel edit
   */
  async pressEscape() {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Click away from sticky to blur/save
   */
  async clickAway() {
    await this.clickCanvasAt(50, 50);
  }

  /**
   * Zoom in by mouse wheel
   */
  async zoomIn(steps: number = 1) {
    const canvasBox = await this.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;

    await this.page.mouse.move(centerX, centerY);
    for (let i = 0; i < steps; i++) {
      await this.page.mouse.wheel(0, -100); // Negative deltaY = zoom in
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Zoom out by mouse wheel
   */
  async zoomOut(steps: number = 1) {
    const canvasBox = await this.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;

    await this.page.mouse.move(centerX, centerY);
    for (let i = 0; i < steps; i++) {
      await this.page.mouse.wheel(0, 100); // Positive deltaY = zoom out
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Pan canvas with right-click drag
   */
  async panCanvas(dx: number, dy: number) {
    const canvasBox = await this.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + canvasBox.width / 2;
    const startY = canvasBox.y + canvasBox.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down({ button: 'right' });
    await this.page.mouse.move(startX + dx, startY + dy, { steps: 10 });
    await this.page.mouse.up({ button: 'right' });
  }

  /**
   * Click export button
   */
  async clickExport() {
    await this.exportButton.click();
  }

  /**
   * Wait for download to start
   */
  async waitForDownload() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.clickExport();
    return await downloadPromise;
  }

  /**
   * Get online user count
   */
  async getOnlineCount(): Promise<number> {
    const text = await this.page.locator('text=/\\d+ online/').textContent();
    if (!text) return 0;
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
