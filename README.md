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

Dados da propriedade poderão ser informados como parâmetros de simulação e, em *releases* futuras, recebidos por integrações. Essa possibilidade serve para contextualizar as análises de mercado para cada operação.

## Público-alvo

- Criadores interessados em preços de bezerros, matrizes e reposição.
- Recriadores e produtores de engorda que precisam avaliar relações de troca e margens.
- Agentes da cadeia de abate que acompanham categorias, praças e condições comerciais.
- Produtores de leite que analisam preços, qualidade e custos de alimentação.
- Consultores e gestores que apoiam decisões em diferentes operações pecuárias.

## Cobertura pretendida

| Segmento | Informações e decisões a apoiar |
| --- | --- |
| Cria | Preços de bezerros e matrizes; histórico e sazonalidade da reposição. |
| Recria | Preços de garrotes e boi magro; relação de troca e ágio da reposição. |
| Engorda | Preço do boi gordo; custos de referência e cenários de margem. |
| Abate | Cotações por categoria e praça; condições comerciais e referências de carcaça e atacado, conforme disponibilidade. |
| Leite | Preços por região e período; parâmetros de qualidade e relação entre receita e custo de alimentação. |

A cobertura será ampliada gradualmente. Cada *release* deverá informar quais regiões, categorias, períodos e fontes estão efetivamente disponíveis.

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

## Fases de *release* propostas

Este *roadmap* prioriza o **mercado de reposição para cria e recria em Goiás**. A **v0.1 entregará uma interface funcional com dados fictícios de bezerros e garrotes**, permitindo explorar o apoio da IA na definição de requisitos, no desenho da interface, na implementação e nos testes. A obtenção de dados reais será uma etapa posterior e não condicionará essa primeira entrega.

Os dados fictícios serão consistentes e identificados visivelmente como **demonstrativos**, sem serem apresentados como cotações reais. Sua estrutura contemplará categoria, região, data, preço e unidade, preparando a substituição por dados reais.

A ampliação geográfica ficará limitada ao **Centro-Oeste brasileiro (Goiás, Mato Grosso, Mato Grosso do Sul e Distrito Federal)** neste planejamento. Nas etapas com dados reais, cada cotação deverá identificar seu mercado de origem. Caso não haja uma fonte viável para Goiás, poderá ser definido um piloto em outra unidade do Centro-Oeste, com a mudança de escopo documentada.

| Fase | Foco | Critério de conclusão |
| --- | --- | --- |
| **v0.1 — Interface funcional com dados fictícios** | Consulta de preços de bezerros e garrotes em Goiás, filtros por categoria, região e período, tabela de cotações, gráfico histórico e variação de preços entre períodos. | Fluxo de consulta completo e verificável, dados identificados como demonstrativos, comportamento dos filtros e cálculos testado e instruções de execução documentadas. Nenhuma fonte externa é necessária para concluir esta versão. |
| **v0.2 — Submissão acadêmica** | Preparar a interface demonstrativa da v0.1 para avaliação, cumprindo o Checklist de Submissão do [ABOUT.md](ABOUT.md) e seus requisitos de licença e publicação. | Repositório público sem informações sensíveis, histórico consistente, README completo com execução, exemplos, tecnologias, limitações, créditos e licença, arquivo de dependências, testes executáveis passando e uma *release* ou *tag* de entrega. Não exige novas funcionalidades nem dados reais. |
| **v0.3 — Validação e importação de dados reais** | Validar pelo menos uma fonte para reposição em Goiás, obter uma amostra histórica e implementar importação por arquivo CSV. Definir cobertura, unidades, periodicidade e condições de uso. | Amostra real importada e verificável, com fonte, data, unidade e características do animal visíveis. Dados reais e demonstrativos claramente separados; eventual recorte alternativo no Centro-Oeste documentado. |
| **v0.4 — Indicadores e comparações** | Ampliar as comparações e incorporar relação de troca e ágio quando houver cotações e parâmetros compatíveis. O boi gordo poderá entrar como referência para esses cálculos. | Fórmulas verificadas, com unidades e premissas explícitas, sem misturar peso vivo e carcaça ou mercados diferentes sem identificação. |
| **v0.5 — Atualização e ampliação regional** | Definir rotina de atualização, exportar consultas e ampliar a cobertura em Goiás e, conforme viabilidade, no Centro-Oeste. Automatizar a importação quando houver acesso estável e autorizado. | Atualização rastreável, lacunas sinalizadas e cobertura efetiva documentada, com comparações restritas a dados compatíveis. |
| **v1.0 — Plataforma pronta para uso público** | Consolidar o escopo de monitoramento de mercado validado e preparar o software para implantação e utilização pelo público geral. | Dados reais com uso autorizado, atualização operacional, fluxos essenciais validados com usuários, testes passando, segurança e acessibilidade verificadas e documentação de implantação, operação e suporte disponível. Termos de uso e licença adequados ao uso público definidos. O lançamento depende da prontidão do produto, sem exigir cobertura de toda a cadeia ou de todo o Centro-Oeste. |
| **Após v1.0 — Expansão da cadeia e dos recursos** | Investigar engorda, abate e leite, mantendo Goiás como prioridade e o Centro-Oeste como limite geográfico deste planejamento. Avaliar favoritos, alertas, integrações e modelos preditivos conforme necessidade e viabilidade. | Cada expansão terá requisitos próprios, fontes validadas e critérios de qualidade definidos antes de sua implementação. |

