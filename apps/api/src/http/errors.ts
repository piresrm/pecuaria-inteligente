import type { FastifyReply } from 'fastify';
import type { Erro } from '@pecuaria/contracts/types';
import { ControleErro } from '../control/types.js';
import { DatabaseReadError } from '../db/repository.js';
type Code = Erro['erro']['codigo'];
const errors: Record<Code, { status: number; mensagem: string }> = {
  PARAMETROS_INVALIDOS: { status: 400, mensagem: 'Parâmetros de consulta inválidos.' },
  PERFIL_INEXISTENTE: { status: 404, mensagem: 'Perfil não encontrado.' },
  VERSAO_INDISPONIVEL: { status: 409, mensagem: 'Versão de dados indisponível.' },
  LIMITE_REQUISICOES: { status: 429, mensagem: 'Limite de requisições atingido.' },
  SERVICO_OCUPADO: { status: 503, mensagem: 'Serviço ocupado. Tente novamente mais tarde.' },
  CONTROLE_INDISPONIVEL: {
    status: 503,
    mensagem: 'Controle de acesso temporariamente indisponível.',
  },
  DADOS_INDISPONIVEIS: { status: 503, mensagem: 'Dados temporariamente indisponíveis.' },
  ERRO_INTERNO: { status: 500, mensagem: 'Não foi possível concluir a consulta.' },
};
export class HttpError extends Error {
  constructor(readonly codigo: Code) {
    super(codigo);
  }
}
export function sendError(reply: FastifyReply, error: unknown): FastifyReply {
  const codigo =
    error instanceof ControleErro || error instanceof HttpError
      ? error.codigo
      : error instanceof DatabaseReadError
        ? 'DADOS_INDISPONIVEIS'
        : 'ERRO_INTERNO';
  const { status, mensagem } = errors[codigo];
  if (error instanceof ControleErro)
    reply.header(
      'Retry-After',
      codigo === 'LIMITE_REQUISICOES' &&
        Number.isSafeInteger(error.retryAfter) &&
        error.retryAfter > 0
        ? error.retryAfter
        : 5,
    );
  return reply
    .code(status)
    .header('Cache-Control', 'no-store')
    .type('application/json')
    .send({ schemaVersion: '1.0.0', erro: { codigo, mensagem } } satisfies Erro);
}
