# Testes, auditoria e integração contínua da v0.1

Data: 7 de outubro de 2026.  
Estado: configuração definida sob a delegação técnica do autor; referências Semgrep verificadas isoladamente; aplicação e fluxo CI ainda não implementados.

## Objetivo e decisões

Concluir a definição das ferramentas já adotadas, preservando TDD, Semgrep obrigatório e a entrega acadêmica local. Este documento detalha arquivos, comandos previstos, isolamento, evidências e aprovação. Escopo e resultados esperados permanecem nos [requisitos](2026-10-04-requisitos-v0.1-design.md), na [arquitetura](2026-10-04-arquitetura-v0.1-design.md), no [modelo PostgreSQL](2026-10-07-modelo-fisico-postgresql-v0.1-design.md) e nos [contratos](2026-10-07-contratos-api-e-indexeddb-v0.1-design.md).

Adotar cinco projetos Vitest e verificações separadas no GitHub Actions. Testes rápidos fornecem retorno no ciclo TDD; banco e navegador reais verificam integridade, publicação, persistência e transporte. Uma execução que falha não será aprovada porque uma repetição passou. Cobertura informa lacunas; não haverá percentual arbitrário substituindo os cenários obrigatórios.

A seleção automática remota do Semgrep foi descartada por mudar as regras entre execuções. Copiar os YAML comunitários para o repositório também foi descartado: a licença atual proíbe redistribuição. Adotar manifesto versionado com revisão e hashes, cópias locais fora do Git e três regras próprias, verificadas por casos positivos e negativos. Não alterar o escopo do produto nem usar um serviço hospedado de análise.

## Arquivos e comandos previstos

Os caminhos abaixo são para a implementação; existem agora apenas a especificação e os [artefatos de referência](../quality/v0.1/). Nenhum comando npm desta seção funciona antes da criação dos manifestos e respectivos módulos.

| Caminho previsto | Responsabilidade |
| --- | --- |
| `vitest.config.ts` | Projetos e cobertura na raiz, sem misturar ambientes. |
| `packages/domain/vitest.config.ts` | Projeto `dominio`, ambiente Node.js. |
| `packages/contracts/vitest.config.ts` | Projeto `contratos`, ambiente Node.js, equivalência dos esquemas e validadores. |
| `apps/api/vitest.config.ts` | Projeto `api`, Node.js e `fastify.inject()`, repositório controlado para testes rápidos. |
| `apps/web/vitest.config.ts`, `apps/web/tests/setup.ts` | Projeto `componentes`, jsdom, React Testing Library e integração `jest-dom/vitest`. |
| `apps/api/vitest.integration.config.ts`, `apps/api/tests/integration/` | Projeto `banco`, PostgreSQL real e chamadas à API com o repositório real. |
| `playwright.config.ts`, `tests/e2e/` | Aplicação compilada, HTTPS, armazenamento, recuperação e acesso por teclado. |
| `tools/quality/` | Executores Node.js para conferência da base, artefatos, Compose de teste e políticas de aprovação. |
| `tools/semgrep/manifesto.json`, `tools/semgrep/regras/projeto.yaml`, `tools/semgrep/casos-semgrep.json` | Seleção fixada e regras próprias, provenientes das referências desta etapa. |
| `tools/semgrep/preparar.mjs`, `testar.mjs`, `analisar.mjs` | Obter regras fixas, comparar casos com achados e analisar alvos próprios com preservação de códigos de saída. |
| `.semgrepignore` | Exclusões explícitas de dependências e arquivos gerados; preservar testes próprios no escopo. |
| `.github/workflows/ci.yml` | Trabalhos obrigatórios de qualidade, banco, navegador e segurança, com resultado agregador. |
| `docs/qualidade/excecoes.json` | Exceções revisadas por regra/dependência, trecho, evidência e prazo; lista inicialmente vazia. |

