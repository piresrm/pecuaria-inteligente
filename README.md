# Pecuária Inteligente

Central brasileira de inteligência de mercado para acompanhar preços e apoiar decisões na cadeia pecuária: **cria, recria, engorda, abate e leite**.

## Contexto

As decisões de compra, reposição e comercialização na pecuária dependem de informações distribuídas entre diferentes regiões, categorias de animais e etapas produtivas. Uma cotação isolada não explica a rentabilidade de uma operação: é necessário considerar histórico, condições comerciais, custos e diferenças regionais.

A Pecuária Inteligente propõe reunir essas informações em uma experiência integrada, com critérios claros de comparação e identificação das fontes. O projeto é desenvolvido como um MVP acadêmico, com apoio de inteligência artificial no processo de engenharia de software. O contexto acadêmico e as orientações de desenvolvimento estão em [ABOUT.md](ABOUT.md).

## Objetivo

Oferecer uma plataforma brasileira única de consulta e análise de mercado pecuário, permitindo que produtores, gestores e consultores compreendam os movimentos de preços e avaliem cenários de compra e venda com base em dados rastreáveis.

## Proposta de valor

- Centralizar cotações e indicadores de diferentes etapas da cadeia.
- Comparar preços por região, praça, categoria e período, respeitando as características de cada dado.
- Relacionar preços de venda, reposição e custos para apoiar a análise de margens.
- Disponibilizar históricos, visualizações e simulações com premissas explícitas.
- Apresentar fonte, data de referência, unidade e condições comerciais de cada informação.
- Tornar a consulta acessível em computador e celular, com uma interface em português.

## Monitoramento de mercado e gestão do rebanho

O núcleo da plataforma é o **monitoramento de mercado**: preços, históricos, indicadores, tendências e cenários de comercialização.

A **gestão do rebanho** envolve registros individuais de animais, pesagens, reprodução, sanidade, alimentação e desempenho dentro da propriedade. Esse conjunto de atividades fica fora do escopo inicial.

Dados da propriedade poderão ser informados como parâmetros de simulação e, em _releases_ futuras, recebidos por integrações. Essa possibilidade serve para contextualizar as análises de mercado para cada operação.

## Público-alvo

- Criadores interessados em preços de bezerros, matrizes e reposição.
- Recriadores e produtores de engorda que precisam avaliar relações de troca e margens.
- Agentes da cadeia de abate que acompanham categorias, praças e condições comerciais.
- Produtores de leite que analisam preços, qualidade e custos de alimentação.
- Consultores e gestores que apoiam decisões em diferentes operações pecuárias.

## Cobertura pretendida

| Segmento | Informações e decisões a apoiar                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| Cria     | Preços de bezerros e matrizes; histórico e sazonalidade da reposição.                                              |
| Recria   | Preços de garrotes e boi magro; relação de troca e ágio da reposição.                                              |
| Engorda  | Preço do boi gordo; custos de referência e cenários de margem.                                                     |
| Abate    | Cotações por categoria e praça; condições comerciais e referências de carcaça e atacado, conforme disponibilidade. |
| Leite    | Preços por região e período; parâmetros de qualidade e relação entre receita e custo de alimentação.               |

A cobertura será ampliada gradualmente. Cada _release_ deverá informar quais regiões, categorias, períodos e fontes estão efetivamente disponíveis.

## Funcionalidades planejadas

### Consulta e análise

Painel de preços, filtros por segmento e região, séries históricas e comparação entre categorias e praças. As visualizações deverão distinguir valores observados, estimativas e dados demonstrativos.

### Indicadores e simuladores

Relação de troca, ágio da reposição e cenários de receita, custo e margem. Cada cálculo deverá apresentar suas entradas, unidades, premissas e limitações. Simulações que envolvam peso vivo e carcaça deverão explicitar o rendimento considerado; regras de bonificação do leite deverão identificar região, metodologia e vigência.

### Acompanhamento personalizado

Favoritos e alertas por categoria, praça ou faixa de preço, previstos para depois da validação do fluxo principal de consulta.

### Apoio analítico

Análises de tendências e, em uma etapa posterior, avaliação de modelos preditivos. A adoção de IA na plataforma dependerá de dados suficientes e validação dos resultados; o uso de IA no desenvolvimento não significa que já exista previsão automatizada no produto.

## Princípios dos dados

1. **Rastreabilidade:** identificar fonte, data de referência e momento da coleta.
2. **Comparabilidade:** explicitar unidade, categoria, região, prazo de pagamento, frete e tratamento de tributos quando disponíveis.
3. **Atualidade visível:** sinalizar dados desatualizados e lacunas de cobertura.
4. **Separação entre observação e estimativa:** diferenciar cotações coletadas, indicadores calculados e projeções.
5. **Uso autorizado:** avaliar permissões de coleta, armazenamento, exibição e redistribuição antes de integrar cada fonte.
6. **Premissas transparentes:** documentar fórmulas e parâmetros para permitir conferência dos resultados.

## Fases de _release_ propostas

Este _roadmap_ prioriza o **mercado de reposição para cria e recria em Goiás**. A **v0.1 entregará uma interface funcional com dados fictícios de bezerros e garrotes**, permitindo explorar o apoio da IA na definição de requisitos, no desenho da interface, na implementação e nos testes. A obtenção de dados reais será uma etapa posterior e não condicionará essa primeira entrega.

Os dados fictícios serão consistentes e identificados visivelmente como **demonstrativos**, sem serem apresentados como cotações reais. Sua estrutura contemplará categoria, região, data, preço e unidade, preparando a substituição por dados reais.

A ampliação geográfica ficará limitada ao **Centro-Oeste brasileiro (Goiás, Mato Grosso, Mato Grosso do Sul e Distrito Federal)** neste planejamento. Nas etapas com dados reais, cada cotação deverá identificar seu mercado de origem. Caso não haja uma fonte viável para Goiás, poderá ser definido um piloto em outra unidade do Centro-Oeste, com a mudança de escopo documentada.

