type TTLMeta = {
  storeName: string;
  createdAt: number;
  ttlMs: number;
};

export class IndexedTTLStoreManager {
  private static DB_NAME = 'iScrollDB';

  private static TTL_STORE = '__ttl__';

  private readonly storeName: string;

  constructor(storeName: string) {
    this.storeName = storeName;
  }

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
          db.createObjectStore(storeName); // ✅ теперь используется `id` как ключ
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
            upgradeDb.createObjectStore(storeName);
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

  public async setTTL(ttlMs: number): Promise<void> {
    const db = await this.openDatabase(IndexedTTLStoreManager.TTL_STORE);
    const tx = db.transaction(IndexedTTLStoreManager.TTL_STORE, 'readwrite');
    const store = tx.objectStore(IndexedTTLStoreManager.TTL_STORE);

    const meta: TTLMeta = {
      storeName: this.storeName,
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

  private async isExpired(): Promise<boolean> {
    const db = await this.openDatabase(IndexedTTLStoreManager.TTL_STORE);
    const tx = db.transaction(IndexedTTLStoreManager.TTL_STORE, 'readonly');
    const store = tx.objectStore(IndexedTTLStoreManager.TTL_STORE);
    const request = store.get(this.storeName);

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

  public async clearIfExpired(): Promise<void> {
    const expired = await this.isExpired();
    if (!expired) return;

    console.warn(`Your data in store '${this.storeName}' is expired!`);

    const db = await this.openDatabase(this.storeName);
    const tx = db.transaction(this.storeName, 'readwrite');
    tx.objectStore(this.storeName).clear();

    // eslint-disable-next-line consistent-return
    return new Promise((resolve) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    });
  }

  public async write(
    index: number | string,
    value: Record<string, unknown>
  ): Promise<void> {
    const db = await this.openDatabase(this.storeName);
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);

    store.put(value, index);

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

  public async writeMany(
    entries: { index: number; value: Record<string, unknown> }[]
  ): Promise<void> {
    const db = await this.openDatabase(this.storeName);
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);

    entries.forEach(({ value, index }) => {
      if (!('id' in value)) {
        throw new Error(
          'All objects must contain an "id" property to be used as the key.'
        );
      }
      store.put(value, index);
    });

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

  public async readAll(): Promise<Record<string, unknown>[]> {
    await this.clearIfExpired();

    const db = await this.openDatabase(this.storeName);
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const result: Record<string, unknown>[] = [];

    return new Promise((resolve, reject) => {
      const request = store.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const key = cursor.key as number;
          result[key] = cursor.value;
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

  public async readRange(
    fromId: number,
    toId: number
  ): Promise<Record<string, unknown>[]> {
    await this.clearIfExpired();

    const db = await this.openDatabase(this.storeName);
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);

    const range = IDBKeyRange.bound(fromId, toId);
    const result: Record<string, unknown>[] = new Array(toId - fromId + 1);

    return new Promise((resolve, reject) => {
      const request = store.openCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const key = cursor.key as number;
          const index = key - fromId;
          result[index] = cursor.value;
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

  public async get(
    index: number | string
  ): Promise<Record<string, unknown> | undefined> {
    await this.clearIfExpired(this.storeName);

    const db = await this.openDatabase(this.storeName);
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(index);
      request.onsuccess = () => {
        db.close();
        resolve(request.result as Record<string, unknown> | undefined);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  public async has(id: IDBValidKey): Promise<boolean> {
    const db = await this.openDatabase(this.storeName);
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);

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

  public async getStoreSize(): Promise<number> {
    const db = await this.openDatabase(this.storeName);
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.count();

      request.onsuccess = () => {
        db.close();
        resolve(request.result);
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }
}
