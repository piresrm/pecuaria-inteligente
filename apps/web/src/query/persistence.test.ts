// @vitest-environment node
import { expect, it } from 'vitest';
import type { ConsultaSalva, Historico, Resumo } from '@pecuaria/contracts/types';
import type { Fotografia, Recurso } from './state';
import { QueryCoordinator } from './coordinator';
import { MercadoError } from './client';
import resumoJson from '../../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json';
import historicoJson from '../../../../docs/superpowers/contracts/v0.1/historico.exemplo.json';
const resumo = resumoJson as Resumo;
const historico = historicoJson as Historico;
const recurso = <T>(dados: T): Recurso<T> => ({
  dados,
  etag: 'W/"v1-resumo-' + 'a'.repeat(64) + '"',
  recebidoEm: '2026-10-07T12:00:00.000Z',
  verificadoEm: '2026-10-07T12:00:00.000Z',
});
const filtros = {
  categoria: 'Bezerro' as const,
  sexo: 'Macho' as const,
  grupoRacial: 'Nelore' as const,
  regiaoId: null,
  inicio: resumo.janela.inicio,
  fim: resumo.janela.fim,
  modoTabela: 'recente' as const,
};
const ref = (revision: number, version = resumo.versaoDados): ConsultaSalva => ({
  chave: 'consultaSalva',
  revisao: revision,
  schemaVersion: '1.0.0',
  versaoDados: version,
  etapa: 'completa',
  filtros,
  perfilAtivoId: historico.perfilId,
  perfisHistorico: [historico.perfilId],
});
it('bootstrap captura uma única revisão antes de rede e salva somente fotografia completa', async () => {
  const events: string[] = [];
  let saved: Fotografia | undefined;
  let token: number | null | undefined;
  const port = {
    capturar: () => {
      events.push('captura');
      return Promise.resolve(ref(7));
    },
    recuperar: () => Promise.resolve(null),
    confirmar: (f: Fotografia, r: number | null) => {
      saved = f;
      token = r;
      events.push('salva');
      return Promise.resolve('salva' as const);
    },
  };
  const c = new QueryCoordinator(
    {
      resumo: () => {
        events.push('rede');
        return Promise.resolve(recurso(resumo));
      },
      historico: () => Promise.resolve(recurso(historico)),
    },
    () => 0,
    port,
  );
  await c.iniciar();
  expect(events).toEqual(['captura', 'rede', 'salva']);
  expect(token).toBe(7);
  expect(saved?.etapa).toBe('completa');
});
it('reconstrução409 leva token original e conflito seguinte revalida resumo se versão salva mudou', async () => {
  let captured = ref(1);
  const tokens: (number | null)[] = [];
  let summaries = 0;
  let firstHistory = true;
  const port = {
    capturar: () => Promise.resolve(captured),
    recuperar: () => Promise.resolve(null),
    confirmar: (_f: Fotografia, r: number | null) => {
      tokens.push(r);
      captured = ref(2, 'nova');
      return Promise.resolve('conflito' as const);
    },
  };
  const c = new QueryCoordinator(
    {
      resumo: () => {
        summaries++;
        return Promise.resolve(
          recurso({ ...resumo, versaoDados: summaries >= 3 ? 'nova' : resumo.versaoDados }),
        );
      },
      historico: (_id: string, v: string) => {
        if (firstHistory) {
          firstHistory = false;
          return Promise.reject(new MercadoError('rotacionou', 409));
        }
        return Promise.resolve(recurso({ ...historico, versaoDados: v }));
      },
    },
    () => 0,
    port,
  );
  await c.consultar(filtros, historico.perfilId);
  expect(tokens).toEqual([1]);
  expect(summaries).toBe(2);
  expect(c.state.avisoArmazenamento).toBeTruthy();
  await c.consultar({ ...filtros, regiaoId: 'centro-goiano' }, historico.perfilId);
  expect(summaries).toBe(3);
  expect(tokens).toEqual([1, 2]);
  expect(c.state.exibido?.resumo.dados.versaoDados).toBe('nova');
});
it('quota preserva nova consulta completa em memória e mostra aviso', async () => {
  const c = new QueryCoordinator(
    {
      resumo: () => Promise.resolve(recurso(resumo)),
      historico: () => Promise.resolve(recurso(historico)),
    },
    () => 0,
    {
      capturar: () => Promise.resolve(null),
      recuperar: () => Promise.resolve(null),
      confirmar: () => Promise.resolve('memoria'),
    },
  );
  await c.consultar(filtros, historico.perfilId);
  expect(c.state.etapa).toBe('completa');
  expect(c.state.avisoArmazenamento).toBeTruthy();
  expect(c.state.erros).toEqual({});
});
it('captura indisponível nunca vira ausência válida para sobrescrever disco', async () => {
  let writes = 0;
  const c = new QueryCoordinator(
    {
      resumo: () => Promise.resolve(recurso(resumo)),
      historico: () => Promise.resolve(recurso(historico)),
    },
    () => 0,
    {
      capturar: () => Promise.reject(new Error('indisponível')),
      recuperar: () => Promise.resolve(null),
      confirmar: () => {
        writes++;
        return Promise.resolve('salva');
      },
    },
  );
  await c.iniciar();
  expect(writes).toBe(0);
  expect(c.state.etapa).toBe('completa');
  expect(c.state.avisoArmazenamento).toBeTruthy();
});
it('restauração usa fronteira commit e sempre revalida resumo preservando filtros', async () => {
  const { calcularConsulta } = await import('@pecuaria/domain');
  const restored: Fotografia = {
    filtros: { ...filtros, regiaoId: 'centro-goiano' },
    perfilAtivoId: historico.perfilId,
    resumo: recurso(resumo),
    historicos: { [historico.perfilId]: recurso(historico) },
    etapa: 'completa',
    resultado: calcularConsulta(
      resumo,
      [historico],
      { ...filtros, regiaoId: 'centro-goiano' },
      historico.perfilId,
    ),
  };
  let resolve!: () => void;
  const pending = new Promise<void>((r) => {
    resolve = r;
  });
  let revalidated = false;
  const c = new QueryCoordinator(
    {
      resumo: async (local) => {
        revalidated = local?.dados === resumo;
        await pending;
        throw new Error('sem rede');
      },
      historico: () => Promise.resolve(recurso(historico)),
    },
    () => 0,
    {
      capturar: () => Promise.resolve(ref(1)),
      recuperar: () => Promise.resolve(restored),
      confirmar: () => Promise.resolve('salva'),
    },
  );
  const initial = c.iniciar();
  await new Promise((r) => setTimeout(r, 0));
  expect(c.state.exibido?.filtros.regiaoId).toBe('centro-goiano');
  expect(c.state.recuperado).toBe(true);
  expect(c.state.verificando).toBe(true);
  expect(revalidated).toBe(true);
  resolve();
  await initial;
  expect(c.state.exibido?.filtros.regiaoId).toBe('centro-goiano');
  expect(c.state.ultimaVerificacao).toBeNull();
});
