type TTLMeta = {
  storeName: string;
  createdAt: number;
  ttlMs: number;
};

export class IndexedTTLStoreManager {
  private static DB_NAME = 'iScrollDB';

  private static TTL_STORE = '__ttl__';

  private static waitingQueue: Array<() => void> = [];

  private static isWorking = false;

  private readonly storeName: string;

  constructor(storeName: string) {
    this.storeName = storeName;
  }

  static build(selectorId: string) {
    return IndexedTTLStoreManager.checkIndexedDBSupport().then(
      (async_result) => {
        console.log(async_result);
        return new IndexedTTLStoreManager(selectorId);
      },
      (error): undefined => {
        console.log(error);
        return undefined;
      }
    );
  }

  static async checkIndexedDBSupport() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB не поддерживается браузером'));
        return;
      }

      const dbName = `support-test-${Date.now()}`; // Уникальное имя
      const request = indexedDB.open(dbName, 1);

      let db;

      request.onupgradeneeded = (event) => {
        // База создаётся - это нормально
        db = event.target.result;
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        db.close();
        // Удаляем тестовую базу
        indexedDB.deleteDatabase(dbName);
        resolve('IndexedDB полностью поддерживается');
      };

      request.onerror = (event) => {
        reject(
          new Error(`Ошибка при создании/открытии базы: ${event.target.error}`)
        );
      };

      request.onblocked = (event) => {
        reject(new Error('Операция с IndexedDB заблокирована'));
      };

      // Таймаут на случай зависания
      setTimeout(() => {
        if (db) db.close();
        reject(new Error('Таймаут при проверке IndexedDB'));
      }, 5000);
    });
  }

  private addToWaitingQueue(cb: () => Promise<TTLMeta>) {
    return new Promise((resolve: (a: TTLMeta) => void) => {
      console.log('push to queue', IndexedTTLStoreManager.waitingQueue.slice());
      IndexedTTLStoreManager.waitingQueue.push(async () => {
        console.log('before cb');
        const res = await cb();
        console.log('after cb');
        resolve(res);
      });

      if (!IndexedTTLStoreManager.isWorking) {
        console.log('handle queue');
        this.handleQueue();
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private async handleQueue() {
    if (IndexedTTLStoreManager.isWorking) return;

    IndexedTTLStoreManager.isWorking = true;

    const runTask = async () => {
      if (IndexedTTLStoreManager.waitingQueue.length === 0) {
        IndexedTTLStoreManager.isWorking = false;
        return;
      }

      console.log('queue length', IndexedTTLStoreManager.waitingQueue.length);
      const task = IndexedTTLStoreManager.waitingQueue.shift();
      console.log('task started');
      await task?.();
      console.log('task done');
      runTask();
    };

    runTask();
  }

  private async queuedOpenDb(ttlMs: number): Promise<TTLMeta> {
    // await this.sleep(2000);
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
        resolve(meta);
      };
    });
  }

  public async setTTL(ttlMs: number): Promise<unknown> {
    const res = await this.addToWaitingQueue(async () =>
      this.queuedOpenDb(ttlMs)
    );
    const parsedRes = {
      ...res,
      createdAt: new Date(res.createdAt).toLocaleString(),
    };
    return parsedRes;
  }

  // eslint-disable-next-line class-methods-use-this
  private async openDatabase(storeName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IndexedTTLStoreManager.DB_NAME);

      request.onupgradeneeded = () => {
        console.log('onupgradeneeded outer');
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
        console.log('onsuccess', this.storeName);
        const db = request.result;
        console.log(
          this.storeName,
          'is exist?',
          db.objectStoreNames.contains(storeName)
        );
        if (!db.objectStoreNames.contains(storeName)) {
          console.log('Стор не найден', this.storeName);
          db.close();
          const upgradeRequest = indexedDB.open(
            IndexedTTLStoreManager.DB_NAME,
            db.version + 1
          );

          upgradeRequest.onupgradeneeded = () => {
            console.log('onupgradeneeded inner (создаём стор)', this.storeName);
            const upgradeDb = upgradeRequest.result;
            upgradeDb.createObjectStore(storeName);
          };

          upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
          upgradeRequest.onerror = () => reject(upgradeRequest.error);
        } else {
          console.log(
            'Стор найден!',
            this.storeName,
            Array.from(db.objectStoreNames).slice(),
            db.objectStoreNames
          );
          resolve(db);
        }
      };

      request.onerror = () => reject(request.error);
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
    await this.addToWaitingQueue(async () => {
      const db = await this.openDatabase(this.storeName);
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      store.put(value, index);

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
          db.close();
          resolve({} as TTLMeta); // Возвращаем пустой объект для совместимости с очередью
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    });
  }

  public async writeMany(
    entries: { index: number; value: Record<string, unknown> }[]
  ): Promise<void> {
    await this.addToWaitingQueue(async () => {
      const db = await this.openDatabase(this.storeName);
      console.log('try to write many', this.storeName);
      console.log(db.objectStoreNames);
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
          resolve({} as TTLMeta); // Возвращаем пустой объект для совместимости с очередью
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
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
