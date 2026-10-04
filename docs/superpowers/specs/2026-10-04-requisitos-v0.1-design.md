# Requisitos da v0.1 — Pecuária Inteligente

Data: 04/10/2026.
Estado: requisitos aprovados em conversa; documento consolidado para revisão.

## Objetivo e público

Apoiar produtores, gestores e consultores na avaliação de compra e venda de animais de reposição em Goiás, por meio de uma consulta única de preços, comparações regionais, histórico e variações.

A v0.1 é um MVP acadêmico demonstrativo. Todos os preços são fictícios e devem ser identificados como demonstrativos. Não há integração com fontes externas nesta versão.

O público poderá acessar a aplicação em smartphones com conexões móveis lentas e instáveis em regiões rurais. Essa condição orienta os requisitos desde a primeira entrega.

## Escopo

### Perfis de animais

São oito perfis, combinando etapa, sexo e grupo racial:

| Categoria | Sexo | Grupo racial |
| --- | --- | --- |
| Bezerro | Macho | Nelore |
| Bezerro | Macho | Mestiço |
| Bezerra | Fêmea | Nelore |
| Bezerra | Fêmea | Mestiça |
| Garrote | Macho | Nelore |
| Garrote | Macho | Mestiço |
| Novilha | Fêmea | Nelore |
| Novilha | Fêmea | Mestiça |

Cada perfil terá idade e peso de referência fixos, documentados na preparação dos dados demonstrativos, iguais entre regiões e semanas. Esses parâmetros não representam registros individuais de animais.

### Cobertura geográfica

Adotar as dez regiões de planejamento publicadas pelo Instituto Mauro Borges (IMB), preservando os nomes e identificando sua composição municipal:

1. Região Metropolitana de Goiânia.
2. Região Centro Goiano (Eixo BR-153).
3. Região Norte Goiano.
4. Região Nordeste Goiano.
5. Região Entorno do Distrito Federal.
6. Região Sudeste Goiano (Estrada-de-Ferro).
7. Região Sul Goiano.
8. Região Sudoeste Goiano.
9. Região Oeste Goiano (Eixo GO-060).
10. Região Noroeste Goiano (Estrada do Boi).

A classificação é uma referência territorial para a demonstração, sem afirmar que corresponde às praças das fontes de mercado. A composição municipal e a versão territorial utilizadas deverão ser documentadas com os dados.

