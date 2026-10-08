# Base demonstrativa fixa da v0.1

Data da pesquisa: 7 de outubro de 2026.  
Conjunto: `go-reposicao-demo-2026-10-07-r1`.

## Finalidade e limites

O autor solicitou pesquisa pública e montagem de uma base demonstrativa fixa. Este conjunto atende ao recorte aprovado de cria e recria em Goiás, com oito perfis e dez regiões de planejamento do IMB. As regras de consulta e cálculo permanecem nos [requisitos](2026-10-04-requisitos-v0.1-design.md) e na [arquitetura](2026-10-04-arquitetura-v0.1-design.md).

**Todos os preços são fictícios e demonstrativos.** A pesquisa fundamenta os parâmetros de idade e peso e a composição territorial. Os valores, diferenças regionais, movimentos temporais e lacunas foram definidos para exercitar a aplicação. Não representam observações, estimativas de mercado, sazonalidade comprovada ou recomendações de negociação. A importação de cotações reais continua na v0.3.

O preço representa o animal por cabeça, em reais, à vista, sem frete nem tributos. Essas condições são uma convenção da demonstração, não uma atribuição às fontes pesquisadas. Peso vivo serve exclusivamente à conversão prevista em RN03. Não há rendimento de carcaça, indicadores de abate, leite ou registros individuais de animais nesta base.

## Pesquisa pública e escolhas

### Perfis de reposição

