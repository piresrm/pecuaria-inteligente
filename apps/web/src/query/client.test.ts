import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Resumo } from '@pecuaria/contracts/types';
import { MercadoClient } from './client';
import resumo from '../../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json';
afterEach(() => vi.useRealTimers());
describe('cliente HTTP', () => {
  it('recupera 304 sem corpo local e rejeita contrato inválido sem repetir', async () => {
    const requests: RequestInit[] = [];
    const client = new MercadoClient({
      fetch: (_url, init) => {
        requests.push(init!);
        return Promise.resolve(
          requests.length === 1
            ? new Response(null, { status: 304 })
            : new Response('{}', { status: 200 }),
        );
      },
    });
    await expect(client.resumo()).rejects.toThrow('Contrato');
    expect(requests).toHaveLength(2);
    expect(requests[1]?.headers).toEqual({});
    expect(requests[0]?.cache).toBe('no-cache');
  });
  it('limita retry de rede a duas novas tentativas com relógio controlado', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockRejectedValue(new TypeError('offline'));
    const client = new MercadoClient({ fetch, random: () => 0.5 });
    const pending = expect(client.resumo()).rejects.toThrow();
    await vi.runAllTimersAsync();
    await pending;
    expect(fetch).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
  it('não aceita corpo estrutural sem semântica', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ...resumo, perfis: [] }), { status: 200 }));
    await expect(new MercadoClient({ fetch }).resumo()).rejects.toThrow('Contrato');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
