import { ConsultaSalva as validarConsultaSalva } from '@pecuaria/contracts/browser';
import type { Fotografia, QueryPersistence } from '../query/state';
import { abrirArmazenamento, type StorageHandle } from './database';
import { recuperarConsulta, restaurarFotografia } from './recovery';
import { confirmarConsulta, criarSnapshot } from './saved-query';
/** Lazy opening; an invalidated connection gets one fresh open on the next operation. */
export class BrowserPersistence implements QueryPersistence {
  private handle: Promise<StorageHandle> | undefined;
  private active: StorageHandle | undefined;
  private closed = false;
  constructor(private onAviso: (aviso: string) => void = () => {}) {}
  private async getHandle(): Promise<StorageHandle> {
    if (this.closed) throw new Error('Armazenamento fechado');
    if (this.active && !this.active.disponivel) {
      this.active = undefined;
      this.handle = undefined;
    }
    this.handle ??= abrirArmazenamento(this.onAviso);
    try {
      const h = await this.handle;
      if (this.closed) {
        h.db.close();
        throw new Error('Armazenamento fechado');
      }
      this.active = h;
      return h;
    } catch (error) {
      this.handle = undefined;
      throw error;
    }
  }
  async capturar() {
    const h = await this.getHandle();
    const tx = h.db.transaction('metadados', 'readonly');
    const done = tx.done;
    void done.catch(() => {});
    const c = await tx.store.get('consultaSalva');
    await done;
    if (c !== undefined && !validarConsultaSalva(c))
      throw new TypeError('Referência salva inválida');
    return c ?? null;
  }
  async recuperar() {
    const s = await recuperarConsulta(await this.getHandle());
    return s ? restaurarFotografia(s) : null;
  }
  async confirmar(foto: Fotografia, revisaoEsperada: number | null, geracaoAtual: () => boolean) {
    const h = await this.getHandle();
    if (revisaoEsperada === Number.MAX_SAFE_INTEGER) return 'memoria' as const;
    return confirmarConsulta(
      h,
      criarSnapshot(foto, (revisaoEsperada ?? 0) + 1),
      revisaoEsperada,
      geracaoAtual,
    );
  }
  fechar() {
    this.closed = true;
    this.active?.db.close();
    if (this.active) this.active.disponivel = false;
  }
}