| Fase                                               | Foco                                                                                                                                                                                                                           | Critério de conclusão                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v0.1 — Interface funcional com dados fictícios** | Consulta de preços de bezerros e garrotes em Goiás, filtros por categoria, região e período, tabela de cotações, gráfico histórico e variação de preços entre períodos.                                                        | Fluxo de consulta completo e verificável, dados identificados como demonstrativos, comportamento dos filtros e cálculos testado e instruções de execução documentadas. Nenhuma fonte externa é necessária para concluir esta versão.                                                                                                                                                                |
| **v0.2 — Submissão acadêmica**                     | Preparar a interface demonstrativa da v0.1 para avaliação, cumprindo o Checklist de Submissão do [ABOUT.md](ABOUT.md) e seus requisitos de licença e publicação.                                                               | Repositório público sem informações sensíveis, histórico consistente, README completo com execução, exemplos, tecnologias, limitações, créditos e licença, arquivo de dependências, testes executáveis passando e uma _release_ ou _tag_ de entrega. Não exige novas funcionalidades nem dados reais.                                                                                               |
| **v0.3 — Validação e importação de dados reais**   | Validar pelo menos uma fonte para reposição em Goiás, obter uma amostra histórica e implementar importação por arquivo CSV. Definir cobertura, unidades, periodicidade e condições de uso.                                     | Amostra real importada e verificável, com fonte, data, unidade e características do animal visíveis. Dados reais e demonstrativos claramente separados; eventual recorte alternativo no Centro-Oeste documentado.                                                                                                                                                                                   |
| **v0.4 — Indicadores e comparações**               | Ampliar as comparações e incorporar relação de troca e ágio quando houver cotações e parâmetros compatíveis. O boi gordo poderá entrar como referência para esses cálculos.                                                    | Fórmulas verificadas, com unidades e premissas explícitas, sem misturar peso vivo e carcaça ou mercados diferentes sem identificação.                                                                                                                                                                                                                                                               |
| **v0.5 — Atualização e ampliação regional**        | Definir rotina de atualização, exportar consultas e ampliar a cobertura em Goiás e, conforme viabilidade, no Centro-Oeste. Automatizar a importação quando houver acesso estável e autorizado.                                 | Atualização rastreável, lacunas sinalizadas e cobertura efetiva documentada, com comparações restritas a dados compatíveis.                                                                                                                                                                                                                                                                         |
| **v1.0 — Plataforma pronta para uso público**      | Consolidar o escopo de monitoramento de mercado validado e preparar o software para implantação e utilização pelo público geral.                                                                                               | Dados reais com uso autorizado, atualização operacional, fluxos essenciais validados com usuários, testes passando, segurança e acessibilidade verificadas e documentação de implantação, operação e suporte disponível. Termos de uso e licença adequados ao uso público definidos. O lançamento depende da prontidão do produto, sem exigir cobertura de toda a cadeia ou de todo o Centro-Oeste. |
| **Após v1.0 — Expansão da cadeia e dos recursos**  | Investigar engorda, abate e leite, mantendo Goiás como prioridade e o Centro-Oeste como limite geográfico deste planejamento. Avaliar favoritos, alertas, integrações e modelos preditivos conforme necessidade e viabilidade. | Cada expansão terá requisitos próprios, fontes validadas e critérios de qualidade definidos antes de sua implementação.                                                                                                                                                                                                                                                                             |

A visão de longo prazo continua abrangendo toda a cadeia pecuária brasileira. **A primeira entrega será um MVP demonstrativo de monitoramento de mercado para cria e recria em Goiás**. Seu valor acadêmico estará no fluxo funcional e no aprendizado sobre o uso de IA nas etapas da construção de software. A integração de dados reais, a expansão da cadeia e as previsões automatizadas ficam para entregas posteriores. A v0.2 formaliza a submissão acadêmica da v0.1, sem ampliar seu escopo funcional. As evoluções v0.3 a v0.5 serão posteriores à submissão. A **v1.0 será lançada somente quando o software estiver pronto para implantação e utilização pelo público geral**, no escopo validado. Poderão ser necessárias outras versões v0.x para atingir essa prontidão. As versões indicam uma sequência proposta, sem datas fixadas; a entrega acadêmica não exige dados reais nem cobertura de todo o Centro-Oeste.

## Estado atual

Estão implementados os contratos compartilhados em `packages/contracts/`, o domínio puro em `packages/domain/` e a API Fastify com consultas versionadas, revalidação HTTP e publicação demonstrativa em `apps/api/`, com filtros, indicadores decimais, calendário civil, apresentação localizada, migrações e testes executáveis. Os contratos oferecem tipos, validação estrutural e semântica e serialização determinística. A aplicação completa da v0.1 permanece em desenvolvimento; este README distingue a entrega atual das funcionalidades previstas no _roadmap_.

A arquitetura da v0.1 foi definida e aprovada. TypeScript, React, Tailwind CSS, Vite e Fastify em Node.js foram escolhidos em conversa. O ambiente adotado usa Node.js 24 LTS, TypeScript 6.0.3 e npm com espaços de trabalho; Prettier e ESLint verificam os contratos, o domínio, a API e suas configurações; os demais módulos serão incorporados progressivamente.

O banco escolhido é PostgreSQL 18.6, com persistência em volume no Docker Compose. O módulo de banco usa Drizzle ORM `0.45.3` com o _driver_ `pg` `8.23.1`; o histórico SQL foi gerado com Drizzle Kit `0.31.11`, revisado e complementado com gatilhos e permissões. O [modelo físico](docs/superpowers/specs/2026-10-07-modelo-fisico-postgresql-v0.1-design.md) define sete tabelas, cadastros e preços por versão, precisão decimal, publicação atômica e retenção de todas as versões durante a entrega acadêmica.

Os contratos implementados usam TypeBox e Ajv; o domínio calcula médias, conversões e variações com `big.js` 7.0.1. A persistência no navegador usa IndexedDB com `idb` 8.0.4; o gráfico será feito com Chart.js, carregado separadamente. Os [contratos e o armazenamento local](docs/superpowers/specs/2026-10-07-contratos-api-e-indexeddb-v0.1-design.md) já têm campos, limites, exemplos verificáveis e confirmação atômica especificados.

A [apresentação aprovada](docs/superpowers/specs/2026-10-07-apresentacao-e-armazenamento-v0.1-design.md) terá indicadores em destaque, verde profundo, tons de terra e faixa com imagens responsivas de gado no pasto e boi no curral, sobreposição e degradê. Chrome, Edge, Firefox e Safari compõem a matriz de suporte. O orçamento total do IndexedDB é de 10.240 KiB (10 MiB), contando chaves, envelopes, referência e coexistência antes da limpeza; o autor dispensou novas medições de ocupação nos demais navegadores. O painel e as imagens responsivas locais estão implementados; a fotografia decorativa é carregada após os primeiros preços utilizáveis para preservar o orçamento essencial.

