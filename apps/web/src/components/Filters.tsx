import { useState } from 'react';
import type { Filtros, Resumo } from '@pecuaria/contracts/types';

export function Filters({
  resumo,
  filtros,
  perfilAtivoId,
  disabled,
  onApply,
  onClear,
}: {
  resumo: Resumo;
  filtros: Filtros;
  perfilAtivoId: string | null;
  disabled: boolean;
  onApply: (filtros: Filtros, perfilAtivoId: string | null) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState(filtros);
  const [active, setActive] = useState(perfilAtivoId ?? resumo.perfis[0]?.id ?? '');
  const [source, setSource] = useState({ filtros, perfilAtivoId });
  const [validated, setValidated] = useState(false);
  if (source.filtros !== filtros || source.perfilAtivoId !== perfilAtivoId) {
    setSource({ filtros, perfilAtivoId });
    setDraft(filtros);
    setActive(perfilAtivoId ?? '');
    setValidated(false);
  }
  function errorsFor(value: Filtros) {
    const errors: { inicio?: string; fim?: string } = {};
    if (!value.inicio || value.inicio < resumo.janela.inicio || value.inicio > resumo.janela.fim)
      errors.inicio = 'Informe uma data inicial dentro da janela demonstrativa.';
    if (!value.fim || value.fim < resumo.janela.inicio || value.fim > resumo.janela.fim)
      errors.fim = 'Informe uma data final dentro da janela demonstrativa.';
    else if (value.inicio && value.inicio > value.fim)
      errors.fim = 'A data final deve ser igual ou posterior à data inicial.';
    return errors;
  }
  const errors = validated ? errorsFor(draft) : {};
  const eligible = resumo.perfis.filter(
    (p) =>
      (!draft.categoria || p.categoria === draft.categoria) &&
      (!draft.sexo || p.sexo === draft.sexo) &&
      (!draft.grupoRacial || p.grupoRacial === draft.grupoRacial),
  );
  const unique = (values: string[]) =>
    [...new Set(values)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const update = (key: keyof Filtros, value: string) => {
    const next = { ...draft, [key]: key === 'inicio' || key === 'fim' ? value : value || null };
    setDraft(next);
    if (key === 'categoria' || key === 'sexo' || key === 'grupoRacial' || key === 'regiaoId') {
      if (Object.keys(errorsFor(next)).length === 0) onApply(next, active || null);
      else setValidated(true);
    }
  };
  return (
    <form
      className="filters card"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setValidated(true);
        const invalid = errorsFor(draft);
        if (invalid.inicio || invalid.fim) {
          event.currentTarget
            .querySelector<HTMLInputElement>(invalid.inicio ? '[name="inicio"]' : '[name="fim"]')
            ?.focus();
          return;
        }
        onApply(draft, active || null);
      }}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Recorte da consulta</p>
          <h2>Escolha o que comparar</h2>
        </div>
        <button
          className="button button--quiet"
          type="button"
          disabled={disabled}
          onClick={onClear}
        >
          Limpar filtros
        </button>
      </div>
      <div className="filter-grid">
        <label>
          Categoria
          <select
            value={draft.categoria ?? ''}
            disabled={disabled}
            onChange={(e) => update('categoria', e.target.value)}
          >
            <option value="">Todas</option>
            {unique(resumo.perfis.map((p) => p.categoria)).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Sexo
          <select
            value={draft.sexo ?? ''}
            disabled={disabled}
            onChange={(e) => update('sexo', e.target.value)}
          >
            <option value="">Todos</option>
            {unique(resumo.perfis.map((p) => p.sexo)).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Grupo racial
          <select
            value={draft.grupoRacial ?? ''}
            disabled={disabled}
            onChange={(e) => update('grupoRacial', e.target.value)}
          >
            <option value="">Todos</option>
            {unique(resumo.perfis.map((p) => p.grupoRacial)).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Região
          <select
            value={draft.regiaoId ?? ''}
            disabled={disabled}
            onChange={(e) => update('regiaoId', e.target.value)}
          >
            <option value="">Todo o estado — Goiás</option>
            {[...resumo.regioes]
              .sort((a, b) => a.ordem - b.ordem)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
          </select>
        </label>
        <label>
          Indicadores para
          <select
            value={active}
            disabled={disabled || eligible.length === 0}
            onChange={(e) => {
              setActive(e.target.value);
              if (Object.keys(errorsFor(draft)).length === 0)
                onApply(draft, e.target.value || null);
            }}
          >
            {eligible.map((p) => (
              <option key={p.id} value={p.id}>
                {p.categoria}, {p.sexo}, {p.grupoRacial}
              </option>
            ))}
          </select>
        </label>
        <label>
          Visão da tabela
          <select
            value={draft.modoTabela}
            disabled={disabled}
            onChange={(e) =>
              setDraft((c) => ({ ...c, modoTabela: e.target.value as Filtros['modoTabela'] }))
            }
          >
            <option value="recente">Semana mais recente</option>
            <option value="periodo">Período selecionado</option>
          </select>
        </label>
        <label>
          Data inicial
          <input
            type="date"
            name="inicio"
            aria-invalid={Boolean(errors.inicio)}
            aria-describedby={errors.inicio ? 'date-start-error' : undefined}
            value={draft.inicio}
            min={resumo.janela.inicio}
            max={draft.fim}
            disabled={disabled}
            onChange={(e) => update('inicio', e.target.value)}
          />
          {errors.inicio && (
            <span id="date-start-error" role="alert">
              {errors.inicio}
            </span>
          )}
        </label>
        <label>
          Data final
          <input
            type="date"
            name="fim"
            aria-invalid={Boolean(errors.fim)}
            aria-describedby={errors.fim ? 'date-end-error' : undefined}
            value={draft.fim}
            min={draft.inicio}
            max={resumo.janela.fim}
            disabled={disabled}
            onChange={(e) => update('fim', e.target.value)}
          />
          {errors.fim && (
            <span id="date-end-error" role="alert">
              {errors.fim}
            </span>
          )}
        </label>
      </div>
      <p className="filter-hint">
        Os indicadores acompanham o perfil selecionado. A tabela estadual compara regiões e mantém
        uma linha de média demonstrativa.
      </p>
      <button type="submit" disabled={disabled || eligible.length === 0}>
        Aplicar filtros
      </button>
      {eligible.length === 0 && (
        <p role="status">Nenhum perfil corresponde à combinação. Ajuste os filtros.</p>
      )}
    </form>
  );
}
