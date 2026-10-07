# Tecnologias e implantação — v0.1 e v0.2

Data: 06/10/2026. Atualização de testes, segurança e ambiente: 07/10/2026.  
Estado: registro das decisões de conversa, das escolhas adotadas por delegação técnica e dos achados de documentação oficial. A seleção de tecnologias está parcialmente concluída; este documento não representa implementação nem aprovação das alternativas ainda candidatas.

## Objetivo e relação com a documentação

Preservar o fundamento das escolhas para que trabalhos futuros considerem o escopo acadêmico, os contratos e os limites já estabelecidos nos [requisitos](2026-10-04-requisitos-v0.1-design.md) e na [arquitetura aprovada](2026-10-04-arquitetura-v0.1-design.md).

Este arquivo reúne o registro de decisões tecnológicas e a lista de pendências; ambos os nomes se referem ao mesmo documento. Os requisitos concentram escopo e regras de negócio; a arquitetura concentra componentes, contratos, políticas operacionais e critérios de verificação. Este registro mantém as escolhas, suas justificativas, alternativas avaliadas e implicações de implantação, referenciando as regras desses documentos.

A v0.1 implementará a consulta demonstrativa de reposição em Goiás. A v0.2 preparará essa aplicação para avaliação acadêmica, sem ampliar o escopo funcional. A execução dessas entregas será local, via Docker Compose. O autor pretende experimentar a Vercel em uma versão posterior, antes da v1.0; essa implantação não condiciona a entrega acadêmica.

## Estado das escolhas

| Tema | Estado | Definição ou consideração |
| --- | --- | --- |
| Linguagem | Aprovada em conversa | TypeScript na interface e na API. |
| Interface | Aprovada em conversa | React, Tailwind CSS e Vite. |
| API | Aprovada em conversa | Fastify em Node.js. |
| Execução acadêmica | Definida pelo autor | Local, via Docker Compose. |
| Coordenação local | Aprovada em conversa | Uma única instância da API, com um único processo. Cota por IP e limite de consultas simultâneas ao banco controlados em memória. |
| Armazenamento compartilhado de coordenação | Adiado pelo autor | Avaliar Valkey ou Redis em versões futuras, antes de adotar múltiplas instâncias. Nenhum dos dois integra a entrega local da v0.1/v0.2. |
| Banco | Aprovado pelo autor | PostgreSQL no Docker Compose para a v0.1/v0.2, com persistência em volume. |
| Versão e imagem do banco | Adotadas por delegação técnica | PostgreSQL 18.6, imagem oficial `postgres:18.6-bookworm`; revalidar correções disponíveis antes da implementação e fixar a imagem por resumo criptográfico. |
| Acesso aos dados | Adotado por delegação técnica | Drizzle ORM `0.45.3` com o *driver* `pg` `8.23.1`, encapsulados no repositório do servidor. |
| Migrações | Adotadas por delegação técnica | Drizzle Kit `0.31.11`: esquema em TypeScript, geração de SQL revisado e versionado, aplicação separada da API. |
| Publicação dos dados | Mecanismo adotado por delegação técnica | Fotografias imutáveis identificadas por versão e troca transacional da referência publicada. Detalhamento físico e testes ficam para o plano. |
| Implantação futura | Intenção do autor | Experimentar Vercel antes da v1.0. Compatibilidade documentada; configuração e viabilidade operacional ainda serão verificadas. |
| Contratos e validação | Adotados por delegação técnica | JSON Schema Draft 7 com TypeBox `1.3.36`, `@fastify/type-provider-typebox` `6.1.0`, Ajv `8.20.0` e `ajv-formats` `3.0.1`. Validadores do navegador gerados na compilação. |
| Aritmética decimal | Adotada por delegação técnica | `big.js` `7.0.1`; entradas textuais, somas exatas, 40 casas para divisões e desempate para longe de zero na apresentação. |
| Persistência no navegador | Adotada por delegação técnica | IndexedDB com `idb` `8.0.4`, confirmação transacional da consulta salva. Orçamento de armazenamento ainda depende de medição. |
| Gráfico | Adotado por delegação técnica | Chart.js `4.5.1`, importação seletiva e carregamento separado da interface essencial; conformidade com 60 KiB ainda será medida. |
| Método de desenvolvimento | Reafirmado pelo autor | TDD: teste que falha pelo comportamento ausente, implementação mínima e refatoração com testes passando. |
| Testes de domínio, contratos e API | Adotados por delegação técnica | Vitest, cobertura V8 e `fastify.inject()`; integração com PostgreSQL real por Testcontainers. |
| Testes da interface | Adotados por delegação técnica | React Testing Library com `user-event`, `jest-dom` e jsdom; Playwright para o fluxo completo e `@axe-core/playwright` para verificações automatizáveis de acessibilidade. |
| Gerenciamento de dependências | Adotado por delegação técnica | npm com espaços de trabalho e um `package-lock.json` na raiz; instalação reproduzível com `npm ci`. |
| Auditoria de dependências | Adotada por delegação técnica | `npm audit`, incluindo dependências de desenvolvimento e transitivas; relatório completo e bloqueio inicial em severidade alta ou crítica. |
| Análise de segurança do código | Confirmada pelo autor; execução adotada por delegação técnica | Semgrep Community Edition obrigatório, com regras locais de segurança para a aplicação e configurações analisáveis, revisão fixada e resultados tratados. |
| Integração contínua | Adotada por delegação técnica | GitHub Actions para testes, compilação, análise de tipos, auditoria e Semgrep; configuração executável na implementação. |
| Ambiente Node.js | Adotado por delegação técnica | Node.js `24.21.0` LTS e npm `11.19.0`, com TypeScript `6.0.3`, compatível com a análise de código escolhida. |
| Organização dos módulos | Adotada por delegação técnica | Espaços de trabalho em `apps/web`, `apps/api`, `packages/contracts` e `packages/domain`; preparação demonstrativa no servidor. |
| Formatação e análise de código | Adotadas por delegação técnica | Prettier e ESLint com `typescript-eslint`, regras React e análise de tipos pelo compilador. |
| Entrada local e HTTPS | Adotados por delegação técnica | Caddy `2.11.7`: interface compilada e encaminhamento de `/api/` pela mesma origem, com autoridade certificadora local. |
| Versões e imagens | Referências adotadas por delegação técnica | Versões diretas e resumos criptográficos registrados abaixo; instalação integrada e validação operacional ainda não executadas. |

## Fundamento de TypeScript, React, Tailwind CSS e Vite

A arquitetura coloca filtros, médias, conversões e variações no domínio executado pelo navegador. A API valida consultas, lê versões consistentes do banco e controla respostas e consumo de recursos; não mantém uma segunda implementação dos indicadores da interface.

Usar TypeScript nos dois lados concentra o desenvolvimento no ecossistema Node.js e permite compartilhar definições dos contratos. Compartilhar somente estruturas adequadas ao cliente: credenciais, configuração do servidor e acesso ao banco permanecem no servidor. Navegador, processo da API e banco continuam sendo ambientes separados.

Python com FastAPI foi considerado uma alternativa válida, especialmente pela preferência do autor por Python no servidor. Nesse caminho, contratos poderiam ser integrados via OpenAPI, mas seria necessário manter também o ambiente Python. Importação real e modelos preditivos pertencem a etapas futuras; a v0.1 não exige bibliotecas científicas. Uma necessidade concreta futura poderá justificar um processo Python separado de importação ou análise.

React permite organizar filtros, tabelas, indicadores e estados de consulta em componentes. As fórmulas permanecem em módulos de domínio independentes de React. O cliente de consulta deve preservar as políticas de versões, cancelamento, armazenamento e recuperação especificadas na arquitetura; a escolha de React não implementa essas políticas automaticamente.

Vite compila os arquivos estáticos da interface. Tailwind CSS, integrado à compilação, produz CSS estático sem acrescentar JavaScript para aplicar estilos no navegador. As versões adotadas deverão ser compatíveis com os navegadores suportados, cuja matriz ainda será definida.

### Limites e validação

- Medir o limite de 100 KiB comprimidos para HTML, CSS e JavaScript essenciais, incluindo React e as dependências necessárias à primeira consulta. A adequação a esse orçamento ainda não foi demonstrada.
- Carregar o gráfico separadamente, depois dos preços e do histórico ativo, com limite adicional de 60 KiB. Os dados recebidos devem ser reutilizados, e a consulta textual deve continuar disponível se o gráfico falhar.
- Os tipos TypeScript são removidos ao gerar JavaScript. Validar durante a execução os parâmetros, as respostas HTTP e os dados persistidos; tipos compartilhados não substituem essa validação.
- Preservar preços e pesos como cadeias decimais nos contratos. Usar aritmética decimal nos cálculos, com precisão definida e arredondamento de apresentação verificado por testes. TypeScript não muda a representação numérica do JavaScript.