O desenvolvimento seguirá TDD. Foram adotados Vitest para domínio e API, React Testing Library para componentes e Playwright para a consulta completa. Os testes de integração usam PostgreSQL real com Testcontainers, em bases exclusivas e com credenciais descartáveis. npm organizará as dependências; GitHub Actions executará as verificações, incluindo auditoria com `npm audit` e análise obrigatória com Semgrep Community Edition. A [configuração de testes, auditoria e CI](docs/superpowers/specs/2026-10-07-testes-auditoria-e-ci-v0.1-design.md) já define projetos, isolamento, prazos, evidências e seleção de regras. Manifesto, regras próprias e casos verificados estão em [`docs/superpowers/quality/v0.1/`](docs/superpowers/quality/v0.1/); as comunitárias serão obtidas por revisão e hash para uso local, sem redistribuição no repositório.

A execução da v0.1 e da entrega acadêmica v0.2 será local, via Docker Compose, com uma única instância e um único processo da API. Caddy servirá a interface e encaminhará `/api/` pela mesma origem HTTPS, com certificado emitido por uma autoridade local. Os controles por IP e de concorrência serão mantidos em memória; Valkey ou Redis serão avaliados em versões futuras, antes de ampliar para múltiplas instâncias.

A base demonstrativa fixa foi preparada em `data/demonstrativa/v0.1/`: oito perfis, dez regiões do IMB, 246 municípios e 4.146 preços fictícios, com lacunas controladas. O histórico cobre outubro de 2025 a setembro de 2026, além da semana anterior para comparação. Fontes públicas fundamentam os parâmetros e o território; os preços são demonstrativos. A [documentação da base](docs/superpowers/specs/2026-10-07-base-demonstrativa-v0.1.md) registra pesquisa, condições comerciais, reprodução e verificação.

O [plano de implementação da v0.1](docs/superpowers/plans/2026-10-07-implementacao-v0.1.md) organiza contratos, domínio, banco, API, consulta, persistência, interface, HTTPS e qualidade em tarefas verificáveis de TDD. Contratos, ambiente, domínio, esquema do banco, publicação demonstrativa e consultas versionadas da API estão implementados; controles concretos de entrada/admissão, configuração executável e encerramento por sinais também estão implementados; o cliente progressivo, a persistência, o painel de consulta e a execução local com HTTPS também estão implementados.

Os [exemplos documentais](docs/superpowers/contracts/v0.1/) são entradas dos testes de equivalência entre o esquema de referência, as declarações TypeBox e os validadores do servidor e do navegador. O pacote também valida calendário, cadastros, preços únicos, cobertura regional, fontes e correspondência entre resumo e histórico. A instalação e as verificações dos contratos, do domínio e da API estão disponíveis abaixo. A integração contínua permanece pendente nesta etapa; a v0.1 utilizará apenas dados demonstrativos.

### Dados disponíveis

Os arquivos CSV e JSON da base fixa estão em [`data/demonstrativa/v0.1/`](data/demonstrativa/v0.1/). Para conferir sua integridade com GNU Coreutils, na raiz do repositório:

```bash
(cd data/demonstrativa/v0.1 && sha256sum --check SHA256SUMS)
```

### Organização da implementação

`packages/contracts/`, `packages/domain/`, os módulos de banco, publicação demonstrativa e consultas HTTP de `apps/api/` e a preparação de papéis em `infra/postgres/` estão implementados. O cliente progressivo, a persistência IndexedDB e o painel responsivo em `apps/web/` também estão disponíveis. Os demais diretórios registram a organização prevista para as etapas seguintes.

| Local                                                         | Responsabilidade                                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `apps/web/src/query/`                                         | Cliente HTTP validado, fotografia consistente, prioridade e coordenação das consultas implementados. |
| `apps/web/src/storage/`                                       | IndexedDB, orçamento UTF-8, confirmação por revisão/geração e recuperação validada.                  |
| `apps/web/src/{App,main}.tsx`                                 | Composição do painel, recuperação validada e avisos de uso em memória.                               |
| `apps/web/src/components/`, `apps/web/src/chart/`             | Faixa responsiva, filtros, indicadores, tabelas e gráfico carregado após o histórico.                |
| `apps/web/src/formatters.ts`                                  | Apresentação dos instantes no horário de Brasília, separada das datas civis.                         |
| `apps/web/src/assets/`, `docs/imagens/`, `tools/assets/`      | Imagens WebP/JPEG locais, fontes, origem e transformação reproduzível com manifesto.                 |
| `apps/api/src/db/`, `apps/api/drizzle/`                       | Esquema, cliente, histórico SQL, publicação transacional e repositório de consultas implementados.   |
| `apps/api/src/demo/`                                          | Leitura dos seis arquivos, SHA-256, validação e reprodução da receita fora da transação.             |
| `apps/api/src/operations/`                                    | Migração, preparação inicial e publicação explícita implementadas.                                   |
| `apps/api/src/http/`, `apps/api/src/app.ts`                   | Consultas GET, validação bruta e estrita, erros públicos e HTTP condicional.                         |
| `apps/api/src/control/`, `apps/api/src/server.ts`             | Cache versionado, cota por IP, admissão ao banco, métricas agregadas e servidor executável.          |
| `apps/api/tests/integration/`, `infra/postgres/init-roles.sh` | Testes PostgreSQL isolados e preparação dos três papéis com segredos em arquivos.                    |
| `packages/contracts/`                                         | Contratos, tipos e geração dos validadores compartilhados.                                           |
| `packages/domain/`                                            | Filtros e cálculos independentes da interface e do servidor.                                         |
| `tests/e2e/`                                                  | Verificação da consulta completa com Playwright.                                                     |
| `infra/` e `compose.yaml`                                     | Imagens, entrada HTTPS e configuração local dos serviços.                                            |
| `.github/workflows/`                                          | Testes, compilação e verificações de qualidade e segurança.                                          |

### Cliente progressivo

