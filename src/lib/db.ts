import Dexie, { type EntityTable } from 'dexie';
import type { Board } from '@/types/domain';

interface BoardRecord {
  id: string;
  name: string;
  data: Board;
  updatedAt: string;
}

const db = new Dexie('EventStormerDB') as Dexie & {
  boards: EntityTable<BoardRecord, 'id'>;
};

// Schema: version 1
db.version(1).stores({
  boards: 'id, updatedAt',
});

export { db };
export type { BoardRecord };