Referência: [Mapas das Regiões de Planejamento do Estado de Goiás — IMB](https://goias.gov.br/imb/mapas-das-regioes-de-planejamento/).

### Cobertura temporal e apresentação

Histórico de 12 meses, com frequência semanal. A janela de datas e a convenção da semana serão documentadas na preparação dos dados e ficarão visíveis na consulta.

Preços em `R$/cabeça` como valor principal e `R$/kg de peso vivo` como complemento. Consulta inicial em “Todo o estado — Goiás”, com comparação regional e média estadual demonstrativa.

## Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF01 | Permitir consulta pública, sem cadastro ou login, para apoiar a avaliação de compra e venda. |
| RF02 | Consultar os oito perfis de animais definidos no escopo. |
| RF03 | Filtrar por categoria, sexo, grupo racial, região e período, permitindo limpar os filtros. Combinações sem resultados devem ser informadas claramente. |
| RF04 | Abranger as dez regiões de planejamento do IMB e abrir na visão “Todo o estado — Goiás”. |
| RF05 | Mostrar tabela de preços em `R$/cabeça` e `R$/kg de peso vivo`, com data, região, perfil, idade e peso de referência. |
| RF06 | Apresentar 12 meses de histórico demonstrativo com frequência semanal. |
| RF07 | Comparar preços e históricos do mesmo perfil entre regiões. |
| RF08 | Mostrar a média estadual demonstrativa calculada com as regiões disponíveis para o mesmo perfil e semana, identificando a cobertura regional. |
| RF09 | Exibir variação semanal e no período, em `R$/cabeça` e percentual, identificando as datas comparadas. |
| RF10 | Manter tabela, gráfico e indicadores coerentes com os filtros ativos. Na visão estadual, mostrar as regiões e a média; na seleção regional, mostrar os preços e o histórico da região. |
| RF11 | Informar ausência de resultados, cobertura incompleta e dados insuficientes para cálculos. |
| RF12 | Permitir consultar preços antes do carregamento do gráfico e preservar filtros e resultados disponíveis durante falhas de conexão. |

## Regras de negócio

| ID | Regra |
| --- | --- |
| RN01 | Todos os dados da v0.1 devem ser identificados como demonstrativos. |
| RN02 | Cada perfil terá idade e peso de referência fixos, iguais entre regiões e semanas. |
| RN03 | O preço em `R$/kg de peso vivo` será o preço em `R$/cabeça` dividido pelo peso de referência em kg. |
| RN04 | Comparações regionais usarão o mesmo perfil, semana e condições comerciais demonstrativas. |
| RN05 | A média estadual será a média simples dos preços disponíveis para o mesmo perfil e semana, sem ponderação por volume negociado. |
| RN06 | Valores ausentes serão excluídos do cálculo, nunca tratados como zero. Mostrar a cobertura, por exemplo, “8 de 10 regiões”. Sem valores disponíveis, não calcular média. |
| RN07 | A variação semanal comparará a última cotação do intervalo selecionado com a semana imediatamente anterior, mesmo que esta esteja fora do intervalo. Se a referência faltar, não calcular a variação. |
| RN08 | A variação no período comparará a primeira e a última cotação disponíveis dentro do intervalo, com suas datas visíveis. Serão necessárias duas semanas distintas. |
| RN09 | Variação monetária: `preço final − preço inicial`. Variação percentual: `((preço final ÷ preço inicial) − 1) × 100`. |
| RN10 | Preços e pesos devem ser positivos, datas válidas e cada combinação de perfil, região e semana terá um único registro. |
| RN11 | Usar a precisão armazenada nos cálculos e arredondar apenas na apresentação: duas casas decimais para preços e uma para percentuais. |

As condições demonstrativas são pagamento à vista e preço do animal sem frete nem tributos, informadas na consulta.

Na visão de Goiás, as variações usarão a média estadual; na visão regional, os preços da região. Quando o conjunto de regiões disponíveis mudar entre as semanas comparadas, sinalizar que a variação também pode refletir essa mudança de composição.

A média estadual deverá ser identificada como “Média demonstrativa de Goiás, sem ponderação por volume negociado”. Não interpolar semanas ausentes para calcular variações; explicitar lacunas no histórico.

## Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF01 | Interface em português brasileiro, com datas, números e moedas no formato local. Preços com duas casas decimais e percentuais com uma. |
| RNF02 | Consulta utilizável em smartphones e computadores, sem perda de funcionalidades essenciais em telas pequenas. |
| RNF03 | Filtros operáveis por teclado, campos com rótulos e variações identificáveis sem depender apenas de cores. Os valores do gráfico também estarão disponíveis na tabela. |
| RNF04 | Carregamento progressivo, priorizando filtros e preços, com reutilização dos dados recebidos para reduzir transferências repetidas. |
| RNF05 | Falhas de conexão devem preservar filtros e resultados disponíveis, apresentar mensagem clara e permitir nova tentativa. A consulta deve funcionar se o gráfico falhar. |
| RNF06 | Verificar o fluxo em conexão lenta, com alta latência e interrupções. Definir na arquitetura, antes da implementação, o perfil de rede e aparelho de teste e os limites de transferência e tempo de resposta. |
| RNF07 | Não incluir credenciais, segredos ou dados pessoais nos artefatos publicados. Validar entradas, exibir textos de forma segura e apresentar erros sem detalhes internos sensíveis. |
| RNF08 | Auditar dependências diretas e transitivas antes de cada entrega e nos PRs que as alterem. Corrigir vulnerabilidades altas ou críticas aplicáveis à aplicação e documentar a avaliação dos demais achados. Definir a ferramenta com a stack. |
| RNF09 | Manter testes automatizados executáveis para filtros, conversão de unidades, médias, cobertura parcial e variações, seguindo o ciclo TDD definido no projeto. |
| RNF10 | Documentar execução e testes reproduzíveis, estrutura dos dados demonstrativos, fórmulas, condições comerciais e limitações. |
| RNF11 | Executar Semgrep nos PRs que alterem código ou configurações analisáveis e na revisão destinada a cada entrega, com regras adequadas à stack. Registrar versão, regras, escopo e resultado. Corrigir achados confirmados altos ou críticos antes da entrega; documentar a avaliação dos demais e justificar falsos positivos ou exclusões. |
| RNF12 | Quando publicada na web, utilizar HTTPS, redirecionar HTTP para HTTPS e carregar recursos por conexões seguras. |

Semgrep analisa o código próprio; a auditoria de dependências é uma verificação distinta, cuja ferramenta pode incluir Semgrep Supply Chain se a escolha for adequada à stack. A ausência de achados não garante ausência de vulnerabilidades.

Referências: [Semgrep Code](https://docs.semgrep.dev/semgrep-code/overview), [Semgrep Supply Chain](https://docs.semgrep.dev/semgrep-supply-chain/overview) e [orçamentos de desempenho — web.dev](https://web.dev/articles/performance-budgets-101).

## Critérios de aceitação

| ID | Cenário verificável | Resultado esperado |
| --- | --- | --- |
| CA01 | Acessar a aplicação sem identificação. | Abrir a visão de Goiás, com aviso de dados demonstrativos, comparação regional e média estadual. |
| CA02 | Selecionar um dos oito perfis, uma região e um período. | Tabela, gráfico e indicadores apresentam o mesmo recorte e suas referências. Limpar filtros restaura a consulta inicial. |
| CA03 | Consultar um animal fictício de 200 kg e preço de 3.000 reais por cabeça. | Exibir `R$ 3.000,00/cabeça` e `R$ 15,00/kg de peso vivo`. |
| CA04 | Calcular a média com oito preços disponíveis e dois ausentes. | Somar apenas os oito preços e dividir por oito; informar “8 de 10 regiões”. Nenhum valor ausente entra como zero. |
| CA05 | Consultar semana sem preços disponíveis. | Não exibir média numérica nem zero substituto; informar ausência de dados. |
| CA06 | Comparar preço inicial de 3.000 reais e final de 3.150 reais. | Exibir variação de `R$ 150,00/cabeça` e `5,0%`, com datas e sentido da mudança identificados. |
| CA07 | Consultar variação semanal sem a semana imediatamente anterior ou período com apenas uma semana. | Informar dados insuficientes; não substituir a referência por outra semana. |
| CA08 | Comparar médias estaduais com conjuntos diferentes de regiões. | Exibir a cobertura de cada referência e sinalizar mudança de composição. |
| CA09 | Interromper a conexão após obter resultados ou provocar falha do gráfico. | Preservar filtros e resultados carregados; manter consulta textual disponível e oferecer nova tentativa quando necessário. |
| CA10 | Executar o fluxo em smartphone e por teclado. | Permitir consulta, filtragem e leitura dos valores sem depender de cores ou do gráfico. |
| CA11 | Preparar uma entrega de software. | Testes passam; auditoria de dependências e Semgrep são executados com evidências e tratamento dos achados conforme RNF08 e RNF11. Publicação web atende RNF12. |

Os testes de desempenho terão critérios quantitativos definidos na arquitetura conforme RNF06. Simular rede lenta não substitui a validação futura com usuários e aparelhos reais.

## Fora do escopo da v0.1 e evoluções

- Dados reais, importação CSV e atualização por fontes externas: a partir da etapa de validação prevista na v0.3.
- Indicadores estaduais fornecidos por fontes reais: poderão ser usados na visão de Goiás, inclusive com ponderação por volume negociado quando prevista na metodologia. Identificar fonte, cobertura e método; distinguir esses indicadores da média simples demonstrativa. Não distribuir um valor estadual entre regiões como se fossem observações regionais.
- Cadastro e login: versões finais do roadmap, conforme necessidade de recursos personalizados.
- Funcionamento offline completo, incluindo reabrir a aplicação sem conexão: evolução posterior com requisitos próprios e data de atualização visível.
- Favoritos, alertas, exportação, relação de troca, ágio, simulações e previsões: entregas posteriores.
- Gestão individual do rebanho, negociação de animais e registro de transações: fora do escopo inicial.

## Próxima etapa: arquitetura

A arquitetura deverá definir limites e componentes para consulta, filtros, cálculos, dados e apresentação, além de estratégias de carregamento, erros e validação.

Os requisitos são independentes de SPA, geração estática ou renderização no servidor. Comparar essas alternativas considerando o primeiro acesso em rede lenta antes de selecionar tecnologias.

A preparação dos dados deverá fixar pesos e idades por perfil, a composição municipal das regiões e a janela semanal de 12 meses. A arquitetura deverá estabelecer os limites mensuráveis de desempenho e a configuração das verificações de segurança.

A v0.2 formaliza a submissão acadêmica da v0.1 conforme o checklist do ABOUT.md, sem ampliar seu escopo funcional.
