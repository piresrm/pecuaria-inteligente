import {
  assertHistorico,
  assertResumo,
  canonicalJson,
  ConsultaHistorico as validarConsultaHistorico,
  InstanteUtc as validarInstanteUtc,
} from '@pecuaria/contracts/browser';
import type { Historico, Resumo } from '@pecuaria/contracts/types';
import { CancelledError, RequestScheduler } from './scheduler';
import type { Prioridade, Recurso } from './state';
export class MercadoError extends Error {
  constructor(
    message: string,
    readonly status: number | null = 0,
    readonly retryAt: number | null = null,
  ) {
    super(message);
  }
}
interface ClientOptions {
  fetch?: typeof fetch;
  random?: () => number;
  now?: () => number;
  wallNow?: () => number;
  scheduler?: RequestScheduler;
  online?: () => boolean;
}
export async function resourceETag(kind: 'resumo' | 'historico', data: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(data));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return `W/"v1-${kind}-${Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, '0')).join('')}"`;
}
/** HTTP only. Storage can provide a validated envelope; this class never persists. */
export class MercadoClient {
  private queue: RequestScheduler;
  private fetcher: typeof fetch;
  private blockedUntil = 0;
  private summaries = new Map<string, Resumo>();
  private pending = new Map<string, { promise: Promise<Recurso<unknown>>; priority: Prioridade }>();
  private background = new AbortController();
  private disposed = false;
  constructor(private options: ClientOptions = {}) {
    this.queue = options.scheduler ?? new RequestScheduler();
    this.fetcher = options.fetch ?? fetch.bind(globalThis);
  }
  private now() {
    return this.options.now?.() ?? performance.now();
  }
  private online() {
    return this.options.online?.() ?? navigator.onLine;
  }
  private wallNow() {
    return this.options.wallNow?.() ?? Date.now();
  }
  prioritize() {
    this.background.abort(new CancelledError());
    this.background = new AbortController();
    this.queue.prioritize();
  }
  dispose() {
    this.disposed = true;
    this.background.abort(new CancelledError());
    this.queue.dispose();
  }
  resumo(local?: Recurso<Resumo>, priority: Prioridade = 'consulta'): Promise<Recurso<Resumo>> {
    return this.shared('resumo', priority, () =>
      this.load('resumo', '/api/v1/mercado/resumo', assertResumo, local, priority).then((r) => {
        this.summaries.set(r.dados.versaoDados, r.dados);
        return r;
      }),
    );
  }
  historico(
    perfilId: string,
    versao: string,
    local?: Recurso<Historico>,
    priority: Prioridade = 'consulta',
  ): Promise<Recurso<Historico>> {
    const resumo = this.summaries.get(versao);
    if (!resumo)
      return Promise.reject(new MercadoError('Contrato: resumo da versão ainda não validado'));
    if (
      !validarConsultaHistorico({ perfilId, versaoDados: versao }) ||
      !resumo.perfis.some((p) => p.id === perfilId)
    )
      return Promise.reject(new MercadoError('Contrato: parâmetros inválidos'));
    return this.shared(`historico|${versao}|${perfilId}`, priority, () =>
      this.load(
        'historico',
        `/api/v1/mercado/historico?perfilId=${encodeURIComponent(perfilId)}&versaoDados=${encodeURIComponent(versao)}`,
        (v): asserts v is Historico => assertHistorico(v, resumo, perfilId),
        local,
        priority,
      ),
    );
  }
  private shared<T>(
    key: string,
    priority: Prioridade,
    load: () => Promise<Recurso<T>>,
  ): Promise<Recurso<T>> {
    const existing = this.pending.get(key);
    if (existing) {
      if (priority === 'consulta' && existing.priority === 'fundo')
        return existing.promise.catch((error) => {
          if (error instanceof CancelledError) return this.shared(key, priority, load);
          throw error;
        }) as Promise<Recurso<T>>;
      return existing.promise as Promise<Recurso<T>>;
    }
    const result = load().finally(() => {
      if (this.pending.get(key)?.promise === result) this.pending.delete(key);
    });
    this.pending.set(key, { promise: result, priority });
    return result;
  }
  private async validLocal<T>(
    kind: 'resumo' | 'historico',
    local: Recurso<T> | undefined,
    validate: (v: unknown) => asserts v is T,
  ): Promise<Recurso<T> | undefined> {
    if (!local) return undefined;
    try {
      validate(local.dados);
      if (
        !validarInstanteUtc(local.recebidoEm) ||
        !validarInstanteUtc(local.verificadoEm) ||
        local.etag !== (await resourceETag(kind, local.dados))
      )
        return undefined;
      return local;
    } catch {
      return undefined;
    }
  }
  private retryAfter(response: Response): number {
    const value = response.headers.get('Retry-After');
    if (!value) return 0;
    const serverDate = Date.parse(response.headers.get('Date') ?? '');
    const reference = Number.isFinite(serverDate) ? serverDate : this.wallNow();
    const seconds = /^\d+$/.test(value) ? Number(value) * 1000 : Date.parse(value) - reference;
    return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  }
  private async load<T>(
    kind: 'resumo' | 'historico',
    url: string,
    validate: (v: unknown) => asserts v is T,
    local: Recurso<T> | undefined,
    priority: Prioridade,
  ): Promise<Recurso<T>> {
    const backgroundSignal = priority === 'fundo' ? this.background.signal : undefined;
    let saved = await this.validLocal(kind, local, validate);
    let recovered = false;
    let retryError: MercadoError | undefined;
    for (let attempt = 0; ;) {
      if (this.disposed || backgroundSignal?.aborted) throw new CancelledError();
      if (this.now() < this.blockedUntil)
        throw new MercadoError('Aguarde para tentar novamente', 429, this.blockedUntil);
      if (retryError && !this.online()) throw retryError;
      try {
        return await this.queue.run(url, priority, async (signal) => {
          // Recheck after admission: another resource may have established a joint-IP deadline.
          if (this.now() < this.blockedUntil)
            throw new MercadoError('Aguarde para tentar novamente', 429, this.blockedUntil);
          if (backgroundSignal?.aborted || this.disposed) throw new CancelledError();
          if (retryError && !this.online()) throw retryError;
          const timeout = new AbortController();
          const abort = () => timeout.abort(new CancelledError());
          signal.addEventListener('abort', abort, { once: true });
          const timer = setTimeout(
            () => timeout.abort(new Error('Prazo da requisição excedido')),
            20000,
          );
          try {
            let response: Response;
            try {
              response = await this.fetcher(url, {
                cache: 'no-cache',
                headers: saved ? { 'If-None-Match': saved.etag } : {},
                signal: timeout.signal,
              });
            } catch (e) {
              if (signal.aborted) throw new CancelledError();
              throw new MercadoError(e instanceof Error ? e.message : 'Falha de rede', null);
            }
            if (signal.aborted) throw new CancelledError();
            if (response.status === 304) {
              if (!saved) throw new MercadoError('Recuperar corpo local', 304);
              if (response.headers.get('ETag') !== saved.etag)
                throw new MercadoError('Contrato: etiqueta de 304 incompatível');
              return { ...saved, verificadoEm: new Date(this.wallNow()).toISOString() };
            }
            if (!response.ok) {
              const delay = this.retryAfter(response);
              if (delay) this.blockedUntil = Math.max(this.blockedUntil, this.now() + delay);
              throw new MercadoError(
                `Não foi possível carregar dados (${response.status})`,
                response.status,
                delay ? this.blockedUntil : null,
              );
            }
            let body: string;
            try {
              body = await response.text();
            } catch (error) {
              if (signal.aborted) throw new CancelledError();
              throw new MercadoError(
                error instanceof Error ? error.message : 'Falha de rede durante leitura',
                null,
              );
            }
            let data: unknown;
            try {
              data = JSON.parse(body);
              validate(data);
            } catch {
              throw new MercadoError('Contrato de mercado inválido');
            }
            const etag = await resourceETag(kind, data);
            if (response.headers.get('ETag') !== etag)
              throw new MercadoError('Contrato: etiqueta de recurso inválida');
            const instant = new Date(this.wallNow()).toISOString();
            return { dados: data, etag, recebidoEm: instant, verificadoEm: instant };
          } finally {
            clearTimeout(timer);
            signal.removeEventListener('abort', abort);
          }
        });
      } catch (error) {
        if (error instanceof MercadoError && error.status === 304 && !recovered) {
          saved = undefined;
          recovered = true;
          continue;
        }
        if (
          !(error instanceof MercadoError) ||
          !(error.status === null || error.status === 429 || error.status === 503) ||
          attempt >= 2 ||
          !this.online()
        )
          throw error;
        const localDelay =
          ([2000, 5000][attempt] ?? 5000) *
          (0.8 + 0.4 * (this.options.random?.() ?? Math.random()));
        const delay = Math.max(localDelay, this.blockedUntil - this.now());
        if (delay > 60000) throw error;
        retryError = error;
        attempt++;
        await new Promise<void>((resolve, reject) => {
          const cancel = () => {
            clearTimeout(timer);
            reject(new CancelledError());
          };
          const timer = setTimeout(() => {
            backgroundSignal?.removeEventListener('abort', cancel);
            resolve();
          }, delay);
          backgroundSignal?.addEventListener('abort', cancel, { once: true });
          if (backgroundSignal?.aborted) cancel();
        });
      }
    }
  }
}