`npm run web:dev` inicia Vite para desenvolvimento; os GET usam `/api/v1/mercado/` na mesma origem. A consulta integrada usa Caddy/Compose descritos abaixo; o Vite isolado serve apenas desenvolvimento. `npm run build` gera validadores, compila contratos/domínio/API e depois compila a interface.

O cliente valida resumo, históricos e `ETag` canônico UTF-8, compartilha consultas equivalentes e admite até duas requisições. Preserva resultados anteriores durante falhas e preparação de nova versão; somente confirma a fotografia completa após todos os históricos exigidos. Filtros locais reutilizam dados completos. `304` sem corpo validado recupera sem etiqueta; `409` busca resumo e reconstrói. Rede/429/503 têm até duas novas tentativas de 2/5 segundos com variação de até 20%, prazo de 20 segundos e respeito a `Retry-After`, inclusive na ação manual.

O agendamento verifica a cada cinco minutos em aba visível, considera retorno/conexão após 60 segundos, suspende ciclos ocultos/offline e cresce para 10/20/30 minutos em falha. O painel mantém aviso demonstrativo, estado, filtros, indicadores do perfil ativo, datas, cobertura e condições comerciais. Tabelas textuais conservam todos os valores e lacunas mesmo quando o gráfico falha; repetir o gráfico não consulta preços novamente. `DESIGN.md` registra os tokens da apresentação aprovada; `premium-ui.json` declara os responsáveis e gates. Os testes de coordenação pura usam ambiente Node; interação e HTTP usam jsdom, com doubles explícitos de mídia na suíte de App. Nenhum teste emulado comprova canvas, fotografia, contraste ou a matriz de navegadores. A verificação integrada em HTTPS e a matriz final de desempenho do painel integrado permanecem na tarefa 12.

Vite `8.3.3` é dependência direta também na raiz para deduplicar a Vite transitiva do Vitest; cópias `8.3.3`/`8.3.4` provocavam conflito nas declarações de `Environment`/Rolldown. jest-dom `7.0.1` usa o entrypoint oficial de matchers explícitos e um adaptador local de tipos para `Matchers<R,T>` do Vitest `5.0.3`, pois sua integração `/vitest` ainda declara `Assertion<T>`. Não há alteração em `node_modules` nem `skipLibCheck` na interface.

As imagens não usam fontes externas. `npm run assets:generate` reproduz variantes sem ampliação a partir de `docs/imagens/fontes/` e atualiza `tools/assets/manifest.json`, com versão do Sharp, dimensões, parâmetros, bytes e SHA-256; direitos e prompts estão em `docs/imagens/origens.json`. O aviso e a descrição também permanecem no HTML sem JavaScript.

Após `npm run build`, `npm run check:bundle` mede HTML, JavaScript, CSS e assets do caminho estático por gzip e verifica **100 KiB = 102.400 bytes**, além de **60 KiB = 61.440 bytes** adicionais para o gráfico. Fotografias ficam em módulo separado carregado depois dos preços; a medição real de rede e tempo permanece necessária na T12.

### Ambiente e verificações dos módulos implementados

Usar Node.js `24.21.0` e npm `11.19.0`, fixados em `.node-version` e no manifesto. Ativar essa instalação antes dos comandos; `.npmrc` rejeita versões incompatíveis. Na raiz:

```bash
node --version
npm --version
npm ci
npm run contracts:generate
npm run build
npm run check:bundle
npm run assets:generate
npm run check
npm run check:data
npm test
npm exec -- vitest run --project dominio
npm exec -- vitest run --project api
npm exec -- vitest run --project componentes
npm run test:coverage
npm run test:integration
```

`npm ci` instala o `package-lock.json` único, incluindo dependências de desenvolvimento. Os únicos _scripts_ de instalação aprovados são os do esbuild `0.28.2`, `0.25.12` e `0.18.20`, usados pelas ferramentas e pelo Drizzle Kit para preparar seus binários. Os instaladores opcionais de `cpu-features`, `protobufjs` e `ssh2` foram revisados e bloqueados explicitamente; não são necessários à integração Docker local. As versões verificadas incluem Chart.js `4.5.1` (MIT), Sharp `0.35.5` (Apache-2.0, ferramenta de desenvolvimento), TypeScript `6.0.3`, TypeBox `1.3.36`, Ajv `8.20.0`, ajv-formats `3.0.1`, Vitest e cobertura V8 `5.0.3`, ESLint `10.12.0` e Prettier `3.9.9`.

A geração produz `packages/contracts/src/generated/` com validadores estáticos autocontidos e preserva as licenças dos auxiliares puros de terceiros. Esses arquivos e `dist/` são ignorados e reproduzíveis. Testes e análise de tipos regeneram os validadores automaticamente; a compilação entrega as exportações `@pecuaria/contracts/types`, `/server` e `/browser`. Importar `/types` com `import type`; `/browser` inclui validadores, assertivas semânticas e `canonicalJson`, sem compilador dinâmico ou módulos Node.

Nesta etapa, os projetos Vitest `contratos`, `dominio`, `api`, `componentes` e `banco` estão ativos. `npm test` executa as quatro suítes rápidas, incluindo componentes; `npm run test:integration` executa o banco real e exige Docker disponível. `npm run check` verifica tipos de produção, ferramentas e testes, formatação e ESLint dos arquivos presentes. A cobertura V8 abrange os contratos, o domínio e os módulos implementados da API e fica em `artifacts/coverage/unit/`; ela não representa a aplicação completa. A prova isolada do pacote de navegador não substitui a futura validação funcional na matriz de navegadores.

O pacote `@pecuaria/domain` exporta `filtrarPerfis`, `filtrarConsulta` e `calcularConsulta`, além dos tipos `Filtragem`, `ConsultaCalculada`, `LinhaPreco`, `PontoHistorico` e `Indicadores`. Recebe respostas previamente validadas dos contratos e filtros tipados; mantém decimais em cadeias e ausência em `null`. Na visão estadual, cada perfil tem dez linhas regionais e uma média; na regional, uma linha. A última data depende do perfil e do recorte, e a série conserva todas as segundas-feiras do intervalo com lacunas reais.

O modo `recente` usa a janela inteira: o resumo permite tabela e comparação semanal, enquanto série e variação do período ficam pendentes até chegar o histórico ativo. O modo `periodo` exige históricos completos de todos os perfis elegíveis, da mesma versão. Combinações sem perfil elegível produzem resultado vazio com perfil ativo nulo. Intervalos inválidos ou históricos incompatíveis são rejeitados sem alterar entradas; preservar a consulta anterior é responsabilidade do futuro consumidor.

