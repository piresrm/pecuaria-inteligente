import { ControleErro, type BancoControl } from './types.js';
import { ControlMetrics, type BancoOperacao } from './metrics.js';
/** No queue. Consumer cancellation cannot end the actual database operation. */
export class DatabaseAdmission implements BancoControl {
  private active = 0;
  constructor(
    private readonly metrics = new ControlMetrics(),
    private readonly now: () => number = () => performance.now(),
    private readonly capacity = 20,
  ) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20)
      throw new TypeError('Capacidade do banco inválida');
  }
  async run<T>(operation: () => Promise<T>, name: BancoOperacao = 'banco'): Promise<T> {
    if (this.active >= this.capacity) {
      this.metrics.rejectDatabase();
      throw new ControleErro('SERVICO_OCUPADO', 5);
    }
    // Clock failure must occur before reserving a slot or beginning the query.
    const start = this.now();
    if (!Number.isFinite(start)) throw new ControleErro('CONTROLE_INDISPONIVEL', 5);
    this.active++;
    this.metrics.admitDatabase();
    let failed = false;
    try {
      return await operation();
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      this.active--;
      // Metrics never mask query errors or leak a slot if their clock fails.
      let duration = NaN;
      try {
        duration = this.now() - start;
      } catch {
        /* timing unavailable */
      }
      this.metrics.completeDatabase(name, failed, duration);
    }
  }
}
