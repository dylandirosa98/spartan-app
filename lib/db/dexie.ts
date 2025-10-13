import Dexie, { Table } from 'dexie';
import { Lead } from '@/types';

export class SpartanDatabase extends Dexie {
  leads!: Table<Lead, string>;

  constructor() {
    super('SpartanCRM');

    this.version(1).stores({
      leads: 'id, name, status, source, createdAt, syncStatus',
    });

    // Add hook to normalize name field for indexing
    this.leads.hook('creating', (_primKey, obj) => {
      if (obj.name) {
        obj.name = obj.name.toLowerCase();
      }
    });

    this.leads.hook('updating', (mods) => {
      const modifications = mods as Partial<Lead>;
      if (modifications.name !== undefined && typeof modifications.name === 'string') {
        modifications.name = modifications.name.toLowerCase();
      }
      return modifications;
    });
  }
}

export const db = new SpartanDatabase();