Os cálculos usam um construtor isolado de `big.js`, com entradas textuais e 40 casas nas divisões, sem arredondamento intermediário para as casas de exibição. `@pecuaria/domain/presentation` aplica duas casas para preços, uma para percentuais e empate para longe de zero, sem converter decimais para ponto flutuante. `tools/quality/check-data.mjs`, executado por `npm run check:data`, verifica os seis SHA-256, reproduz o CSV integralmente, confere calendário, território, lacunas e os nove cenários com aritmética racional independente. A projeção `packages/domain/src/fixtures.ts` é exclusiva dos testes e fica fora da compilação de produção; os arquivos fixos permanecem intactos.

### Migrações e integração PostgreSQL

`npm run test:integration -- schema` seleciona os testes estruturais. Cada arquivo de integração com banco cria um contêiner PostgreSQL `18.6-bookworm`, fixado pelo índice `sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c`, com base exclusiva, segredos temporários e encerramento dos seus recursos. Não usa volumes acadêmicos. O início do contêiner tem prazo de 60 segundos, a preparação de 120 segundos e cada teste de 30 segundos; indisponibilidade do Docker falha a execução.

O esquema `mercado` mantém sete tabelas, chaves compostas por versão, decimais e datas civis textuais no Drizzle. Consultas SQL personalizadas usam o protocolo textual padrão de `pg`: o cliente preserva `DATE` como texto com conversor local ao conjunto de conexões, sem alterar conversores globais ou monetários. O protocolo binário não foi validado e fica fora desse contrato. Gatilhos impedem conteúdo mutável, confirmação de preparação incompleta e truncamento. A finalização confere metadados e contagens do manifesto e atribui o instante no servidor. A operação demonstrativa confere a igualdade integral dos preços e das lacunas com a receita antes da carga; contagens SQL não substituem essa conferência.

`infra/postgres/init-roles.sh` prepara os papéis `mercado_consulta`, `mercado_publicador` e `mercado_migracao` na inicialização de uma base nova. Exige `POSTGRES_USER`, `POSTGRES_DB`, `CONSULTA_PASSWORD_FILE`, `PUBLICADOR_PASSWORD_FILE` e `MIGRACAO_PASSWORD_FILE`; os três últimos apontam para segredos distintos, montados apenas nos serviços autorizados. A consulta tem leitura; o publicador insere conteúdo em preparação e altera apenas colunas de finalização e o ponteiro; a migração é proprietária do esquema. A integração executa esse mesmo script e testa conexões reais dos três papéis.

Para uma base já provisionada com esses papéis, definir `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER=mercado_migracao` e `DB_PASSWORD_FILE` no ambiente local e executar `npm run db:migrate`. O comando lê explicitamente o arquivo do segredo, aplica o histórico com o migrador oficial do Drizzle e fecha as conexões, inclusive após falha. Não publica dados demonstrativos. `npm run db:generate -- --name descricao` gera a próxima migração a partir do esquema; revisar SQL e metadados antes de aplicar. Funções, gatilhos e concessões usam migrações personalizadas; não editar histórico já aplicado nem sincronizar tabelas diretamente.

### Consultas versionadas e HTTP condicional

A API usa Fastify `5.12.5` e `@fastify/type-provider-typebox` `6.1.0`. Estão implementados `GET /api/v1/mercado/resumo` sem parâmetros e `GET /api/v1/mercado/historico?perfilId=bezerro-macho-nelore&versaoDados=go-reposicao-demo-2026-10-07-r1`. O resumo entrega cadastros e as duas últimas segundas-feiras; o histórico entrega um perfil, todas as semanas da janela e a referência auxiliar, preservando preços decimais textuais e ausências explícitas. A versão solicitada nunca é substituída pela atual.

`createRepository(handle)` usa credenciais de leitura e consultas SQL parametrizadas via Drizzle em `READ COMMITTED`, sempre fixando uma única versão. O resumo consulta o ponteiro real antes de selecionar o recurso em _cache_, inclusive para `304`. Uma publicação concorrente mantém a fotografia escolhida íntegra; versões antigas permanecem consultáveis. Saídas passam pelos validadores estruturais e semânticos antes do _cache_ e da serialização.

Respostas `200` usam JSON compacto canônico, `ETag` fraco SHA-256 dos mesmos bytes UTF-8 e `Cache-Control: public, max-age=60, must-revalidate`. `If-None-Match` aceita comparação fraca, etiquetas fortes, listas e `*`; `304` preserva etiqueta e política, sem corpo. O _cache_ compartilha carregamentos equivalentes, separa operação/versão/perfil, expira em até 60 segundos e remove cargas rejeitadas. Erros públicos usam `no-store`, mensagens do contrato e nenhum detalhe interno. A consulta bruta preserva duplicatas, valida percentual/UTF-8 uma vez e limita 1.024 bytes antes da decodificação.

`buildApp({ repository, entrada, banco })` monta o Fastify sem abrir porta e exige os controles de entrada e admissão. `EntryControl` resolve a origem pelo socket e pela configuração explícita de _proxies_, antes de consulta, _cache_, erros, métodos desconhecidos e caminhos inválidos. `IpQuota` oferece 30 permissões iniciais e repõe duas por segundo, compartilhadas por resumo, históricos, `304` e erros; recusas por cota não debitam permissões adicionais. `DatabaseAdmission` admite até 20 operações simultâneas sem fila; toda leitura do repositório ocupa vaga, inclusive o ponteiro antes de `304`, enquanto o conteúdo já no _cache_ não ocupa. Uma vaga só é liberada quando a promessa da operação realmente termina, mesmo se o consumidor cancelar a espera.

A falta de cota responde `429 LIMITE_REQUISICOES` com `Retry-After` inteiro, arredondado para cima e mínimo de um segundo. Saturação do banco responde `503 SERVICO_OCUPADO`; indisponibilidade de controles responde `503 CONTROLE_INDISPONIVEL`, ambas com `Retry-After: 5`. Erros usam `no-store`. O mapa admite até 10.000 IPs; baldes com pelo menos 60 segundos inativos e completamente repostos expiram na próxima varredura, limitada a uma por segundo durante tráfego. Sem balde descartável, novas identidades recebem `503`; baldes ativos nunca são expulsos para conceder cota nova. O custo máximo de varredura é linear em 10.000 entradas; esse teto limita entradas, sem garantir um número exato de bytes do V8. Os identificadores ficam apenas na memória do processo.