it('respeita Retry-After global incluindo tentativa manual e suspende acima de 60s', async () => {
  vi.useFakeTimers();
  let clock = 0;
  const fetch = vi.fn(() =>
    Promise.resolve(new Response(null, { status: 429, headers: { 'Retry-After': '120' } })),
  );
  const client = new MercadoClient({ fetch, now: () => clock, random: () => 0.5 });
  await expect(client.resumo()).rejects.toMatchObject({ status: 429 });
  await expect(client.resumo()).rejects.toMatchObject({ status: 429 });
  expect(fetch).toHaveBeenCalledTimes(1);
  clock = 120000;
  await expect(client.resumo()).rejects.toMatchObject({ status: 429 });
  expect(fetch).toHaveBeenCalledTimes(2);
  vi.useRealTimers();
});
it.each([400, 404, 409, 500])('não repete status %s', async (status) => {
  const fetch = vi.fn(() => Promise.resolve(new Response(null, { status })));
  await expect(new MercadoClient({ fetch }).resumo()).rejects.toMatchObject({ status });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('valida ETag canônico UTF-8, reutiliza 304 válido e preserva recebidoEm com relógio regressivo', async () => {
  const { resourceETag } = await import('./client');
  const etag = await resourceETag('resumo', resumo);
  const fetch = vi.fn<typeof globalThis.fetch>(() =>
    Promise.resolve(new Response(null, { status: 304, headers: { ETag: etag } })),
  );
  const local = {
    dados: resumo,
    etag,
    recebidoEm: '2026-10-07T12:00:00.000Z',
    verificadoEm: '2026-10-07T12:00:00.000Z',
  };
  const result = await new MercadoClient({
    fetch,
    wallNow: () => Date.parse('2020-01-01T00:00:00.000Z'),
  }).resumo({ ...local, dados: resumo as Resumo });
  expect(result.recebidoEm).toBe(local.recebidoEm);
  expect(result.verificadoEm).toBe('2020-01-01T00:00:00.000Z');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0]?.[1]?.headers).toEqual({ 'If-None-Match': etag });
});
it('monta histórico com os dois parâmetros e rejeita versão/local incompatíveis', async () => {
  const { resourceETag } = await import('./client');
  const summaryTag = await resourceETag('resumo', resumo);
  let url = '';
  const fetch = vi.fn<typeof globalThis.fetch>((input) => {
    url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return Promise.resolve(
      url.endsWith('/resumo')
        ? new Response(JSON.stringify(resumo), { headers: { ETag: summaryTag } })
        : new Response('{}'),
    );
  });
  const c = new MercadoClient({ fetch });
  await c.resumo();
  await expect(c.historico('bezerro-macho-nelore', resumo.versaoDados)).rejects.toThrow('Contrato');
  expect(url).toBe(
    `/api/v1/mercado/historico?perfilId=bezerro-macho-nelore&versaoDados=${resumo.versaoDados}`,
  );
  await expect(c.historico('bezerro-macho-nelore', 'outra')).rejects.toThrow('resumo');
  expect(fetch).toHaveBeenCalledTimes(2);
});
it('prazo de 20s aborta cada fetch; cancelar/dispose não dispara retry', async () => {
  vi.useFakeTimers();
  const signals: AbortSignal[] = [];
  const fetch = vi.fn(
    (_input: unknown, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        signals.push(init!.signal as AbortSignal);
        init?.signal?.addEventListener('abort', () => reject(new Error('abort')));
      }),
  );
  const c = new MercadoClient({ fetch, random: () => 0.5 });
  const result = expect(c.resumo()).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(20000);
  expect(signals[0]?.aborted).toBe(true);
  c.dispose();
  await vi.runAllTimersAsync();
  await result;
  expect(fetch).toHaveBeenCalledTimes(1);
  vi.useRealTimers();
});
it('consulta preempta fundo e recupera equivalente cancelada sem retry de fundo', async () => {
  const { resourceETag } = await import('./client');
  const etag = await resourceETag('resumo', resumo);
  let calls = 0;
  const fetch: typeof globalThis.fetch = (_url, init) => {
    calls++;
    if (calls === 1)
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('abort')));
      });
    return Promise.resolve(new Response(JSON.stringify(resumo), { headers: { ETag: etag } }));
  };
  const c = new MercadoClient({ fetch });
  const background = c.resumo(undefined, 'fundo').catch(() => null);
  await vi.waitFor(() => expect(calls).toBe(1));
  c.prioritize();
  const foreground = c.resumo();
  await expect(foreground).resolves.toMatchObject({ dados: { versaoDados: resumo.versaoDados } });
  await background;
  expect(calls).toBe(2);
  c.dispose();
});
it('não tenta automaticamente em offline mas permite tentativa explícita', async () => {
  vi.useFakeTimers();
  const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.reject(new Error('offline')));
  const c = new MercadoClient({ fetch, online: () => false });
  const first = expect(c.resumo()).rejects.toThrow();
  await vi.runAllTimersAsync();
  await first;
  expect(fetch).toHaveBeenCalledTimes(1);
  await expect(c.resumo()).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(2);
  vi.useRealTimers();
});
it('Retry-After protege cota conjunta entre históricos, resumo e gatilhos', async () => {
  const { resourceETag } = await import('./client');
  const etag = await resourceETag('resumo', resumo);
  let clock = 0;
  const urls: string[] = [];
  const fetch: typeof globalThis.fetch = (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    urls.push(url);
    return Promise.resolve(
      url.endsWith('/resumo')
        ? new Response(JSON.stringify(resumo), { headers: { ETag: etag } })
        : new Response(null, { status: 503, headers: { 'Retry-After': '120' } }),
    );
  };
  const c = new MercadoClient({ fetch, now: () => clock });
  await c.resumo();
  await expect(c.historico('bezerro-macho-nelore', resumo.versaoDados)).rejects.toMatchObject({
    status: 503,
  });
  await expect(c.historico('bezerro-macho-mestico', resumo.versaoDados)).rejects.toMatchObject({
    status: 429,
  });
  await expect(c.resumo(undefined, 'fundo')).rejects.toMatchObject({ status: 429 });
  expect(urls).toHaveLength(2);
  clock = 120000;
  await c.resumo();
  expect(urls).toHaveLength(3);
});
it('Retry-After data HTTP usa Date do servidor apesar de relógio civil divergente', async () => {
  vi.useFakeTimers();
  const fetch = vi.fn<typeof globalThis.fetch>(() =>
    Promise.resolve(
      new Response(null, {
        status: 503,
        headers: {
          Date: 'Wed, 07 Oct 2026 12:00:00 GMT',
          'Retry-After': 'Wed, 07 Oct 2026 12:00:05 GMT',
        },
      }),
    ),
  );
  const c = new MercadoClient({
    fetch,
    wallNow: () => Date.parse('2020-01-01T00:00:00Z'),
    now: () => Date.now(),
    random: () => 0.5,
  });
  const result = expect(c.resumo()).rejects.toMatchObject({ status: 503 });
  await vi.advanceTimersByTimeAsync(4999);
  expect(fetch).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(fetch).toHaveBeenCalledTimes(2);
  await vi.runAllTimersAsync();
  await result;
  expect(fetch).toHaveBeenCalledTimes(3);
  vi.useRealTimers();
});
it('prazo conhecido também bloqueia trabalho já enfileirado antes de obter vaga', async () => {
  const { resourceETag } = await import('./client');
  const etag = await resourceETag('resumo', resumo);
  let calls = 0;
  let release!: (r: Response) => void;
  const fetch: typeof globalThis.fetch = (_url, init) => {
    calls++;
    if (calls === 1)
      return Promise.resolve(new Response(JSON.stringify(resumo), { headers: { ETag: etag } }));
    if (calls === 2)
      return new Promise((resolve) => {
        release = resolve;
      });
    if (calls === 3)
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('abort')));
      });
    return Promise.resolve(new Response('{}'));
  };
  const c = new MercadoClient({ fetch, now: () => 0 });
  await c.resumo();
  const one = expect(c.historico('bezerro-macho-nelore', resumo.versaoDados)).rejects.toMatchObject(
    { status: 503 },
  );
  const two = c.historico('bezerro-macho-mestico', resumo.versaoDados).catch(() => null);
  const three = expect(
    c.historico('bezerra-femea-nelore', resumo.versaoDados),
  ).rejects.toMatchObject({ status: 429 });
  await vi.waitFor(() => expect(calls).toBe(3));
  release(new Response(null, { status: 503, headers: { 'Retry-After': '120' } }));
  await one;
  await three;
  expect(calls).toBe(3);
  c.dispose();
  await two;
});
it('falha de rede durante leitura do corpo também segue duas tentativas; contrato continua sem retry', async () => {
  vi.useFakeTimers();
  const fetch = vi.fn<typeof globalThis.fetch>(() =>
    Promise.resolve(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new TypeError('rede interrompida'));
          },
        }),
      ),
    ),
  );
  const c = new MercadoClient({ fetch, random: () => 0.5 });
  const result = expect(c.resumo()).rejects.toThrow();
  await vi.runAllTimersAsync();
  await result;
  expect(fetch).toHaveBeenCalledTimes(3);
});

