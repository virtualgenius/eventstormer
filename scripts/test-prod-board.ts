/**
 * Test script to capture console logs when loading a production board
 * Uses the "Join an existing board" feature with the room ID
 */
import { chromium } from 'playwright'

const HOME_URL = 'https://eventstormer.virtualgenius.com/'
const ROOM_ID = 'qzlllj2y'  // The Dishwasher board

async function main() {
  console.log('Launching browser...')
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  // Capture ALL console logs
  page.on('console', (msg) => {
    const text = msg.text()
    console.log(`[CONSOLE ${msg.type()}] ${text}`)
  })

  console.log(`Navigating to home page: ${HOME_URL}`)
  await page.goto(HOME_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // Click "Have a room ID? Join an existing board..."
  console.log('Clicking join button...')
  await page.click('text=Have a room ID')
  await page.waitForTimeout(500)

  // Enter room ID
  console.log(`Entering room ID: ${ROOM_ID}`)
  await page.fill('input[placeholder="paste room ID here"]', ROOM_ID)

  // Click Join button
  console.log('Clicking Join...')
  await page.click('button:has-text("Join")')

  // Wait for navigation to complete
  await page.waitForURL('**/board/**', { timeout: 10000 })
  console.log('Navigation complete, URL:', page.url())

  // Handle name prompt (shown when no username in localStorage)
  const nameInput = page.locator('input[placeholder="Your name"]')
  if (await nameInput.isVisible({ timeout: 2000 })) {
    console.log('Name prompt detected, entering name...')
    await nameInput.fill('Test User')
    await page.click('button:has-text("Join Session")')
    await page.waitForTimeout(1000)
  }

  console.log('Waiting 20 seconds to observe behavior and capture all logs...')
  await page.waitForTimeout(20000)

  // Take screenshot
  await page.screenshot({ path: '/tmp/board-state.png' })
  console.log('Screenshot saved to /tmp/board-state.png')

  // Count shapes on page
  const shapes = await page.locator('[class*="tl-shape"]').count()
  console.log(`Shapes visible on canvas: ${shapes}`)

  await browser.close()
  console.log('Done')
}

main().catch(console.error)
