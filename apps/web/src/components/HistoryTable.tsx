import type { PontoHistorico } from '@pecuaria/domain';
import { formatarDataCivil, formatarPreco } from '@pecuaria/domain/presentation';

export function HistoryTable({ pontos }: { pontos: PontoHistorico[] }) {
  return (
    <div className="history-text">
      <h3>Valores do histórico</h3>
      {pontos.length === 0 ? (
        <p>Histórico ainda indisponível. A tabela de preços continua acessível.</p>
      ) : (
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Valores semanais do histórico"
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Semana</th>
                <th scope="col">Média (R$/cabeça)</th>
                <th scope="col">R$/kg vivo</th>
                <th scope="col">Cobertura</th>
              </tr>
            </thead>
            <tbody>
              {pontos.map((p) => (
                <tr key={p.semana}>
                  <th scope="row">{formatarDataCivil(p.semana)}</th>
                  <td>{formatarPreco(p.media)}</td>
                  <td>{formatarPreco(p.precoPorKg)}</td>
                  <td>
                    {p.cobertura.disponiveis} de {p.cobertura.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
