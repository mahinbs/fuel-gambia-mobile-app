import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const DATABASE_NAME = 'FuelGambia.db';
const DATABASE_VERSION = '1.0';
const DATABASE_DISPLAY_NAME = 'Fuel Gambia Database';
const DATABASE_SIZE = 200000;

interface QueueItem {
  id: number;
  type: 'QR_SCAN' | 'INVENTORY_SYNC' | 'TRANSACTION';
  data: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  retryCount: number;
}

class OfflineQueue {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: DATABASE_NAME,
        location: 'default',
      });

      await this.createTables();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS offline_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        createdAt TEXT NOT NULL,
        retryCount INTEGER NOT NULL DEFAULT 0
      );
    `;

    await this.db.executeSql(createTableQuery);
  }

  async addToQueue(
    type: QueueItem['type'],
    data: any
  ): Promise<number | null> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) return null;

    try {
      const insertQuery = `
        INSERT INTO offline_queue (type, data, status, createdAt, retryCount)
        VALUES (?, ?, 'PENDING', ?, 0);
      `;

      const result = await this.db.executeSql(insertQuery, [
        type,
        JSON.stringify(data),
        new Date().toISOString(),
      ]);

      return result[0].insertId;
    } catch (error) {
      console.error('Failed to add to queue:', error);
      return null;
    }
  }

  async getPendingItems(): Promise<QueueItem[]> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) return [];

    try {
      const selectQuery = `
        SELECT * FROM offline_queue
        WHERE status = 'PENDING' OR status = 'FAILED'
        ORDER BY createdAt ASC
        LIMIT 10;
      `;

      const result = await this.db.executeSql(selectQuery);
      const rows = result[0].rows;

      const items: QueueItem[] = [];
      for (let i = 0; i < rows.length; i++) {
        items.push({
          id: rows.item(i).id,
          type: rows.item(i).type,
          data: JSON.parse(rows.item(i).data),
          status: rows.item(i).status,
          createdAt: rows.item(i).createdAt,
          retryCount: rows.item(i).retryCount,
        });
      }

      return items;
    } catch (error) {
      console.error('Failed to get pending items:', error);
      return [];
    }
  }

  async updateStatus(
    id: number,
    status: QueueItem['status']
  ): Promise<boolean> {
    if (!this.db) return false;

    try {
      const updateQuery = `
        UPDATE offline_queue
        SET status = ?
        WHERE id = ?;
      `;

      await this.db.executeSql(updateQuery, [status, id]);
      return true;
    } catch (error) {
      console.error('Failed to update status:', error);
      return false;
    }
  }

  async incrementRetryCount(id: number): Promise<boolean> {
    if (!this.db) return false;

    try {
      const updateQuery = `
        UPDATE offline_queue
        SET retryCount = retryCount + 1
        WHERE id = ?;
      `;

      await this.db.executeSql(updateQuery, [id]);
      return true;
    } catch (error) {
      console.error('Failed to increment retry count:', error);
      return false;
    }
  }

  async removeItem(id: number): Promise<boolean> {
    if (!this.db) return false;

    try {
      const deleteQuery = `DELETE FROM offline_queue WHERE id = ?;`;
      await this.db.executeSql(deleteQuery, [id]);
      return true;
    } catch (error) {
      console.error('Failed to remove item:', error);
      return false;
    }
  }

  async clearCompleted(): Promise<boolean> {
    if (!this.db) return false;

    try {
      const deleteQuery = `DELETE FROM offline_queue WHERE status = 'COMPLETED';`;
      await this.db.executeSql(deleteQuery);
      return true;
    } catch (error) {
      console.error('Failed to clear completed items:', error);
      return false;
    }
  }
}

export const offlineQueue = new OfflineQueue();
