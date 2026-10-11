import { createHash } from 'node:crypto';
import { afterEach, expect, test } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { canonicalJson } from '@pecuaria/contracts/server';
import errors from '../../../docs/superpowers/contracts/v0.1/erros.exemplos.json' with { type: 'json' };
import { buildApp, type AppDependencies } from './app.js';
import { ControleErro } from './control/types.js';
import {
  MemoryRepository,
  examples,
  permissiveDependencies,
  resumoUrl,
  historicoUrl,
  versionId,
  profileId,
  historyQuery,
} from '../tests/helpers/http.js';
const apps: FastifyInstance[] = [];
async function setup(deps = permissiveDependencies(new MemoryRepository())) {
  const app = await buildApp(deps);
  apps.push(app);
  return app;
}
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
test('GET entrega corpos canônicos e etiquetas dos mesmos bytes UTF-8', async () => {
  const app = await setup();
  const values = examples();
  for (const [operation, url, value] of [
    ['resumo', resumoUrl, values.resumo],
    ['historico', `${historicoUrl}?${historyQuery}`, values.historico],
  ] as const) {
    const response = await app.inject(url);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(canonicalJson(value));
    expect(response.headers.etag).toBe(
      `W/"v1-${operation}-${createHash('sha256').update(response.body, 'utf8').digest('hex')}"`,
    );
    expect(response.headers['cache-control']).toBe('public, max-age=60, must-revalidate');
    expect(response.headers['content-type']).toMatch(/^application\/json/);
  }
});
test.each([
  `${resumoUrl}?perfilId=${profileId}`,
  `${resumoUrl}?x=1`,
  `${resumoUrl}?%`,
  `${historicoUrl}`,
  `${historicoUrl}?perfilId=${profileId}`,
  `${historicoUrl}?versaoDados=${versionId}`,
  `${historicoUrl}?${historyQuery}&perfilId=${profileId}`,
  `${historicoUrl}?${historyQuery}&versaoDados=${versionId}`,
  `${historicoUrl}?${historyQuery}&%70erfilId=${profileId}`,
  `${historicoUrl}?${historyQuery}&ordem=1`,
  `${historicoUrl}?perfilId=&versaoDados=${versionId}`,
  `${historicoUrl}?perfilId=BEZERRO&versaoDados=${versionId}`,
  `${historicoUrl}?perfilId=%20${profileId}&versaoDados=${versionId}`,
  `${historicoUrl}?perfilId=${profileId}+&versaoDados=${versionId}`,
  `${historicoUrl}?perfilId=${profileId}%&versaoDados=${versionId}`,
  `${historicoUrl}?perfilId=%GG&versaoDados=${versionId}`,
  `${historicoUrl}?perfilId=%C3%28&versaoDados=${versionId}`,
  `${historicoUrl}?perfilId=%ED%A0%80&versaoDados=${versionId}`,
  `${historicoUrl}?perfilId=%C0%AF&versaoDados=${versionId}`,
  `${historicoUrl}?perfilId=%252D&versaoDados=${versionId}`,
  `${historicoUrl}?perfilId=${'a'.repeat(81)}&versaoDados=${versionId}`,
  `${historicoUrl}?perfilId=${profileId}&versaoDados=${'a'.repeat(81)}`,
  `${resumoUrl}?${'a'.repeat(1025)}`,
  `${historicoUrl}?${'a'.repeat(1025)}`,
])('rejeita consulta inválida sem alterar ou coagir entrada: %s', async (url) => {
  const repository = new MemoryRepository();
  const response = await (await setup(permissiveDependencies(repository))).inject(url);
  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual(errors[0]?.corpo);
  expect(response.headers['cache-control']).toBe('no-store');
  expect(repository.pointerReads + repository.summaryReads + repository.historyReads).toBe(0);
});
test('decodifica uma vez e normaliza ordem dos parâmetros para compartilhar recurso', async () => {
  const repository = new MemoryRepository();
  const app = await setup(permissiveDependencies(repository));
  const first = await app.inject(`${historicoUrl}?${historyQuery}`);
  const equivalent = await app.inject(
    `${historicoUrl}?versaoDados=${versionId}&%70erfilId=%62ezerro-macho-nelore`,
  );
  expect(equivalent.statusCode).toBe(200);
  expect(equivalent.body).toBe(first.body);
  expect(repository.historyReads).toBe(1);
});
test('verifica versão antes de perfil e nunca substitui a solicitada', async () => {
  const app = await setup();
  for (const [query, status, code] of [
    ['perfilId=desconhecido&versaoDados=inexistente', 409, 'VERSAO_INDISPONIVEL'],
    [`perfilId=desconhecido&versaoDados=${versionId}`, 404, 'PERFIL_INEXISTENTE'],
    [`perfilId=${'a'.repeat(80)}&versaoDados=${versionId}`, 404, 'PERFIL_INEXISTENTE'],
  ] as const) {
    const response = await app.inject(`${historicoUrl}?${query}`);
    expect(response.statusCode).toBe(status);
    expect(response.json()).toMatchObject({ erro: { codigo: code } });
    expect(response.headers['cache-control']).toBe('no-store');
  }
});
test('revalida com etiquetas fracas, fortes, listas e asterisco sem corpo', async () => {
  const app = await setup();
  for (const url of [resumoUrl, `${historicoUrl}?${historyQuery}`]) {
    const response = await app.inject(url);
    const etag = String(response.headers.etag);
    for (const header of [
      etag,
      etag.slice(2),
      `"outra", ${etag}`,
      `W/"outro,com-virgula", ${etag}`,
      '*',
    ]) {
      const checked = await app.inject({ url, headers: { 'if-none-match': header } });
      expect(checked.statusCode).toBe(304);
      expect(checked.body).toBe('');
      expect(checked.headers.etag).toBe(etag);
      expect(checked.headers['cache-control']).toBe(response.headers['cache-control']);
    }
    for (const header of ['"outra"', `garbage, ${etag}`, `${etag}, garbage`, `*, ${etag}`])
      expect((await app.inject({ url, headers: { 'if-none-match': header } })).statusCode).toBe(
        200,
      );
  }
});
test('lê ponteiro com admissão mesmo no cache e não confirma etiqueta da versão anterior', async () => {
  const repository = new MemoryRepository();
  const deps = permissiveDependencies(repository);
  let admissions = 0;
  deps.banco = {
    run(operation) {
      admissions++;
      return operation();
    },
  };
  const app = await setup(deps);
  const first = await app.inject(resumoUrl);
  const second = await app.inject({
    url: resumoUrl,
    headers: { 'if-none-match': String(first.headers.etag) },
  });
  expect(second.statusCode).toBe(304);
  expect(repository.pointerReads).toBe(2);
  expect(admissions).toBe(3); // two pointer reads, one loaded summary
  const next = structuredClone(examples().resumo);
  next.versaoDados = 'a-versao-nova';
  repository.summaries.set(next.versaoDados, next);
  repository.current = next.versaoDados;
  const response = await app.inject({
    url: resumoUrl,
    headers: { 'if-none-match': String(first.headers.etag) },
  });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ versaoDados: 'a-versao-nova' });
  expect(response.headers.etag).not.toBe(first.headers.etag);
});
test('valida recursos antes de cache e serialização e permite recuperação depois da falha', async () => {
  const repository = new MemoryRepository();
  repository.summaries.get(versionId)!.precos[0]!.preco = '0.00';
  const app = await setup(permissiveDependencies(repository));
  const broken = await app.inject(resumoUrl);
  expect(broken.statusCode).toBe(500);
  expect(broken.json()).toEqual(errors[7]?.corpo);
  repository.summaries.set(versionId, examples().resumo);
  expect((await app.inject(resumoUrl)).statusCode).toBe(200);
  repository.histories.get(`${versionId}/${profileId}`)!.precos[0]!.preco = '0.00';
  expect((await app.inject(`${historicoUrl}?${historyQuery}`)).statusCode).toBe(500);
  repository.histories.set(`${versionId}/${profileId}`, examples().historico);
  expect((await app.inject(`${historicoUrl}?${historyQuery}`)).statusCode).toBe(200);
});
test('controla entrada antes da forma, cache e banco e protege falhas dos controles', async () => {
  const repository = new MemoryRepository();
  const deps = permissiveDependencies(repository);
  deps.entrada = {
    verificar() {
      throw new ControleErro('LIMITE_REQUISICOES', 3);
    },
  };
  const app = await setup(deps);
  const response = await app.inject(`${resumoUrl}?invalido=1`);
  expect(response.statusCode).toBe(429);
  expect(response.headers['retry-after']).toBe('3');
  expect(repository.pointerReads).toBe(0);
  deps.entrada.verificar = () => {
    throw new Error('segredo interno');
  };
  const unavailable = await app.inject(resumoUrl);
  expect(unavailable.statusCode).toBe(503);
  expect(unavailable.json()).toEqual(errors[5]?.corpo);
  expect(unavailable.headers['retry-after']).toBe('5');
});
test('recusa ligação sem controles em vez de usar fallback de produção', async () => {
  const missing = { repository: new MemoryRepository() } as unknown as AppDependencies;
  let failure: unknown;
  try {
    const app = await buildApp(missing);
    await app.close();
  } catch (error) {
    failure = error;
  }
  expect(failure).toBeInstanceOf(Error);
  expect(String(failure)).toMatch(/controle/i);
});
test('prontidão exige leitura compatível atual, sem usar cache nem publicar', async () => {
  const repository = new MemoryRepository();
  const app = await setup(permissiveDependencies(repository));
  expect((await app.inject('/internal/ready')).statusCode).toBe(200);
  await app.inject(resumoUrl);
  repository.summaries.get(versionId)!.versaoTerritorial = 'incompativel';
  const broken = await app.inject('/internal/ready');
  expect(broken.statusCode).toBe(503);
  expect(broken.headers['cache-control']).toBe('no-store');
  repository.current = null;
  expect((await app.inject(resumoUrl)).statusCode).toBe(503);
  expect((await app.inject('/internal/ready')).statusCode).toBe(503);
});