`API_TRUSTED_PROXIES` lista endereços exatos, canonicalizados, da rede Caddy. Conexões fora dessa lista usam o IP do socket e ignoram `X-Forwarded-For`. Uma conexão confiável deve encaminhar exatamente um IP válido; ausência, cadeia com vírgula, porta, escopo IPv6 ou endereço inválido respondem `503 CONTROLE_INDISPONIVEL`. IPv4 mapeado em IPv6 converge à identidade IPv4, e formas equivalentes de IPv6 compartilham a cota. Caddy sobrescreve o cabeçalho e a configuração Compose mantém a API sem portas publicadas, conforme a seção de execução local.

`iniciarAplicacao(config)` cria o conjunto de conexões, o repositório e os controles obrigatórios, verifica conectividade e inicia HTTP. `SIGTERM`, `SIGINT`, fechamento explícito e falhas de inicialização fecham Fastify e o _pool_, sem migrar nem publicar. `iniciarServidor(deps, options, lifecycle)` permite responsabilidade explícita pelos recursos ao consumidor; controles permissivos permanecem exclusivos dos testes. Métricas são contadores agregados de admissão/recusa, concorrência e latência total/máxima por ponteiro, resumo e histórico, acessíveis ao consumidor em `metrics.snapshot()`, sem IPs nem endpoint público de métricas. Não há Redis/Valkey nem coordenação de processos múltiplos.

Após `npm run build`, inicie o processo com `npm run api:start`, usando a identidade de consulta e um arquivo de segredo montado. Por exemplo, para desenvolvimento local com PostgreSQL já configurado:

```bash
NODE_ENV=development \
API_HOST=127.0.0.1 API_PORT=3000 API_PROXY_MODE=direct \
DB_HOST=127.0.0.1 DB_PORT=5432 DB_NAME=pecuaria DB_USER=mercado_consulta \
DB_PASSWORD_FILE=/run/secrets/consulta \
npm run api:start
```

O modo é obrigatório: `API_PROXY_MODE=direct` serve desenvolvimento/testes explícitos; `NODE_ENV=production` exige `API_PROXY_MODE=trusted` e `API_TRUSTED_PROXIES` com os endereços efetivos do Caddy. Nenhum modo é inferido silenciosamente. `API_HOST` e `API_PORT` também são obrigatórios. `API_QUOTA_CAPACITY`, `API_QUOTA_REFILL_PER_SECOND` e `API_DATABASE_CONCURRENCY` permitem reduzir os limites no servidor, com máximos e padrões de 30, 2 e 20; o cenário validado manteve todos os padrões.

`apps/api/tests/integration/controls.test.ts` exercita dez clientes sob o mesmo IP com HTTP e PostgreSQL reais: abertura, histórico, troca de perfil e revalidação automática. A rajada de 40 consultas legítimas excede a cota compartilhada; o teste registra admissões, bloqueios e métricas em `artifacts/t6/load.json`, ignorado pelo Git. Esses bloqueios são uma limitação para usuários atrás do mesmo IP e devem ser considerados na futura experiência de espera; os limites aprovados foram preservados.

A rota interna `/internal/ready` consulta a publicação real e valida sua compatibilidade, sem usar o _cache_, migrar ou publicar. Retorna `200` apenas quando a leitura e os dados estão preparados; ausência, incompatibilidade ou falha de leitura retornam `503`. A entrada Caddy encaminha somente `/api/` à API e responde `404` à rota interna; a seção de execução local descreve HTTPS e compressão.

```bash
npm exec -- vitest run --project api apps/api/src/app.test.ts
npm run test:integration -- repository api.test
```

### Preparação e publicação demonstrativa

Após provisionar os papéis e aplicar as migrações, definir `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER=mercado_publicador` e `DB_PASSWORD_FILE`. Os comandos aceitam um diretório explícito; sem argumento, usam a base fixa do repositório.

```bash
npm run demo:prepare
npm run demo:publish -- /caminho/do/novo/conjunto
npm run test:integration -- publication
```

`demo:prepare` publica a primeira base ou preserva uma publicação atual compatível. Compatibilidade exige versão finalizada, instante finito, formato de arquivos `1`, natureza `demonstrativa` e território `imb-regplan-2018`; uma publicação incompatível causa erro. `demo:publish` publica explicitamente um conjunto novo. Ambos validam os arquivos antes de abrir conexão e encerram as conexões também após falha. A saída informa `versaoDados`, `publicadoEm` e `resultado` (`publicada`, `existente` ou `preservada`).

`validarBase(diretorio)` em `apps/api/src/demo/validate.ts` retorna arquivos, cadastros, preços, receita e SHA-256 dos bytes de `SHA256SUMS`. Confere os seis arquivos, cadastros congelados completos, calendário, decimais, unicidade, condições, referências, contagens, estrutura dos nove cenários e igualdade integral com a receita. O primeiro conjunto contém 4.146 preços; conjuntos novos seguem suas próprias contagens e lacunas. Os resultados numéricos dos cenários são conferidos pelo oráculo independente `check:data` e pelos testes de domínio; hash e estrutura válidos de um novo conjunto não substituem essa conferência acadêmica.

`publicarBase(db, base, modo)` em `apps/api/src/db/publication.ts` usa uma transação Drizzle `READ COMMITTED`: bloqueia primeiro o ponteiro único, verifica identidade, insere preparação e conteúdo, solicita a finalização no servidor e troca o ponteiro antes de confirmar. O gatilho atribui `publicadoEm` em UTC com milissegundos. Repetir uma versão com o mesmo hash conserva seu instante e o ponteiro atual, inclusive quando ela é antiga; hash diferente causa conflito. Todas as versões publicadas ficam retidas. Falha na carga ou confirmação sem finalização desfaz toda a preparação.

Por incompatibilidades das declarações do Drizzle `0.45.3` com TypeScript `6.0.3` e referências a outros _drivers_ opcionais, `skipLibCheck` está ativo somente na configuração da API. Código, testes e configurações próprios continuam sob `strict`, `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`; contratos e domínio mantêm a checagem integral das declarações. Reavaliar essa limitação ao atualizar dependências.

