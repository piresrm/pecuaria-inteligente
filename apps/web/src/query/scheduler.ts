import type { Prioridade } from './state';
export class CancelledError extends Error {
  constructor() {
    super('Consulta cancelada');
  }
}
interface Job {
  key: string;
  priority: Prioridade;
  controller: AbortController;
  start: () => Promise<void>;
  reject: (error: Error) => void;
  promise: Promise<unknown>;
}
/** Shared admission for all fetch attempts. Retrying waits never hold a slot. */
export class RequestScheduler {
  private jobs = new Map<string, Job>();
  private waiting: Job[] = [];
  private active = new Set<Job>();
  private disposed = false;
  run<T>(key: string, priority: Prioridade, task: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const existing = this.jobs.get(key);
    if (existing) {
      if (priority === 'consulta') existing.priority = priority;
      return existing.promise as Promise<T>;
    }
    if (this.disposed) return Promise.reject(new CancelledError());
    let resolve!: (v: T) => void;
    let reject!: (e: Error) => void;
    const promise = new Promise<T>((a, b) => {
      resolve = a;
      reject = b;
    });
    const job: Job = {
      key,
      priority,
      controller: new AbortController(),
      promise,
      reject,
      start: async () => {
        try {
          resolve(await task(job.controller.signal));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        } finally {
          this.active.delete(job);
          this.jobs.delete(key);
          this.drain();
        }
      },
    };
    this.jobs.set(key, job);
    this.waiting.push(job);
    this.drain();
    return promise;
  }
  private drain() {
    this.waiting.sort((a, b) => Number(a.priority === 'fundo') - Number(b.priority === 'fundo'));
    while (this.active.size < 2 && this.waiting.length) {
      const job = this.waiting.shift();
      if (job) {
        this.active.add(job);
        void job.start();
      }
    }
  }
  prioritize() {
    for (const job of this.active)
      if (job.priority === 'fundo') job.controller.abort(new CancelledError());
    this.waiting = this.waiting.filter((job) => {
      if (job.priority === 'consulta') return true;
      this.jobs.delete(job.key);
      job.reject(new CancelledError());
      return false;
    });
  }
  dispose() {
    this.disposed = true;
    for (const job of this.active) job.controller.abort(new CancelledError());
    for (const job of this.waiting) job.reject(new CancelledError());
    this.waiting = [];
  }
}
interface CycleOptions {
  verify: () => Promise<boolean>;
  visible: () => boolean;
  online: () => boolean;
  random?: () => number;
  now?: () => number;
  onAge?: (stale: boolean) => void;
}
/** One lifecycle owner for periodic, visible, reconnect and manual triggers. */
export class VerificationScheduler {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private ageTimer: ReturnType<typeof setTimeout> | undefined;
  private pending: Promise<void> | undefined;
  private failures = 0;
  private last: number;
  private stopped = false;
  constructor(private options: CycleOptions) {
    this.last = this.now();
  }
  private now() {
    return this.options.now?.() ?? performance.now();
  }
  start() {
    this.schedule();
    this.age();
  }
  private age() {
    clearTimeout(this.ageTimer);
    if (this.stopped) return;
    this.options.onAge?.(this.now() - this.last > 900000);
    this.ageTimer = setTimeout(() => this.age(), 30000);
  }
  private schedule() {
    clearTimeout(this.timer);
    if (this.stopped || !this.options.visible() || !this.options.online()) return;
    const minutes = this.failures === 0 ? 5 : Math.min(30, 10 * 2 ** (this.failures - 1));
    const factor = this.failures === 0 ? 1 : 0.8 + 0.4 * (this.options.random?.() ?? Math.random());
    this.timer = setTimeout(
      () => {
        void this.trigger(false);
      },
      minutes * 60000 * factor,
    );
  }
  trigger(manual = true): Promise<void> {
    if (this.pending) return this.pending;
    if (this.stopped || (!manual && (!this.options.visible() || !this.options.online())))
      return Promise.resolve();
    clearTimeout(this.timer);
    this.pending = (async () => {
      try {
        if (await this.options.verify()) {
          this.failures = 0;
          this.last = this.now();
        } else this.failures++;
      } catch {
        this.failures++;
      } finally {
        this.pending = undefined;
        this.age();
        this.schedule();
      }
    })();
    return this.pending;
  }
  visibilityChanged(): Promise<void> {
    clearTimeout(this.timer);
    if (this.options.visible() && this.now() - this.last >= 60000) return this.trigger(false);
    this.schedule();
    return Promise.resolve();
  }
  connectionChanged(): Promise<void> {
    return this.visibilityChanged();
  }
  dispose() {
    this.stopped = true;
    clearTimeout(this.timer);
    clearTimeout(this.ageTimer);
  }
}