| Comando previsto na raiz | Comportamento |
| --- | --- |
| `npm ci` | Instalação exata do único `package-lock.json`, sem contornar conflitos. |
| `npm run check:format` | Prettier, preservando quebras Markdown intencionais. |
| `npm run check:types` | Análise TypeScript de produção e testes, separada da transformação Vitest. |
| `npm run check:lint` | ESLint e fronteiras de importação já adotadas. |
| `npm run check:data` | Resumos SHA-256, receita, calendários, referências e cenários demonstrativos fixos. |
| `npm run test:unit` | `vitest run` com projetos `dominio`, `contratos`, `api` e `componentes`. |
| `npm run test:coverage` | Mesmos quatro projetos com cobertura V8. |
| `npm run test:integration` | `vitest run --project banco`, com Docker disponível. |
| `npm run build` | Geração dos validadores pré-compilados e compilação dos módulos e aplicação. |
| `npm run test:e2e` | Preparar Compose isolado, executar Playwright e encerrar apenas seus recursos. |
| `npm run security:audit` | Executar `npm audit --include=dev --audit-level=high --json`, guardar relatório e avaliar resultado. |
| `npm run security:rules:prepare` | Baixar arquivos por revisão fixa, verificar SHA-256 e preservar avisos em *cache* local. |
| `npm run security:rules:test` | Materializar os casos próprios e comparar achados esperados e alvos analisados. |
| `npm run security:semgrep` | Análise completa com configurações locais e exame do relatório e das exceções revisadas. |

Na implementação, materializar os artefatos de referência nos caminhos previstos e verificar sua equivalência; não manter duas seleções ou conjuntos de casos editados independentemente. A descrição fixa o comportamento dos comandos. Os manifestos, argumentos completos de compilação, segredos, Compose e confiança HTTPS continuam na pendência de ambiente; não declarar executáveis que ainda não existem.

## Projetos Vitest e TDD

Usar `pool: 'forks'`, isolamento entre arquivos, `globals: false`, `passWithNoTests: false`, `allowOnly: false` em CI e `retry: 0`. Os quatro projetos rápidos terão `testTimeout: 5000` e `hookTimeout: 10000`; no CI, limitar o executor a dois trabalhadores. Restaurar objetos substituídos e relógios entre testes; não usar esperas reais para prazos, repetição e limitação por IP. Testes `.test.ts` e `.test.tsx` ficam junto ao comportamento, conforme as convenções centrais.

No projeto `banco`, usar um trabalhador, `fileParallelism: false`, teste de até 30 segundos e preparação de até 120 segundos. A criação do contêiner terá prazo de 60 segundos; indisponibilidade do Docker ou do PostgreSQL falha o trabalho, sem pular a suíte. Registrar tempo de preparação separadamente da latência das consultas. Alterações justificadas dos prazos serão registradas com evidência; não usar prazo ilimitado para ocultar bloqueios.

Cada comportamento começa por teste que falha pelo resultado ausente, seguido de implementação mínima e refatoração. Registrar evidência do ciclo nas revisões de alterações relevantes. A CI verifica o estado final; sozinha não demonstra que TDD foi seguido. Correções reproduzem o defeito antes da mudança. Não gerar o resultado esperado executando a mesma fórmula que está sendo testada.

Cobertura V8 usa `coverage.include` explícito para `packages/domain/src/**/*.ts`, `packages/contracts/src/**/*.ts`, `apps/api/src/**/*.ts` e `apps/web/src/**/*.{ts,tsx}`. Excluir somente declarações, testes e validadores gerados, com teste de equivalência destes últimos. Não excluir módulos sem testes para aumentar percentual. Gerar texto, JSON de resumo, LCOV e HTML em `artifacts/coverage/unit/`; cobertura de integração, quando coletada, fica em `artifacts/coverage/integration/`. Identificar o escopo de cada relatório; não anunciar um percentual como cobertura de ponta a ponta ou somar percentuais de suítes.

