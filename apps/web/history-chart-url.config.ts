import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

/** URL do chunk compilado: o navegador precisa de outra URL para repetir um import rejeitado. */
export function historyChartUrl(): Plugin {
  const virtualId = 'virtual:history-chart-url';
  const resolvedId = `\0${virtualId}`;
  let sourceUrl: string | undefined;
  let reference: string | undefined;
  return {
    name: 'history-chart-url',
    enforce: 'pre',
    configResolved(config) {
      if (config.command === 'serve') sourceUrl = `${config.base}src/chart/HistoryChart.tsx`;
    },
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      if (sourceUrl) return `export default ${JSON.stringify(sourceUrl)};`;
      reference = this.emitFile({
        type: 'chunk',
        id: fileURLToPath(new URL('./src/chart/HistoryChart.tsx', import.meta.url)),
        // A importação dinâmica em App já preserva o default do módulo.
        preserveSignature: false,
      });
      return `export default import.meta.ROLLUP_FILE_URL_${reference};`;
    },
    resolveFileUrl({ referenceId, relativePath }) {
      if (referenceId === reference)
        return `new URL(${JSON.stringify(relativePath)}, import.meta.url).href`;
    },
  };
}
