export type BancoOperacao = 'banco' | 'ponteiro' | 'resumo' | 'historico';
interface OperationMetric {
  concluidas: number;
  falhas: number;
  totalMs: number;
  maxMs: number;
}
/** Fixed aggregate dimensions only; no IP, headers, SQL, or personal labels. */
export class ControlMetrics {
  private readonly entrada = { admitidas: 0, recusadas: 0, indisponiveis: 0 };
  private readonly banco = { admitidas: 0, recusadas: 0, ativas: 0, pico: 0 };
  private readonly operacoes: Record<BancoOperacao, OperationMetric> = {
    banco: { concluidas: 0, falhas: 0, totalMs: 0, maxMs: 0 },
    ponteiro: { concluidas: 0, falhas: 0, totalMs: 0, maxMs: 0 },
    resumo: { concluidas: 0, falhas: 0, totalMs: 0, maxMs: 0 },
    historico: { concluidas: 0, falhas: 0, totalMs: 0, maxMs: 0 },
  };
  entry(result: keyof ControlMetrics['entrada']): void {
    this.entrada[result]++;
  }
  rejectDatabase(): void {
    this.banco.recusadas++;
  }
  admitDatabase(): void {
    this.banco.admitidas++;
    this.banco.ativas++;
    this.banco.pico = Math.max(this.banco.pico, this.banco.ativas);
  }
  completeDatabase(operation: BancoOperacao, failed: boolean, ms: number): void {
    this.banco.ativas--;
    const metric = this.operacoes[operation];
    metric.concluidas++;
    if (failed) metric.falhas++;
    if (Number.isFinite(ms) && ms >= 0) {
      metric.totalMs += ms;
      metric.maxMs = Math.max(metric.maxMs, ms);
    }
  }
  snapshot() {
    return structuredClone({ entrada: this.entrada, banco: this.banco, operacoes: this.operacoes });
  }
}
