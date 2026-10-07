# Tecnologias e implantação — v0.1 e v0.2

Data: 06/10/2026.  
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
| Aritmética decimal | Candidata | `decimal.js` foi sugerida. Biblioteca, precisão e modo de arredondamento ainda precisam ser definidos. |
| Demais ferramentas e versões | Pendentes | Validação de contratos, gráfico, persistência no navegador, testes, auditoria, formatação e ambiente reproduzível. |

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

## Implantação local e compatibilidade futura com Vercel

No Compose, preparar serviços para servir a interface compilada, executar a API e manter PostgreSQL com volume persistente. A preparação e publicação demonstrativa será uma operação separada da consulta pública. A imagem do banco foi definida nesta etapa; as demais imagens, a inicialização, as verificações de disponibilidade, a rede, o HTTPS local e os comandos ainda serão definidos no plano.

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

## Definições restantes antes do plano de implementação

1. Detalhar o modelo físico com Drizzle e as migrações: tabelas, índices, precisão/escala, proteção de imutabilidade e retenção de versões, após fixar os dados demonstrativos. Versão do PostgreSQL, acesso, ferramenta de migrações e mecanismo de publicação já foram adotados.
2. Formalizar os esquemas das respostas e escolher validação, aritmética decimal, persistência no navegador e gráfico.
3. Selecionar testes, auditoria de dependências, regras do Semgrep e integração contínua; TDD já está estabelecido.
4. Fixar versões, gerenciador de pacotes, diretórios, formatação, análise estática, configuração do Compose e comandos reproduzíveis.
5. Definir idade e peso dos oito perfis, composição municipal e versão territorial, janela de 12 meses, convenção semanal e geração reproduzível de preços e lacunas.
6. Definir apresentação visual e navegadores suportados, preservando estados de consulta, acessibilidade e rotação de tela já exigidos.
7. Medir a representação persistida do resumo e dos oito históricos para definir o orçamento de armazenamento, incluindo margem e troca segura de versões, antes de fechar essa configuração no plano.

As escolhas técnicas registradas como adotadas foram resolvidas sob a delegação do autor. Decisões de produto e escolhas ainda pendentes devem ser revisadas e registradas antes de serem tratadas como aprovadas. A implementação e as medições produzirão evidências próprias; este registro preserva a pesquisa e suas implicações.