Fontes: [projetos Vitest](https://vitest.dev/guide/projects.html), [cobertura](https://vitest.dev/config/coverage), [prazo dos testes](https://vitest.dev/config/testtimeout) e [concorrência](https://vitest.dev/config/maxworkers). Valores de configuração acima são escolhas do projeto.

## Cenários e isolamento

| Grupo | Evidência obrigatória |
| --- | --- |
| Domínio | CA03–CA08, precisão decimal, peso de referência, datas civis, ausência excluída, cobertura e composição regional. Usar os resultados independentes da base e exemplos aprovados. |
| Contratos | Exemplos completos e casos inválidos; equivalência TypeBox/Ajv/navegador; metadados cruzados; calendário inteiro; partição entre presentes e ausentes; preço, moeda e unidade sem coerção. |
| API rápida | Entrada duplicada, limites, erros, `ETag`, `200`/`304`, versão indisponível, cota conjunta por IP, concorrência, liberação de vagas e rejeição de IP encaminhado não confiável. |
| Componentes | Filtros solicitados versus exibidos, consulta vazia, estados pendentes, texto acessível, respostas fora de ordem e falha independente do gráfico. |
| Banco real | Migrações desde base vazia, PK/FK, decimais, permissões, gatilhos, publicação idempotente, conflito de hash, interrupção antes de confirmar, leitura concorrente e retenção de versões. |
| Navegador real | Consulta com API/banco reais, carregamento progressivo, IndexedDB/duas abas/quota, recuperação, revalidação através de Caddy, teclado, rotação e acesso textual ao histórico. |
| Segurança | SQL parametrizado com entradas hostis, renderização como texto, HTTPS confiável e ausência de conteúdo misto, cabeçalhos de proteção, limites e isolamento das credenciais. Semgrep não substitui esses testes. |

O banco de integração usa a imagem PostgreSQL fixada, sem montar o volume acadêmico. Criar base exclusiva por arquivo de testes com nome gerado e credenciais descartáveis; cada arquivo cria suas próprias publicações. Casos de concorrência usam conexões independentes. Não simular publicação com uma única conexão nem envolver testes de confirmação em uma transação externa que desfaça seus resultados. Encerrar clientes e contêineres em `finally`; não usar limpeza global de Docker.

No fluxo completo, gerar nome exclusivo de projeto Compose por execução, com redes, volumes e credenciais próprios. Inicializar migrações e carga através das operações previstas, aguardar prontidão real e validar a consulta. O encerramento remove somente recursos daquele projeto. Usar `docker compose config` também para examinar a configuração efetiva: proibir modo privilegiado e montagem do socket Docker, manter API/banco sem portas publicadas e exigir usuário sem privilégios na imagem da API. Semgrep não resolve sozinho variáveis, herança de imagens ou composição de arquivos.

Playwright terá `workers: 1`, `fullyParallel: false`, `retries: 0`, `forbidOnly` no CI, prazo de teste de 60 segundos e expectativa de 5 segundos. Capturar traço e imagem em falha; vídeo desativado. O ciclo deve registrar a primeira falha; uma nova execução não elimina a obrigação de investigar instabilidade. A matriz aprovada abrange Chrome, Edge, Firefox e Safari, conforme a [definição de apresentação](2026-10-07-apresentacao-e-armazenamento-v0.1-design.md). Usar projetos Chromium, Firefox e WebKit, registrando a distinção entre motores automatizados e produtos suportados. Chromium será usado nas medições que exigem controle de rede/CPU. O autor dispensou apenas medições adicionais de ocupação do armazenamento; os testes funcionais e de falhas permanecem.

Confiar no certificado público da autoridade de teste em todos os clientes usados na consulta. Não usar `ignoreHTTPSErrors`, `NODE_TLS_REJECT_UNAUTHORIZED=0` ou `curl -k` para comprovar HTTPS. Medições de cinco navegações na rede e CPU aprovadas ficam em relatório próprio e não são substituídas pelos prazos do executor. A entrega inclui revisão manual de teclado, foco e acessibilidade além dos resultados de axe.

Fontes: [Testcontainers PostgreSQL](https://node.testcontainers.org/modules/postgresql/), [Playwright em CI](https://playwright.dev/docs/ci) e [repetição de testes](https://playwright.dev/docs/test-retries).

## Seleção Semgrep e licença

O [manifesto fixado](../quality/v0.1/semgrep-selecao.json) concentra executor, revisão de origem, caminhos, identificadores, SHA-256, licença e ações GitHub. Revisão oficial escolhida: `a84ff9cc2453ca91d581380de4b8b3f272f6f4be`, datada de 22/09/2026; executor Semgrep CE `1.179.0`, na imagem já adotada no registro tecnológico. Não usar ramo, tag mutável ou seleção automática como identidade das regras.

Foram adotadas dez regras comunitárias:

| Identificador | Cobertura selecionada |
| --- | --- |
| `eval-detected` | Avaliação dinâmica em JavaScript/TypeScript. |
| `ajv-allerrors-true` | Opção de alocação de todos os erros em Ajv. |
| `insecure-innerhtml` | Inserção de conteúdo dinâmico por `innerHTML`. |
| `spawn-shell-true` | Subprocesso com interpretação por *shell*. |
| `secret-in-build-arg` | Argumentos Docker com nomes associados a segredos. |
| `last-user-is-root` | Usuário final explicitamente raiz em Dockerfile. |
| `missing-user` | `CMD` sem usuário anterior declarado. |
| `run-shell-injection` | Interpolação de contexto GitHub no comando de execução. |
| `pull-request-target-code-checkout` | Consulta de código não confiável com contexto de destino privilegiado. |
| `github-actions-mutable-action-tag` | Referência mutável em ações, incluindo ações do GitHub. |

A licença atual permite uso interno sujeito às suas condições e **proíbe redistribuição**. Portanto, substituir a decisão anterior de versionar YAML comunitários: versionar o manifesto, conferir hashes ao obter cópias locais em `.cache/semgrep/<revisao>/` e preservar os avisos de origem. Não incluir essas cópias, testes de terceiros ou configuração que os incorpore nos arquivos Git, imagens entregues ou artefatos publicados. O produto não disponibiliza análise como serviço. Antes de atualizar a seleção, revisar novamente origem, licença, comportamento e compatibilidade; não presumir licença de código aberto pela disponibilidade no GitHub.

A obtenção ocorre numa etapa explícita de preparação, por URLs imutáveis da revisão. A análise usa somente arquivos locais verificados. Falha de download ou hash impede preparar a seleção; não substituir automaticamente por outra revisão. Em CI, a preparação pode baixar as cópias fixadas a cada execução; nenhuma execução usa regras mutáveis do registro remoto.

Fontes: [repositório na revisão fixada](https://github.com/semgrep/semgrep-rules/tree/a84ff9cc2453ca91d581380de4b8b3f272f6f4be), [aviso de licença dessa revisão](https://github.com/semgrep/semgrep-rules/blob/a84ff9cc2453ca91d581380de4b8b3f272f6f4be/LICENSE) e [condições de uso e redistribuição](https://semgrep.dev/legal/rules-license/). Esta escolha preserva os limites expressos da fonte; não transfere sua licença para o projeto.

### Regras próprias e limites verificados

As [regras próprias de referência](../quality/v0.1/regras-proprias.exemplo.yaml) são originais do projeto e serão incorporadas à configuração na implementação:

- `pi-react-raw-html`: proibir `dangerouslySetInnerHTML`, inclusive conteúdo constante, pois a consulta deve renderizar os dados como texto. Não depende de reconhecer a origem de dados através de propriedades tipadas.
- `pi-compose-privileged`: detectar modo privilegiado em arquivos `compose.yaml` e `compose.*.yaml`, sem exigir `version:`.
- `pi-compose-host-socket`: detectar montagem curta ou longa do socket Docker, inclusive sufixo `:ro`; leitura do socket também concede acesso indevido aos serviços da aplicação.

Os [28 casos próprios](../quality/v0.1/casos-semgrep.json) contêm trechos originais, regra esperada e presença/ausência esperada. Materializá-los somente em diretório temporário, preservando nomes de arquivo e escopo; não executam as operações maliciosas representadas. O executor deve conferir o conjunto de achados e que todos os arquivos foram analisados. Casos positivos devem produzir o achado esperado; casos negativos não podem produzir achados. IDs são preservados com `--no-rewrite-rule-ids`. Não aceitar ausência de alertas sem verificar positivos nem considerar arquivo ignorado como negativo válido.

Foram avaliadas e rejeitadas regras de Compose que dependem de `version:`, pois esse campo não fará parte do Compose moderno adotado. A regra comunitária React `react-dangerouslysetinnerhtml` deixou passar o caso mínimo com propriedades tipadas e desestruturadas, embora tenha encontrado o equivalente com parâmetro simples. A regra própria aplica a política mais restrita do produto. `node-postgres-sqli` cobre construções `require('pg')` nesta revisão e não demonstra cobertura do acesso ESM/Drizzle; sua adoção foi rejeitada para esse fim. A regra de ações de terceiros que exclui `actions/*` foi substituída por uma que também examina essas ações.

A seleção é limitada: não demonstra detecção de toda injeção SQL, de toda montagem indireta, de herança Docker ou de fluxo entre arquivos. Manter testes de integração e conferência da configuração efetiva. Testes normais permanecem analisados; somente os trechos deliberadamente inseguros materializados pelo teste das regras ficam fora da análise de código da aplicação, pois são verificados separadamente com resultado esperado.

### Execução e política de aprovação

O comando interno de análise será `semgrep scan`, com configurações locais, `--error`, `--strict`, `--disable-nosem`, `--no-rewrite-rule-ids`, `--metrics=off`, `--disable-version-check` e relatório JSON. Desativar supressões por comentário: exceções só serão aplicadas pelo processo revisado abaixo. Aplicar limite de dez segundos por regra/arquivo e limite de tamanho de 1 MiB; arquivo relevante ignorado por tamanho ou prazo faz a conferência falhar e exige ajuste registrado. Não usar `--validate` como prova de execução independente da rede, pois esse modo também pode buscar regras remotas de validação.

Analisar código próprio e testes em `apps/`, `packages/`, `tests/` e `tools/`, Dockerfiles, `compose*.yaml`, `.github/workflows/` e configurações JS/TS próprias. A `.semgrepignore` explícita substituirá padrões iniciais que excluem diretórios de teste; listar somente dependências instaladas, arquivos gerados, relatórios e *cache* de terceiros. Verificar os alvos contra inventário esperado por linguagem, inclusive `.ts`, `.tsx`, `.mjs`, YAML e Dockerfile. Esquemas JSON, CSV e documentação sem regras aplicáveis são verificados por contratos, integridade e formatação, sem alegar cobertura Semgrep. Não excluir geradores escritos no projeto.

Erro de análise, JSON ausente/inválido, regra inválida, prazo esgotado, alvo obrigatório omitido ou nenhum alvo esperado analisado impedem aprovação. Os testes de regras são uma execução distinta sem `--error`, pois contêm achados deliberados; seu comparador falha por divergência, erro ou alvo ignorado. A análise da aplicação usa `--error` e conserva o código bruto do scanner em `artifacts/security/semgrep-exit.json`. Sem achados, código zero ainda exige a conferência de execução completa.

Uma exceção pode tornar aprovado um achado conhecido somente mediante registro estrito de regra, caminho, trecho/resumo criptográfico, motivo, evidência, revisor e data-limite. O avaliador compara todos os achados com esses registros; erro do scanner não é excepcionável. Qualquer achado não coberto ou exceção vencida falha. Mudança do trecho invalida a exceção; exceção sem achado correspondente será revista e removida. Conservar relatório bruto e decisão avaliada separadamente, sem `|| true`, `continue-on-error` ou captura que ignore falhas. Não usar a severidade Semgrep como classificação automática de risco.

Fontes: [CLI e códigos de saída](https://docs.semgrep.dev/cli-reference), [testes de regras](https://docs.semgrep.dev/writing-rules/testing-rules) e [exclusões Semgrepignore](https://docs.semgrep.dev/semgrepignore-v2-reference).

## Auditoria de dependências

Auditar o arquivo de dependências após `npm ci`, com todas as dependências diretas, transitivas e de desenvolvimento. Guardar JSON completo, versão npm, data, revisão Git e hash do `package-lock.json`. O trabalho falha por alerta alto/crítico sem tratamento revisado ou por indisponibilidade da auditoria. Examinar também severidades menores, sem escondê-las pelo parâmetro de bloqueio.

Aplicar exceções somente com identificador do alerta, pacote, versão, caminho da dependência, motivo, evidência, revisor e prazo. Não executar `npm audit fix` dentro da conferência. Atualizações são mudanças revisadas, acompanhadas pelos testes. O código bruto do npm, erros de acesso e a decisão do avaliador são preservados; não transformar erro de ferramenta em “nenhuma vulnerabilidade”. Antes de cada entrega, executar novamente a auditoria e Semgrep na revisão exata, mesmo que o último relatório de uma proposta esteja aprovado.

Fonte: [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/).

## GitHub Actions, prazos e evidências

Usar `pull_request`, `push` em `main` e `workflow_dispatch`, sem filtros de caminho que deixem verificações obrigatórias permanentemente pendentes. Permissão padrão `contents: read`; nenhum segredo de implantação. Não usar `pull_request_target` para executar a alteração proposta. Fixar as três ações em revisões completas, registradas no manifesto: `actions/checkout` v7.0.1, `actions/setup-node` v7.0.0 e `actions/upload-artifact` v7.0.2. Versão serve de referência humana; a execução usa o identificador de 40 caracteres.

| Trabalho | Prazo máximo | Conteúdo e resultado |
| --- | --- | --- |
| `qualidade` | 20 minutos | Instalar, formatar, analisar tipos/código, verificar base, testes rápidos com cobertura e compilar. |
| `integracao` | 20 minutos | Instalar e testar migrações/publicação/repositório em PostgreSQL real. |
| `e2e` | 30 minutos | Instalar, compilar e testar aplicação completa com Compose isolado e navegadores da matriz definida. |
| `auditoria` | 10 minutos | Instalar, auditar dependências e avaliar relatório. |
| `semgrep` | 10 minutos | Preparar seleção verificada, testar regras e analisar código/configurações. |
| `aprovacao` | 5 minutos | Aguardar todos os cinco resultados e aprovar somente se todos concluíram com sucesso. |

Executar em Linux `ubuntu-24.04`, com Docker disponível e versões npm/Node fixadas. O rótulo do sistema do executor não congela sua imagem; registrar versão da imagem do executor, sistema, Docker, Compose e ferramentas nos artefatos. A compatibilidade das ações e dos executores deverá ser conferida na implementação. Cada trabalho prepara suas próprias dependências e recursos; não reutilizar volumes nem banco acadêmico. Não transportar `node_modules` entre trabalhos. Começar sem *cache* de instalação; adotar *cache* apenas após medição e com chave que inclua o arquivo de dependências.

O agregador usa condição de execução após todos os resultados, inclusive falha; trabalho cancelado, pulado ou falho não é sucesso. Cancelar uma execução anterior da mesma proposta quando outra a superar; separar grupos por evento e proposta/ramo, evitando cancelamento cruzado de propostas diferentes. A proteção de `main` exigirá o resultado estável `aprovacao` quando o fluxo estiver implementado e validado; esta etapa não modifica a proteção do GitHub.

Publicar evidências com condição `always()` nos trabalhos, mesmo em falha, sem neutralizar o estado anterior. Usar nomes com revisão e tentativa de execução, retenção de 14 dias para cobertura e navegador e 30 dias para auditoria e Semgrep. Um relatório obrigatório ausente falha; a ausência legítima de traço num teste aprovado não exige um arquivo fictício. Não anexar regras comunitárias, `.env`, credenciais, chaves privadas, volumes ou diretórios inteiros não revisados.

Guardar metadados de execução, relatórios, códigos brutos e conclusão. Antes da v0.2, vincular as evidências da revisão exata à entrega e registrar limitações, exceções e revisão manual. Não executar implantação nem publicação de versão automaticamente. Tempos e consumo do CI serão medidos na implementação; qualquer mudança dos limites será registrada.

Fontes: [sintaxe de fluxos GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [uso seguro de ações](https://docs.github.com/en/actions/reference/security/secure-use), [artefatos e retenção](https://docs.github.com/en/actions/tutorials/store-and-share-data) e lançamentos oficiais de [checkout](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node](https://github.com/actions/setup-node/releases/tag/v7.0.0) e [upload-artifact](https://github.com/actions/upload-artifact/releases/tag/v7.0.2).

## Verificação desta definição e continuidade

O Semgrep 1.179.0 foi executado isoladamente em ambiente temporário via `uv`, sem instalar dependências no projeto. Os 28 casos foram analisados: 14 positivos produziram achados deliberados e 14 negativos ficaram sem achados, com zero erros de análise. Antes das referências próprias, os riscos de Compose e o caso React tipado não eram detectados; os casos passaram depois da inclusão das três regras de referência. Revisões, identificadores e hashes dos dez YAML comunitários foram conferidos contra os arquivos oficiais; esses arquivos não são redistribuídos aqui.

Isso valida os exemplos e a seleção proposta, sem demonstrar análise de código da aplicação, execução da imagem Docker, suíte Vitest/Playwright ou funcionamento do GitHub Actions. O computador não tinha Docker disponível para essa verificação. Criar as configurações executáveis no plano e verificar integralmente sua combinação. Os limites das ferramentas, licença e riscos reproduzidos estão persistidos para os trabalhos seguintes.

As definições necessárias ao plano estão concluídas no [registro central](2026-10-06-tecnologias-e-implantacao.md#próxima-etapa-plano-de-implementação). Apresentação, matriz e orçamento local foram aprovados; o plano formalizará os arquivos completos do ambiente e as verificações da implementação.