A visão de longo prazo continua abrangendo toda a cadeia pecuária brasileira. **A primeira entrega será um MVP demonstrativo de monitoramento de mercado para cria e recria em Goiás**. Seu valor acadêmico estará no fluxo funcional e no aprendizado sobre o uso de IA nas etapas da construção de software. A integração de dados reais, a expansão da cadeia e as previsões automatizadas ficam para entregas posteriores. A v0.2 formaliza a submissão acadêmica da v0.1, sem ampliar seu escopo funcional. As evoluções v0.3 a v0.5 serão posteriores à submissão. A **v1.0 será lançada somente quando o software estiver pronto para implantação e utilização pelo público geral**, no escopo validado. Poderão ser necessárias outras versões v0.x para atingir essa prontidão. As versões indicam uma sequência proposta, sem datas fixadas; a entrega acadêmica não exige dados reais nem cobertura de todo o Centro-Oeste.

## Estado atual

Estão implementados os contratos compartilhados em `packages/contracts/` e o domínio puro em `packages/domain/`, com filtros, indicadores decimais, calendário civil, apresentação localizada e testes executáveis. Os contratos oferecem tipos, validação estrutural e semântica e serialização determinística. A aplicação completa da v0.1 permanece em desenvolvimento; este README distingue a entrega atual das funcionalidades previstas no *roadmap*.

A arquitetura da v0.1 foi definida e aprovada. TypeScript, React, Tailwind CSS, Vite e Fastify em Node.js foram escolhidos em conversa. O ambiente adotado usa Node.js 24 LTS, TypeScript 6.0.3 e npm com espaços de trabalho; Prettier e ESLint verificam os contratos, o domínio e suas configurações; os demais módulos serão incorporados progressivamente.

O banco escolhido é PostgreSQL 18.6, com persistência em volume no Docker Compose. O acesso aos dados usará Drizzle ORM com o *driver* `pg`; as migrações serão geradas, revisadas e versionadas com Drizzle Kit. O [modelo físico](docs/superpowers/specs/2026-10-07-modelo-fisico-postgresql-v0.1-design.md) define sete tabelas, cadastros e preços por versão, precisão decimal, publicação atômica e retenção de todas as versões durante a entrega acadêmica.

Os contratos implementados usam TypeBox e Ajv; o domínio calcula médias, conversões e variações com `big.js` 7.0.1. A persistência no navegador usará IndexedDB com `idb`; o gráfico será feito com Chart.js, carregado separadamente. Os [contratos e o armazenamento local](docs/superpowers/specs/2026-10-07-contratos-api-e-indexeddb-v0.1-design.md) já têm campos, limites, exemplos verificáveis e confirmação atômica especificados.

A [apresentação aprovada](docs/superpowers/specs/2026-10-07-apresentacao-e-armazenamento-v0.1-design.md) terá indicadores em destaque, verde profundo, tons de terra e faixa com imagens responsivas de gado no pasto e boi no curral, sobreposição e degradê. Chrome, Edge, Firefox e Safari compõem a matriz de suporte. O orçamento total do IndexedDB será de 10.240 KiB (10 MiB), com margem para troca segura; o autor dispensou novas medições de ocupação nos demais navegadores. A interface e as imagens finais ainda não foram produzidas.

