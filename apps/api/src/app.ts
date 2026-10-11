import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { definitions, validators } from '@pecuaria/contracts/server';
import type { MercadoRepository } from './db/repository.js';
import type { EntradaControl, BancoControl } from './control/types.js';
import { sendError, HttpError } from './http/errors.js';
import { registerRoutes } from './http/routes.js';
export interface AppDependencies {
  repository: MercadoRepository;
  entrada: EntradaControl;
  banco: BancoControl;
}
export async function buildApp(deps: AppDependencies): Promise<FastifyInstance> {
  if (!deps.entrada?.verificar || !deps.banco?.run)
    throw new TypeError('Controles obrigatórios não configurados');
  const app = Fastify({
    logger: false,
    exposeHeadRoutes: false,
    routerOptions: { querystringParser: () => ({}) },
  }).withTypeProvider<TypeBoxTypeProvider>();
  // Shared strict Draft 7 validators never coerce/default/remove fields. Public
  // queries are checked after raw duplicate/encoding validation in the handlers.
  app.setValidatorCompiler(({ schema, httpPart }) => {
    if (httpPart === 'querystring' && schema === definitions.ConsultaResumo)
      return validators.ConsultaResumo;
    if (httpPart === 'querystring' && schema === definitions.ConsultaHistorico)
      return validators.ConsultaHistorico;
    throw new TypeError('Contrato de entrada não registrado');
  });
  app.setErrorHandler<FastifyError>((error, _request, reply) =>
    sendError(reply, error.validation ? new HttpError('PARAMETROS_INVALIDOS') : error),
  );
  app.setNotFoundHandler((_request, reply) =>
    sendError(reply, new HttpError('PARAMETROS_INVALIDOS')),
  );
  registerRoutes(app, deps);
  await app.ready();
  return app;
}