Fontes: [TypeScript — tipos removidos na compilação](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types), [React com Vite](https://react.dev/learn/build-a-react-app-from-scratch), [React — carregamento adiado](https://react.dev/reference/react/lazy), [Vite — implantação estática](https://vite.dev/guide/static-deploy.html), [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite), [compatibilidade do Tailwind](https://tailwindcss.com/docs/compatibility), [Fastify — validação e serialização](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/), [Fastify — integração entre esquemas e tipos](https://fastify.dev/docs/latest/Reference/Type-Providers/), [decimal.js](https://mikemcl.github.io/decimal.js/) e [FastAPI](https://fastapi.tiangolo.com/features/).

## Contratos, cálculos e recursos do navegador

As escolhas desta seção foram adotadas sob a delegação técnica do autor, preservando os contratos, as regras e os orçamentos aprovados. A pesquisa comparou possibilidades; ainda não houve instalação nem medição integrada da aplicação.

### Contratos e validação adotados

Adotar JSON Schema Draft 7 declarado com TypeBox, com tipos inferidos e integração por `@fastify/type-provider-typebox` na linha compatível com Fastify 5. O pacote escolhido é `typebox`, da série 1, conforme a integração atual; exemplos antigos com `@sinclair/typebox` não serão misturados. Compartilhar as definições dos campos; a API e os validadores do navegador usarão os mesmos esquemas HTTP, e a preparação demonstrativa usará essas definições em seu esquema de entrada. O esquema físico de Drizzle permanece separado.

Usar Ajv com `ajv-formats` para validar durante a execução. Configurar `coerceTypes: false`, `useDefaults: false`, `removeAdditional: false` e `allErrors: false`; os esquemas dos parâmetros de consulta e dos objetos de dados rejeitarão propriedades extras. Não modificar dados recebidos para fazê-los passar na validação. Formatos de datas serão conferidos junto ao perfil exato já exigido no [contrato da arquitetura](2026-10-04-arquitetura-v0.1-design.md#modelo-de-dados-e-publicação). Conferências de referências, unicidade e compatibilidade de versões ficam em validação semântica explícita, além do esquema estrutural.

Gerar validadores ESM com o modo *standalone* do Ajv durante a compilação, incluindo somente as funções e os auxiliares necessários no navegador. O compilador e o construtor de esquemas não serão carregados para compilar contratos durante a navegação. O código gerado ainda pode depender de auxiliares do Ajv e de formatos; seu tamanho real integra o orçamento da interface essencial. A API validará as respostas antes da serialização e de armazená-las em *cache*: o serializador do Fastify não substitui essa validação. O navegador validará respostas e dados recuperados antes de usá-los.

Alternativas avaliadas: Zod oferece validação e inferência de tipos, com variante Mini; Valibot oferece composição modular. Ambas são válidas. TypeBox e Ajv foram escolhidos pela integração com o JSON Schema usado pelo Fastify e pela possibilidade de pré-compilar os validadores. Não foi demonstrada superioridade de desempenho ou tamanho sobre essas alternativas.

Fontes: [TypeBox](https://github.com/sinclairzx81/typebox), [integração com Fastify](https://github.com/fastify/fastify-type-provider-typebox/blob/v6.1.0/README.md), [validação e serialização](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/), [opções do Ajv](https://ajv.js.org/options.html), [validadores pré-compilados](https://ajv.js.org/standalone.html), [formatos](https://ajv.js.org/packages/ajv-formats.html), [Zod](https://zod.dev/) e [Valibot](https://valibot.dev/guides/comparison/).

### Aritmética e arredondamento adotados

Adotar `big.js` em um módulo de domínio independente da interface. A candidata anterior, `decimal.js`, permanece válida, mas oferece operações além das fórmulas desta entrega e configura precisão em dígitos significativos para as operações. `big.js` atende à aritmética básica e mantém soma, subtração e multiplicação exatas; sua precisão de divisão é expressa em casas decimais. Inteiros escalados exigiriam tratamento adicional de médias, conversões e razões.

Usar um construtor dedicado com `strict: true`, `DP: 40` e `RM: Big.roundHalfUp`. Preços, pesos e constantes entrarão como texto, evitando conversão intermediária para `number`. Não reduzir valores armazenados às casas de apresentação durante os cálculos. Divisões com expansão infinita precisam de precisão finita: 40 casas são o parâmetro inicial de cálculo, a verificar contra os limites dos dados e casos de fronteira; isso não significa arredondar indicadores intermediários para duas ou uma casa.

Na apresentação, adotar arredondamento ao valor mais próximo, com empate para longe de zero, mantendo as casas exigidas por RN11. Por exemplo, `1.005` vira `1.01` e `-1.005` vira `-1.01` ao apresentar duas casas. Esse desempate foi definido como escolha técnica para o conjunto demonstrativo; não é uma regra de uma fonte comercial. Os testes deverão cobrir esses empates, sinais, divisões periódicas e os critérios CA03–CA08, verificando a estabilidade da apresentação com precisão maior.

Fontes: [API de big.js](https://mikemcl.github.io/big.js/), [comparação de bibliotecas pelo mantenedor](https://github.com/MikeMcl/big.js/wiki) e [API de decimal.js](https://mikemcl.github.io/decimal.js/).

### Persistência adotada

Adotar IndexedDB com `idb`, que oferece uma interface baseada em promessas e tipos TypeScript. A necessidade principal é confirmar dados e referência da consulta salva numa transação. IndexedDB nativo atende à mesma capacidade com mais controle manual; Dexie é uma alternativa válida com recursos de consulta adicionais. `localStorage` tem operações síncronas e não oferece transação envolvendo vários registros; não foi escolhido para persistir resumo e históricos.

Separar resumo, históricos e metadados em armazenamentos de objetos, com chaves que incluam versão do contrato, versão dos dados e perfil quando aplicável. Preparar os dados completos e validados antes de abrir a transação de escrita. Confirmar os registros necessários e a referência da consulta salva juntos e aguardar `tx.done`; não aguardar rede durante a transação. A remoção da versão anterior ocorrerá somente depois dessa confirmação, conforme a [política de persistência da arquitetura](2026-10-04-arquitetura-v0.1-design.md#navegador).

Falhas de abertura, quota ou transação manterão a consulta disponível em memória e preservarão a última consulta salva válida. A versão do esquema IndexedDB será distinta de `schemaVersion` e `versaoDados`. Mudanças desse esquema precisarão de migração que preserve dados compatíveis, sem recriar destrutivamente a base como solução automática.

O armazenamento pode ser removido pelo navegador; persistência local não é garantia de retenção nem funcionamento offline completo. O orçamento continua pendente da medição obrigatória do resumo e dos oito históricos, com metadados, índices e espaço de troca entre versões. Registrar também navegador e método de medição; tamanho de JSON ou quota declarada, isoladamente, não demonstram a ocupação efetiva.

Fontes: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB), [idb e duração de transações](https://github.com/jakearchibald/idb), [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API), [quotas e remoção pelo navegador](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) e [Dexie](https://dexie.org/docs/Tutorial/Hello-World).

### Gráfico adotado

Adotar Chart.js com integração direta num componente React e importação dinâmica. Registrar apenas o controlador e os elementos de linha, escalas de categorias e linear e os recursos efetivamente usados. As semanas serão rótulos civis ordenados, sem adaptador de datas. O módulo será carregado conforme a [sequência aprovada](2026-10-04-arquitetura-v0.1-design.md#carregamento-progressivo-e-recuperação), utilizando o histórico já disponível.

Representar todas as semanas do recorte e usar `null` onde faltar preço, com `spanGaps: false` e `tension: 0`; omitir semanas ausentes do eixo poderia ocultar lacunas. Converter valores para números somente na projeção visual exigida pelo gráfico, sem reutilizá-los em cálculos financeiros. Rótulos e valores detalhados consultarão a série decimal original. A tabela acessível continuará sendo a representação textual completa; o desenho em `canvas` não oferece essa leitura sozinho.

Usar contêiner responsivo, atualizar e destruir a instância nos momentos corretos e desativar animações nessa entrega. A rotação reorganizará o gráfico sem nova consulta de dados. Essa configuração é técnica; cores, tipografia e composição da página continuam na etapa de apresentação visual.

Recharts foi avaliado pela integração declarativa com React; uPlot, pelo foco em séries temporais; SVG próprio dispensaria uma biblioteca de gráficos, mas exigiria implementar escalas, eixos, interação e adaptação. Chart.js foi escolhido pelo conjunto documentado de configuração, lacunas e importação seletiva. Medir todo o módulo adicional, incluindo integração e dependências, contra 60 KiB comprimidos. Se falhar, reduzir o módulo ou reavaliar a escolha, registrando a evidência antes de alterar o orçamento.

Fontes: [integração seletiva do Chart.js](https://www.chartjs.org/docs/latest/getting-started/integration.html), [linhas e lacunas](https://www.chartjs.org/docs/latest/charts/line.html), [acessibilidade](https://www.chartjs.org/docs/latest/general/accessibility.html), [adaptação ao contêiner](https://www.chartjs.org/docs/latest/configuration/responsive.html), [atualização](https://www.chartjs.org/docs/latest/developers/updates.html), [ciclo de vida](https://www.chartjs.org/docs/latest/api/classes/Chart.html), [Recharts](https://recharts.github.io/en-US/guide/getting-started/) e [uPlot](https://github.com/leeoniya/uPlot).

### Versões e verificação desta seleção

As versões estáveis foram conferidas em 06/10/2026 nos metadados públicos do npm: [TypeBox 1.3.36](https://registry.npmjs.org/typebox/1.3.36), [integração Fastify 6.1.0](https://registry.npmjs.org/@fastify%2Ftype-provider-typebox/6.1.0), [Ajv 8.20.0](https://registry.npmjs.org/ajv/8.20.0), [ajv-formats 3.0.1](https://registry.npmjs.org/ajv-formats/3.0.1), [big.js 7.0.1](https://registry.npmjs.org/big.js/7.0.1), [idb 8.0.4](https://registry.npmjs.org/idb/8.0.4) e [Chart.js 4.5.1](https://registry.npmjs.org/chart.js/4.5.1). Fixar essas versões e o arquivo de resolução de dependências ao introduzir os manifestos. Tipagens auxiliares e versões restantes serão conferidas junto ao ambiente.

No plano, formalizar os esquemas e exemplos completos, os detalhes do armazenamento e os testes de contrato, precisão e recuperação. A seleção das ferramentas foi concluída; a conformidade da aplicação dependerá das medições e dos testes previstos na arquitetura. Publicidade de tamanho de uma biblioteca ou de um exemplo não substitui essas medições.

## Banco: escolha aprovada e alternativa avaliada

### PostgreSQL — aprovado para execução local

O autor escolheu PostgreSQL no Docker Compose e delegou a seleção das opções técnicas que dispensam sua avaliação. Foram adotados a versão, o acesso aos dados, as migrações e o mecanismo de publicação descritos abaixo. O detalhamento do modelo físico depende das definições restantes dos dados demonstrativos.

Perfis, regiões, semanas, preços e versões têm estrutura estável. A arquitetura exige referências válidas, unicidade, valores positivos e publicação transacional. PostgreSQL permite expressar integridade referencial por chaves estrangeiras, unicidade por `UNIQUE` e restrições de valores por `CHECK`, reduzindo a lógica de integridade que a aplicação precisa manter.

Uma cotação poderá ser impedida pelo próprio banco de referenciar um perfil ou uma região inexistente. A modelagem deverá impedir também referências entre versões incompatíveis. A unicidade será definida dentro da versão ou do conjunto publicado, conforme o modelo final; preservar versões anteriores não autoriza duplicatas dentro de uma mesma versão.

O tipo `NUMERIC` permite armazenamento decimal. A precisão, a escala e a rejeição de valores especiais precisarão ser configuradas para preservar os requisitos. O contrato HTTP continuará usando cadeias decimais, e os cálculos do navegador continuarão exigindo uma biblioteca decimal.

A escolha se fundamenta na adequação às regras documentadas. Não foi realizada uma medição comparativa de desempenho entre os bancos, nem demonstrada uma necessidade de capacidade que favoreça um deles.

Fontes: [PostgreSQL — restrições](https://www.postgresql.org/docs/current/ddl-constraints.html) e [tipos numéricos](https://www.postgresql.org/docs/current/datatype-numeric.html).

### Versão, imagem e persistência adotadas

Adotar PostgreSQL 18.6, versão estável corrente na documentação consultada em 06/10/2026. A série 18 tem suporte previsto até novembro de 2030; a série 19 ainda está em *beta*. PostgreSQL 17 permanece válido, mas não há restrição documentada deste projeto que justifique iniciar numa série anterior. Essa escolha é uma avaliação de adequação, não um resultado de desempenho.

Usar a imagem oficial `postgres:18.6-bookworm`. A base Debian foi escolhida para manter um ambiente convencional de administração e diagnóstico; o tamanho da imagem do banco não participa do orçamento transferido ao navegador. Antes de criar o Compose, conferir novas correções da série 18 e fixar a imagem adotada por resumo criptográfico. Atualizações serão explícitas e verificadas, sem depender de `latest`.

Na imagem da série 18, montar o volume nomeado em `/var/lib/postgresql`; o diretório de dados padrão é `/var/lib/postgresql/18/docker`. Scripts em `/docker-entrypoint-initdb.d` executam apenas na inicialização de um volume vazio: não serão o mecanismo de evolução do esquema. Mudanças de versão principal exigem procedimento próprio de atualização do banco.

Fontes: [política de versões do PostgreSQL](https://www.postgresql.org/support/versioning/) e [imagem oficial e caminhos de persistência](https://hub.docker.com/_/postgres).

### Acesso aos dados e alternativas avaliadas

| Opção | Adequação ao projeto | Resultado |
| --- | --- | --- |
| Drizzle ORM, `pg` e Drizzle Kit | Esquema em TypeScript, inferência de tipos nas consultas, acesso a SQL e migrações SQL revisáveis. Permite expressar as restrições relacionais exigidas. | Adotada. |
| `pg` e `node-pg-migrate` | SQL explícito e migrações independentes; requer manter manualmente a correspondência entre consultas, resultados e tipos TypeScript. | Alternativa válida, sem a inferência do esquema oferecida pela escolha adotada. |
| Prisma ORM | Alternativa válida com esquema e cliente próprios, consultas tipadas e ferramentas de migração. | Não adotada: o fluxo adicional não apresenta vantagem necessária para as duas operações públicas e a preparação demonstrativa deste MVP. |

A preferência por Drizzle é uma avaliação técnica para este escopo. Não foi realizada comparação de desempenho, tamanho de instalação ou produtividade entre essas alternativas.

Adotar as versões estáveis publicadas consultadas em 06/10/2026: `drizzle-orm` `0.45.3`, `pg` `8.23.1` e `drizzle-kit` `0.31.11`. O guia atual de início do Drizzle instala pacotes com `@rc`; seus exemplos não serão copiados sem conferir a compatibilidade com a linha estável. Fixar versões exatas e versionar o arquivo de resolução de dependências quando os manifestos forem introduzidos. A versão compatível de `@types/pg` será fixada junto ao ambiente TypeScript.

O repositório do servidor encapsulará Drizzle, SQL e o conjunto reutilizável de conexões de `pg`. Consultas serão parametrizadas; SQL personalizado seguirá a mesma regra. Esquemas do banco e clientes de conexão não integrarão a compilação da interface. Tipos inferidos auxiliam o desenvolvimento, mas não validam dados durante a execução nem substituem os contratos HTTP.

Preservar `NUMERIC` em modo textual no Drizzle, sem convertê-lo para `number`. Usar `DATE` em modo textual para a semana e `TIMESTAMPTZ(3)` para instantes, com serialização UTC conforme a arquitetura. No modelo físico, definir precisão, escala e restrições de valores finitos; a validação de entrada deverá rejeitar excesso de escala antes de o banco arredondá-lo. Consultas SQL personalizadas também deverão respeitar esses mapeamentos.

Fontes: [integração Drizzle e PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new), [restrições e índices](https://orm.drizzle.team/docs/indexes-constraints), [SQL parametrizado](https://orm.drizzle.team/docs/sql), [tipos de `pg`](https://node-postgres.com/features/types), [representação numérica no Drizzle 0.45.3](https://github.com/drizzle-team/drizzle-orm/blob/0.45.3/drizzle-orm/src/pg-core/columns/numeric.ts), [datas civis nessa versão](https://github.com/drizzle-team/drizzle-orm/blob/0.45.3/drizzle-orm/src/pg-core/columns/date.ts), [tipos numéricos do PostgreSQL](https://www.postgresql.org/docs/18/datatype-numeric.html), [tipos temporais](https://www.postgresql.org/docs/18/datatype-datetime.html), [node-pg-migrate](https://github.com/salsita/node-pg-migrate/releases/tag/v9.0.0) e [recursos relacionais do Prisma](https://www.prisma.io/docs/orm/v7/reference/database-features).

As versões foram conferidas também nos metadados públicos dos pacotes: [Drizzle ORM](https://registry.npmjs.org/drizzle-orm/0.45.3), [Drizzle Kit](https://registry.npmjs.org/drizzle-kit/0.31.11) e [`pg`](https://registry.npmjs.org/pg/8.23.1). São referências da pesquisa, não dependências instaladas ou uma validação integrada do ambiente.

### Fluxo de migrações adotado

Declarar o esquema físico em TypeScript, gerar migrações com `drizzle-kit generate`, revisar o SQL e versionar os arquivos e metadados gerados. Aplicar as migrações com `drizzle-kit migrate` numa operação única e separada da API, antes de disponibilizar a consulta. O plano definirá diretórios, configuração e comandos completos; esses comandos ainda não estão disponíveis no repositório.

A API usará credenciais de leitura; migrações e publicação terão permissões próprias. A aplicação pública não alterará o esquema ao iniciar. O fluxo reproduzível usará arquivos de migração, preservando o histórico das mudanças. Uma migração já aplicada não será reescrita: correções entrarão numa nova migração.

A geração automática não dispensa revisão de chaves estrangeiras compostas, verificações, índices e eventuais operações SQL personalizadas. A preparação demonstrativa será uma operação separada das migrações de estrutura. Os testes de integração deverão aplicar o histórico numa base vazia, reaplicá-lo sem repetir alterações e verificar atualização de uma base na versão anterior; usar PostgreSQL da mesma série da entrega, em vez de substituir suas regras por outro banco.

Fontes: [fluxos de migração do Drizzle](https://orm.drizzle.team/docs/migrations), [geração](https://orm.drizzle.team/docs/drizzle-kit-generate) e [aplicação](https://orm.drizzle.team/docs/drizzle-kit-migrate).

### Mecanismo de publicação adotado

Representar cada fotografia por uma versão própria, com cadastros e preços associados à mesma versão. A identidade de uma cotação incluirá versão, perfil, região e semana; as referências aos cadastros também incluirão a versão. A referência da publicação atual ficará numa linha única do banco, criada pela migração antes da primeira publicação.

Preparar e validar o conjunto demonstrativo fora da consulta pública. Para publicá-lo, usar uma transação com Drizzle: bloquear a linha da referência atual com `SELECT ... FOR UPDATE`, gravar a nova fotografia completa, registrar seu identificador e instante de publicação e atualizar a referência. Uma falha desfará a publicação inteira. O bloqueio serializa publicações concorrentes; os identificadores não dependerão do relógio do navegador. Fotografias publicadas não serão modificadas; correções produzirão nova versão.

No resumo, ler a referência publicada antes de selecionar o conteúdo em *cache*. Ao detectar mudança, invalidar a entrada anterior e carregar o resumo da versão escolhida. Essa leitura de metadados também passará pelo controle de admissão ao banco. Depois de selecionar uma versão, todas as consultas daquela resposta usarão seu identificador, inclusive se houver publicação concorrente. Históricos solicitados continuarão vinculados à versão recebida pelo cliente. O TTL permanecerá uma proteção adicional, conforme a arquitetura.

O plano detalhará tabelas, índices, proteção de imutabilidade, precisão decimal e retenção de versões. Esses detalhes serão conferidos com os dados demonstrativos e os testes de consistência já exigidos na [arquitetura](2026-10-04-arquitetura-v0.1-design.md#modelo-de-dados-e-publicação). Esta definição não escolhe um serviço de coordenação distribuída nem encerra as verificações necessárias para múltiplas instâncias.

Fontes: [transações no Drizzle](https://orm.drizzle.team/docs/transactions), [bloqueio de linhas no PostgreSQL](https://www.postgresql.org/docs/18/explicit-locking.html#LOCKING-ROWS) e [isolamento transacional](https://www.postgresql.org/docs/18/transaction-iso.html).

### MongoDB — alternativa avaliada

MongoDB era a preferência inicial do autor, com execução local ou Atlas no plano gratuito. A alternativa foi avaliada e PostgreSQL foi escolhido para esta entrega. Os achados abaixo preservam o fundamento da comparação para uma eventual revisão futura.

MongoDB oferece validação de documentos, índices únicos e transações envolvendo múltiplos documentos. A publicação transacional exige um conjunto de réplicas (*replica set*); uma instância independente sem essa configuração não atende a essa estratégia. Durante a comparação, foi considerada a possibilidade de um conjunto de réplicas com um nó no ambiente acadêmico, sujeita a verificação com as versões adotadas. Essa configuração não oferece redundância.

Com cadastros e preços em coleções separadas, as referências precisam de controles na aplicação para permanecer consistentes. Se essa alternativa for retomada, revisar e explicitar esse mecanismo na arquitetura: a exigência de referências válidas permanece, mas sua execução não terá o mecanismo de chaves estrangeiras de PostgreSQL. Transações, validação e imutabilidade das versões publicadas deverão trabalhar juntas; validar somente o formato dos documentos não garante a existência dos documentos referenciados.

Outro ponto avaliado foi a necessidade de definir armazenamento decimal e conversão para o contrato HTTP, preservando a precisão monetária. A familiaridade do autor com MongoDB foi considerada junto ao trabalho adicional de integridade e testes.

Atlas no plano gratuito foi considerado como opção futura associada a MongoDB. Uma eventual retomada deverá conferir limites de armazenamento, conexões, operações e transferência; a existência de um plano gratuito não demonstra cumprimento dos limites de desempenho da aplicação. Atlas não integra a solução aprovada para a entrega acadêmica.

Fontes: [MongoDB — validação e índices únicos](https://www.mongodb.com/docs/manual/tutorial/unique-indexes-schema-validation/), [transações](https://www.mongodb.com/docs/manual/core/transactions/), [integridade das referências](https://www.mongodb.com/docs/manual/data-modeling/data-consistency/), [configuração de um conjunto com um nó](https://www.mongodb.com/docs/v8.3/tutorial/restore-replica-set-from-backup/) e [limites gratuitos do Atlas](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/).

## TDD, testes e verificações de segurança

O autor reafirmou TDD e confirmou Semgrep obrigatório. As ferramentas e o fluxo abaixo foram adotados por delegação técnica, com base na documentação oficial consultada em 07/10/2026. Ainda não existem dependências instaladas, testes ou configuração de integração contínua neste repositório. Os comandos citados descrevem o fluxo a implementar.

### Método e ferramentas de teste adotados

Seguir o ciclo estabelecido em [ABOUT.md](../../../ABOUT.md): escrever um teste de comportamento, executá-lo e observar a falha esperada; implementar o mínimo para passar; refatorar mantendo a suíte passando. Falha por erro de configuração não comprova a etapa inicial. Correções começarão por um teste que reproduza o defeito. Os resultados esperados serão derivados das regras e exemplos aprovados, sem repetir a fórmula da implementação para gerar a resposta do teste.

| Camada | Ferramenta e ambiente | Aplicação nesta arquitetura |
| --- | --- | --- |
| Domínio e contratos | Vitest no ambiente Node.js | Verificar regras, precisão decimal e validação estrutural e semântica. Conferir equivalência dos validadores pré-compilados e dos usados no servidor. |
| Componentes React | Vitest, jsdom, React Testing Library, `@testing-library/user-event` e `@testing-library/jest-dom` | Exercitar filtros, estados e resultados por interações e elementos acessíveis ao usuário. |
| API | Vitest e `fastify.inject()` | Verificar rotas, validação, respostas, cabeçalhos e controles de admissão, sem abrir uma porta em cada teste. |
| Persistência do servidor | Vitest e `@testcontainers/postgresql` | Executar migrações, consultas e publicação transacional num PostgreSQL isolado, com a mesma imagem fixada para a entrega. |
| Consulta completa | Playwright Test | Exercitar interface compilada, API e banco; verificar também IndexedDB, recuperação, carregamento progressivo e rotação nos navegadores reais da matriz a definir. |
| Acessibilidade | `@axe-core/playwright` e verificações de interação | Detectar problemas automatizáveis e verificar teclado e foco; complementar com revisão manual dos critérios aprovados. |

Vitest foi escolhido pela integração com Vite e pelo suporte a TypeScript, ambientes separados, relógios controlados e cobertura. Jest e `node:test` foram considerados; Vitest concentra domínio, API e componentes num executor alinhado à compilação da interface. A transformação de TypeScript nos testes não substitui a análise de tipos, que terá uma verificação própria.

Usar cobertura V8 com `@vitest/coverage-v8` na mesma versão de Vitest, incluindo os módulos de produção relevantes mesmo quando não forem importados pelos testes. O relatório orientará a busca de comportamentos sem verificação. A conclusão dependerá dos critérios de aceitação e cenários obrigatórios da [arquitetura](2026-10-04-arquitetura-v0.1-design.md#verificação-funcional-e-riscos); um percentual global, isoladamente, não comprova correção. Não foi adotado um limiar numérico arbitrário nesta etapa.

React Testing Library foi escolhida pelo foco no uso dos componentes. jsdom atenderá aos testes rápidos de interação; IndexedDB, desenho do gráfico, disposição visual e comportamento efetivo do navegador serão verificados com Playwright. Emulação de DOM não demonstra esses resultados. Usar dados demonstrativos e controlar falhas de rede nos testes específicos de recuperação, mantendo também um fluxo completo com a API e o banco reais.

Testcontainers automatizará a criação e o encerramento do banco de integração, aproveitando Docker já previsto no ambiente. Os testes usarão credenciais e bases descartáveis próprias, sem conectar ao volume da consulta acadêmica. Isolar casos e encerrar conexões e contêineres mesmo após falhas; testes de concorrência e publicação precisarão de conexões reais independentes. A suíte completa com Compose também terá projeto e volumes exclusivos de teste. Esses detalhes serão formalizados no plano.

Playwright será o executor dos testes de ponta a ponta. Os testes de componentes permanecem em Vitest, evitando depender da modalidade experimental de componentes do Playwright. A matriz de navegadores suportados continua pendente; escolher Playwright não aprova automaticamente todos os navegadores que ele consegue executar. Usar Chromium nas medições que exigirem controle de rede e CPU por protocolo de depuração, registrando ambiente e parâmetros; executar as demais verificações nos navegadores da matriz aprovada.

As metas e condições de medição permanecem no [orçamento de desempenho da arquitetura](2026-10-04-arquitetura-v0.1-design.md#orçamento-de-desempenho-proposto). Conferir tamanhos comprimidos na compilação e medir o fluxo na rede e CPU definidas; testes funcionais passando não demonstram esses limites. Relatórios de acessibilidade automatizados também precisarão da revisão manual prevista para a entrega.

Fontes: [Vitest](https://vitest.dev/guide/), [ambientes de teste](https://vitest.dev/guide/environment.html), [cobertura](https://vitest.dev/guide/coverage.html), [verificação de tipos](https://vitest.dev/guide/testing-types.html), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), [user-event](https://testing-library.com/docs/user-event/intro/), [jest-dom](https://github.com/testing-library/jest-dom), [testes do Fastify](https://fastify.dev/docs/latest/Guides/Testing/), [PostgreSQL com Testcontainers](https://node.testcontainers.org/modules/postgresql/), [Playwright em integração contínua](https://playwright.dev/docs/ci), [controle de rede](https://playwright.dev/docs/network), [sessão de depuração do Chromium](https://playwright.dev/docs/api/class-cdpsession), [testes de componentes do Playwright](https://playwright.dev/docs/test-components) e [acessibilidade com axe](https://playwright.dev/docs/accessibility-testing).

### Dependências e auditoria adotadas

Adotar npm com espaços de trabalho para a interface, a API e os módulos compartilhados. Um único `package-lock.json` na raiz registrará a resolução de dependências. Essa escolha atende ao ambiente TypeScript comum sem acrescentar outro gerenciador ou orquestrador de compilação. Fixar versões compatíveis e documentar os diretórios e comandos ao introduzir os manifestos; `npm ci` será usado na integração contínua e na instalação reproduzível.

Adotar `npm audit --include=dev --audit-level=high --json`, incluindo dependências diretas, transitivas e de desenvolvimento. Guardar o relatório completo: esse parâmetro altera o código de saída, sem esconder resultados de severidade menor. Falha de acesso à base de alertas impedirá considerar a auditoria concluída. Registrar data, ferramenta, arquivo de dependências analisado e tratamento dos resultados conforme RNF08 dos [requisitos](2026-10-04-requisitos-v0.1-design.md#requisitos-não-funcionais).

O bloqueio inicial abrangerá alertas altos e críticos. Conferir aplicabilidade e corrigir os aplicáveis; uma classificação como não aplicável precisará de evidência específica e revisão, sem remover a dependência do escopo da auditoria para obter sucesso. Avaliar também os demais resultados. Atualizações serão revisadas e acompanhadas pelos testes; não aplicar correções automáticas com mudanças incompatíveis como parte da verificação.

Fontes: [espaços de trabalho do npm](https://docs.npmjs.com/cli/v11/using-npm/workspaces/), [instalação reproduzível](https://docs.npmjs.com/cli/v11/commands/npm-ci/) e [auditoria e códigos de saída](https://docs.npmjs.com/cli/v11/commands/npm-audit/).

### Semgrep obrigatório e execução adotada

Adotar Semgrep Community Edition pela CLI, em contêiner com versão e resumo criptográfico fixados. Executar `semgrep scan` com configuração local, `--error`, `--strict`, `--metrics=off` e `--disable-version-check`, preservando relatório JSON. Esse caminho permite execução sem conta ou serviço pago. O plano definirá os caminhos e o comando completo. Não usar seleção automática de regras remotas a cada execução.

Adotar uma seleção de regras comunitárias de segurança do repositório oficial `semgrep-rules`: JavaScript/TypeScript e Node.js, React, Ajv, Dockerfile, Docker Compose e GitHub Actions, conforme os arquivos introduzidos. Fixar a revisão de origem e versionar os YAML selecionados, seus identificadores e licenças aplicáveis; revisar a compatibilidade antes de incorporá-los. A seleção concreta dos arquivos e eventuais regras próprias ocorrerão junto ao código e às configurações, com casos de teste positivos e negativos. Uma regra destinada a outro ambiente, como Express, não demonstra cobertura de Fastify.

Analisar o código próprio da interface, API, módulos compartilhados e preparação demonstrativa, além das configurações para as quais houver regras. Conferir os arquivos efetivamente analisados e os ignorados; configurar exclusões justificadas para dependências e artefatos gerados, preservando a análise dos esquemas e geradores escritos no projeto. Não excluir os testes próprios por padrão. Falhas de análise, regras inválidas, ausência inesperada de alvos e arquivos relevantes ignorados precisarão de tratamento antes de aceitar o resultado.

Bloquear achados sem tratamento e falhas da execução. `ERROR`, `WARNING` e `INFO` das regras não equivalem automaticamente à classificação de risco alta ou crítica: avaliar contexto e confirmação conforme RNF11 dos [requisitos](2026-10-04-requisitos-v0.1-design.md#requisitos-não-funcionais). Corrigir vulnerabilidades confirmadas altas e críticas. Exceções pontuais, falsos positivos e exclusões terão justificativa revisada e vinculada à regra e ao trecho; preservar sua rastreabilidade. Não neutralizar o código de saída para fazer a verificação passar.

Registrar versão do executor, revisão das regras, escopo, resultados e tratamento por revisão e entrega. A análise comunitária tem limites, inclusive de fluxo entre arquivos; os testes de segurança e a revisão continuam exigidos. A auditoria de pacotes será executada separadamente com npm. Semgrep Supply Chain e a plataforma hospedada foram considerados, mas não integram o fluxo acadêmico adotado.

Fontes: [CLI e códigos de saída](https://docs.semgrep.dev/cli-reference), [regras comunitárias e licenças](https://github.com/semgrep/semgrep-rules), [regras JavaScript](https://github.com/semgrep/semgrep-rules/tree/develop/javascript), [regras TypeScript e React](https://github.com/semgrep/semgrep-rules/tree/develop/typescript), [regras de configurações](https://github.com/semgrep/semgrep-rules/tree/develop/yaml), [exclusões e padrões iniciais](https://docs.semgrep.dev/semgrepignore-v2-reference) e [limites da edição comunitária](https://github.com/semgrep/semgrep/blob/develop/README.md).

### Integração contínua adotada

Adotar GitHub Actions, acompanhando o repositório já hospedado no GitHub. Ao introduzir a implementação, configurar verificações em propostas de alteração, alterações em `main` e execução manual, com estes grupos de trabalho:

1. Instalação reproduzível, análise de tipos, demais verificações estáticas a configurar, testes de domínio e componentes com cobertura e compilação.
2. Testes de integração com PostgreSQL por Testcontainers e testes de ponta a ponta sobre a aplicação compilada no Compose isolado.
3. Auditoria de dependências e Semgrep em trabalhos separados, preservando seus relatórios mesmo quando houver falha.

A auditoria acompanhará as alterações de dependências e será refeita antes de cada entrega; o Semgrep acompanhará alterações de código ou configurações analisáveis e também a revisão de entrega. Os demais resultados obrigatórios de aceitação serão executados e registrados conforme a arquitetura. Falha de testes, compilação, tipos ou verificações de segurança impedirá considerar a alteração pronta para integração; habilitar as verificações obrigatórias da proposta quando os trabalhos existirem.

Usar ambiente Linux com Docker disponível, versões fixadas das ferramentas, imagens por resumo criptográfico e ações por identificador completo de revisão. Dar ao *token* apenas as permissões necessárias, começando por `contents: read`; os testes usarão dados e credenciais descartáveis. Executar código de propostas pelo evento `pull_request`, sem segredos de implantação. Publicação e implantação não serão ações automáticas deste fluxo acadêmico.

Guardar cobertura, relatórios de segurança e evidências de falhas dos testes de navegador como artefatos da execução, vinculados à revisão analisada. O plano definirá duração de retenção, tempos máximos e comandos locais equivalentes. As versões de referência estão no [ambiente reproduzível](#ambiente-reproduzível-módulos-e-convenções); confirmar a instalação integrada e não atualizar isoladamente sem conferir a combinação.

Fontes: [testes Node.js com GitHub Actions](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs), [Playwright em integração contínua](https://playwright.dev/docs/ci), [uso seguro de ações](https://docs.github.com/en/actions/reference/security/secure-use) e [artefatos de execução](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/storing-and-sharing-data-from-a-workflow).

## Ambiente reproduzível, módulos e convenções

Estas escolhas completam a seleção do ambiente e das ferramentas para o plano. Foram verificadas em 07/10/2026 nos metadados dos mantenedores e registros oficiais. A compatibilidade conferida é a declarada por essas fontes; ainda será necessário instalar, compilar, executar os testes e medir a aplicação antes de considerar o ambiente validado.

### Versões adotadas

Adotar Node.js `24.21.0`, da linha LTS, e npm `11.19.0`, distribuído nessa versão do Node.js. Node.js 26 ainda está na fase *Current* nesta pesquisa. A linha 24 atende às exigências declaradas de Vite, Vitest, ESLint e jsdom; usar tipagens da linha 24 para não pressupor APIs de outra versão do servidor.

Adotar TypeScript `6.0.3`. O registro apresenta TypeScript `7.0.2` como mais recente, mas `typescript-eslint` `8.71.1` declara suporte a TypeScript `>=4.8.4 <6.1.0`. Escolher 6.0.3 preserva a compatibilidade declarada da análise de código. Não contornar conflitos com `--force` ou `--legacy-peer-deps`; reavaliar a combinação numa atualização acompanhada dos testes.

| Uso | Dependências diretas e versões adotadas |
| --- | --- |
| Linguagem | [typescript `6.0.3`](https://registry.npmjs.org/typescript/6.0.3). |
| Interface React | [react `19.3.0`](https://registry.npmjs.org/react/19.3.0), [react-dom `19.3.0`](https://registry.npmjs.org/react-dom/19.3.0), [@types/react `19.3.0`](https://registry.npmjs.org/@types%2Freact/19.3.0) e [@types/react-dom `19.3.0`](https://registry.npmjs.org/@types%2Freact-dom/19.3.0). |
| Compilação da interface | [vite `8.3.3`](https://registry.npmjs.org/vite/8.3.3) e [@vitejs/plugin-react `6.1.2`](https://registry.npmjs.org/@vitejs%2Fplugin-react/6.1.2). |
| Estilos | [tailwindcss `4.3.3`](https://registry.npmjs.org/tailwindcss/4.3.3) e [@tailwindcss/vite `4.3.3`](https://registry.npmjs.org/@tailwindcss%2Fvite/4.3.3). |
| API | [fastify `5.12.5`](https://registry.npmjs.org/fastify/5.12.5), [@types/node `24.19.1`](https://registry.npmjs.org/@types%2Fnode/24.19.1) e [@types/pg `8.23.1`](https://registry.npmjs.org/@types%2Fpg/8.23.1). |
| Tipagem decimal | [@types/big.js `7.0.0`](https://registry.npmjs.org/@types%2Fbig.js/7.0.0). |
| Executor e cobertura | [vitest `5.0.3`](https://registry.npmjs.org/vitest/5.0.3) e [@vitest/coverage-v8 `5.0.3`](https://registry.npmjs.org/@vitest%2Fcoverage-v8/5.0.3). |
| Componentes e interações | [@testing-library/react `16.3.3`](https://registry.npmjs.org/@testing-library%2Freact/16.3.3), [@testing-library/dom `10.4.2`](https://registry.npmjs.org/@testing-library%2Fdom/10.4.2), [@testing-library/user-event `14.6.7`](https://registry.npmjs.org/@testing-library%2Fuser-event/14.6.7), [@testing-library/jest-dom `7.0.1`](https://registry.npmjs.org/@testing-library%2Fjest-dom/7.0.1) e [jsdom `30.1.2`](https://registry.npmjs.org/jsdom/30.1.2). |
| Navegador e acessibilidade | [@playwright/test `1.63.0`](https://registry.npmjs.org/@playwright%2Ftest/1.63.0) e [@axe-core/playwright `4.13.0`](https://registry.npmjs.org/@axe-core%2Fplaywright/4.13.0). |
| Banco de integração | [@testcontainers/postgresql `12.2.0`](https://registry.npmjs.org/@testcontainers%2Fpostgresql/12.2.0). |
| Análise de código | [eslint `10.12.0`](https://registry.npmjs.org/eslint/10.12.0), [@eslint/js `10.0.1`](https://registry.npmjs.org/@eslint%2Fjs/10.0.1), [typescript-eslint `8.71.1`](https://registry.npmjs.org/typescript-eslint/8.71.1), [globals `17.13.0`](https://registry.npmjs.org/globals/17.13.0), [eslint-plugin-react-hooks `7.1.1`](https://registry.npmjs.org/eslint-plugin-react-hooks/7.1.1) e [eslint-plugin-react-refresh `0.5.7`](https://registry.npmjs.org/eslint-plugin-react-refresh/0.5.7). |
| Formatação | [prettier `3.9.9`](https://registry.npmjs.org/prettier/3.9.9) e [eslint-config-prettier `10.1.8`](https://registry.npmjs.org/eslint-config-prettier/10.1.8). |
| Desenvolvimento | [tsx `4.23.15`](https://registry.npmjs.org/tsx/4.23.15) e [concurrently `10.0.5`](https://registry.npmjs.org/concurrently/10.0.5), somente para executar e acompanhar processos de desenvolvimento. |

As versões já adotadas de contratos, aritmética, persistência, gráfico e banco permanecem no [estado das escolhas](#estado-das-escolhas). Conferidas novamente as declarações de TypeBox, sua integração Fastify, Drizzle e `pg`; o provedor TypeBox da série 6 atende a Fastify 5. Dependências opcionais de outros bancos, compiladores ou ambientes de teste não serão instaladas apenas por aparecerem nos metadados.

Fixar versões diretas sem faixas e registrar as transitivas no `package-lock.json`. Declarar as versões de Node.js e npm nos manifestos, registrar Node.js em `.node-version` e conferir o executor na instalação e na integração contínua. Instalar os navegadores correspondentes à versão fixada de Playwright. Atualizações exigirão revisão do arquivo de dependências, auditoria e verificações; versões pesquisadas não são garantia de ausência de vulnerabilidades.

Fontes adicionais: [índice oficial do Node.js, incluindo npm](https://nodejs.org/dist/index.json), [linhas e suporte do Node.js](https://nodejs.org/en/about/previous-releases), [Vite](https://vite.dev/guide/), [Vitest](https://vitest.dev/guide/), [integração Fastify/TypeBox](https://github.com/fastify/fastify-type-provider-typebox/blob/v6.1.0/README.md) e [dependências suportadas por typescript-eslint](https://typescript-eslint.io/users/dependency-versions/).

### Estrutura e fronteiras adotadas

Adotar quatro espaços de trabalho privados com nomes `@pecuaria/web`, `@pecuaria/api`, `@pecuaria/contracts` e `@pecuaria/domain`. npm e comandos explícitos de compilação atenderão à estrutura inicial.
| Local planejado | Responsabilidade e dependências permitidas |
| --- | --- |
| `apps/web/` | React, cliente de consulta, IndexedDB e gráfico. Consome contratos próprios do navegador e domínio; não importa código ou configuração do servidor. |
| `apps/api/` | Fastify, consultas e controles em memória. Consome contratos e repositório PostgreSQL; credenciais e permissões de escrita ficam nas operações autorizadas do servidor. |
| `apps/api/src/db/` e `apps/api/drizzle/` | Esquema físico, repositório, conexões e migrações SQL com seus metadados. |
| `apps/api/src/demo/` | Geração, validação e publicação demonstrativa por comando separado; sem rota pública de escrita. |
| `packages/contracts/` | Esquemas TypeBox, tipos e geração de validadores Ajv. Exportações separadas para servidor, tipos e validadores pré-compilados do navegador. |
| `packages/domain/` | Filtros e cálculos puros com `big.js`, independentes de React, rede, armazenamento e API. Pode consumir somente tipos dos contratos. |
| `tests/e2e/` | Testes Playwright e dados auxiliares de cenários completos. Testes unitários ficam junto aos módulos; integrações da API ficam em `apps/api/tests/`. |
| `infra/` | Dockerfiles, Caddyfile e arquivos auxiliares. `compose.yaml` fica na raiz; configurações de desenvolvimento e testes terão complementos explícitos. |
| `.github/workflows/` | Verificações adotadas; sem implantação automática. |

Usar ESM com `type: "module"`. Os pacotes compartilhados terão exportações explícitas de código e tipos compilados; gerar validadores antes de compilar a interface. A compilação executará a ordem de dependências, em vez de presumir que uma execução genérica em todos os espaços de trabalho encontra essa ordem. O navegador importará apenas tipos e validadores necessários; a exportação dos esquemas TypeBox do servidor não será incluída implicitamente na interface.

A API e os pacotes compartilhados serão compilados com TypeScript e resolução `NodeNext`; a interface usará Vite, resolução `bundler` e JSX de React. Declarar destino de linguagem e bibliotecas de cada ambiente no plano, compatíveis com Node.js 24 e com a matriz de navegadores. O processo da API executará JavaScript compilado com Node.js; `tsx` e `concurrently` ficam no desenvolvimento. Nenhum comando de desenvolvimento será usado como servidor da entrega acadêmica.

### Convenções e verificações adotadas

Adotar `strict: true`, `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`, mantendo a validação durante a execução já definida. A análise de tipos terá comando próprio e abrangerá os módulos e testes TypeScript. Usar arquivos `.ts` e `.tsx`, testes `.test.ts`/`.test.tsx` junto ao comportamento e `.spec.ts` para testes de ponta a ponta.

Adotar Prettier com dois espaços, ponto e vírgula, aspas simples, largura de referência de 100 colunas, fim de linha LF e `proseWrap: preserve`. Preservar as quebras Markdown intencionais de dois espaços e as convenções de idioma e itálico da documentação. Não aplicar mudanças gerais de formatação aos documentos existentes nesta etapa. Configurar `.editorconfig`, `.gitignore` e `.dockerignore` antes dos arquivos de implementação; excluir credenciais, dependências instaladas, resultados e certificados privados.

Adotar ESLint com configuração `eslint.config.mjs`, `@eslint/js` recomendado e `typescript-eslint` `recommendedTypeChecked` com `projectService`, além das regras recomendadas de React Hooks e da configuração Vite de React Refresh. Separar globais de Node.js e navegador e impedir importações de módulos do servidor pela interface. Usar `eslint-config-prettier` para retirar conflitos de estilo; Prettier terá sua própria verificação. Biome foi considerado como ferramenta unificada; ESLint foi escolhido pelas regras com informação de tipos e pelas integrações React adotadas.

Fontes: [verificação estrita](https://www.typescriptlang.org/tsconfig/strict.html), [índices potencialmente ausentes](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html), [propriedades opcionais](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html), [resolução por ambiente](https://www.typescriptlang.org/tsconfig/moduleResolution.html), [análise com tipos](https://typescript-eslint.io/getting-started/typed-linting/), [configurações recomendadas](https://typescript-eslint.io/users/configs/), [Prettier e análise de código](https://prettier.io/docs/integrating-with-linters), [React Hooks](https://react.dev/reference/eslint-plugin-react-hooks) e [React Refresh](https://github.com/ArnaudBarre/eslint-plugin-react-refresh) e [Biome](https://biomejs.dev/).

### Imagens e ferramentas de contêiner adotadas

Adotar Docker Engine `29.8.2` e Docker Compose `5.6.0` como referências para qualificar o ambiente local Linux. Registrar as versões efetivamente usadas na execução; uma combinação diferente precisará das mesmas verificações. A escolha não instala nem modifica Docker no computador do autor. Usar o comando `docker compose`.

As tags e os resumos abaixo foram conferidos nos metadados públicos do Docker Hub. São resumos dos índices de imagens; permitem selecionar a variante da arquitetura da máquina sem trocar a referência fixada. As quatro imagens consultadas têm variantes Linux `amd64` e `arm64`; isso não demonstra que a aplicação inteira já foi validada nas duas arquiteturas.

| Uso | Imagem e resumo adotados |
| --- | --- |
| Node.js para compilação e API | `node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20` |
| PostgreSQL | `postgres:18.6-bookworm@sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c` |
| Entrada HTTPS e arquivos da interface | `caddy:2.11.7-alpine@sha256:d8542f48d34a9cf4e4c11a478865229840e87e4c96ea3f439101f31a5d35f75f` |
| Análise Semgrep | `semgrep/semgrep:1.179.0@sha256:93963d9295a366f59e4850127b1550400ee7b388f04fe144e4a1f6325d96e01b` |

Usar compilação em estágios: instalar com npm e compilar no estágio de preparação; levar apenas os arquivos estáticos à imagem Caddy e o JavaScript compilado e dependências necessárias à imagem da API. A API usará usuário sem privilégios, um processo Node.js e encerramento que libere conexões. Migrações e preparação demonstrativa usarão estágio ou imagem de operações separado, com as ferramentas e permissões necessárias. Não levar Drizzle Kit, testes ou executores de desenvolvimento à imagem de consulta apenas para aplicar migrações ao iniciar.

Fontes: [Docker Engine 29.8.2](https://docs.docker.com/engine/release-notes/29/#2982), [Docker Compose 5.6.0](https://github.com/docker/compose/releases/tag/v5.6.0), [Node.js no Docker Hub](https://hub.docker.com/v2/repositories/library/node/tags/24.21.0-bookworm-slim), [PostgreSQL](https://hub.docker.com/v2/repositories/library/postgres/tags/18.6-bookworm), [Caddy](https://hub.docker.com/v2/repositories/library/caddy/tags/2.11.7-alpine), [Semgrep](https://hub.docker.com/v2/repositories/semgrep/semgrep/tags/1.179.0), [compilação em estágios](https://docs.docker.com/build/building/multi-stage/) e [orientações da imagem Node.js](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md).

### Serviços, HTTPS e inicialização local adotados

Adotar Caddy como entrada única da execução acadêmica. Ele servirá a interface compilada e encaminhará `/api/` ao Fastify, preservando o caminho e sem adicionar armazenamento compartilhado de respostas da API. Usar compressão gzip e conferir cabeçalhos, validade HTTP, `ETag`, respostas `304` e cotas através da entrada real. HTML será revalidado e recursos identificados por conteúdo terão a validade longa prevista na arquitetura. Caddy foi escolhido por reunir arquivos estáticos, encaminhamento, compressão e HTTPS local no mesmo serviço.

A origem padrão será `https://localhost`, com HTTP redirecionado para HTTPS. Caddy usará `tls internal` e volumes próprios para sua configuração e autoridade certificadora local. Instalar o certificado público dessa autoridade no armazenamento de confiança do sistema e do navegador usado; o contêiner não torna esse certificado confiável automaticamente no computador. Documentar instalação e remoção na implementação, sem versionar chaves privadas. Os testes completos também deverão confiar nessa autoridade; desativar a verificação de TLS não comprova o critério de HTTPS.

Expor por padrão somente as portas da entrada em `127.0.0.1`. API e PostgreSQL ficarão nas redes do Compose, sem portas publicadas no computador; a porta administrativa de Caddy também não será publicada. A API confiará apenas na origem do Caddy identificada na configuração da rede para interpretar IP encaminhado. Conferir a normalização e a rejeição de cabeçalhos forjados conforme a política aprovada. Não ativar registro de acesso com IP ou outros dados pessoais na entrada; a aplicação manterá as métricas agregadas previstas na arquitetura.

O fluxo inicial será: PostgreSQL disponível, migrações concluídas, preparação inicial concluída, API pronta e entrada disponível. Usar `healthcheck`, `service_healthy` e `service_completed_successfully` nas dependências apropriadas. Migrações e preparação serão serviços de execução única com credenciais próprias. A preparação inicial publicará dados somente quando não houver fotografia publicada; não sobrescreverá nem apagará uma publicação existente. Publicações seguintes terão comando explícito e usarão o mecanismo transacional já adotado.

O teste de prontidão da API deverá verificar acesso de leitura e existência de publicação compatível; `pg_isready` isoladamente não demonstra que esquema e dados estão preparados. Falha de migração ou preparação impedirá disponibilizar a aplicação, e quedas posteriores do banco serão tratadas pela API. O plano definirá verificações internas, tempos máximos, repetição limitada de conexões e comportamento de reinício. A persistência e o diretório do PostgreSQL continuam na [definição adotada do banco](#postgresql--aprovado-para-execução-local).

Guardar senhas em arquivos locais ignorados, montados como segredos apenas nos serviços autorizados; exemplos versionados conterão somente instruções e valores demonstrativos identificados. A aplicação lerá os arquivos explicitamente; a montagem como segredo não faz bibliotecas Node.js lê-los automaticamente. A imagem PostgreSQL poderá usar suas opções `_FILE`. Dados persistentes e material da autoridade local não entrarão no contexto de compilação. Os projetos e volumes de teste permanecerão separados dos usados na consulta acadêmica.

Fontes: [Caddy e HTTPS local](https://caddyserver.com/docs/automatic-https), [autoridade interna](https://caddyserver.com/docs/caddyfile/directives/tls#internal), [serviço de arquivos e SPA](https://caddyserver.com/docs/caddyfile/patterns#single-page-apps-spas), [encaminhamento e cabeçalhos](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), [compressão](https://caddyserver.com/docs/caddyfile/directives/encode), [registros de acesso](https://caddyserver.com/docs/caddyfile/directives/log), [ordem de inicialização no Compose](https://docs.docker.com/compose/how-tos/startup-order/) e [segredos por serviço](https://docs.docker.com/compose/how-tos/use-secrets/).

### Comandos a disponibilizar na implementação

Estabelecer comandos na raiz para instalar (`npm ci`), desenvolver (`npm run dev`), compilar (`npm run build`), verificar tipos/formatação/código (`npm run check`), testar (`npm test`, `npm run test:integration`, `npm run test:e2e`) e executar auditoria e Semgrep (`npm run security`). A execução acadêmica usará `docker compose up --build`; o fluxo de dependências preparará banco, esquema e dados iniciais antes de expor a consulta.

Esses nomes são o contrato planejado dos comandos, ainda sem manifestos ou arquivos Compose. O plano explicitará geração de validadores, ordem de compilação, processos de desenvolvimento, execução das operações de banco, preparação dos segredos e confiança da autoridade local. Registrar no README somente como procedimentos disponíveis após implementação e verificação. Revalidar correções de segurança das versões escolhidas ao introduzir os arquivos, registrando qualquer atualização e repetindo as verificações de compatibilidade.

## Implantação local e compatibilidade futura com Vercel

No Compose, Caddy servirá a interface compilada e encaminhará as consultas à API Fastify; PostgreSQL manterá os dados em volume persistente. Imagens, HTTPS local e fluxo de inicialização seguem as [escolhas do ambiente reproduzível](#ambiente-reproduzível-módulos-e-convenções). A preparação e publicação demonstrativa será uma operação separada da consulta pública. O plano formalizará os arquivos, credenciais, verificações de disponibilidade e comandos completos; essas configurações ainda não foram implementadas.

Expor interface e API pela mesma origem, com encaminhamento de `/api/`, preserva a recomendação da arquitetura. Foi aprovada uma única instância da API, com um único processo atendendo às consultas na entrega local. A cota por IP e o limite global de consultas simultâneas ao banco serão controlados em memória nesse processo. Essa decisão orientará a configuração do Compose e os testes. Um contêiner com vários processos ou várias réplicas exigirá os controles distribuídos descritos abaixo antes de sua adoção.

A documentação oficial consultada em 06/10/2026 confirma suporte a Vite e Fastify na Vercel. Pelo caminho documentado de Fastify, a aplicação executa como uma Vercel Function com escalonamento automático. A Vercel também documenta Services e imagens de contêiner em beta; os detalhes poderão mudar antes do experimento.

Docker Compose continuará sendo a definição da execução local. A implantação na Vercel terá configuração própria, e a persistência do banco local será substituída por PostgreSQL em um serviço externo. O provedor ainda será avaliado. Não assumir que transferir o arquivo Compose cria a mesma infraestrutura na Vercel.

Revalidar suporte, planos, limites e custos na etapa de implantação. Verificar conexões com o banco, reutilização de clientes, região dos serviços, latência de inicialização e os orçamentos de desempenho. Compatibilidade com as tecnologias não demonstra prontidão operacional nem cumprimento das metas de latência.

Fontes: [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Fastify na Vercel](https://vercel.com/docs/frameworks/backend/fastify) e [mapeamento de conceitos do Compose para Vercel](https://vercel.com/kb/guide/docker-compose-concepts-on-vercel).

## Coordenação entre instâncias da API

Uma instância é uma cópia da API em execução, com sua própria memória. Um serviço de entrada pode distribuir chamadas entre as instâncias A, B e C. Sem coordenação, cada cópia conhece apenas os pedidos e as operações que ela mesma recebeu.

Os limites globais e os cenários obrigatórios de teste estão na [política de limitação de requisições da arquitetura](2026-10-04-arquitetura-v0.1-design.md#limitação-de-requisições-da-api-pública). A consistência de versões e a invalidação estão nas seções de modelo de dados e de [cache e atualização](2026-10-04-arquitetura-v0.1-design.md#cache-e-atualização-automática). A tabela abaixo ilustra as consequências dessas políticas ao ampliar a implantação.

| Controle | Problema sem coordenação | Resultado exigido |
| --- | --- | --- |
| Cota por IP | Cada uma de três instâncias concede 30 permissões iniciais ao mesmo IP: até 90 chamadas imediatas no conjunto. Cada cópia também repõe duas permissões por segundo, multiplicando a reposição total. | Um único balde lógico por IP para todas as chamadas à API: capacidade inicial de 30 e reposição total de duas permissões por segundo. |
| Concorrência do banco | Cada uma de três instâncias admite 20 operações: até 60 operações simultâneas no conjunto. | Até 20 operações simultâneas somando todas as instâncias, com admissão e liberação coordenadas. |
| Versão e resumo em *cache* | Uma publicação invalida apenas a memória de A, enquanto B continua escolhendo um resumo antigo sem perceber a publicação. | Acompanhar a versão publicada e invalidar ou deixar de selecionar o resumo antigo em todas as instâncias, respeitando o contrato e a validade HTTP. |

Esses exemplos usam os valores iniciais já propostos na arquitetura. O limite de 120 requisições por minuto é uma taxa de reposição contínua, não uma janela fixa; a capacidade de 30 permissões também faz parte da política.

### Mecanismos antes de ampliar a implantação

Uma entrada única pode controlar as cotas por IP; alternativamente, as instâncias podem usar contadores compartilhados com operações atômicas. O limite global de operações no banco precisa de um mecanismo equivalente de admissão e liberação, inclusive após cancelamento ou falha de processo. Não basta configurar um conjunto de conexões de tamanho 20 em cada instância.

A publicação e a seleção de versões na entrega local seguem o [mecanismo adotado](#mecanismo-de-publicação-adotado). Antes de ampliar a implantação, verificar seu comportamento entre instâncias e o custo da leitura da referência publicada. Qualquer substituição dessa leitura por notificações ou outro mecanismo deverá preservar a invalidação e a consistência exigidas na arquitetura, inclusive após falhas de comunicação.

O autor decidiu deixar Valkey ou Redis para versões futuras. Ambos são candidatos à coordenação compartilhada, e a escolha entre eles permanece pendente. A entrega local da v0.1/v0.2 usará controles em memória no único processo da API. Os limites por IP e de concorrência continuam obrigatórios nessa entrega; o adiamento se aplica ao armazenamento compartilhado. Antes de ampliar para múltiplas instâncias, selecionar e testar o mecanismo distribuído conforme a hospedagem. Implementações locais e distribuídas poderão ter a mesma interface, com regras e contratos preservados.

Não é necessário compartilhar todo o conteúdo em memória nem fazer todas as instâncias responderem com a mesma versão no mesmo instante. Requisições em andamento e *caches* HTTP podem legitimamente usar uma versão anterior completa dentro das políticas aprovadas. É necessário preservar cada fotografia, informar sua versão e impedir combinação de cadastros, preços e históricos de versões diferentes. O cliente trata `409` para uma versão indisponível e mantém a consulta anterior identificada até concluir a troca.

### Verificação antes de ampliar a implantação

Executar na infraestrutura de destino os cenários de limitação, falhas e consistência de versões definidos na arquitetura, distribuindo as chamadas entre pelo menos duas instâncias. Repetir as medições do [orçamento de desempenho](2026-10-04-arquitetura-v0.1-design.md#orçamento-de-desempenho-proposto). Execução local em uma instância não comprova comportamento distribuído.

## Base demonstrativa definida

O autor solicitou pesquisa pública e montagem da base fixa. O conjunto `go-reposicao-demo-2026-10-07-r1` foi preparado em `data/demonstrativa/v0.1/`, com os oito perfis, composição municipal completa e versão territorial do IMB, janela de 12 meses com referência semanal, receita determinística e lacunas controladas. A [documentação da base](2026-10-07-base-demonstrativa-v0.1.md) concentra parâmetros, fontes, arquivos e cenários; este registro mantém as decisões tecnológicas e as pendências.

Os preços são fictícios, preservando a natureza demonstrativa da v0.1/v0.2. A pesquisa pública não antecipa a integração de séries reais nem configura autorização de uso para a v0.3.

## Definições restantes antes do plano de implementação

1. Detalhar o modelo físico com Drizzle e as migrações: tabelas, índices, precisão/escala, proteção de imutabilidade e retenção de versões, usando os dados demonstrativos fixados. Versão do PostgreSQL, acesso, ferramenta de migrações e mecanismo de publicação já foram adotados.
2. Formalizar os esquemas completos e exemplos das respostas com TypeBox, os limites de entrada e os detalhes do armazenamento com IndexedDB. Validação, aritmética decimal, persistência e gráfico já foram adotados; verificar suas configurações nos testes e medições da implementação.
3. Detalhar a configuração das ferramentas de teste, auditoria e integração contínua adotadas; fixar os arquivos e a revisão das regras comunitárias do Semgrep e seus testes. TDD e Semgrep foram confirmados pelo autor; as configurações executáveis serão criadas com a implementação.
4. Formalizar os arquivos do ambiente e os comandos completos no plano: manifestos, compilação, geração de validadores, formatação, verificações estáticas, Compose, segredos e confiança HTTPS local. Versões de referência, imagens, diretórios e convenções já foram adotados; instalar e verificar a combinação na implementação.
5. Definir apresentação visual e navegadores suportados, preservando estados de consulta, acessibilidade e rotação de tela já exigidos.
6. Medir a representação persistida do resumo e dos oito históricos para definir o orçamento de armazenamento, incluindo margem e troca segura de versões, antes de fechar essa configuração no plano.

As escolhas técnicas registradas como adotadas foram resolvidas sob a delegação do autor. Decisões de produto e escolhas ainda pendentes devem ser revisadas e registradas antes de serem tratadas como aprovadas. A implementação e as medições produzirão evidências próprias; este registro preserva a pesquisa e suas implicações.
