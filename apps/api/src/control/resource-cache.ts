export interface ResourceKey {
  operacao: 'resumo' | 'historico';
  versao: string;
  perfilId?: string;
}
interface Entry<T> {
  key: ResourceKey;
  expiresAt: number;
  promise: Promise<T>;
}
export class ResourceCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly ttlMs: number;
  private readonly now: () => number;
  constructor(options: { ttlMs?: number; now?: () => number } = {}) {
    this.ttlMs = options.ttlMs ?? 60000;
    this.now = options.now ?? (() => performance.now());
    if (!Number.isFinite(this.ttlMs) || this.ttlMs <= 0 || this.ttlMs > 60000)
      throw new RangeError('TTL deve estar entre 0 e 60 segundos');
  }
  get(key: ResourceKey, load: () => Promise<T>): Promise<T> {
    const now = this.now();
    for (const [id, entry] of this.entries) if (entry.expiresAt <= now) this.entries.delete(id);
    const id = JSON.stringify([key.operacao, key.versao, key.perfilId ?? null]);
    const existing = this.entries.get(id);
    if (existing) return existing.promise;
    // Invoke synchronously so equivalent calls made in the same tick share one
    // operation, including a synchronous loader failure converted to rejection.
    let promise: Promise<T>;
    try {
      promise = load();
    } catch (error) {
      return Promise.reject(
        error instanceof Error ? error : new Error('Carga indisponível', { cause: error }),
      );
    }
    const entry: Entry<T> = { key: { ...key }, expiresAt: now + this.ttlMs, promise };
    entry.promise = promise.catch((error: unknown) => {
      if (this.entries.get(id) === entry) this.entries.delete(id);
      throw error;
    });
    this.entries.set(id, entry);
    return entry.promise;
  }
  selectSummaryVersion(version: string): void {
    for (const [id, entry] of this.entries)
      if (entry.key.operacao === 'resumo' && entry.key.versao !== version) this.entries.delete(id);
  }
}
