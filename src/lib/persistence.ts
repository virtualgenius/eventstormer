import { db } from './db';
import type { Board } from '@/types/domain';

/**
 * Save board to IndexedDB
 */
export async function saveBoard(board: Board): Promise<void> {
  await db.boards.put({
    id: board.id,
    name: board.name,
    data: board,
    updatedAt: board.updatedAt,
  });
}

/**
 * Load board from IndexedDB by ID
 */
export async function loadBoard(boardId: string): Promise<Board | undefined> {
  const record = await db.boards.get(boardId);
  return record?.data;
}

/**
 * Get all boards (for board list UI)
 */
export async function getAllBoards(): Promise<Array<{ id: string; name: string; updatedAt: string }>> {
  const records = await db.boards.orderBy('updatedAt').reverse().toArray();
  return records.map(r => ({
    id: r.id,
    name: r.name,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Delete board from IndexedDB
 */
export async function deleteBoard(boardId: string): Promise<void> {
  await db.boards.delete(boardId);
}

/**
 * Export board as JSON string
 */
export function exportBoardJSON(board: Board): string {
  return JSON.stringify(board, null, 2);
}

/**
 * Import board from JSON string
 */
export function importBoardJSON(json: string): Board {
  const board = JSON.parse(json) as Board;

  // Validate required fields
  if (!board.id || !board.name || !board.stickies) {
    throw new Error('Invalid board JSON: missing required fields');
  }

  return board;
}

/**
 * Download board as JSON file
 */
export function downloadBoardJSON(board: Board, filename?: string): void {
  const json = exportBoardJSON(board);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${board.name.replace(/\s+/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