A auditoria inicial do banco identificou quatro ocorrências moderadas na cadeia de desenvolvimento do Drizzle Kit, associadas a [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99), sem ocorrências altas ou críticas. A geração usa transformação de código e gravação de arquivos; não inicia o servidor de desenvolvimento afetado. A migração usa o migrador do ORM. Drizzle Kit e suas dependências de desenvolvimento devem ficar fora da futura imagem de consulta; a auditoria será repetida na integração de segurança.

## Execução local com Compose e HTTPS

Docker Engine `29.8.2` e Compose `5.6.0` são as referências verificadas. Os comandos locais usam o UID/GID não privilegiado do proprietário dos segredos, sem ampliar suas permissões. Na raiz, com Node.js e npm adotados:

```sh
npm run local:prepare
npm run local:up
npm run local:ca
docker compose cp entrada:/data/caddy/pki/authorities/local/root.crt .local/root.crt
```

Por padrão, a entrada publica somente em `127.0.0.1`. Para uma avaliação
temporária em outro dispositivo da mesma LAN, habilite explicitamente o bind:

```sh
BIND_ADDRESS=0.0.0.0 ALLOW_LAN=1 SITE_HOST=192.168.1.50 npm run local:up
```

API e PostgreSQL continuam sem portas publicadas. Use esse modo apenas em uma
rede confiável e encerre-o com `npm run local:down` ao terminar.

Substitua `192.168.1.50` pelo endereço LAN do computador. O celular deve abrir
`https://192.168.1.50` e confiar na CA pública copiada para `.local/root.crt`.

`local:prepare` cria quatro arquivos independentes em `.local/secrets/`, com diretório `0700` e arquivos `0600`; preserva arquivos existentes. A API recebe apenas o segredo de consulta; migração e publicação recebem suas credenciais próprias. PostgreSQL e consumidores usam `RUNTIME_UID:RUNTIME_GID`, obtidos do usuário do host, inclusive UID 1001 em CI. Antes de iniciar, o executor confere tipo de arquivo, modo `0600`, proprietário UID/GID e leitura dos quatro segredos, sem registrar seus conteúdos. Para instalação nova, o *entrypoint* oficial cria o volume com essa identidade; manter os mesmos identificadores nos próximos inícios. Volume criado por outra identidade exige decisão explícita de migração manual; os comandos não ajustam seu proprietário nem removem volumes existentes para corrigir permissões. `local:up` valida a configuração efetiva, constrói imagens e aguarda prontidão por até 180 segundos. O fluxo exige PostgreSQL saudável, migração e preparação concluídas, API pronta e entrada saudável. As operações têm prazo externo de 120 segundos; abertura inicial de conexão tem prazo de cinco segundos por tentativa e até cinco tentativas, com dois segundos entre elas. Nenhuma consulta ou escrita é repetida automaticamente por esse mecanismo.

A origem é `https://localhost`; HTTP redireciona com `308`. Somente `127.0.0.1:80` e `127.0.0.1:443` são publicadas. API, PostgreSQL e administração Caddy não têm portas publicadas. API e PostgreSQL pertencem exclusivamente à rede dedicada interna; o Caddy também participa da rede de ingresso que viabiliza as duas portas de *loopback*; o Caddy tem IP previsível `172.30.10.2`, exclusivo na lista de proxies confiáveis. A faixa dinâmica `172.30.10.128/25` exclui esse endereço, evitando colisão com os demais serviços. O projeto E2E mantém o mesmo isolamento entre endereço fixo e faixa dinâmica em sua sub-rede própria. Cabeçalhos de origem são sobrescritos, `/api/` mantém o caminho, `/internal/ready` não é encaminhado e não há registro de acesso com IP. No Linux, o administrador do host pode alcançar IPs internos da bridge Docker; essa configuração não constitui isolamento contra o próprio host. O *healthcheck* do Caddy usa `curl` `8.22.0` (`8.22.0-r0`, incluído na imagem com *digest* fixado), com CA explícita e prazo de três segundos. A API mantém gzip, ETag fraco, revalidação e erros sem cache através da entrada. HTML revalida, ativos identificados por hash têm validade de um ano e a CSP admite recursos locais e impede incorporação externa.

O certificado copiado é público; as chaves da CA permanecem no volume exclusivo de Caddy. Para confiar deliberadamente na CA no Ubuntu, executar manualmente:

```sh
sudo install -m 0644 .local/root.crt /usr/local/share/ca-certificates/pecuaria-inteligente-local.crt
sudo update-ca-certificates
```

Importar também esse certificado como autoridade no gerenciador de certificados do navegador utilizado, quando ele mantiver armazenamento próprio, habilitando confiança para identificar sites. Para remover, excluir a mesma autoridade no navegador e executar:

```sh
sudo rm /usr/local/share/ca-certificates/pecuaria-inteligente-local.crt
sudo update-ca-certificates --fresh
```