test('falha de mecanismo de admissão retorna proteção indisponível sem ler banco', async () => {
  const repository = new MemoryRepository();
  const deps = permissiveDependencies(repository);
  deps.banco = {
    run() {
      return Promise.reject(new Error('falha controle secreta'));
    },
  };
  const response = await (await setup(deps)).inject(resumoUrl);
  expect(response.statusCode).toBe(503);
  expect(response.json()).toEqual(errors[5]?.corpo);
  expect(response.headers['retry-after']).toBe('5');
  expect(repository.pointerReads).toBe(0);
});
test('admissão nega inclusive 304 com recurso já no cache', async () => {
  const deps = permissiveDependencies(new MemoryRepository());
  const app = await setup(deps);
  const first = await app.inject(resumoUrl);
  deps.banco.run = () => Promise.reject(new ControleErro('SERVICO_OCUPADO', 5));
  const response = await app.inject({
    url: resumoUrl,
    headers: { 'if-none-match': String(first.headers.etag) },
  });
  expect(response.statusCode).toBe(503);
  expect(response.json()).toEqual(errors[4]?.corpo);
  expect(response.headers['retry-after']).toBe('5');
});
test('histórico condicional desconhecido verifica disponibilidade antes de asterisco', async () => {
  const response = await (
    await setup()
  ).inject({
    url: `${historicoUrl}?perfilId=${profileId}&versaoDados=nao-publicada`,
    headers: { 'if-none-match': '*' },
  });
  expect(response.statusCode).toBe(409);
  expect(response.headers.etag).toBeUndefined();
});
test('recusa outros métodos e não expõe detalhes de falha inesperada', async () => {
  const repository = new MemoryRepository();
  const app = await setup(permissiveDependencies(repository));
  for (const method of ['POST', 'PUT', 'DELETE', 'HEAD'] as const)
    expect((await app.inject({ method, url: resumoUrl })).statusCode).toBe(400);
  repository.lerVersaoAtual = () =>
    Promise.reject(new Error('SELECT segredo FROM tabela; password=privada'));
  const response = await app.inject(resumoUrl);
  expect(response.statusCode).toBe(500);
  expect(response.json()).toEqual(errors[7]?.corpo);
  expect(response.body).not.toMatch(/SELECT|segredo|password|privada/);
});

test('controle de entrada também precede rejeição de método e caminho público desconhecido', async () => {
  const deps = permissiveDependencies(new MemoryRepository());
  deps.entrada = {
    verificar() {
      throw new ControleErro('LIMITE_REQUISICOES', 1);
    },
  };
  const app = await setup(deps);
  for (const request of [
    { method: 'POST', url: resumoUrl },
    { method: 'GET', url: '/api/v1/inexistente' },
  ] as const) {
    const response = await app.inject(request);
    expect(response.statusCode).toBe(429);
    expect(response.headers['retry-after']).toBe('1');
  }
});
