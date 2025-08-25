import { Status } from '../../types/utils';

export class StatusManager {
  private statusListeners: ((status: Status) => void)[] = [];

  is: Status = Status.Initial;

  cb: (status: Status) => undefined;

  constructor(callback) {
    this.cb = callback;
  }

  setStatus(newStatus: Status) {
    if (this.is !== newStatus) {
      this.is = newStatus;
      this.statusListeners.forEach((listener) => listener(newStatus));
      this.cb(newStatus);
    }
  }

  waitForStatus(targetStatus: Status): Promise<Status> {
    if (this.is === targetStatus) {
      return Promise.resolve(this.is);
    }

    return new Promise((resolve, reject) => {
      const listener = (status: Status) => {
        if (status === targetStatus) {
          this.removeStatusListener(listener);
          resolve(status);
        } else if (status === Status.Error && targetStatus !== Status.Error) {
          this.removeStatusListener(listener);
          reject(
            new Error(
              `Status changed to error while waiting for ${targetStatus}`
            )
          );
        }
      };

      this.statusListeners.push(listener);
    });
  }

  whenReady(): Promise<void> {
    return this.waitForStatus(Status.Ready).then(() => {});
  }

  private removeStatusListener(listener: (status: Status) => void) {
    const index = this.statusListeners.indexOf(listener);
    if (index > -1) {
      this.statusListeners.splice(index, 1);
    }
  }

  // Метод для сброса состояния
  reset(): void {
    this.setStatus(Status.Initial);
  }

  // Проверка состояний
  get isReady(): boolean {
    return this.is === Status.Ready;
  }

  get isLoading(): boolean {
    return this.is === Status.Loading;
  }

  get hasError(): boolean {
    return this.is === Status.Error;
  }
}
