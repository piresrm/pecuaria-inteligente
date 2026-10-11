import { ControleErro } from './types.js';
interface Bucket {
  tokens: number;
  updated: number;
  touched: number;
}
export interface QuotaOptions {
  now?: () => number;
  maxBuckets?: number;
  idleMs?: number;
  capacity?: number;
  refillPerSecond?: number;
}
/** Single-process atomic token bucket. Time is monotonic milliseconds. */
export class IpQuota {
  private readonly buckets = new Map<string, Bucket>();
  private readonly now: () => number;
  private readonly maxBuckets: number;
  private readonly idleMs: number;
  private readonly capacity: number;
  private readonly refillPerMs: number;
  private lastTime = -Infinity;
  private nextSweep = -Infinity;
  constructor(options: QuotaOptions = {}) {
    this.now = options.now ?? (() => performance.now());
    this.maxBuckets = options.maxBuckets ?? 10000;
    this.idleMs = options.idleMs ?? 60000;
    this.capacity = options.capacity ?? 30;
    const refill = options.refillPerSecond ?? 2;
    if (
      !Number.isInteger(this.maxBuckets) ||
      this.maxBuckets < 1 ||
      !Number.isFinite(this.idleMs) ||
      this.idleMs < 1 ||
      !Number.isInteger(this.capacity) ||
      this.capacity < 1 ||
      !Number.isFinite(refill) ||
      refill <= 0
    )
      throw new TypeError('Configuração de cota inválida');
    this.refillPerMs = refill / 1000;
  }
  consume(ip: string): { permitido: boolean; retryAfter: number } {
    const now = this.now();
    if (!Number.isFinite(now) || now < this.lastTime)
      throw new ControleErro('CONTROLE_INDISPONIVEL', 5);
    this.lastTime = now;
    // Bounded sweep also occurs with ordinary traffic: stale identities do not
    // remain forever merely because the map has not reached its capacity.
    if (now >= this.nextSweep) {
      for (const [key, bucket] of this.buckets) {
        if (
          now - bucket.touched >= this.idleMs &&
          bucket.tokens + (now - bucket.updated) * this.refillPerMs >= this.capacity
        )
          this.buckets.delete(key);
      }
      this.nextSweep = now + 1000;
    }
    let bucket = this.buckets.get(ip);
    if (!bucket) {
      if (this.buckets.size >= this.maxBuckets) throw new ControleErro('CONTROLE_INDISPONIVEL', 5);
      bucket = { tokens: this.capacity, updated: now, touched: now };
      this.buckets.set(ip, bucket);
    }
    const available = Math.min(
      this.capacity,
      bucket.tokens + (now - bucket.updated) * this.refillPerMs,
    );
    bucket.touched = now;
    // Refused attempts leave the credit baseline untouched, avoiding cumulative
    // floating point drift from splitting one refill into many denied attempts.
    if (available < 1)
      return {
        permitido: false,
        retryAfter: Math.max(1, Math.ceil((1 - available) / this.refillPerMs / 1000)),
      };
    bucket.tokens = available - 1;
    bucket.updated = now;
    return { permitido: true, retryAfter: 0 };
  }
}