A instalação de confiança no computador é uma ação manual; nenhum script local modifica automaticamente esses armazenamentos. O cliente Node pode usar `NODE_EXTRA_CA_CERTS` apontando para `.local/root.crt`. Não desativar a validação TLS. Referências: [HTTPS local do Caddy](https://caddyserver.com/docs/automatic-https#local-https) e [instalação de CA no Ubuntu](https://ubuntu.com/server/docs/how-to/security/install-a-root-ca-certificate-in-the-trust-store/).

```sh
npm run local:publish
npm run local:down
npm run test:local
npm run test:e2e
```

`local:publish` executa o serviço do perfil `operacoes`, sem rota pública de escrita. O conjunto fixo existente é idempotente; uma nova versão exige diretório validado com identidade própria, conforme os comandos `demo:publish` já documentados. `local:down` preserva os volumes de banco e CA. O segundo início preserva a publicação compatível existente. Não usar `down --volumes` para encerrar a consulta acadêmica.

`test:e2e` cria nome de projeto, rede, volumes, segredos e CA exclusivos. Constrói `infra/e2e.Dockerfile` com Playwright `1.63.0`, seus motores e as dependências oficiais necessárias, incluindo `libnss3-tools` para importar a CA em perfis NSS descartáveis. A confiança fica somente nesse contêiner: Node usa a CA explícita, Chromium e Firefox têm perfis próprios e WebKit usa o armazenamento de CA do contêiner. O script de confiança exige contêiner e perfil interno `/home/node`; não pode executá-lo no host. O executor aguarda prontidão por até 180 segundos, verifica reinício/publicação/indisponibilidade, executa Chromium/Firefox/WebKit e encerra somente seus recursos. Falta de Docker ou erro TLS falha a execução. Relatórios, configuração efetiva, logs e traços de falha ficam em `artifacts/e2e/<projeto>/`.

O artefato de armazenamento é servido em `https://localhost:8443`, exclusivamente na imagem de teste. A imagem pública contém apenas `apps/web/dist`; não inclui o harness nem suas injeções de falha. A API usa JavaScript compilado, dependências de execução, usuário sem privilégios e um processo; não contém Drizzle Kit, esbuild ou tsx. As imagens-base têm os digests fixados na especificação de tecnologias. A matriz de motores automatizados não comprova todos os produtos Chrome/Edge/Firefox/Safari e aparelhos; a verificação visual do painel completo depende da integração da tarefa de interface.

## Qualidade e critérios de sucesso

### Segurança e integração contínua

`npm run security:audit` mantém o JSON bruto do `npm audit --include=dev --audit-level=high` e sua decisão em `artifacts/security/`; achados altos ou críticos sem exceção revisada e vigente bloqueiam o comando. Severidades moderadas e baixas permanecem registradas no relatório. A lista de `docs/qualidade/excecoes.json` começa vazia e aceita exceções de auditoria (identificadas por `id` e `pacote`) e Semgrep (por `regraId`). Os dois avaliadores verificam todos os registros e aplicam somente os da própria ferramenta; registros desconhecidos, ambíguos ou inválidos bloqueiam os comandos.

`npm run security:rules:prepare` baixa as dez regras Semgrep da revisão indicada em `tools/semgrep/manifesto.json`, confere os hashes e a licença e mantém as cópias somente em `.cache/semgrep/`. `npm run security:rules:test` testa as três regras próprias e as regras selecionadas contra 28 casos fixos. `npm run security:semgrep` analisa fontes, testes, configurações, workflows, arquivos Docker e Compose com Semgrep CE 1.179.0 em imagem fixada por digest. Os relatórios brutos, inventários e decisões ficam em `artifacts/security/`.

O workflow `.github/workflows/ci.yml` define trabalhos separados de qualidade, integração PostgreSQL, navegador, auditoria de dependências e Semgrep. O trabalho estável `aprovacao` falha se qualquer gate terminar com falha, cancelado ou pulado. A configuração foi criada nesta etapa; a primeira execução em GitHub ainda depende da integração e publicação da branch.

- Permitir localizar uma cotação e entender seu contexto sem ambiguidade.
- Comparar apenas dados compatíveis, sinalizando diferenças relevantes.
- Reproduzir os indicadores a partir das entradas e fórmulas documentadas.
- Manter testes para ingestão, normalização e cálculos críticos.
- Oferecer navegação responsiva e acessível nas consultas principais.
- Documentar limitações e medir a utilidade dos fluxos com usuários do público-alvo.

## Limitações e próximos passos

A viabilidade da plataforma depende da disponibilidade, do histórico, da qualidade e das permissões de uso das fontes. A frequência de atualização será definida por fonte e não pressupõe cotações em tempo real.

A documentação da v0.1 está em `docs/superpowers/specs/`:

- [Requisitos](docs/superpowers/specs/2026-10-04-requisitos-v0.1-design.md): escopo, regras de negócio e critérios de aceitação.
- [Arquitetura aprovada](docs/superpowers/specs/2026-10-04-arquitetura-v0.1-design.md): componentes, contratos e políticas de consistência, recuperação, segurança e desempenho.
- [Tecnologias e implantação](docs/superpowers/specs/2026-10-06-tecnologias-e-implantacao.md): escolhas aprovadas, justificativas, alternativas avaliadas, considerações sobre Vercel e lista centralizada de decisões pendentes.
- [Base demonstrativa fixa](docs/superpowers/specs/2026-10-07-base-demonstrativa-v0.1.md): pesquisa pública, perfis, território, arquivos de dados, receita e cenários verificáveis.
- [Modelo físico do PostgreSQL](docs/superpowers/specs/2026-10-07-modelo-fisico-postgresql-v0.1-design.md): tabelas, chaves, índices, precisão, publicação, imutabilidade, retenção e migrações.

A persistência local confirma somente consultas completas, compara a revisão capturada antes da rede e aguarda o _commit_ IndexedDB. Quota, orçamento insuficiente e conflito preservam a consulta salva anterior e mantêm os novos resultados em memória com aviso. A recuperação valida contratos, dependências e SHA-256, preserva dados incompatíveis e sempre revalida o resumo; não oferece funcionamento _offline_ completo.

Os testes rápidos de armazenamento usam `fake-indexeddb` `6.2.5` e não comprovam transações em navegador real. `npm run test:e2e` executa a suíte `tests/e2e/storage.spec.ts` em Chromium/Firefox/WebKit com CA confiável e origem HTTPS isolada. Seu artefato exclusivo é gerado com `storage-test.vite.config.ts` em `artifacts/storage-harness/`; somente a imagem de teste o serve. As injeções de falha nunca integram o _build_ normal da aplicação. Não usar exceções de certificado.

O painel está implementado. Após falha de importação do gráfico, a ação Tentar carregar o gráfico repete somente o carregamento do módulo e conserva os preços e o histórico textual. Se o arquivo continuar indisponível, a mensagem de falha e as tabelas permanecem acessíveis. Os próximos passos incluem validar o painel integrado e a matriz de desempenho no ambiente HTTPS conforme o plano aprovado. A validação de fontes reais será realizada para a v0.3, após a submissão acadêmica. Modelos preditivos, quando investigados, deverão ser avaliados com dados históricos e comunicar incerteza.

## Créditos e licença

Projeto mantido neste repositório por seu autor, no contexto de formação em Engenharia de Software Apoiada por GenAI. Fontes de dados e contribuições deverão receber os créditos correspondentes à medida que forem incorporadas.

Os termos de uso e avaliação acadêmica estão previstos em [ABOUT.md](ABOUT.md). O arquivo de licença deverá ser formalizado antes da publicação pública do repositório.
