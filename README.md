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

O projeto está em fase de concepção e documentação. Este README descreve a visão do produto e o *roadmap* proposto; as funcionalidades apresentadas ainda não constituem uma aplicação implementada neste repositório.

A arquitetura da v0.1 foi definida e aprovada. TypeScript, React, Tailwind CSS, Vite e Fastify em Node.js foram escolhidos em conversa. O ambiente adotado usa Node.js 24 LTS, TypeScript 6.0.3 e npm com espaços de trabalho; Prettier e ESLint farão as verificações de formatação e código.

O banco escolhido é PostgreSQL 18.6, com persistência em volume no Docker Compose. O acesso aos dados usará Drizzle ORM com o *driver* `pg`; as migrações serão geradas, revisadas e versionadas com Drizzle Kit. O [modelo físico](docs/superpowers/specs/2026-10-07-modelo-fisico-postgresql-v0.1-design.md) define sete tabelas, cadastros e preços por versão, precisão decimal, publicação atômica e retenção de todas as versões durante a entrega acadêmica.

Os contratos usarão TypeBox e Ajv, e os cálculos usarão `big.js`. A persistência no navegador usará IndexedDB com `idb`; o gráfico será feito com Chart.js, carregado separadamente. Os [contratos e o armazenamento local](docs/superpowers/specs/2026-10-07-contratos-api-e-indexeddb-v0.1-design.md) já têm campos, limites, exemplos verificáveis e confirmação atômica especificados.

O desenvolvimento seguirá TDD. Foram adotados Vitest para domínio e API, React Testing Library para componentes e Playwright para a consulta completa. Os testes de integração usarão PostgreSQL real com Testcontainers. npm organizará as dependências; GitHub Actions executará as verificações, incluindo auditoria com `npm audit` e análise obrigatória com Semgrep Community Edition. A [configuração de testes, auditoria e CI](docs/superpowers/specs/2026-10-07-testes-auditoria-e-ci-v0.1-design.md) já define projetos, isolamento, prazos, evidências e seleção de regras. Manifesto, regras próprias e casos verificados estão em [`docs/superpowers/quality/v0.1/`](docs/superpowers/quality/v0.1/); as comunitárias serão obtidas por revisão e hash para uso local, sem redistribuição no repositório.

A execução da v0.1 e da entrega acadêmica v0.2 será local, via Docker Compose, com uma única instância e um único processo da API. Caddy servirá a interface e encaminhará `/api/` pela mesma origem HTTPS, com certificado emitido por uma autoridade local. Os controles por IP e de concorrência serão mantidos em memória; Valkey ou Redis serão avaliados em versões futuras, antes de ampliar para múltiplas instâncias.

A base demonstrativa fixa foi preparada em `data/demonstrativa/v0.1/`: oito perfis, dez regiões do IMB, 246 municípios e 4.146 preços fictícios, com lacunas controladas. O histórico cobre outubro de 2025 a setembro de 2026, além da semana anterior para comparação. Fontes públicas fundamentam os parâmetros e o território; os preços são demonstrativos. A [documentação da base](docs/superpowers/specs/2026-10-07-base-demonstrativa-v0.1.md) registra pesquisa, condições comerciais, reprodução e verificação.

A aplicação, os testes e as configurações de execução e integração contínua ainda não foram implementados. As versões de referência, imagens e módulos planejados estão no registro de tecnologias; a instalação integrada e as configurações ainda serão verificadas na implementação. A v0.1 utilizará apenas dados demonstrativos; a validação para importação de cotações reais será realizada posteriormente. Há [exemplos documentais das respostas previstas](docs/superpowers/contracts/v0.1/), mas ainda não há rotas executáveis nem procedimento de instalação ou execução local. Essas instruções serão acrescentadas conforme a implementação avance.

### Dados disponíveis

Os arquivos CSV e JSON da base fixa estão em [`data/demonstrativa/v0.1/`](data/demonstrativa/v0.1/). Para conferir sua integridade com GNU Coreutils, na raiz do repositório:

```bash
(cd data/demonstrativa/v0.1 && sha256sum --check SHA256SUMS)
```

### Organização planejada para a implementação

Os diretórios abaixo ainda não existem; registram a organização adotada para o plano de implementação.

| Local | Responsabilidade |
| --- | --- |
| `apps/web/` | Interface React, consultas, persistência no navegador e gráfico. |
| `apps/api/` | API Fastify, repositório PostgreSQL e operações demonstrativas autorizadas. |
| `packages/contracts/` | Contratos, tipos e geração dos validadores compartilhados. |
| `packages/domain/` | Filtros e cálculos independentes da interface e do servidor. |
| `tests/e2e/` | Verificação da consulta completa com Playwright. |
| `infra/` e `compose.yaml` | Imagens, entrada HTTPS e configuração local dos serviços. |
| `.github/workflows/` | Testes, compilação e verificações de qualidade e segurança. |

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

Os próximos passos são formalizar os contratos a partir da base fixa e do modelo físico e elaborar o plano de implementação, conforme as pendências do registro. A seleção principal do ambiente e das ferramentas foi concluída; sua instalação e verificação integrada ocorrerão na implementação. A validação de fontes reais será realizada para a v0.3, após a submissão acadêmica. Modelos preditivos, quando investigados, deverão ser avaliados com dados históricos e comunicar incerteza.

## Créditos e licença

Projeto mantido neste repositório por seu autor, no contexto de formação em Engenharia de Software Apoiada por GenAI. Fontes de dados e contribuições deverão receber os créditos correspondentes à medida que forem incorporadas.

Os termos de uso e avaliação acadêmica estão previstos em [ABOUT.md](ABOUT.md). O arquivo de licença deverá ser formalizado antes da publicação pública do repositório.
