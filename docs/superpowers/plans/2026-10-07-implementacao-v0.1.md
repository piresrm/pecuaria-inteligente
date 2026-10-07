# Plano de implementação da v0.1 — Pecuária Inteligente

> **Para agentes executores:** habilidade obrigatória: usar *superpowers:subagent-driven-development* ou *superpowers:executing-plans* para executar tarefa por tarefa. Os passos usam caixas de seleção. A implementação começa depois da revisão deste plano e da escolha do método pelo autor.

**Objetivo:** entregar a consulta demonstrativa de reposição em Goiás, com filtros, indicadores, histórico, persistência segura e execução local HTTPS verificável.

**Arquitetura:** React estático servido por Caddy; `/api/` encaminhado para um processo Fastify com leitura PostgreSQL. Contratos e domínio compartilhados preservam fotografia única, aritmética decimal e carregamento progressivo. Migrações e publicação demonstrativa são operações separadas com credenciais próprias.

**Tecnologias:** Node.js 24.21.0, npm 11.19.0, TypeScript 6.0.3, React, Tailwind CSS, Vite, Fastify, TypeBox/Ajv, `big.js`, Drizzle/`pg`, PostgreSQL 18.6, `idb`, Chart.js, Vitest, Testing Library, Playwright, Testcontainers, Docker Compose, Caddy e Semgrep CE.

**Especificações:** [requisitos](../specs/2026-10-04-requisitos-v0.1-design.md), [arquitetura](../specs/2026-10-04-arquitetura-v0.1-design.md), [tecnologias](../specs/2026-10-06-tecnologias-e-implantacao.md), [base](../specs/2026-10-07-base-demonstrativa-v0.1.md), [modelo físico](../specs/2026-10-07-modelo-fisico-postgresql-v0.1-design.md), [contratos](../specs/2026-10-07-contratos-api-e-indexeddb-v0.1-design.md), [qualidade](../specs/2026-10-07-testes-auditoria-e-ci-v0.1-design.md) e [apresentação e armazenamento](../specs/2026-10-07-apresentacao-e-armazenamento-v0.1-design.md).

Estado: plano documental para revisão; os arquivos e comandos descritos abaixo ainda serão implementados. As tarefas formam uma entrega integrada e sequencial, com verificações próprias; não são novos projetos de produto.

## Restrições globais