O desenvolvimento seguirá TDD. Foram adotados Vitest para domínio e API, React Testing Library para componentes e Playwright para a consulta completa. Os testes de integração usarão PostgreSQL real com Testcontainers. npm organizará as dependências; GitHub Actions executará as verificações, incluindo auditoria com `npm audit` e análise obrigatória com Semgrep Community Edition. A [configuração de testes, auditoria e CI](docs/superpowers/specs/2026-10-07-testes-auditoria-e-ci-v0.1-design.md) já define projetos, isolamento, prazos, evidências e seleção de regras. Manifesto, regras próprias e casos verificados estão em [`docs/superpowers/quality/v0.1/`](docs/superpowers/quality/v0.1/); as comunitárias serão obtidas por revisão e hash para uso local, sem redistribuição no repositório.

A execução da v0.1 e da entrega acadêmica v0.2 será local, via Docker Compose, com uma única instância e um único processo da API. Caddy servirá a interface e encaminhará `/api/` pela mesma origem HTTPS, com certificado emitido por uma autoridade local. Os controles por IP e de concorrência serão mantidos em memória; Valkey ou Redis serão avaliados em versões futuras, antes de ampliar para múltiplas instâncias.

A base demonstrativa fixa foi preparada em `data/demonstrativa/v0.1/`: oito perfis, dez regiões do IMB, 246 municípios e 4.146 preços fictícios, com lacunas controladas. O histórico cobre outubro de 2025 a setembro de 2026, além da semana anterior para comparação. Fontes públicas fundamentam os parâmetros e o território; os preços são demonstrativos. A [documentação da base](docs/superpowers/specs/2026-10-07-base-demonstrativa-v0.1.md) registra pesquisa, condições comerciais, reprodução e verificação.

O [plano de implementação da v0.1](docs/superpowers/plans/2026-10-07-implementacao-v0.1.md) organiza contratos, domínio, banco, API, consulta, persistência, interface, HTTPS e qualidade em tarefas verificáveis de TDD. Contratos, ambiente e domínio estão implementados; banco, API e interface serão implementados nas etapas seguintes.

Os [exemplos documentais](docs/superpowers/contracts/v0.1/) são entradas dos testes de equivalência entre o esquema de referência, as declarações TypeBox e os validadores do servidor e do navegador. O pacote também valida calendário, cadastros, preços únicos, cobertura regional, fontes e correspondência entre resumo e histórico. A instalação e as verificações dos contratos e do domínio estão disponíveis abaixo. Rotas HTTP, banco, interface, Compose e integração contínua permanecem pendentes; a v0.1 utilizará apenas dados demonstrativos.

### Dados disponíveis

Os arquivos CSV e JSON da base fixa estão em [`data/demonstrativa/v0.1/`](data/demonstrativa/v0.1/). Para conferir sua integridade com GNU Coreutils, na raiz do repositório:

```bash
(cd data/demonstrativa/v0.1 && sha256sum --check SHA256SUMS)
```

### Organização da implementação

`packages/contracts/` e `packages/domain/` estão implementados. Os demais diretórios da tabela registram a organização prevista para as etapas seguintes.

| Local | Responsabilidade |
| --- | --- |
| `apps/web/` | Interface React, consultas, persistência no navegador e gráfico. |
| `apps/api/` | API Fastify, repositório PostgreSQL e operações demonstrativas autorizadas. |
| `packages/contracts/` | Contratos, tipos e geração dos validadores compartilhados. |
| `packages/domain/` | Filtros e cálculos independentes da interface e do servidor. |
| `tests/e2e/` | Verificação da consulta completa com Playwright. |
| `infra/` e `compose.yaml` | Imagens, entrada HTTPS e configuração local dos serviços. |
| `.github/workflows/` | Testes, compilação e verificações de qualidade e segurança. |

### Ambiente e verificações dos contratos e do domínio

Usar Node.js `24.21.0` e npm `11.19.0`, fixados em `.node-version` e no manifesto. Ativar essa instalação antes dos comandos; `.npmrc` rejeita versões incompatíveis. Na raiz:

