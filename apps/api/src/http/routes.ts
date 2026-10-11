import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { Resumo, Historico } from '@pecuaria/contracts/types';
import { definitions, assertResumo, assertHistorico } from '@pecuaria/contracts/server';
import type { AppDependencies } from '../app.js';
import { ControleErro } from '../control/types.js';
import { ResourceCache } from '../control/resource-cache.js';
import { HttpError } from './errors.js';
import { queryFromUrl } from './query.js';
import { matchesIfNoneMatch, serializeResource, type HttpResource } from './conditional.js';
function sendResource<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  resource: HttpResource<T>,
): FastifyReply {
  reply
    .header('Cache-Control', 'public, max-age=60, must-revalidate')
    .header('ETag', resource.etag);
  if (matchesIfNoneMatch(request.headers['if-none-match'], resource.etag))
    return reply.code(304).send();
  // Sending a string bypasses any second JSON serializer. These are the hash bytes.
  return reply.type('application/json').send(resource.body);
}
export function registerRoutes(app: FastifyInstance, deps: AppDependencies): void {
  const typed = app.withTypeProvider<TypeBoxTypeProvider>();
  const parse = (request: FastifyRequest) => {
    request.query = queryFromUrl(request.raw.url ?? request.url);
    return Promise.resolve();
  };
  const run = async <T>(operation: () => Promise<T>): Promise<T> => {
    let operationFailed = false;
    let operationError: unknown;
    try {
      return await deps.banco.run(async () => {
        try {
          return await operation();
        } catch (error) {
          operationFailed = true;
          operationError = error;
          throw error;
        }
      });
    } catch (error) {
      if (error instanceof ControleErro || (operationFailed && error === operationError))
        throw error;
      throw new ControleErro('CONTROLE_INDISPONIVEL', 5);
    }
  };
  const cache = new ResourceCache<HttpResource<Resumo | Historico>>();
  const summary = (versao: string) =>
    cache.get({ operacao: 'resumo', versao }, async () => {
      const value = await run(() => deps.repository.lerResumo(versao));
      if (!value) throw new HttpError('VERSAO_INDISPONIVEL');
      assertResumo(value);
      if (value.versaoDados !== versao) throw new TypeError('Identidade interna incompatível');
      return serializeResource('resumo', value);
    });
  const entry = async (request: FastifyRequest) => {
    try {
      const forwarded = request.headers['x-forwarded-for'];
      await deps.entrada.verificar({
        remoteAddress: request.raw.socket.remoteAddress ?? '',
        forwardedFor: typeof forwarded === 'string' ? forwarded : forwarded?.join(','),
      });
    } catch (error) {
      throw error instanceof ControleErro ? error : new ControleErro('CONTROLE_INDISPONIVEL', 5);
    }
  };
  app.addHook('onRequest', async (request) => {
    if (request.url.startsWith('/api/')) await entry(request);
  });
  // Control first, then raw syntax, then existence/cache. The default query parser
  // is disabled at buildApp so nothing normalizes or decodes the raw URL earlier.
  typed.get(
    '/api/v1/mercado/resumo',
    { schema: { querystring: definitions.ConsultaResumo }, preValidation: parse },
    async (request, reply) => {
      const versao = await run(() => deps.repository.lerVersaoAtual());
      if (versao === null) throw new HttpError('DADOS_INDISPONIVEIS');
      cache.selectSummaryVersion(versao);
      return sendResource(request, reply, await summary(versao));
    },
  );
  typed.get(
    '/api/v1/mercado/historico',
    {
      schema: { querystring: definitions.ConsultaHistorico },
      preValidation: parse,
    },
    async (request, reply) => {
      const query = request.query;
      const resource = await summary(query.versaoDados);
      const resumo = resource.dados;
      assertResumo(resumo);
      if (!resumo.perfis.some((p) => p.id === query.perfilId))
        throw new HttpError('PERFIL_INEXISTENTE');
      const historico = await cache.get(
        { operacao: 'historico', versao: query.versaoDados, perfilId: query.perfilId },
        async () => {
          const value = await run(() =>
            deps.repository.lerHistorico(query.versaoDados, query.perfilId),
          );
          if (!value) throw new HttpError('PERFIL_INEXISTENTE');
          assertHistorico(value, resumo, query.perfilId);
          return serializeResource('historico', value);
        },
      );
      return sendResource(request, reply, historico);
    },
  );
  app.get('/internal/ready', async (_request, reply) => {
    // Always read real publication + compatible payload, independent of resource
    // cache. This endpoint performs no migration or publication.
    reply.header('Cache-Control', 'no-store');
    try {
      const versao = await run(() => deps.repository.lerVersaoAtual());
      if (versao === null) throw new Error('Sem publicação');
      const value = await run(() => deps.repository.lerResumo(versao));
      assertResumo(value);
      if (value.versaoDados !== versao) throw new Error('Publicação incompatível');
      return reply.send({ ready: true });
    } catch {
      throw new HttpError('DADOS_INDISPONIVEIS');
    }
  });
}