it('interrompe retry automático se a conexão cair durante a espera; tentativa explícita continua permitida', async () => {
  vi.useFakeTimers();
  let online = true;
  const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.reject(new TypeError('rede')));
  const c = new MercadoClient({ fetch, online: () => online, random: () => 0.5 });
  const result = expect(c.resumo()).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(0);
  expect(fetch).toHaveBeenCalledTimes(1);
  online = false;
  await vi.runAllTimersAsync();
  await result;
  expect(fetch).toHaveBeenCalledTimes(1);
  await expect(c.resumo()).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(2);
  c.dispose();
});
it('revalida conexão quando retry enfileirado finalmente recebe uma vaga', async () => {
  vi.useFakeTimers();
  const { RequestScheduler } = await import('./scheduler');
  const scheduler = new RequestScheduler();
  let online = true;
  const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.reject(new TypeError('rede')));
  const c = new MercadoClient({ fetch, scheduler, online: () => online, random: () => 0.5 });
  const result = expect(c.resumo()).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(0);
  const releases: (() => void)[] = [];
  const hold = () => new Promise<void>((resolve) => releases.push(resolve));
  const blockers = [scheduler.run('one', 'consulta', hold), scheduler.run('two', 'consulta', hold)];
  await vi.advanceTimersByTimeAsync(2000);
  online = false;
  for (const release of releases) release();
  await Promise.all(blockers);
  await vi.runAllTimersAsync();
  await result;
  expect(fetch).toHaveBeenCalledTimes(1);
  c.dispose();
});
