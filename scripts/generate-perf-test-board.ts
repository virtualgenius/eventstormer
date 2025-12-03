/**
 * Performance Test: Generate a board with 1000 stickies
 *
 * Usage: npx tsx scripts/generate-perf-test-board.ts
 *
 * This generates a JSON file that can be imported into EventStormer
 * to test canvas performance at scale.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Sticky types matching EventStormer domain
type StickyKind = 'event' | 'hotspot' | 'person' | 'system' | 'opportunity' | 'glossary';

interface Sticky {
  id: string;
  kind: StickyKind;
  text: string;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
}

interface Board {
  id: string;
  name: string;
  stickies: Sticky[];
  verticals: any[];
  lanes: any[];
  labels: any[];
  themes: any[];
  phase: string;
  createdAt: string;
  updatedAt: string;
}

// Simple ID generator (matches nanoid output format)
function generateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 21; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Sample event texts for realistic content
const eventTexts = [
  'User submitted form',
  'Payment processed',
  'Order confirmed',
  'Email sent',
  'Account created',
  'Password reset requested',
  'Item added to cart',
  'Checkout started',
  'Shipment dispatched',
  'Delivery completed',
  'Review submitted',
  'Refund requested',
  'Subscription renewed',
  'Profile updated',
  'Notification sent',
  'Report generated',
  'Data exported',
  'File uploaded',
  'Search performed',
  'Session started',
];

const hotspotTexts = [
  'Slow response time',
  'User confusion here',
  'Missing validation',
  'Error handling needed',
  'Security concern',
  'Performance bottleneck',
  'UX improvement needed',
  'Technical debt',
  'Integration issue',
  'Data inconsistency',
];

const personTexts = [
  'Customer',
  'Admin',
  'Support Agent',
  'Developer',
  'Manager',
  'Analyst',
  'Guest User',
  'Premium User',
];

const systemTexts = [
  'Payment Gateway',
  'Email Service',
  'Database',
  'Cache',
  'Search Engine',
  'Analytics',
  'CRM',
  'ERP',
];

function getRandomText(kind: StickyKind): string {
  switch (kind) {
    case 'event':
      return eventTexts[Math.floor(Math.random() * eventTexts.length)];
    case 'hotspot':
      return hotspotTexts[Math.floor(Math.random() * hotspotTexts.length)];
    case 'person':
      return personTexts[Math.floor(Math.random() * personTexts.length)];
    case 'system':
      return systemTexts[Math.floor(Math.random() * systemTexts.length)];
    case 'opportunity':
      return 'Opportunity ' + Math.floor(Math.random() * 100);
    case 'glossary':
      return 'Term ' + Math.floor(Math.random() * 100);
  }
}

function generateBoard(stickyCount: number): Board {
  const now = new Date().toISOString();
  const stickies: Sticky[] = [];

  // Layout configuration
  const STICKY_WIDTH = 120;
  const STICKY_HEIGHT = 120;
  const GAP_X = 20;
  const GAP_Y = 40;
  const STICKIES_PER_ROW = 50;
  const START_X = 100;
  const START_Y = 100;

  // Distribution of sticky types (weighted toward events)
  const kindWeights: { kind: StickyKind; weight: number }[] = [
    { kind: 'event', weight: 60 },      // 60% events
    { kind: 'hotspot', weight: 15 },    // 15% hotspots
    { kind: 'person', weight: 8 },      // 8% people
    { kind: 'system', weight: 8 },      // 8% systems
    { kind: 'opportunity', weight: 5 }, // 5% opportunities
    { kind: 'glossary', weight: 4 },    // 4% glossary
  ];

  function getRandomKind(): StickyKind {
    const total = kindWeights.reduce((sum, k) => sum + k.weight, 0);
    let random = Math.random() * total;
    for (const { kind, weight } of kindWeights) {
      random -= weight;
      if (random <= 0) return kind;
    }
    return 'event';
  }

  for (let i = 0; i < stickyCount; i++) {
    const row = Math.floor(i / STICKIES_PER_ROW);
    const col = i % STICKIES_PER_ROW;

    const kind = getRandomKind();
    const height = kind === 'person' ? STICKY_HEIGHT / 2 : STICKY_HEIGHT;

    // Add some randomness to positions for realistic look
    const jitterX = (Math.random() - 0.5) * 30;
    const jitterY = (Math.random() - 0.5) * 30;

    stickies.push({
      id: generateId(),
      kind,
      text: getRandomText(kind),
      x: START_X + col * (STICKY_WIDTH + GAP_X) + jitterX,
      y: START_Y + row * (STICKY_HEIGHT + GAP_Y) + jitterY,
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    id: 'perf-test-' + generateId(),
    name: `Performance Test (${stickyCount} stickies)`,
    stickies,
    verticals: [],
    lanes: [],
    labels: [],
    themes: [],
    phase: 'chaotic-exploration',
    createdAt: now,
    updatedAt: now,
  };
}

// Generate boards of different sizes
const sizes = [100, 500, 1000, 2000, 5000];

for (const size of sizes) {
  const board = generateBoard(size);
  const filename = `perf-test-${size}-stickies.json`;
  const filepath = join(process.cwd(), 'test-data', filename);

  // Ensure test-data directory exists
  const testDataDir = join(process.cwd(), 'test-data');
  if (!existsSync(testDataDir)) {
    mkdirSync(testDataDir, { recursive: true });
  }

  writeFileSync(filepath, JSON.stringify(board, null, 2));
  console.log(`Generated: ${filename} (${board.stickies.length} stickies)`);
}

console.log('\nTo test performance:');
console.log('1. Start the app: npm run dev');
console.log('2. Import a test file via the Import feature');
console.log('3. Open browser DevTools > Performance tab');
console.log('4. Record while panning/zooming');
console.log('5. Look for frame times > 16ms (60fps target)');
