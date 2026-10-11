import { assertHistorico, assertResumo, validators } from '@pecuaria/contracts/browser';
import type { Filtros, Historico, Resumo } from '@pecuaria/contracts/types';
import { calcularConsulta, filtrarConsulta } from '@pecuaria/domain';
import { MercadoError } from './client';
import { CancelledError } from './scheduler';
import type {
  Fotografia,
  MercadoGateway,
  Prioridade,
  QueryState,
  Recurso,
  Solicitacao,
} from './state';
/** Canonical state owner. Each committed snapshot is also the future storage boundary. */
export class QueryCoordinator {
  state: QueryState = {
    solicitado: null,
    exibido: null,
    geracao: 0,
    etapa: null,
    pendente: false,
    verificando: false,
    erros: {},
    ultimaVerificacao: null,
    desatualizado: false,
  };
  private listeners = new Set<(state: QueryState) => void>();
  private summary: Recurso<Resumo> | undefined;
  private histories = new Map<string, Recurso<Historico>>();
  private pendingHistories = new Map<string, Promise<Recurso<Historico>>>();
  private verification: Promise<void> | undefined;
  private disposed = false;
  private attempt = 0;
  constructor(
    private api: MercadoGateway,
    private now: () => number = () => performance.now(),
  ) {}
  async iniciar(): Promise<void> {
    const generation = this.state.geracao;
    try {
      const summary = await this.api.resumo();
      assertResumo(summary.dados);
      if (!this.current(generation)) return;
      this.summary = summary;
      await this.consultar(
        {
          categoria: null,
          sexo: null,
          grupoRacial: null,
          regiaoId: null,
          inicio: summary.dados.janela.inicio,
          fim: summary.dados.janela.fim,
          modoTabela: 'recente',
        },
        summary.dados.perfis[0]?.id ?? null,
      );
      if (this.current(generation + 1) && Object.keys(this.state.erros).length === 0)
        this.update({ ultimaVerificacao: this.now(), desatualizado: false });
    } catch (error) {
      if (!this.current(generation)) return;
      this.update({
        erros: { resumo: error instanceof Error ? error.message : 'Falha na consulta' },
      });
    }
  }
  subscribe(listener: (state: QueryState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private update(patch: Partial<QueryState>) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.state);
  }
  setStale(desatualizado: boolean) {
    this.update({ desatualizado });
  }
  consultar(filtros: Filtros, perfilAtivoId: string | null): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.api.prioritize?.();
    const geracao = this.state.geracao + 1;
    const requested = { filtros: { ...filtros }, perfilAtivoId };
    this.update({ solicitado: requested, geracao, pendente: true, erros: {} });
    return this.prepare(requested, geracao, 'consulta', false);
  }
  verificar(): Promise<void> {
    if (this.verification) return this.verification;
    if (this.disposed) return Promise.resolve();
    if (!this.state.solicitado) return this.iniciar();
    if (this.state.pendente) return Promise.resolve();
    const request = this.state.solicitado;
    const generation = this.state.geracao;
    this.update({ verificando: true, erros: {} });
    this.verification = this.prepare(request, generation, 'fundo', true).finally(() => {
      this.verification = undefined;
      if (generation === this.state.geracao) this.update({ verificando: false });
    });
    return this.verification;
  }
  private current(generation: number) {
    return !this.disposed && generation === this.state.geracao;
  }
  private async history(
    id: string,
    summary: Recurso<Resumo>,
    priority: Prioridade,
  ): Promise<Recurso<Historico>> {
    const key = `${summary.dados.versaoDados}|${id}`;
    const saved = this.histories.get(key);
    if (saved) {
      assertHistorico(saved.dados, summary.dados, id);
      return saved;
    }
    const existing = this.pendingHistories.get(key);
    if (existing)
      return existing.catch((error) => {
        if (error instanceof CancelledError && priority === 'consulta')
          return this.history(id, summary, priority);
        throw error;
      });
    const request = this.api
      .historico(id, summary.dados.versaoDados, undefined, priority)
      .then((h) => {
        assertHistorico(h.dados, summary.dados, id);
        this.histories.set(key, h);
        return h;
      })
      .finally(() => this.pendingHistories.delete(key));
    this.pendingHistories.set(key, request);
    return request;
  }
  private commit(
    summary: Recurso<Resumo>,
    histories: Record<string, Recurso<Historico>>,
    request: Solicitacao,
    stage: 'resumo' | 'completa',
    generation: number,
  ) {
    if (!this.current(generation)) return;
    const fotografia: Fotografia = {
      ...request,
      resumo: summary,
      historicos: histories,
      etapa: stage,
      resultado: calcularConsulta(
        summary.dados,
        Object.values(histories).map((h) => h.dados),
        request.filtros,
        request.perfilAtivoId,
      ),
    };
    this.update({ exibido: fotografia, etapa: stage });
  }
  private async prepare(
    request: Solicitacao,
    generation: number,
    priority: Prioridade,
    refresh: boolean,
    reconstructed = false,
  ): Promise<void> {
    const attempt = ++this.attempt;
    const current = () => this.current(generation) && attempt === this.attempt;
    let resource = 'resumo';
    try {
      const summaryFetched = refresh || !this.summary;
      const summary = summaryFetched
        ? await this.api.resumo(this.summary, priority)
        : this.summary!;
      assertResumo(summary.dados);
      if (!current()) return;
      if (!validators.FiltrosSalvos(request.filtros)) throw new TypeError('Filtros inválidos');
      const eligible = filtrarConsulta(summary.dados, request.filtros).perfis;
      const active =
        eligible.find((p) => p.id === request.perfilAtivoId)?.id ?? eligible[0]?.id ?? null;
      const normalized = { ...request, perfilAtivoId: active };
      this.update({ solicitado: normalized });
      if (!this.state.exibido && request.filtros.modoTabela === 'recente')
        this.commit(summary, {}, normalized, 'resumo', generation);
      const needed =
        request.filtros.modoTabela === 'periodo'
          ? eligible.map((p) => p.id)
          : active
            ? [active]
            : [];
      const entries = await Promise.all(
        needed.map(async (id) => {
          try {
            return [id, await this.history(id, summary, priority)] as const;
          } catch (error) {
            if (current())
              this.update({
                erros: {
                  ...this.state.erros,
                  [id]: error instanceof Error ? error.message : 'Falha no histórico',
                },
              });
            throw error;
          }
        }),
      );
      if (!current()) return;
      this.summary = summary;
      this.commit(summary, Object.fromEntries(entries), normalized, 'completa', generation);
      this.update({
        pendente: false,
        verificando: false,
        ...(summaryFetched ? { ultimaVerificacao: this.now(), desatualizado: false } : {}),
        erros: {},
      });
    } catch (error) {
      if (!current()) return;
      if (error instanceof MercadoError && error.status === 409 && !reconstructed) {
        await this.prepare(request, generation, priority, true, true);
        return;
      }
      if (Object.keys(this.state.erros).length) resource = 'consulta';
      this.update({
        pendente: false,
        verificando: false,
        erros: {
          ...this.state.erros,
          [resource]: error instanceof Error ? error.message : 'Falha na consulta',
        },
      });
    }
  }
  dispose() {
    this.disposed = true;
    this.listeners.clear();
    this.api.dispose?.();
  }
}