- Apenas demonstração de reposição em Goiás: oito perfis, dez regiões IMB, 246 municípios e 4.146 preços no primeiro conjunto fixo. Sem login, gestão individual de rebanho ou fonte externa de preços.
- Português brasileiro, `R$/cabeça` principal, `R$/kg de peso vivo` complementar; condições à vista, sem frete nem tributos; aviso “Dados demonstrativos” sempre visível.
- Precisão decimal textual; cálculos com `big.js`, arredondamento somente na apresentação, duas casas em preços e uma em percentuais; ausência nunca vira zero.
- `schemaVersion: "1.0.0"`; IndexedDB estrutural `1`; `versaoFormatoArquivos: "1"`. Nunca inferir ordem das fotografias pelo identificador ou relógio.
- Persistência: **10.240 KiB = 10.485.760 bytes** totais, com coexistência; não realizar novas medições de ocupação nos outros navegadores. Manter testes de limite, quota e falhas.
- Chrome, Edge, Firefox e Safari suportados em computador/celular onde disponíveis. Registrar versões; motores de Playwright não comprovam todos os produtos e aparelhos.
- Uma instância e um processo da API; cota conjunta por IP de 30 fichas iniciais, reposição de duas por segundo; até 20 operações simultâneas no banco. Sem Redis/Valkey nesta entrega.
- HTTP `public, max-age=60, must-revalidate`, `ETag` fraco, JSON determinístico; erros `no-store`. HTTPS confiável, sem ignorar certificado.
- Datas civis sem conversão de fuso; instantes UTC com milissegundos, apresentação em `America/Sao_Paulo` como horário de Brasília.
- Dependências diretas exatas, imagens por digest e ações por revisão completa, conforme os registros. Revalidar segurança e compatibilidade ao instalar; registrar alterações necessárias sem contornar conflitos.
- ESM; TypeScript `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Node: `NodeNext`, alvo `ES2023`; web: `bundler`, alvo `ES2022`, bibliotecas `ES2022`, `DOM` e `DOM.Iterable`, JSX `react-jsx`. Conferir APIs efetivamente usadas na matriz, sem presumir que alvo de compilação fornece APIs ausentes.
- Testes e operações isolados dos volumes acadêmicos. Nada de limpeza global Docker, segredos versionados, socket Docker montado na aplicação ou modo privilegiado.
- Commits granulares `<type>: <descrição em pt-BR>`, com rodapé do modelo efetivo da sessão. Não copiar o modelo desta conversa para uma execução futura sem verificá-lo. Não versionar `PROMPTS.md`.

## Foco da revisão

1. Calendários válidos com 53 semanas, intervalos vazios/invertidos e datas fora da janela: rejeitar entradas inválidas e não omitir referências (tarefas 2 e 3).
2. Resposta antiga concluída depois de filtro novo ou publicação concorrente: jamais substituir a consulta atual nem misturar fotografias (tarefas 5, 7 e 8).
3. Relógio local retrocedendo ou avançando: preservar dados válidos, ordenar confirmações por revisão e respeitar esperas monotônicas (tarefas 7 e 8).
4. Armazenamento bloqueado, removido, quota negada ou troca que excede 10 MiB: consulta continua; última confirmação válida permanece (tarefa 8).
5. Imagem/gráfico indisponíveis, rotação durante erro e mudança de largura: consulta textual permanece utilizável; dados recebidos não são buscados novamente (tarefas 9 e 10).

## Arquivos e responsabilidades

| Local | Responsabilidade |
| --- | --- |
| `package.json`, `package-lock.json`, `.node-version`, `tsconfig.base.json` | Ambiente e comandos comuns, espaços de trabalho `apps/*` e `packages/*`. |
| `.gitignore`, `.dockerignore`, `.editorconfig`, `.prettierrc.json`, `eslint.config.mjs`, `vitest.config.ts` | Fronteiras, estilo e projetos de qualidade. |
| `packages/contracts/src/` | `schemas.ts`, `types.ts`, `semantic.ts`, `canonical.ts`, `server.ts`; exportação browser somente dos validadores gerados e tipos. |
| `packages/contracts/tools/generate-validators.ts` | Geração Ajv anterior à compilação da web; saída em `src/generated/`, ignorada e reproduzível. |
| `packages/domain/src/` | `calendar.ts`, `filters.ts`, `indicators.ts`, `presentation.ts`, `types.ts` e `index.ts`. |
| `apps/api/src/db/`, `apps/api/drizzle/` | Esquema, migrações, repositório e publicação; SQL de proteção revisado. |
| `apps/api/src/demo/`, `apps/api/src/operations/` | Validação da base, migração e comandos administrativos, sem rotas públicas de escrita. |
| `apps/api/src/http/`, `apps/api/src/control/` | Rotas, entrada, erros, transporte condicional, cache, cota e admissão. |
| `apps/api/src/app.ts`, `server.ts`, `config.ts` | Construção injetável, processo e leitura explícita dos segredos. |
| `apps/web/src/query/`, `storage/` | Cliente, coordenador, estado exibido/solicitado, IndexedDB e contabilidade do orçamento. |
| `apps/web/src/components/`, `chart/`, `assets/` | Consulta acessível, identidade agro, imagens responsivas e gráfico separado. |
| `infra/`, `compose.yaml`, `compose.test.yaml` | Imagens, segredos por serviço, HTTPS, inicialização e ambiente de testes isolado. |
| `tools/quality/`, `tools/semgrep/`, `tools/assets/` | Comandos reproduzíveis de qualidade, segurança e variantes de imagens. |
| `tests/e2e/`, `playwright.config.ts`, `.github/workflows/ci.yml` | Consulta completa e trabalhos obrigatórios. |

Os testes `.test.ts`/`.test.tsx` ficam junto ao comportamento; banco real em `apps/api/tests/integration/*.test.ts`, navegador em `tests/e2e/*.spec.ts`. Cada tarefa declara os arquivos adicionais que cria. Reutilizar tipos de contratos, sem inventar modelos HTTP paralelos.

## Comandos e ambiente a materializar

| Comando na raiz | Definição |
| --- | --- |
| `npm ci` | Instala o único arquivo de dependências após sua geração revisada; requer Node/npm fixados. |
| `npm run contracts:generate` | Executa o gerador Ajv com `tsx`; testa equivalência antes de entregar. |
| `npm run build` | Gera validadores e compila contratos, domínio, API e web nessa ordem; `tsc -b` para projetos Node, Vite para web. |
| `npm run dev` | Gera contratos, inicia observação dos compartilhados, API por `tsx watch` e Vite via `concurrently`; proxy `/api/` preserva mesma origem de desenvolvimento. |
| `npm run check` | Tipos, formatação, ESLint e integridade da base; falha na primeira verificação malsucedida. |
| `npm run check:types` | `tsc -b` dos projetos Node e `tsc --noEmit` dos projetos web/testes; nenhum teste fica sem análise. |
| `npm run check:format`, `check:lint`, `check:data` | Prettier, ESLint e conferência dos seis arquivos e receita fixa. |
| `npm test`, `npm run test:unit`, `npm run test:coverage` | Projetos rápidos `dominio`, `contratos`, `api`, `componentes`; cobertura V8 no terceiro comando. |
| `npm run test:integration` | Projeto `banco` com PostgreSQL real em Testcontainers. |
| `npm run test:e2e` | Executor `tools/quality/e2e.mjs`: cria projeto Compose exclusivo, confia na CA, executa Playwright e encerra apenas seus recursos em `finally`. |
| `npm run security` | Auditoria, preparação das regras, testes de regras e Semgrep, com relatórios e códigos preservados. |
| `npm run assets:build` | Gera variantes de imagens aprovadas com ferramenta e versão registradas na tarefa 9. |
| `npm run local:prepare` | Gera segredos locais e confere ambiente, sem sobrescrever arquivos existentes; imprime instruções de confiança da CA. |
| `docker compose up --build` | Banco saudável → migração concluída → preparação inicial concluída → API pronta → Caddy. |
| `docker compose run --rm publicar --versao <id> --diretorio /dados` | Publicação explícita; serviço administrativo no perfil `operacoes`, nunca rota pública. |

`npm ci` não cria um arquivo de dependências inexistente. Na tarefa 1, gerar `package-lock.json` com instalação normal das versões exatas, revisar e passar a usar `npm ci`. Scripts administrativos usarão nomes das credenciais preparados em `infra/postgres/init-roles.sh`: `pi_migracao`, `pi_publicacao`, `pi_consulta`. Ler caminhos `_FILE` explicitamente na API/operações; imagens recebem apenas os segredos de seu papel.

## Tarefa 1: contratos executáveis e ambiente mínimo

**Arquivos:** criar manifestos e `tsconfig` de `packages/contracts/`, configurações comuns listadas acima, `packages/contracts/vitest.config.ts`, `schemas.ts`, `types.ts`, `server.ts`, `semantic.ts`, `canonical.ts`, `tools/generate-validators.ts`, `schemas.test.ts`, `semantic.test.ts` e `canonical.test.ts`. Modificar README apenas para comandos comprovadamente disponíveis.

**Interfaces:** produzir `Perfil`, `Regiao`, `PrecoRegional`, `Resumo`, `Historico`, `ConsultaSalva`, `ResumoSalvo`, `HistoricoSalvo`, `Filtros` e `Erro` a partir de TypeBox; `canonicalJson(value: unknown): string`; `assertResumo(value: unknown): asserts value is Resumo`; `assertHistorico(value: unknown, resumo: Resumo, perfilId: string): asserts value is Historico`. Exportações `@pecuaria/contracts/types`, `/server`, `/browser`; browser sem TypeBox/Ajv dinâmico.

- [ ] Preparar arquivos de exclusão e ambiente estritamente necessários aos testes; importar os exemplos documentais como entradas, sem reescrevê-los. Configurar Prettier/ESLint conforme tecnologias e Vitest conforme qualidade. Ativar somente projetos cujos módulos já existam durante a implantação incremental; no final, todos os cinco projetos são obrigatórios, sem `passWithNoTests`. Criar comandos progressivamente e executar `check` apenas sobre arquivos presentes.
- [ ] Escrever testes que aceitam os exemplos, rejeitam preço zero/número/escala excedente, LF final em identificadores, campos extras, datas impossíveis e UTC sem milissegundos. Testar `canonicalJson({b:1,a:'à'}) === '{"a":"à","b":1}'`. Verificar calendário de janela com 53 segundas-feiras, semana totalmente omitida, duplicatas e partição incompleta.
Exemplo do teste `canonicalJson preserva UTF-8 e ordena chaves`, em `canonical.test.ts`:

```ts
import { expect, test } from 'vitest';
import { canonicalJson } from './canonical.js';

test('canonicalJson preserva UTF-8 e ordena chaves', () => {
  expect(canonicalJson({ b: 1, a: 'à' })).toBe('{"a":"à","b":1}');
});
```

- [ ] Executar `npm run test:unit -- --project contratos`; confirmar falha pelas funções ausentes, distinguindo falha de configuração.
- [ ] Implementar TypeBox Draft 7, Ajv estrito sem coerção/default/remoção e formatos completos; implementar validação semântica das seis regras do contrato. Gerar validadores estáticos; teste compara aceitação/rejeição com esquema documental e servidor.
- [ ] Executar geração, testes e `npm run check`; verificar que o pacote browser não importa compilador dinâmico. Documentar instalação e versões efetivamente instaladas.
- [ ] Comitar `feat: implementa contratos e validação compartilhada`, após revisão do SQL inexistente, fronteiras e rodapé efetivo.

## Tarefa 2: domínio de consulta e indicadores

**Arquivos:** criar manifesto/configurações de `packages/domain/`, arquivos `src/` previstos e respectivos `.test.ts`; criar `tools/quality/check-data.mjs` e `fixtures.ts` para conferir/projetar a base nos testes.

**Interfaces:** consumir tipos da tarefa 1; produzir `Filtragem {perfis: Perfil[]; inicio: string; fim: string; regiaoId: string | null}`, `ConsultaCalculada {linhas: LinhaPreco[]; indicadores: Indicadores; serie: PontoHistorico[]}`, `calcularConsulta(resumo: Resumo, historicos: Historico[], filtros: Filtros, perfilAtivoId: string | null): ConsultaCalculada`, `filtrarPerfis(resumo: Resumo, filtros: Filtros): Perfil[]`. `Indicadores` contém `media`, `precoPorKg`, `variacaoSemanal`, `variacaoPeriodo`, cobertura e datas; decimais em cadeias ou `null`, nenhuma ausência convertida em zero. Tipos `LinhaPreco`, `PontoHistorico` e `Indicadores` são definidos em `types.ts`, separando dados exatos de textos formatados.

- [ ] Escrever testes CA03–CA08 com valores literais de `cenarios.json`: 3000/200 → `15.00`; média `3368.75`, cobertura 8/10; semana sem registros → `null`; 3000 → 3150 gera `150.00` e `5.0`; média `3218.75` → `3368.75` gera `4.7` e composição alterada. Uma única semana não calcula variação de período.
- [ ] Adicionar testes de filtros sem perfil elegível, período invertido/fora da janela, referência auxiliar fora do intervalo, anos bissextos e últimas datas diferentes entre perfis. Rejeitar intervalos inválidos; preservar consultas anteriores no consumidor.
- [ ] Executar `npm run test:unit -- --project dominio`; verificar falha pelo comportamento ausente.
- [ ] Implementar calendário civil e cálculos com `big.js`, sem arredondamento intermediário, séries com lacunas e comparação da semana imediatamente anterior. Formatação localizada fica em `presentation.ts`; ajustar somente resultados finais.
- [ ] Executar testes, tipos e conferência da base; garantir que filtros sobre entradas completas não realizam I/O.
- [ ] Comitar `feat: implementa filtros e indicadores demonstrativos`.

## Tarefa 3: esquema PostgreSQL e proteção por papéis

**Arquivos:** criar manifesto/configurações API, `apps/api/drizzle.config.ts`, `src/db/schema.ts`, `src/operations/migrate.ts`, `src/config.ts`, `drizzle/`, `infra/postgres/init-roles.sh`, `vitest.integration.config.ts`, `tests/integration/schema.test.ts`, `permissions.test.ts` e `helpers/database.ts`.

**Interfaces:** produzir `createDatabase(config: DatabaseConfig): DatabaseHandle` em `src/db/client.ts`, com `db`, `pool` e `close(): Promise<void>`; `DatabaseConfig` contém host, porta, base, usuário e caminho do segredo. `migrateDatabase(config: DatabaseConfig): Promise<void>` aplica histórico revisado, não sincronização direta.

- [ ] Escrever testes com contêiner da imagem fixada: sete tabelas no esquema `mercado`, linha `(1,NULL)`, PK/FK compostas, índices, `NUMERIC(12,2)` textual e peso `NUMERIC(8,2)`, calendário 52/53 semanas. Rejeitar zero, negativos, não finitos, vínculos cruzados e datas não semanais.
- [ ] Executar `npm run test:integration -- schema`; confirmar falha pelo esquema ausente; Docker indisponível é bloqueio ambiental, não aprovação.
- [ ] Gerar migração declarativa com Drizzle Kit e revisar SQL; acrescentar migrações personalizadas de gatilhos, finalização pelo servidor, imutabilidade, restrição diferível e proibição de `TRUNCATE`. Preparar papéis sem segredos nas migrações, sem `SECURITY DEFINER`.
- [ ] Testar permissões com conexões reais dos três papéis: consulta lê/não escreve; publicador insere somente em preparação e finaliza; só migração possui DDL. Reaplicação não duplica ponteiro; evolução mantém dados antigos.
- [ ] Executar integração, tipos e revisão de SQL; fechar todos os clientes em `finally`.
- [ ] Comitar `feat: cria esquema versionado e permissões do banco`.

## Tarefa 4: preparação e publicação demonstrativa

**Arquivos:** criar `src/demo/read.ts`, `validate.ts`, `recipe.ts`, respectivos testes; `src/db/publication.ts`, `src/operations/prepare.ts`, `publish.ts`, `tests/integration/publication.test.ts`.

**Interfaces:** produzir `validarBase(diretorio: string): Promise<BaseValidada>` com arquivos, cadastros, preços e SHA-256; `publicarBase(db: DatabaseHandle, base: BaseValidada, modo: 'inicial' | 'explicito'): Promise<Publicacao>`; `Publicacao {versaoDados: string; publicadoEm: string; resultado: 'publicada' | 'existente' | 'preservada'}`. A versão vem dos arquivos, e conflito de hash é erro, não sobrescrita.

- [ ] Escrever testes de igualdade integral com receita e lacunas, total atual de 4.146 preços e alterações de hash/duplicatas/escala excedente rejeitadas antes de SQL.
- [ ] Executar testes rápidos API e integração de publicação; observar falha pelo publicador ausente.
- [ ] Implementar leitura/validação fora da transação; dentro, bloquear ponteiro, inserir preparação/cadastros/preços, finalizar via gatilho, trocar ponteiro e confirmar. Repetição de versão antiga preserva ponteiro e instante; preparação inicial não sobrescreve publicação existente.
- [ ] Testar falha após carga parcial, tentativa de confirmar sem finalização, duas publicações concorrentes em conexões independentes e conflito de identidade. Instante é gerado no servidor e todas as versões publicadas ficam retidas.
- [ ] Executar integração e conferir arquivos com `sha256sum --check SHA256SUMS` no diretório da base, sem modificá-los.
- [ ] Comitar `feat: implementa publicação demonstrativa atômica`.

## Tarefa 5: repositório, API e HTTP condicional

**Arquivos:** criar `src/db/repository.ts`, `src/http/query.ts`, `routes.ts`, `errors.ts`, `conditional.ts`, `src/app.ts`, `server.ts`, `src/control/resource-cache.ts`, respectivos testes; `tests/integration/repository.test.ts` e `api.test.ts`.

**Interfaces:** `MercadoRepository {lerVersaoAtual(): Promise<string | null>; lerResumo(versao: string): Promise<Resumo | null>; lerHistorico(versao: string, perfilId: string): Promise<Historico | null>}`; `buildApp(deps: AppDependencies): Promise<FastifyInstance>` sem iniciar porta; `AppDependencies` agrega repositório e controles da tarefa 6. Nesta tarefa usar controles injetados permissivos só nos testes, nunca como padrão de produção.

- [ ] Testar via `inject()` os dois caminhos GET, resumo sem parâmetros, histórico com ambos os identificadores, duplicação mesmo com valores iguais, UTF-8/percentual inválidos, consulta de 1.025 bytes e identificadores acima de 80 caracteres. `409` precede `404` quando versão e perfil são inexistentes.
- [ ] Executar `npm run test:unit -- --project api`; confirmar falha de comportamento.
- [ ] Implementar consultas parametrizadas e fixação de versão única, ordenação contratual, duas semanas do resumo e 53/54 referências por histórico. Validar saída antes de serializar; JSON canônico produz corpo e hash únicos; erros preservam mensagens documentais sem detalhes internos.
- [ ] Testar `If-None-Match` fraco/forte/lista/asterisco; `304` sem corpo, com cabeçalhos; nova publicação não confirma etiqueta antiga. Cache compartilha carregamentos equivalentes, usa versão e TTL máximo de 60 segundos; falha não deixa promessa rejeitada guardada.
- [ ] Testar leitura durante publicação real e consulta de versão antiga retida; comparar preços/ausências com CSV. Conferir prontidão de leitura e publicação compatível em rota interna `/internal/ready`, sem expô-la pelo Caddy.
- [ ] Executar integração e testes rápidos; comitar `feat: disponibiliza consultas versionadas e revalidação HTTP`.

## Tarefa 6: limites e ciclo de vida da API

**Arquivos:** criar `src/control/ip-quota.ts`, `database-admission.ts`, `trusted-proxy.ts`, `metrics.ts` e respectivos testes; integrar controles em `app.ts`, `server.ts`, `config.ts`.

**Interfaces:** `IpQuota.consume(ip: string): {permitido: boolean; retryAfter: number}` com relógio monotônico injetado; `DatabaseAdmission.run<T>(operation: () => Promise<T>): Promise<T>`; `resolveClientIp(remote: string, forwarded: string | undefined, trusted: boolean): string`. Normalizar IPv4/IPv6 e rejeitar cabeçalhos forjados conforme arquitetura; métricas agregadas sem IP persistido.

- [ ] Testar 30 chamadas imediatas, 31ª `429`, reposição de duas por segundo, cota compartilhada por resumo/histórico/`304`/erro, recusa sem débito extra; testar IP confiável e forjado e formas IPv4-mapeadas de IPv6.
- [ ] Executar testes API com relógio controlado; confirmar falhas.
- [ ] Implementar entrada antes de consulta/cache, até 20 operações no banco sem fila ilimitada; esgotamento gera `503 SERVICO_OCUPADO`, controle indisponível gera `503 CONTROLE_INDISPONIVEL`, `Retry-After: 5`. Cache pronto não ocupa vaga, leitura do ponteiro no banco ocupa.
- [ ] Testar liberação de vaga após sucesso, erro e cancelamento sem liberar antes de a operação realmente terminar; encerramento fecha Fastify e pool. Estabelecer limite de memória do mapa IP e expiração de baldes totalmente repostos/inativos; nunca expulsar balde ativo para conceder nova cota.
- [ ] Executar cenário de dez clientes sob o mesmo IP com carga real; registrar bloqueios legítimos antes de propor mudança de valores. Conectar controles obrigatórios ao processo de produção.
- [ ] Comitar `feat: limita consultas e protege recursos da API`.

## Tarefa 7: cliente progressivo e coordenação das consultas

**Arquivos:** criar manifesto/configurações web, `src/query/client.ts`, `coordinator.ts`, `state.ts`, `scheduler.ts`, testes correspondentes; `src/main.tsx`, `App.tsx` e `tests/setup.ts` mínimos para testes.

**Interfaces:** `MercadoClient.resumo(local?: ResumoSalvo): Promise<Recurso<Resumo>>`, `historico(perfilId: string, versao: string, local?: HistoricoSalvo): Promise<Recurso<Historico>>`; `Recurso<T> {dados: T; etag: string; recebidoEm: string; verificadoEm: string}`. `QueryCoordinator.consultar(filtros: Filtros, perfilAtivoId: string | null): Promise<void>`, `verificar(): Promise<void>`, `subscribe(listener: (state: QueryState) => void): () => void`, `dispose(): void`. `QueryState` distingue solicitado/exibido, geração, recursos e etapa `resumo`/`completa`, com erros por recurso.

- [ ] Testar resumo antes de histórico/gráfico, filtros locais sem I/O quando dados completos, troca de filtros com respostas fora de ordem e requisições equivalentes compartilhadas. `304` sem corpo local válido exige recuperação sem etiqueta e nunca inventa sucesso.
- [ ] Executar projeto `componentes`; confirmar falhas com promessas e relógio controlados.
- [ ] Implementar `fetch` com `cache: 'no-cache'`, prazo de 20 segundos e validações antes de aceitar dados; até duas novas tentativas para rede/429/503, atrasos de 2/5 segundos com variação de até 20%. Respeitar maior atraso entre local e `Retry-After` segundos/data; acima de 60 segundos suspender tentativa automática. Não repetir validação/400/404/500; `409` reconstrói a fotografia preservando consulta anterior.
- [ ] Implementar um coordenador para cinco minutos em aba visível, retorno/conexão após 60 segundos, falhas com ciclos de 10/20/30 minutos e variação de até 20%; sucesso restaura cinco. Alerta depois de 15 minutos sem verificação. Aba oculta não acumula ciclos; chamada manual não contorna `Retry-After`.
- [ ] Testar relógio divergente, prioridade de consulta sobre fundo, falha no histórico sem cálculo fictício de período e troca de versão somente após dependências completas; atualizar dados juntos sem mudar filtros/posição.
- [ ] Executar testes e tipos; comitar `feat: coordena carregamento e recuperação das consultas`.

## Tarefa 8: IndexedDB e limite de 10 MiB

**Arquivos:** criar `src/storage/database.ts`, `budget.ts`, `saved-query.ts`, `recovery.ts`, testes rápidos de orçamento; criar `tests/e2e/storage.spec.ts` para transações reais. Integrar persistência ao coordenador.

**Interfaces:** `abrirArmazenamento(): Promise<StorageHandle>`; `calcularBytes(registros: RegistroPersistivel[]): number` usando `TextEncoder` sobre JSON compacto de valores e chaves; `confirmarConsulta(storage: StorageHandle, snapshot: Snapshot, revisaoEsperada: number, geracaoAtual: () => boolean): Promise<'salva' | 'conflito' | 'memoria'>`; `recuperarConsulta(storage: StorageHandle): Promise<Snapshot | null>`. `Snapshot` contém resumo, históricos requeridos e `ConsultaSalva`; `RegistroPersistivel` contém armazém, chave e envelope conforme contrato. Limite padrão exportado `ORCAMENTO_BYTES = 10_485_760`.

- [ ] Testar contagem UTF-8 com acentos, substituição da mesma chave, duas versões coexistentes, referência única e fronteira de limite: igual cabe, mais um byte não cabe. Revisão máxima segura suspende escrita; empate de uso segue `perfilId`.
- [ ] Executar testes de componentes; confirmar falha de orçamento/persistência ausentes.
- [ ] Implementar três armazéns sem índices secundários; preparar validação, hashes e bytes fora da transação. Transação `readwrite` confirma revisão/geração, grava recursos e referência e aguarda `tx.done`; nenhuma espera de rede ou validação externa dentro dela. Limpeza posterior relê revisão, protege dependências e abandona limpeza se mudou.
- [ ] Testar em IndexedDB real falha de cada escrita, quota simulada, fechamento/interrupção, migração bloqueada, duas abas, leitura consistente e conflito sem repetição da escrita antiga. Preservar consulta anterior em troca que não cabe; novos dados ficam em memória com aviso.
- [ ] Testar registros removidos/corrompidos, relógio futuro e etapa apenas de resumo; validar antes de restaurar e sempre revalidar resumo. Não realizar comparação de ocupação física entre navegadores nem oferecer funcionamento offline completo.
- [ ] Executar suíte de armazenamento quando ambiente da tarefa 10 estiver disponível; até lá não declarar confirmação transacional verificada. Comitar `feat: persiste consultas com confirmação e limite de armazenamento`.

## Tarefa 9: painel agro, imagens e gráfico separado

**Arquivos:** criar `src/components/Hero.tsx`, `Filters.tsx`, `Indicators.tsx`, `PriceTable.tsx`, `QueryStatus.tsx`, `src/chart/HistoryChart.tsx`, `src/styles.css`, testes `.test.tsx`; `src/assets/`, `docs/imagens/origens.json`, `tools/assets/generate.mjs` e seu manifesto; atualizar `App.tsx` e `index.html`.

**Interfaces:** componentes recebem `QueryState`/`ConsultaCalculada` e ações do coordenador; `HistoryChart` recebe `PontoHistorico[]` sem I/O de preços. `Hero` renderiza `picture`, com composição de pasto em largura ≥768 px e curral abaixo, efeitos CSS estáticos e `alt=""`.

- [ ] Escrever testes de aviso, rótulos/teclado, limpar filtros, indicadores do perfil ativo, datas/cobertura e resultados anteriores identificados durante erro. Falha de gráfico não remove tabela nem solicita novos preços.
- [ ] Executar testes de componentes e confirmar falhas.
- [ ] Implementar superfícies claras, verde profundo, tons de terra e faixa menor no celular; consulta sem JavaScript conserva descrição e aviso. Importar Chart.js dinamicamente após histórico; registrar só módulos necessários, lacunas sem interpolação e acesso textual completo.
- [ ] Selecionar imagens de uso autorizado ou gerar as duas composições durante a execução, usando a habilidade de imagens se aplicável. Guardar origem/direitos; preparar variantes de pasto de 768/1280/1920 px e curral de 320/480/768 px, sem ampliar original menor. Proporção 4:1 no computador e 16:9 no celular; conferir recorte dos animais.
- [ ] Fixar ferramenta de transformação e versão após verificar instalação; gerar WebP e JPEG alternativo, `srcset`/`sizes` coerentes com largura real. Meta de no máximo 30 KiB comprimidos para a variante inicial da faixa; todo o caminho essencial, incluindo fotografia, deve caber nos 100 KiB existentes. Se não couber, reduzir imagem/código ou adiar imagem decorativa até preços utilizáveis, sem elevar orçamento.
- [ ] Verificar rede: uma variante inicial, dimensões declaradas, ausência de fontes externas e consulta legível sem imagem. Rotação pode selecionar nova imagem, mas não dispara consultas de dados. Verificar contraste, foco e sinais sem depender de cor; comitar `feat: apresenta painel responsivo com identidade pecuária`.

## Tarefa 10: Compose, HTTPS e operações locais

**Arquivos:** criar `infra/api.Dockerfile`, `operations.Dockerfile`, `web.Dockerfile`, `Caddyfile`, `compose.yaml`, `compose.test.yaml`, `tools/quality/local-prepare.mjs`, `e2e.mjs`, `trust-ca.mjs`, `playwright.config.ts`, `tests/e2e/consulta.spec.ts`, `https.spec.ts`, `recovery.spec.ts`; atualizar README e AGENTS em inglês quanto aos comandos/estrutura disponíveis.

**Interfaces:** serviços `postgres`, `migrar`, `preparar`, `api`, `entrada`, `publicar`; `publicar` só no perfil `operacoes`. API em 3000 interna; Caddy `https://localhost`, portas 80/443 apenas em `127.0.0.1`, sem portas API/banco/admin Caddy no host. Segredos em `.local/secrets/`, CA em volumes próprios; exemplo contém instruções, nenhum segredo real.

- [ ] Escrever verificações da configuração efetiva e testes de fluxo HTTPS: HTTP redireciona, CA confiável, API/banco inacessíveis diretamente pelo host, `/internal/ready` não público, ausência de conteúdo misto. Falha de migração ou preparação impede entrada disponível.
- [ ] Executar `docker compose config` e testes; confirmar falha por infraestrutura ausente, sem desativar verificação TLS.
- [ ] Construir imagens em estágios com digests registrados; API com usuário sem privilégios, só JavaScript/dependências de execução e um processo. Operações têm ferramentas e credenciais próprias. PostgreSQL 18 usa volume no diretório `/var/lib/postgresql`, conforme especificação da imagem; Caddy mantém CA/configuração em volumes próprios.
- [ ] Fixar Caddy em endereço interno previsível da rede dedicada e confiar somente nesse IP para cabeçalhos encaminhados. Caddy sobrescreve cabeçalhos de origem, mantém caminho `/api/`, gzip e `ETag`; sem cache compartilhado de API, sem acesso registrado com IP. CSP usa recursos locais e bloqueia incorporação externa; HTML revalida, ativos com hash têm validade longa.
- [ ] Implementar ordem de inicialização por dependências saudáveis/concluídas. `healthcheck` a cada 5 s, prazo 3 s e 12 tentativas; operações de inicialização com prazo externo de 120 s e falha explícita. Conexão ao banco tem prazo 5 s e até cinco tentativas de abertura em inicialização com 2 s entre elas; consultas indisponíveis geram erro público, sem repetir escrita implicitamente. Executor e2e aguarda prontidão por até 180 s. API/entrada reiniciam `unless-stopped`, operações não reiniciam automaticamente.
- [ ] Documentar extração do certificado público da CA e instalação/remoção no sistema e navegador; testes confiam na CA gerada, incluindo Node e motores, sem `ignoreHTTPSErrors`/`curl -k`. Criar CA de teste exclusivamente no projeto temporário. Executar projetos Chromium/Firefox/WebKit e testes da tarefa 8, recuperação, duas abas, rotação e teclado.
- [ ] Verificar primeiro início e segundo início sem sobrescrever publicação; publicação explícita não altera versões antigas. Testar persistência após reinício e indisponibilidade posterior do banco. Comitar `feat: configura execução local segura com HTTPS`.

## Tarefa 11: segurança e integração contínua

**Arquivos:** criar `tools/semgrep/manifesto.json`, `regras/projeto.yaml`, `casos-semgrep.json`, `preparar.mjs`, `testar.mjs`, `analisar.mjs`, `.semgrepignore`, `tools/quality/audit.mjs`, `docs/qualidade/excecoes.json`, `.github/workflows/ci.yml`. Referências documentais de seleção passam a ser geradas ou conferidas por equivalência, sem edição independente.

**Interfaces:** comandos `security:audit`, `security:rules:prepare`, `security:rules:test`, `security:semgrep`; relatórios em `artifacts/security/`; avaliadores retornam código não zero por falha de execução/inventário ou achado sem exceção válida. Lista de exceções inicialmente vazia.

- [ ] Escrever testes dos avaliadores para JSON inválido, alvo ignorado, hash divergente, achado não previsto, exceção vencida/trecho alterado e saída bruta não zero. Testes positivos/negativos do Semgrep usam os 28 casos fixos, sem executar seus trechos.
- [ ] Executar testes; confirmar falha pelos avaliadores ausentes.
- [ ] Materializar manifesto e três regras próprias; obter dez YAML comunitários por revisão/hash em `.cache/semgrep/`, preservar licença e não redistribuir em Git/imagens/artefatos. Semgrep CE 1.179.0: `scan --error --strict --disable-nosem --no-rewrite-rule-ids --metrics=off --disable-version-check`, configurações locais, prazo de 10 s por regra/arquivo, tamanho 1 MiB; conferir inventário de alvos e códigos brutos.
- [ ] Implementar `npm audit --include=dev --audit-level=high --json` com relatório bruto e decisão separada; altas/críticas aplicáveis bloqueiam entrega. Não usar `|| true` ou `continue-on-error` para aprovação.
- [ ] Criar trabalhos de qualidade, integração, e2e, auditoria, Semgrep e agregador obrigatório, por `pull_request`, `push` em `main` e execução manual; `contents: read`, ações por hashes do manifesto, Docker disponível, credenciais descartáveis e nenhum segredo de implantação. Prazos: qualidade/integração 20 min, e2e 30 min, auditoria/Semgrep 10 min, agregador 5 min; Linux `ubuntu-24.04`. Retenção: cobertura/navegador 14 dias, segurança 30 dias. Agregador roda mesmo após falha e rejeita trabalho cancelado ou pulado; evidências usam `always()` sem neutralizar resultados.
- [ ] Executar localmente todos os comandos e verificar primeira execução CI quando publicada a branch. Não mudar proteção remota nem abrir/publicar PR sem autorização da etapa de entrega. Comitar `ci: verifica qualidade e segurança da aplicação`.

## Tarefa 12: aceitação, desempenho e documentação da v0.1

**Arquivos:** criar `tools/quality/performance.mjs`, `tests/e2e/performance.spec.ts`, `docs/qualidade/v0.1-aceitacao.md`; atualizar README, AGENTS e registro de tecnologias para separar entregue/planejado. Relatórios detalhados em `artifacts/`, sem dados pessoais.

**Interfaces:** relatório associa revisão, máquina, sistema, navegadores, versões, bytes por recurso/sessão, cinco execuções, percentis da API e resultados dos requisitos RF/RNF/RN e cenários CA. Não contém novas medições de ocupação do IndexedDB nos demais navegadores.

- [ ] Preparar testes de aceitação para todos os RF01–RF12/RN01–RN11, falhas de resumo/histórico/gráfico/atualização, teclado, rotação e consulta com cache. Fixar expectativas independentes dos cálculos e não mascarar primeira falha com repetição.
- [ ] Executar `npm run check`, `npm test`, `npm run test:integration`, `npm run build`, `npm run test:e2e` e `npm run security`; nenhum comando inexistente ou suíte pulada pode ser marcado como aprovado.
- [ ] Medir Chromium a 400 kbit/s download, 200 kbit/s upload, RTT 800 ms, CPU 4×, em 440×956 e 956×440. Cinco navegações sem cache: pelo menos quatro atendem 10 s primeiros preços, 15 s histórico/indicadores, 18 s gráfico. Transferência: essencial ≤100 KiB, resumo ≤40 KiB, histórico individual ≤100 KiB e gráfico adicional ≤60 KiB; filtro local ≤200 ms. Registrar também todos os oito históricos sem atribuir ao total o limite individual.
- [ ] Medir API com dez consultas simultâneas, p95 ≤500 ms de servidor, planos `EXPLAIN (ANALYZE, BUFFERS)` e liberação de recursos. Se limites falharem, investigar e reduzir trabalho/transferência; alteração do orçamento exige decisão registrada.
- [ ] Completar revisão manual de foco/teclado e testes axe, contraste do fundo e recortes de imagens, ambas as orientações; registrar limites dos motores e aparelhos usados sem exigir nova medição de ocupação nos outros navegadores.
- [ ] Documentar comandos realmente executados, confiança/remoção da CA, segredos locais, origem das imagens, fórmulas, limites e restauração/reinício. A v0.2 terá licença, visibilidade pública e tag próprias; não publicá-las automaticamente nesta tarefa.
- [ ] Comitar `docs: registra execução e aceitação da v0.1`. Aplicar revisão de conclusão da branch; preparar descrição com Propósito, Alterações e Validação quando a publicação da implementação for autorizada.

## Revisão deste plano

A cobertura das definições se distribui em contratos (1), domínio (2), esquema (3), publicação (4), consultas HTTP (5), controles (6), coordenação (7), persistência (8), interface (9), execução HTTPS (10), qualidade (11) e aceitação (12). Os cinco focos de revisão têm testes nos passos indicados. Todas as tarefas usam as mesmas identidades de fotografia, contratos e coordenador; não há fonte externa de preços, serviço offline completo, retenção automática do banco ou mecanismo distribuído.

As escolhas de infraestrutura que detalham o ambiente são propostas executáveis deste plano para revisão; não evidências de instalação. Dependências, bibliotecas de imagens e APIs dos navegadores devem ser verificadas ao materializar arquivos. Se uma tarefa depender de ferramenta ausente, registrar o bloqueio e continuar somente trabalho independente; não marcar verificações como passadas.

## Entrega do plano

Revisar este documento e escolher execução pelo próprio agente com *superpowers:executing-plans* ou execução por agentes com *superpowers:subagent-driven-development*. Recomenda-se execução pelo próprio agente, porque o fluxo depende sequencialmente dos contratos, publicação e coordenador. A escolha e a revisão do plano precedem qualquer implementação.
