# Qualidade e limitações

## Verificações

O projeto segue TDD e usa Vitest para contratos, domínio e API, React Testing Library para componentes, Testcontainers com PostgreSQL real para integração e Playwright para o fluxo completo. `make check` verifica tipos, formatação e lint; `make data` valida a base fixa; `make verify` adiciona build, bundle, políticas locais e segurança; `make acceptance` acrescenta banco, desempenho e E2E.

O workflow `.github/workflows/ci.yml` separa qualidade, integração PostgreSQL, navegador, auditoria e Semgrep. O gate `aprovacao` falha se algum trabalho terminar com falha, cancelado ou pulado.

## Segurança

`npm run security:audit` registra o JSON bruto e a decisão do `npm audit`, bloqueando achados altos ou críticos sem exceção válida. `npm run security:semgrep` analisa fontes, testes, configurações, Docker, Compose e workflows. As regras comunitárias são obtidas por revisão e hash para uso local, sem redistribuição.

As imagens e redes locais usam usuários sem privilégios, segredos em arquivos separados, portas públicas limitadas ao Caddy e certificados explícitos. A CA não é instalada automaticamente no host e nenhuma instrução de avaliação deve desativar TLS.

## Critérios de sucesso

- localizar uma cotação e entender seu contexto sem ambiguidade;
- comparar apenas dados compatíveis, sinalizando diferenças relevantes;
- reproduzir indicadores a partir das entradas e fórmulas documentadas;
- manter testes para ingestão, normalização e cálculos críticos;
- oferecer navegação responsiva e acessível nas consultas principais;
- documentar limitações e medir a utilidade dos fluxos com usuários do público-alvo.

## Limitações conhecidas

- A v0.1 usa dados demonstrativos; a validação de fontes reais está planejada para a v0.3.
- A frequência de atualização dependerá da disponibilidade, do histórico, da qualidade e das permissões de cada fonte.
- A persistência local confirma somente consultas completas e não fornece funcionamento offline completo.
- Quota ou conflito no IndexedDB preserva a consulta salva anterior e mantém os novos dados em memória com aviso.
- A aceitação E2E cobre Chromium, Firefox e WebKit em ambiente isolado, mas não comprova todos os produtos Chrome, Edge, Firefox e Safari, aparelhos físicos ou ocupação do IndexedDB em outros motores.
- Metas de rede, tempo de resposta e inferências para todos os navegadores comerciais permanecem fora da aceitação atual.
- Controles de cota por IP podem afetar usuários atrás do mesmo endereço; a v0.1 não coordena múltiplos processos.
- Modelos preditivos, alertas, favoritos, integrações externas e cobertura ampliada dependem de versões futuras e de dados suficientes.

## Evidências detalhadas

- [Aceitação integrada v0.1](qualidade/v0.1-aceitacao.md)
- [Testes, auditoria e CI](superpowers/specs/2026-10-07-testes-auditoria-e-ci-v0.1-design.md)
- [Tecnologias e implantação](superpowers/specs/2026-10-06-tecnologias-e-implantacao.md)
- [Base demonstrativa](superpowers/specs/2026-10-07-base-demonstrativa-v0.1.md)
