# Tecnologias e implantação — v0.1 e v0.2

Data: 06/10/2026.  
Estado: registro das decisões de conversa, das recomendações técnicas e dos achados de documentação oficial. A seleção de tecnologias está parcialmente concluída; este documento não representa implementação nem aprovação de todas as recomendações.

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
| Banco | Aprovado pelo autor | PostgreSQL no Docker Compose para a v0.1/v0.2, com persistência em volume. Versão, acesso aos dados e migrações ainda serão definidos. |
| Implantação futura | Intenção do autor | Experimentar Vercel antes da v1.0. Compatibilidade documentada; configuração e viabilidade operacional ainda serão verificadas. |
| Aritmética decimal | Candidata | `decimal.js` foi sugerida. Biblioteca, precisão e modo de arredondamento ainda precisam ser definidos. |
| Demais ferramentas e versões | Pendentes | Validação de contratos, acesso ao banco, gráfico, persistência no navegador, testes, auditoria, formatação e ambiente reproduzível. |

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

O autor escolheu PostgreSQL no Docker Compose. Os fundamentos abaixo registram a justificativa da escolha; versão, modelo físico, acesso aos dados e migrações permanecem pendentes.

Perfis, regiões, semanas, preços e versões têm estrutura estável. A arquitetura exige referências válidas, unicidade, valores positivos e publicação transacional. PostgreSQL permite expressar integridade referencial por chaves estrangeiras, unicidade por `UNIQUE` e restrições de valores por `CHECK`, reduzindo a lógica de integridade que a aplicação precisa manter.

Uma cotação poderá ser impedida pelo próprio banco de referenciar um perfil ou uma região inexistente. A modelagem deverá impedir também referências entre versões incompatíveis. A unicidade será definida dentro da versão ou do conjunto publicado, conforme o modelo final; preservar versões anteriores não autoriza duplicatas dentro de uma mesma versão.

O tipo `NUMERIC` permite armazenamento decimal. A precisão, a escala e a rejeição de valores especiais precisarão ser configuradas para preservar os requisitos. O contrato HTTP continuará usando cadeias decimais, e os cálculos do navegador continuarão exigindo uma biblioteca decimal.

A escolha se fundamenta na adequação às regras documentadas. Não foi realizada uma medição comparativa de desempenho entre os bancos, nem demonstrada uma necessidade de capacidade que favoreça um deles.

