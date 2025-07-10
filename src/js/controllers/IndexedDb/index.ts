type TTLMeta = {
  storeName: string;
  createdAt: number;
  ttlMs: number;
};

export class IndexedTTLStoreManager {
  private static DB_NAME = 'iScrollDB';

  private static TTL_STORE = '__ttl__';

  // eslint-disable-next-line class-methods-use-this
  private async openDatabase(storeName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IndexedTTLStoreManager.DB_NAME);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(IndexedTTLStoreManager.TTL_STORE)) {
          db.createObjectStore(IndexedTTLStoreManager.TTL_STORE, {
            keyPath: 'storeName',
          });
        }

        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' }); // ✅ теперь используется `id` как ключ
        }
      };

      request.onsuccess = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(storeName)) {
          db.close();
          const upgradeRequest = indexedDB.open(
            IndexedTTLStoreManager.DB_NAME,
            db.version + 1
          );

          upgradeRequest.onupgradeneeded = () => {
            const upgradeDb = upgradeRequest.result;
            upgradeDb.createObjectStore(storeName, { keyPath: 'id' });
          };

          upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
          upgradeRequest.onerror = () => reject(upgradeRequest.error);
        } else {
          resolve(db);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async setTTL(storeName: string, ttlMs: number): Promise<void> {
    const db = await this.openDatabase(IndexedTTLStoreManager.TTL_STORE);
    const tx = db.transaction(IndexedTTLStoreManager.TTL_STORE, 'readwrite');
    const store = tx.objectStore(IndexedTTLStoreManager.TTL_STORE);

    const meta: TTLMeta = {
      storeName,
      createdAt: Date.now(),
      ttlMs,
    };

    store.put(meta);

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    });
  }

  private async isExpired(storeName: string): Promise<boolean> {
    const db = await this.openDatabase(IndexedTTLStoreManager.TTL_STORE);
    const tx = db.transaction(IndexedTTLStoreManager.TTL_STORE, 'readonly');
    const store = tx.objectStore(IndexedTTLStoreManager.TTL_STORE);
    const request = store.get(storeName);

    return new Promise((resolve) => {
      // eslint-disable-next-line consistent-return
      request.onsuccess = () => {
        db.close();
        const meta = request.result as TTLMeta | undefined;
        if (!meta) return resolve(false);
        resolve(Date.now() > meta.createdAt + meta.ttlMs);
      };
      request.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  }

  public async clearIfExpired(storeName: string): Promise<void> {
    const expired = await this.isExpired(storeName);
    if (!expired) return;

    const db = await this.openDatabase(storeName);
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();

    // eslint-disable-next-line consistent-return
    return new Promise((resolve) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    });
  }

  public async writeMany(
    storeName: string,
    entries: Record<string, unknown>[]
  ): Promise<void> {
    const db = await this.openDatabase(storeName);
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    // eslint-disable-next-line no-restricted-syntax
    for (const value of entries) {
      if (!('id' in value)) {
        throw new Error(
          'All objects must contain an "id" property to be used as the key.'
        );
      }
      store.put(value);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  public async readAll(storeName: string): Promise<Record<string, unknown>[]> {
    await this.clearIfExpired(storeName);

    const db = await this.openDatabase(storeName);
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result as Record<string, unknown>[]);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  public async readRange(
    storeName: string,
    fromId: number | string,
    toId: number | string
  ): Promise<Record<string, unknown>[]> {
    await this.clearIfExpired(storeName);

    const db = await this.openDatabase(storeName);
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    const range = IDBKeyRange.bound(fromId, toId);
    const result: Record<string, unknown>[] = [];

    return new Promise((resolve, reject) => {
      const request = store.openCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          result.push(cursor.value);
          cursor.continue();
        } else {
          db.close();
          resolve(result);
        }
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  public async has(storeName: string, id: IDBValidKey): Promise<boolean> {
    const db = await this.openDatabase(storeName);
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve) => {
      const request = store.count(id);
      request.onsuccess = () => {
        db.close();
        resolve(request.result > 0);
      };
      request.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  }
}