A [tabela pública de reposição da Scot Consultoria](https://www.scotconsultoria.com.br/cotacoes/reposicao/), consultada em 07/10/2026 e datada de 06/10/2026, apresenta os oito perfis aprovados com idade e peso explícitos. Foram adotados os parâmetros abaixo. São referências da tabela consultada, não um padrão universal para essas categorias.

| Categoria | Sexo | Grupo racial | Idade de referência | Peso vivo de referência |
| --- | --- | --- | --- | --- |
| Bezerro | Macho | Nelore | 12 meses | 240 kg |
| Bezerro | Macho | Mestiço | 12 meses | 205 kg |
| Bezerra | Fêmea | Nelore | 12 meses | 210 kg |
| Bezerra | Fêmea | Mestiça | 12 meses | 195 kg |
| Garrote | Macho | Nelore | 18 meses | 300 kg |
| Garrote | Macho | Mestiço | 18 meses | 255 kg |
| Novilha | Fêmea | Nelore | 18 meses | 270 kg |
| Novilha | Fêmea | Mestiça | 18 meses | 255 kg |

As referências de Goiás nessa página situam a reposição na ordem de alguns milhares de reais por cabeça. Foram escolhidas bases fictícias arredondadas entre R$ 2.200 e R$ 4.100, sem transcrição dos preços observados. Não houve extração de série histórica, ajuste estatístico ou desagregação de cotação estadual em regiões.

O [indicador do bezerro do CEPEA/ESALQ](https://cepea.org.br/br/indicador/bezerro.aspx) identifica Mato Grosso do Sul e publica peso médio variável. Por isso, não foi usado como cotação de Goiás nem como peso fixo dos perfis. A página informa licença CC BY-NC 4.0; sua metodologia e as condições aplicáveis a uma futura integração deverão ser verificadas nessa etapa.

A consulta pública da Scot não estabelece autorização para coleta periódica ou republicação de séries históricas. A pesquisa desta entrega registra parâmetros e referências, sem incorporar observações comerciais na tabela de preços demonstrativos.

### Conferência da ordem de grandeza dos preços

Em 07/10/2026, a pedido do autor, foram comparados os extremos efetivos do CSV com as referências por cabeça de Goiás da [tabela Scot de 06/10/2026](https://www.scotconsultoria.com.br/cotacoes/reposicao/). A comparação é nominal e serve à avaliação da escala dos valores. Não harmoniza condições comerciais das fontes nem valida preços por região ou data do histórico fictício.

| Perfil | Faixa fictícia do CSV, R$/cabeça | Referência pública de Goiás, R$/cabeça |
| --- | ---: | ---: |
| Bezerro/Macho/Nelore | 2.950,00 a 3.700,00 | 3.738,73 |
| Bezerro/Macho/Mestiço | 2.838,41 a 3.148,00 | 3.145,56 |
| Bezerra/Fêmea/Nelore | 2.538,72 a 2.822,31 | 2.888,68 |
| Bezerra/Fêmea/Mestiça | 2.139,03 a 2.396,62 | 2.455,38 |
| Garrote/Macho/Nelore | 4.039,34 a 4.400,93 | 4.385,50 |
| Garrote/Macho/Mestiço | 3.439,65 a 3.775,24 | 3.727,00 |
| Novilha/Fêmea/Nelore | 3.139,96 a 3.449,55 | 3.436,65 |
| Novilha/Fêmea/Mestiça | 2.690,27 a 2.973,86 | 2.921,15 |

Os extremos fictícios ficam entre 21,1% abaixo e 1,8% acima das referências individuais usadas nessa comparação. Esse desvio é uma descrição calculada da base, não uma faixa de mercado estabelecida ou um limite estatístico. A tabela pública é posterior em seis dias ao fim da janela demonstrativa.

Como conferência adicional dentro da janela, a [publicação Scot de 18/05/2026](https://www.scotconsultoria.com.br/imprimir/carne/10146) informa, para Goiás na semana de 08 a 14/05/2026, bezerro Nelore de ano a R$ 3.475,60, garrote a R$ 3.965,10, bezerra de ano a R$ 2.528,40 e novilha a R$ 2.998,80. Esses pontos também sustentam a escala de alguns milhares de reais para os perfis, sem demonstrar que toda a trajetória fictícia ou seus extremos ocorreram no mercado.

**Conclusão técnica:** os preços são plausíveis em ordem de grandeza para a demonstração acadêmica. Manter o conjunto e seu identificador, sem alterar CSV, receita, cenários ou resumos SHA-256. Os pontos reais acima permanecem apenas nesta comparação documental e não integram o conjunto de preços demonstrativos.

### Regiões e municípios

Adotar a classificação da publicação [Regiões de Planejamento do Estado de Goiás — 2018, do IMB](https://goias.gov.br/imb/regioes-de-planejamento-do-estado-de-goias-2018/), publicada em 13/04/2018. A [planilha oficial](https://goias.gov.br/imb/wp-content/uploads/sites/29/2018/04/regplan2018-69c.xls) contém as listas municipais na coluna A da Tabela 01 de cada região, nas dez folhas terminadas em `3`.

A versão territorial fixa é `imb-regplan-2018`. Ela identifica a edição usada na demonstração e não afirma reproduzir a configuração legal vigente em 2026. Regiões de planejamento não são praças comerciais nem são substituídas por regiões metropolitanas legais ou divisões estatísticas do IBGE.

| Região | Municípios |
| --- | ---: |
| Região Metropolitana de Goiânia | 20 |
| Região Centro Goiano (Eixo BR-153) | 31 |
| Região Norte Goiano | 26 |
| Região Nordeste Goiano | 20 |
| Região Entorno do Distrito Federal | 19 |
| Região Sudeste Goiano (Estrada-de-Ferro) | 22 |
| Região Sul Goiano | 26 |
| Região Sudoeste Goiano | 26 |
| Região Oeste Goiano (Eixo GO-060) | 43 |
| Região Noroeste Goiano (Estrada do Boi) | 13 |
| **Total** | **246** |

Os nomes e códigos municipais foram conferidos com a [API de localidades do IBGE](https://servicodados.ibge.gov.br/api/docs/localidades), usando a [lista de municípios de Goiás](https://servicodados.ibge.gov.br/api/v1/localidades/estados/52/municipios) consultada em 07/10/2026. A associação usa nomes sem acentos e sem espaços externos apenas para comparação. O cadastro final preserva nome oficial, código IBGE textual de sete dígitos, nome original do IMB e número da linha da planilha.

Os 246 municípios da lista do IBGE correspondem às listas do IMB, sem município duplicado ou não associado. O nome original de cada região também fica preservado. A grafia de exibição segue o cadastro dos requisitos, incluindo `Estrada-de-Ferro`; a planilha usa `Estrada de Ferro`.

## Janela e identificação temporal

A janela tem 12 meses civis completos: **01/10/2025 a 30/09/2026**. As referências são segundas-feiras, de 06/10/2025 a 28/09/2026: 52 semanas dentro da janela. A referência de 29/09/2025 é incluída adicionalmente para RN07, sem ampliar o intervalo disponível para seleção.

A data `semana` identifica o início civil da semana de referência. Não representa uma coleta real nem uma média dos dias da semana. Não há conversão de fuso horário, dependência da data atual ou atualização automática. Uma semana inteiramente ausente continua pertencendo à janela; sua ausência não encurta o histórico.

`preparadoEm` registra a preparação dos arquivos. O futuro servidor gerará `publicadoEm` ao confirmar a publicação no PostgreSQL, conforme a arquitetura. A versão do formato dos arquivos (`versaoFormatoArquivos: "1"`) é independente do futuro `schemaVersion` das respostas da API.

## Arquivos e reprodução

Os arquivos estão em [`data/demonstrativa/v0.1/`](../../../data/demonstrativa/v0.1/).

| Arquivo | Conteúdo |
| --- | --- |
| [`manifesto.json`](../../../data/demonstrativa/v0.1/manifesto.json) | Identificação, janela, condições comerciais, contagens, fontes e resumos SHA-256 dos arquivos públicos usados na conferência territorial. |
| [`perfis.json`](../../../data/demonstrativa/v0.1/perfis.json) | Oito perfis, ordem de exibição e parâmetros fixos. |
| [`regioes.json`](../../../data/demonstrativa/v0.1/regioes.json) | Dez regiões, composição municipal completa e localização de cada município na planilha de origem. |
| [`precos.csv`](../../../data/demonstrativa/v0.1/precos.csv) | 4.146 preços fictícios, dos quais 4.066 estão na janela e 80 na semana anterior. |
| [`receita.json`](../../../data/demonstrativa/v0.1/receita.json) | Parâmetros inteiros, calendário completo, fórmulas, substituições e lacunas controladas. |
| [`cenarios.json`](../../../data/demonstrativa/v0.1/cenarios.json) | Entradas e resultados esperados para os futuros testes de domínio. |
| [`SHA256SUMS`](../../../data/demonstrativa/v0.1/SHA256SUMS) | Resumos SHA-256 dos seis arquivos de dados e metadados. |

O CSV usa vírgula como delimitador, cabeçalho, UTF-8 sem marca inicial e fim de linha LF. Preços são cadeias decimais positivas com ponto e duas casas, sem símbolo monetário. Os pesos seguem a mesma representação nos cadastros. Cada linha contém moeda `BRL`, unidade `cabeca`, natureza `demonstrativa`, conjunto e identificador das condições comerciais. A importação deverá preservar cadeias decimais, sem conversão intermediária para ponto flutuante.

A receita é determinística. Os índices `p`, `r` e `s` começam em zero e seguem respectivamente a ordem dos perfis, a ordem das regiões e a lista `semanas` em `receita.json`. A geração usa preços e deslocamentos inteiros em centavos e incrementos inteiros em centavos por semana. Índices e semente também são inteiros. `%` significa resto não negativo, e `//` significa divisão inteira.

```text
ruido = ((semente + 31*p + 17*r + 13*s + 7*s*s) % 1501) - 750
precoCentavos = basesCentavos[p]
              + incrementosSemanaisCentavos[p]*s
              + deslocamentosRegionaisCentavos[r]
              + cicloCentavos[(s // 4) % 12]
              + ruido
```

Aplicar a substituição explícita da receita, se houver; omitir combinações listadas nas lacunas; depois serializar por semana, perfil e região. O preço inteiro é dividido em quociente e resto por 100, formando uma cadeia com duas casas. Não há arredondamento monetário nessa geração, interpolação ou sorteio dependente de uma biblioteca. O movimento temporal e os deslocamentos regionais são escolhas fictícias para exercitar a consulta.

O cadastro territorial completo já está congelado nos arquivos. A reprodução da demonstração não depende de consultar as páginas novamente: basta usar os cadastros e a receita versionados. Não foi criada uma rotina executável de geração ou importação da aplicação. A futura operação TypeScript usará esses parâmetros e deverá comparar sua saída ao CSV fixo.

A integridade dos arquivos pode ser conferida, a partir da raiz do repositório, com GNU Coreutils:

```bash
(cd data/demonstrativa/v0.1 && sha256sum --check SHA256SUMS)
```

Qualquer correção exige novo identificador do conjunto, revisão dos cenários e novos resumos SHA-256. Os arquivos são insumos da futura importação e não respostas prontas da API; seu tamanho não comprova os limites HTTP ou o orçamento de IndexedDB.

## Lacunas e cenários verificáveis

Há 4.240 combinações possíveis: 53 referências, oito perfis e dez regiões. Foram omitidas **94 combinações**, mantendo 4.146 preços positivos e chaves únicas. A receita registra quais combinações omitir e os motivos; `*` se aplica a todos os perfis ou regiões naquela regra. Ausência é ausência de linha no CSV.

| Cenário | Referência | Resultado esperado |
| --- | --- | --- |
| Cobertura parcial, CA04 | Bezerro/Macho/Nelore em 28/09/2026 | Oito preços, soma R$ 26.950,00 e média R$ 3.368,75; cobertura de 8 de 10 regiões. |
| Semana inteira ausente, CA05 | 02/02/2026, todos os perfis e regiões | Nenhum preço e nenhuma média numérica. |
| Variação semanal, CA06 | Bezerro/Macho/Nelore no Sudoeste, 21/09 a 28/09/2026 | R$ 3.000,00 para R$ 3.150,00: mais R$ 150,00 e 5,0%. |
| Semana anterior ausente, CA07 | Bezerro/Macho/Nelore na Metropolitana, 08/06/2026 | Não calcular variação contra 01/06; informar dados insuficientes. |
| Período com uma semana, CA07 | Apenas 28/09/2026 no Sudoeste, mesmo perfil | Não calcular variação no período. |
| Composição alterada, CA08 | Mesmo perfil, média estadual de 21/09 a 28/09/2026 | Ambas têm oito regiões, mas conjuntos diferentes; R$ 3.218,75 para R$ 3.368,75, mais R$ 150,00 e 4,7%; sinalizar composição alterada. |
| Duas lacunas consecutivas | Bezerra/Fêmea/Nelore no Nordeste, 03/11 e 10/11/2025 | Nenhum registro nessas duas semanas, sem preenchimento ou interpolação. |
| Referência anterior à janela, RN07 | 29/09 e 06/10/2025 | Ambas as referências presentes; a primeira é auxiliar ao cálculo semanal. |

CA03 usa uma entrada isolada em `cenarios.json`: animal fictício de 200 kg e preço de R$ 3.000,00, resultando em R$ 15,00/kg de peso vivo. Essa entrada serve ao futuro teste de conversão e não acrescenta um nono perfil nem altera os pesos pesquisados.

## Verificação e continuidade

Conferir contagens, códigos municipais, unicidade das chaves, positividade, formato decimal, calendário e presença exata das lacunas. Reproduzir a receita e comparar o CSV integralmente; conferir os resultados dos cenários com aritmética decimal independente e verificar SHA-256.

Na preparação em 07/10/2026, foram conferidos os 4.146 preços, as 94 lacunas, os 246 municípios, o calendário, os nove cenários e os seis resumos SHA-256. A reprodução integral gerou o mesmo CSV, byte a byte. Uma revisão independente confirmou esses resultados. Essas verificações dos arquivos não substituem os futuros testes executáveis da aplicação.

Esta entrega fixa os dados necessários ao detalhamento do modelo físico e dos contratos. Testes executáveis da aplicação, importação transacional e validação com TypeBox/Ajv serão implementados no ambiente TypeScript, com TDD. As demais definições permanecem na [lista central de pendências](2026-10-06-tecnologias-e-implantacao.md#definições-restantes-antes-do-plano-de-implementação).