Fontes: [PostgreSQL — restrições](https://www.postgresql.org/docs/current/ddl-constraints.html) e [tipos numéricos](https://www.postgresql.org/docs/current/datatype-numeric.html).

### MongoDB — alternativa avaliada

MongoDB era a preferência inicial do autor, com execução local ou Atlas no plano gratuito. A alternativa foi avaliada e PostgreSQL foi escolhido para esta entrega. Os achados abaixo preservam o fundamento da comparação para uma eventual revisão futura.

MongoDB oferece validação de documentos, índices únicos e transações envolvendo múltiplos documentos. A publicação transacional exige um conjunto de réplicas (*replica set*); uma instância independente sem essa configuração não atende a essa estratégia. Durante a comparação, foi considerada a possibilidade de um conjunto de réplicas com um nó no ambiente acadêmico, sujeita a verificação com as versões adotadas. Essa configuração não oferece redundância.

Com cadastros e preços em coleções separadas, as referências precisam de controles na aplicação para permanecer consistentes. Se essa alternativa for retomada, revisar e explicitar esse mecanismo na arquitetura: a exigência de referências válidas permanece, mas sua execução não terá o mecanismo de chaves estrangeiras de PostgreSQL. Transações, validação e imutabilidade das versões publicadas deverão trabalhar juntas; validar somente o formato dos documentos não garante a existência dos documentos referenciados.

Outro ponto avaliado foi a necessidade de definir armazenamento decimal e conversão para o contrato HTTP, preservando a precisão monetária. A familiaridade do autor com MongoDB foi considerada junto ao trabalho adicional de integridade e testes.

Atlas no plano gratuito foi considerado como opção futura associada a MongoDB. Uma eventual retomada deverá conferir limites de armazenamento, conexões, operações e transferência; a existência de um plano gratuito não demonstra cumprimento dos limites de desempenho da aplicação. Atlas não integra a solução aprovada para a entrega acadêmica.

Fontes: [MongoDB — validação e índices únicos](https://www.mongodb.com/docs/manual/tutorial/unique-indexes-schema-validation/), [transações](https://www.mongodb.com/docs/manual/core/transactions/), [integridade das referências](https://www.mongodb.com/docs/manual/data-modeling/data-consistency/), [configuração de um conjunto com um nó](https://www.mongodb.com/docs/v8.3/tutorial/restore-replica-set-from-backup/) e [limites gratuitos do Atlas](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/).

## Implantação local e compatibilidade futura com Vercel

No Compose, preparar serviços para servir a interface compilada, executar a API e manter PostgreSQL com volume persistente. A preparação e publicação demonstrativa será uma operação separada da consulta pública. Os detalhes de imagens, inicialização, verificações de disponibilidade, rede, HTTPS local e comandos ainda serão definidos no plano.

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

### Mecanismos a selecionar

Uma entrada única pode controlar as cotas por IP; alternativamente, as instâncias podem usar contadores compartilhados com operações atômicas. O limite global de operações no banco precisa de um mecanismo equivalente de admissão e liberação, inclusive após cancelamento ou falha de processo. Não basta configurar um conjunto de conexões de tamanho 20 em cada instância.

Para a versão dos dados, usar uma referência publicada no banco e chaves de *cache* por versão. Selecionar também um mecanismo de invalidação ou verificação que alcance todas as instâncias, incluindo a comunicação entre a preparação dos dados e a API. O TTL de 60 segundos é uma proteção adicional, não substitui por si só a invalidação exigida após publicação.

O autor decidiu deixar Valkey ou Redis para versões futuras. Ambos são candidatos à coordenação compartilhada, e a escolha entre eles permanece pendente. A entrega local da v0.1/v0.2 usará controles em memória no único processo da API. Os limites por IP e de concorrência continuam obrigatórios nessa entrega; o adiamento se aplica ao armazenamento compartilhado. Antes de ampliar para múltiplas instâncias, selecionar e testar o mecanismo distribuído conforme a hospedagem. Implementações locais e distribuídas poderão ter a mesma interface, com regras e contratos preservados.

Não é necessário compartilhar todo o conteúdo em memória nem fazer todas as instâncias responderem com a mesma versão no mesmo instante. Requisições em andamento e *caches* HTTP podem legitimamente usar uma versão anterior completa dentro das políticas aprovadas. É necessário preservar cada fotografia, informar sua versão e impedir combinação de cadastros, preços e históricos de versões diferentes. O cliente trata `409` para uma versão indisponível e mantém a consulta anterior identificada até concluir a troca.

### Verificação antes de ampliar a implantação

Executar na infraestrutura de destino os cenários de limitação, falhas e consistência de versões definidos na arquitetura, distribuindo as chamadas entre pelo menos duas instâncias. Repetir as medições do [orçamento de desempenho](2026-10-04-arquitetura-v0.1-design.md#orçamento-de-desempenho-proposto). Execução local em uma instância não comprova comportamento distribuído.

## Definições restantes antes do plano de implementação

1. Definir a versão de PostgreSQL, a biblioteca de acesso aos dados, as migrações, o modelo físico e o mecanismo de publicação transacional.
2. Formalizar os esquemas das respostas e escolher validação, aritmética decimal, persistência no navegador e gráfico.
3. Selecionar testes, auditoria de dependências, regras do Semgrep e integração contínua; TDD já está estabelecido.
4. Fixar versões, gerenciador de pacotes, diretórios, formatação, análise estática, configuração do Compose e comandos reproduzíveis.
5. Definir idade e peso dos oito perfis, composição municipal e versão territorial, janela de 12 meses, convenção semanal e geração reproduzível de preços e lacunas.
6. Definir apresentação visual e navegadores suportados, preservando estados de consulta, acessibilidade e rotação de tela já exigidos.
7. Medir a representação persistida do resumo e dos oito históricos para definir o orçamento de armazenamento, incluindo margem e troca segura de versões, antes de fechar essa configuração no plano.

As escolhas pendentes devem ser revisadas e registradas antes de serem tratadas como aprovadas. A implementação e as medições produzirão evidências próprias; este registro preserva a pesquisa e suas implicações.
