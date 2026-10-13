# Visão do produto e roadmap

## Contexto

Decisões de compra, reposição e comercialização dependem de informações distribuídas por regiões, categorias e etapas produtivas. Uma cotação isolada não explica a rentabilidade de uma operação: é necessário considerar histórico, condições comerciais, custos e diferenças regionais.

A Pecuária Inteligente reúne essas informações em uma experiência integrada, com critérios claros de comparação e identificação das fontes. O projeto é um MVP acadêmico desenvolvido com apoio de inteligência artificial no processo de engenharia de software.

## Objetivo e proposta de valor

Oferecer uma plataforma brasileira de consulta e análise de mercado pecuário para que produtores, gestores e consultores compreendam movimentos de preços e avaliem cenários de compra e venda com dados rastreáveis.

O produto pretende:

- centralizar cotações e indicadores de diferentes etapas da cadeia;
- comparar preços por região, praça, categoria e período;
- relacionar preços de venda, reposição e custos;
- disponibilizar históricos, visualizações e simulações com premissas explícitas;
- apresentar fonte, data, unidade e condições comerciais;
- oferecer consulta acessível em computador e celular.

## Escopo

O núcleo inicial é o monitoramento de mercado: preços, históricos, indicadores, tendências e cenários de comercialização. A gestão individual de rebanhos, com pesagens, reprodução, sanidade, alimentação e desempenho na propriedade, está fora do escopo inicial.

O piloto prioriza o mercado de reposição para cria e recria em Goiás, com possibilidade futura de ampliar a cobertura ao Centro-Oeste. Na v0.1, os dados são fictícios, consistentes e identificados visivelmente como demonstrativos.

## Cobertura pretendida

| Segmento | Decisões apoiadas                                                               |
| -------- | ------------------------------------------------------------------------------- |
| Cria     | Preços de bezerros e matrizes, histórico e sazonalidade da reposição.           |
| Recria   | Preços de garrotes e boi magro, relação de troca e ágio da reposição.           |
| Engorda  | Preço do boi gordo, custos de referência e cenários de margem.                  |
| Abate    | Cotações por categoria e praça, condições comerciais e referências compatíveis. |
| Leite    | Preços por região e período, qualidade e relação entre receita e alimentação.   |

## Funcionalidades planejadas

Consulta por segmento e região, séries históricas, comparação entre categorias e praças, relação de troca, ágio da reposição, cenários de receita/custo/margem, favoritos, alertas e análises de tendência. Modelos preditivos só serão incorporados depois de dados suficientes e validação dos resultados.

## Princípios dos dados

Os dados devem ter rastreabilidade, comparabilidade, atualidade visível, separação entre observação e estimativa, uso autorizado e premissas transparentes. Cada release deve declarar regiões, categorias, períodos e fontes efetivamente disponíveis.

## Releases

| Release   | Foco                                                                           | Critério de conclusão                                                                       |
| --------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| v0.1      | Interface funcional com preços demonstrativos de bezerros e garrotes em Goiás. | Fluxo de consulta, filtros, tabela, histórico, indicadores, testes e execução documentados. |
| v0.2      | Submissão acadêmica da v0.1.                                                   | Repositório publicável, histórico consistente, testes, licença, documentação e release/tag. |
| v0.3      | Validação de fonte real e importação CSV.                                      | Amostra real verificável, com fonte, data, unidade e características visíveis.              |
| v0.4      | Indicadores e comparações compatíveis.                                         | Fórmulas, unidades, premissas e mercados identificados.                                     |
| v0.5      | Atualização, exportação e ampliação regional.                                  | Atualização rastreável e lacunas documentadas.                                              |
| v1.0      | Plataforma pronta para uso público no escopo validado.                         | Dados autorizados, operação, segurança, acessibilidade, testes e suporte preparados.        |
| Após v1.0 | Expansão para outros segmentos e integrações.                                  | Requisitos, fontes e critérios próprios antes de cada expansão.                             |

As versões representam uma sequência proposta, sem datas fixadas. A entrega acadêmica não exige dados reais nem cobertura de toda a cadeia ou do Centro-Oeste.
