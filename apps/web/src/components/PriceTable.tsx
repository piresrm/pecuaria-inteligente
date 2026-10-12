import type { Resumo } from '@pecuaria/contracts/types';
import type { ConsultaCalculada } from '@pecuaria/domain';
import { formatarDataCivil, formatarPreco } from '@pecuaria/domain/presentation';

export function PriceTable({
  resumo,
  resultado,
}: {
  resumo: Resumo;
  resultado: ConsultaCalculada;
}) {
  const perfis = new Map<string, (typeof resumo.perfis)[number]>(
    resumo.perfis.map((p) => [p.id, p]),
  );
  const regioes = new Map<string, (typeof resumo.regioes)[number]>(
    resumo.regioes.map((r) => [r.id, r]),
  );
  const rows = resultado.linhas;
  return (
    <section className="table-section card" aria-labelledby="prices-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Quadro de preços</p>
          <h2 id="prices-title">Preços de reposição</h2>
        </div>
        <span className="table-count">{rows.length} linhas</span>
      </div>
      <p className="table-intro">
        Valores demonstrativos em reais. Ausência de preço aparece como dado indisponível.
      </p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabela de preços">
        <table aria-label="Preços de reposição por região e perfil">
          <caption>
            {resultado.linhas.some((r) => r.regiaoId === null)
              ? 'Média demonstrativa de Goiás, sem ponderação por volume negociado.'
              : 'Preços do recorte selecionado.'}
          </caption>
          <thead>
            <tr>
              <th scope="col">Região</th>
              <th scope="col">Perfil</th>
              <th scope="col">Idade</th>
              <th scope="col">Peso de referência</th>
              <th scope="col">Data</th>
              <th scope="col">R$/cabeça</th>
              <th scope="col">R$/kg vivo</th>
              <th scope="col">Cobertura</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((line, index) => {
              const perfil = perfis.get(line.perfilId);
              const regiao = line.regiaoId ? regioes.get(line.regiaoId) : null;
              return (
                <tr key={`${line.perfilId}:${line.regiaoId ?? 'goias'}:${index}`}>
                  <th scope="row">{regiao?.nome ?? 'Média demonstrativa — Goiás'}</th>
                  <td>
                    {perfil
                      ? `${perfil.categoria}, ${perfil.sexo}, ${perfil.grupoRacial}`
                      : 'Perfil indisponível'}
                  </td>
                  <td>{perfil ? `${perfil.idadeReferenciaMeses} meses` : '—'}</td>
                  <td>{perfil ? `${perfil.pesoReferencia.replace('.', ',')} kg` : '—'}</td>
                  <td>{line.semana ? formatarDataCivil(line.semana) : 'Sem preço'}</td>
                  <td>{formatarPreco(line.preco)}</td>
                  <td>{formatarPreco(line.precoPorKg)}</td>
                  <td>
                    {line.cobertura.disponiveis} de {line.cobertura.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p role="status">Nenhum resultado para esta combinação. Ajuste ou limpe os filtros.</p>
      )}
    </section>
  );
}
