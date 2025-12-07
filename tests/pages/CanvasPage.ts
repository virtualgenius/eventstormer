import { Page, Locator, TestInfo } from '@playwright/test'

export type ToolType =
  | 'event-sticky'
  | 'hotspot-sticky'
  | 'person-sticky'
  | 'system-sticky'
  | 'opportunity-sticky'
  | 'glossary-sticky'
  | 'command-sticky'
  | 'policy-sticky'
  | 'aggregate-sticky'
  | 'readmodel-sticky'
  | 'vertical-line'
  | 'horizontal-lane'
  | 'theme-area'
  | 'label'

const USER_NAME_KEY = 'eventstormer-user-name'
const TEST_USER_NAME = 'Test User'
const FALLBACK_BOARD_ID = 'e2e-test-board'
const EDITOR_READY_TIMEOUT_MS = 15000
const ZOOM_STEP_DELAY_MS = 100

export class CanvasPage {
  readonly page: Page
  readonly canvas: Locator
  private testInfo?: TestInfo

  constructor(page: Page, testInfo?: TestInfo) {
    this.page = page
    this.canvas = page.locator('.tl-container').first()
    this.testInfo = testInfo
  }

  private getBoardId(): string {
    const testRunId = this.testInfo?.config?.metadata?.testRunId
    return testRunId ?? FALLBACK_BOARD_ID
  }

  async clearBrowserStorage(): Promise<void> {
    await this.page.context().clearCookies()
    await this.page.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => {
          if (db.name) indexedDB.deleteDatabase(db.name)
        })
      })
    })
  }

  async setupTestUser(): Promise<void> {
    await this.page.addInitScript(({ key, name }) => {
      localStorage.setItem(key, name)
    }, { key: USER_NAME_KEY, name: TEST_USER_NAME })
  }

  async goto(boardId?: string): Promise<void> {
    const id = boardId ?? this.getBoardId()
    await this.clearBrowserStorage()
    await this.setupTestUser()
    await this.page.goto(`/board/${id}`)
    await this.page.waitForLoadState('networkidle')
    await this.waitForEditorReady()
  }

  async waitForEditorReady(): Promise<void> {
    await this.page.waitForFunction(
      () => (window as unknown as { __tldrawEditor: unknown }).__tldrawEditor !== undefined,
      { timeout: EDITOR_READY_TIMEOUT_MS }
    )
  }

  async selectTool(toolType: ToolType): Promise<void> {
    await this.page.click(`[data-tool="${toolType}"]`)
  }

  async createShapeAt(toolType: ToolType, x: number, y: number): Promise<void> {
    await this.selectTool(toolType)
    await this.clickCanvasAt(x, y)
  }

  async clickCanvasAt(x: number, y: number): Promise<void> {
    await this.canvas.click({ position: { x, y } })
  }

  async doubleClickCanvasAt(x: number, y: number): Promise<void> {
    await this.canvas.dblclick({ position: { x, y } })
  }

  async dragCanvasFrom(fromX: number, fromY: number, toX: number, toY: number): Promise<void> {
    const canvasBox = await this.canvas.boundingBox()
    if (!canvasBox) throw new Error('Canvas not found')

    await this.page.mouse.move(canvasBox.x + fromX, canvasBox.y + fromY)
    await this.page.mouse.down()
    await this.page.mouse.move(canvasBox.x + toX, canvasBox.y + toY, { steps: 10 })
    await this.page.mouse.up()
  }

  async typeText(text: string): Promise<void> {
    await this.page.keyboard.type(text)
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key)
  }

  async pressEscape(): Promise<void> {
    await this.page.keyboard.press('Escape')
  }

  async pressTab(): Promise<void> {
    await this.page.keyboard.press('Tab')
  }

  async getConnectionStatus(): Promise<string> {
    const statusText = await this.page.locator('text=/Connected|Offline|Connecting|Syncing|Loading/').first().textContent()
    return statusText || 'unknown'
  }

  async zoomIn(steps = 1): Promise<void> {
    const canvasBox = await this.canvas.boundingBox()
    if (!canvasBox) throw new Error('Canvas not found')

    const centerX = canvasBox.x + canvasBox.width / 2
    const centerY = canvasBox.y + canvasBox.height / 2

    await this.page.mouse.move(centerX, centerY)
    for (let i = 0; i < steps; i++) {
      await this.page.mouse.wheel(0, -100)
      await this.page.waitForTimeout(ZOOM_STEP_DELAY_MS)
    }
  }

  async zoomOut(steps = 1): Promise<void> {
    const canvasBox = await this.canvas.boundingBox()
    if (!canvasBox) throw new Error('Canvas not found')

    const centerX = canvasBox.x + canvasBox.width / 2
    const centerY = canvasBox.y + canvasBox.height / 2

    await this.page.mouse.move(centerX, centerY)
    for (let i = 0; i < steps; i++) {
      await this.page.mouse.wheel(0, 100)
      await this.page.waitForTimeout(ZOOM_STEP_DELAY_MS)
    }
  }

  async panCanvas(dx: number, dy: number): Promise<void> {
    const canvasBox = await this.canvas.boundingBox()
    if (!canvasBox) throw new Error('Canvas not found')

    const startX = canvasBox.x + canvasBox.width / 2
    const startY = canvasBox.y + canvasBox.height / 2

    // tldraw uses space+drag for panning, not right-click
    await this.page.keyboard.down('Space')
    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(startX + dx, startY + dy, { steps: 10 })
    await this.page.mouse.up()
    await this.page.keyboard.up('Space')
  }

  async selectWorkshopMode(mode: 'big-picture' | 'process-modeling' | 'software-design'): Promise<void> {
    const modeLabels: Record<string, string> = {
      'big-picture': 'Big Picture',
      'process-modeling': 'Process',
      'software-design': 'Software'
    }
    await this.page.getByRole('button', { name: modeLabels[mode] }).click()
  }

  async selectPhase(phase: string): Promise<void> {
    await this.page.locator('select').selectOption(phase)
  }

  async clickExport(): Promise<void> {
    await this.page.getByRole('button', { name: /Export/i }).click()
  }

  async clickImport(): Promise<void> {
    await this.page.getByRole('button', { name: /Import/i }).click()
  }
}