```bash
node --version
npm --version
npm ci
npm run contracts:generate
npm run build
npm run check
npm run check:data
npm test
npm run test:unit -- --project dominio
npm run test:coverage
```

`npm ci` instala o `package-lock.json` único, incluindo dependências de desenvolvimento. O único script de instalação aprovado é o do esbuild `0.28.2`, usado pelas ferramentas. As versões verificadas incluem TypeScript `6.0.3`, TypeBox `1.3.36`, Ajv `8.20.0`, ajv-formats `3.0.1`, Vitest e cobertura V8 `5.0.3`, ESLint `10.12.0` e Prettier `3.9.9`.

A geração produz `packages/contracts/src/generated/` com validadores estáticos autocontidos e preserva as licenças dos auxiliares puros de terceiros. Esses arquivos e `dist/` são ignorados e reproduzíveis. Testes e análise de tipos regeneram os validadores automaticamente; a compilação entrega as exportações `@pecuaria/contracts/types`, `/server` e `/browser`. Importar `/types` com `import type`; `/browser` inclui validadores, assertivas semânticas e `canonicalJson`, sem compilador dinâmico ou módulos Node.

Nesta etapa, os projetos Vitest `contratos` e `dominio` estão ativos. `npm run check` verifica tipos de produção, ferramentas e testes, formatação e ESLint dos arquivos presentes. A cobertura V8 abrange os contratos e o domínio e fica em `artifacts/coverage/unit/`; ela não representa a aplicação completa. A prova isolada do pacote de navegador não substitui a futura validação funcional na matriz de navegadores.

O pacote `@pecuaria/domain` exporta `filtrarPerfis`, `filtrarConsulta` e `calcularConsulta`, além dos tipos `Filtragem`, `ConsultaCalculada`, `LinhaPreco`, `PontoHistorico` e `Indicadores`. Recebe respostas previamente validadas dos contratos e filtros tipados; mantém decimais em cadeias e ausência em `null`. Na visão estadual, cada perfil tem dez linhas regionais e uma média; na regional, uma linha. A última data depende do perfil e do recorte, e a série conserva todas as segundas-feiras do intervalo com lacunas reais.

O modo `recente` usa a janela inteira: o resumo permite tabela e comparação semanal, enquanto série e variação do período ficam pendentes até chegar o histórico ativo. O modo `periodo` exige históricos completos de todos os perfis elegíveis, da mesma versão. Combinações sem perfil elegível produzem resultado vazio com perfil ativo nulo. Intervalos inválidos ou históricos incompatíveis são rejeitados sem alterar entradas; preservar a consulta anterior é responsabilidade do futuro consumidor.

Os cálculos usam um construtor isolado de `big.js`, com entradas textuais e 40 casas nas divisões, sem arredondamento intermediário para as casas de exibição. `@pecuaria/domain/presentation` aplica duas casas para preços, uma para percentuais e empate para longe de zero, sem converter decimais para ponto flutuante. `tools/quality/check-data.mjs`, executado por `npm run check:data`, verifica os seis SHA-256, reproduz o CSV integralmente, confere calendário, território, lacunas e os nove cenários com aritmética racional independente. A projeção `packages/domain/src/fixtures.ts` é exclusiva dos testes e fica fora da compilação de produção; os arquivos fixos permanecem intactos.

## Qualidade e critérios de sucesso

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

Os próximos passos são implementar banco, API, consulta, persistência e interface conforme o plano aprovado. O ambiente dos contratos foi instalado e verificado; a integração da aplicação e sua execução HTTPS ainda serão validadas nas etapas correspondentes. A validação de fontes reais será realizada para a v0.3, após a submissão acadêmica. Modelos preditivos, quando investigados, deverão ser avaliados com dados históricos e comunicar incerteza.

## Créditos e licença

Projeto mantido neste repositório por seu autor, no contexto de formação em Engenharia de Software Apoiada por GenAI. Fontes de dados e contribuições deverão receber os créditos correspondentes à medida que forem incorporadas.

Os termos de uso e avaliação acadêmica estão previstos em [ABOUT.md](ABOUT.md). O arquivo de licença deverá ser formalizado antes da publicação pública do repositório.
