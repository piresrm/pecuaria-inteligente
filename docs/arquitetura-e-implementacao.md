# Arquitetura e implementação

## Estado atual

A v0.1 implementa contratos compartilhados, domínio puro, API Fastify com consultas versionadas, publicação demonstrativa PostgreSQL, cliente progressivo, persistência IndexedDB e painel responsivo. A aceitação integrada está registrada em [qualidade/v0.1-aceitacao.md](qualidade/v0.1-aceitacao.md).

O ambiente usa Node.js `24.21.0`, npm `11.19.0`, TypeScript `6.0.3`, React, Tailwind CSS, Vite e Fastify. PostgreSQL `18.6` é executado no Docker Compose; Drizzle ORM `0.45.3` e `pg` `8.23.1` sustentam o módulo de banco.

## Módulos

| Local                                   | Responsabilidade                                                            |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `packages/contracts/`                   | TypeBox, Ajv, tipos, validação estrutural/semântica e JSON canônico.        |
| `packages/domain/`                      | Filtros, calendário civil, cálculos com `big.js` e apresentação localizada. |
| `apps/api/src/db/`                      | Esquema, migrações, publicação transacional e repositório de consultas.     |
| `apps/api/src/demo/`                    | Receita, SHA-256, validação e preparação dos dados demonstrativos.          |
| `apps/api/src/http/`                    | Consultas GET versionadas, erros públicos e HTTP condicional.               |
| `apps/api/src/control/`                 | Cache versionado, cota por IP, admissão ao banco e métricas agregadas.      |
| `apps/web/src/query/`                   | Cliente HTTP validado, prioridade e coordenação das consultas.              |
| `apps/web/src/storage/`                 | IndexedDB, orçamento de 10 MiB, confirmação e recuperação validada.         |
| `apps/web/src/{App,main}.tsx`           | Composição do painel, inicialização e avisos de recuperação.                |
| `tests/e2e/`, `infra/`, `compose*.yaml` | Aceitação no navegador, imagens e execução local isolada.                   |

## Dados e cálculos

A base demonstrativa fixa está em `data/demonstrativa/v0.1/`. Ela mantém seis arquivos com hashes, cadastros congelados, dez regiões do IMB, 246 municípios, oito perfis, lacunas controladas e nove cenários verificáveis. Fontes públicas fundamentam ordem de grandeza e território; os preços não são importados nem apresentados como observações reais.

O domínio preserva ausências como `null`, não trata lacunas como zero e arredonda apenas na apresentação. O modo `recente` pode usar o resumo; o modo `periodo` exige os históricos completos dos perfis elegíveis na mesma versão. Os cálculos decimais usam entradas textuais e `big.js`, sem arredondamento intermediário.

## API e interface

A API expõe consultas GET versionadas em `/api/v1/mercado/`, com validação bruta e estrita, erros públicos, ETag e revalidação. A publicação é explícita e mantém versões compatíveis. A entrada Caddy encaminha somente `/api/` pela mesma origem HTTPS e mantém a rota interna de prontidão fora do acesso público.

O cliente valida resumo, históricos e ETag, compartilha consultas equivalentes, admite até duas requisições e preserva resultados anteriores durante falhas. A persistência só confirma consultas completas; conflitos ou quota insuficiente mantêm a consulta anterior salva e os novos dados em memória com aviso.

## Referências técnicas

As decisões detalhadas permanecem nas especificações aprovadas:

- [Requisitos](superpowers/specs/2026-10-04-requisitos-v0.1-design.md)
- [Arquitetura](superpowers/specs/2026-10-04-arquitetura-v0.1-design.md)
- [Tecnologias e implantação](superpowers/specs/2026-10-06-tecnologias-e-implantacao.md)
- [Apresentação e armazenamento](superpowers/specs/2026-10-07-apresentacao-e-armazenamento-v0.1-design.md)
- [Contratos e IndexedDB](superpowers/specs/2026-10-07-contratos-api-e-indexeddb-v0.1-design.md)
- [Base demonstrativa](superpowers/specs/2026-10-07-base-demonstrativa-v0.1.md)
- [Modelo físico PostgreSQL](superpowers/specs/2026-10-07-modelo-fisico-postgresql-v0.1-design.md)
