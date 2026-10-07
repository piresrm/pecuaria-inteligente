# Contratos da API e IndexedDB da v0.1

Data: 7 de outubro de 2026.  
Estado: definições técnicas adotadas sob a delegação do autor; rotas, validadores e persistência ainda não implementados.

## Objetivo e responsabilidade deste documento

Formalizar as duas consultas públicas e a recuperação da última consulta no navegador. Preservar os [requisitos](2026-10-04-requisitos-v0.1-design.md), a [arquitetura](2026-10-04-arquitetura-v0.1-design.md), o [modelo físico](2026-10-07-modelo-fisico-postgresql-v0.1-design.md) e as [tecnologias adotadas](2026-10-06-tecnologias-e-implantacao.md). O autor delegou escolhas técnicas que não exigem avaliação de produto e pediu prosseguir. Esta etapa entrega especificações e exemplos verificáveis para o plano.

Adotar objetos JSON fechados, preços e pesos textuais e referências semanais explícitas. O resumo leva os cadastros e duas semanas; cada histórico leva somente um perfil e toda a janela, com sua referência auxiliar. A lista de regiões ausentes permite verificar a completude sem converter ausência em zero. Indicadores continuam no domínio do navegador.

Persistir os recursos separados e uma referência única da última consulta salva. A transação inclui dados e referência; uma revisão local impede que outra aba sobrescreva uma confirmação mais recente durante um carregamento. Não haverá sincronização de filtros entre abas nem garantia de abertura sem rede. O orçamento total adotado é de 10.240 KiB (10 MiB), conforme a [decisão de armazenamento](2026-10-07-apresentacao-e-armazenamento-v0.1-design.md).

## Artefatos de contrato

O [esquema JSON Schema Draft 7](../contracts/v0.1/mercado.schema.json) é a referência documental verificável desta etapa. Todas as propriedades declaradas são obrigatórias, objetos rejeitam propriedades adicionais e limites de listas estão explícitos. O documento completo valida `Resumo` por padrão; para outro contrato, usar o mesmo documento com `$ref: "#/definitions/Nome"`, preservando suas definições.

| Definição | Uso | Exemplo completo |
| --- | --- | --- |
| `ConsultaResumo` | Parâmetros do resumo: objeto vazio. | `GET /api/v1/mercado/resumo` |
| `ConsultaHistorico` | Parâmetros obrigatórios `perfilId` e `versaoDados`. | `GET /api/v1/mercado/historico?perfilId=bezerro-macho-nelore&versaoDados=go-reposicao-demo-2026-10-07-r1` |
| `Resumo` | Corpo de resposta `200` do resumo. | [resumo.exemplo.json](../contracts/v0.1/resumo.exemplo.json) |
| `Historico` | Corpo de resposta `200` do histórico. | [historico.exemplo.json](../contracts/v0.1/historico.exemplo.json) |
| `Erro` | Corpo público de erro; estado HTTP e cabeçalhos são externos ao corpo. | [erros.exemplos.json](../contracts/v0.1/erros.exemplos.json) |
| `ResumoSalvo`, `HistoricoSalvo` | Recursos envelopados no IndexedDB. | Campos e chaves na seção de armazenamento abaixo. |
| `ConsultaSalva` | Referência e filtros da última consulta confirmada. | [consulta-salva.exemplo.json](../contracts/v0.1/consulta-salva.exemplo.json) |

Os exemplos de preços são projeções da base fixa, sem alterá-la. O resumo contém 156 preços; o histórico de Bezerro, Macho, Nelore contém 515 preços e 53 referências, incluindo `2026-02-02` com dez regiões ausentes. `publicadoEm: "2026-10-07T12:00:00.000Z"` é um instante **ilustrativo do contrato**, não uma publicação executada nem a data de preparação dos arquivos. A publicação real será gerada pelo servidor.

Na implementação, TypeBox será a fonte das declarações em `packages/contracts/`; os esquemas gerados e os exemplos terão testes de equivalência com esta referência. Não manter dois esquemas editados independentemente. A geração deverá preservar os mesmos campos, restrições e referências; qualquer evolução intencional exige atualizar o contrato e seus exemplos. Esses diretórios e testes ainda não existem.

Fontes: [TypeBox](https://github.com/sinclairzx81/typebox), [JSON Schema no Ajv](https://ajv.js.org/json-schema.html) e [formatos temporais de ajv-formats 3.0.1](https://github.com/ajv-validator/ajv-formats/blob/v3.0.1/src/formats.ts#L164).

## Versões, valores e metadados

| Campo | Regra |
| --- | --- |
| `schemaVersion` | Cadeia exata `1.0.0`, versão dos corpos e valores locais deste contrato. Não é `versaoFormatoArquivos: "1"` nem o inteiro da estrutura IndexedDB. |
| `versaoDados` | Identificador opaco da fotografia publicada; 1–80 caracteres ASCII minúsculos, dígitos e hífens, começando e terminando com letra ou dígito. Nunca ordenar versões por nome ou relógio. |
| `conjuntoId`, `natureza`, `aviso` | Origem do conjunto e aviso demonstrativo. Na v0.1, natureza exatamente `demonstrativa`; não aceitar observações reais. |
| `publicadoEm` | UTC no formato `AAAA-MM-DDTHH:mm:ss.SSSZ`, com exatamente três casas; instante gerado na publicação, igual em todas as respostas da fotografia. |
| `janela` | `inicio`, `fim`, `primeiraSemana`, `ultimaSemana`, `semanaAnterior` e `quantidadeSemanasNaJanela`. São datas civis e 52 ou 53 referências dentro dos 12 meses. |
| `versaoTerritorial` | Identificador da classificação congelada; inicialmente `imb-regplan-2018`. Não afirma vigência territorial em 2026. |
| `condicoesComerciais` | Uma condição: pagamento à vista, frete excluído e tributos excluídos, com identificador e descrição. |
| `referenciasFontes` | Duas referências, dos parâmetros Scot e do território IMB: identificador, instituição, URL HTTPS, data da consulta e uso. Não representam fontes de preços reais. |

`preco` é uma cadeia positiva com ponto e duas casas, sem sinal, símbolo, separador de milhar ou zeros iniciais excedentes; máximo `9999999999.99`. `pesoReferencia` segue o mesmo formato, com máximo `999999.99`. `0.00`, números JSON, escala excedente e valores não finitos são inválidos. Moeda `BRL`, unidade de preço `cabeca` e unidade de peso `kg` são obrigatórias. Não arredondar nem converter para `number` para tornar uma entrada válida.

Datas devem existir no calendário, entre os anos 0001 e 9999; semanas devem ser segundas-feiras. Instantes não aceitam horários sem fuso, deslocamentos alternativos nem segundos intercalares; restringir horas a 00–23 e minutos/segundos a 00–59 também no padrão, pois o formato padrão aceita segundos intercalares. Datas civis não passam por conversão de fuso. Instantes são exibidos em Brasília; relógio local divergente não muda a identidade de uma versão nem permite comparar a ordem de recebimento pela data.

Objetos com campos desconhecidos são incompatíveis, inclusive dados locais. Preservar a fotografia anterior validada e apresentar falha de contrato sem promover a resposta inválida ou seu `ETag`. Evolução incompatível exige outra versão de esquema e uma estratégia explícita de compatibilidade; a rota `v1` não autoriza ignorar alterações estruturais.

## Resumo, histórico e completude

O resumo retorna os oito `perfis`, com identidade, ordem, categoria, sexo, grupo racial, idade, peso, unidade e referência dos parâmetros. Retorna as dez `regioes`, com identidade, ordem, código IMB, nome, versão territorial e quantidade de municípios. Não envia listas municipais nem o manifesto de auditoria. Ordens e identificadores são únicos e correspondem aos cadastros da mesma fotografia.

`referenciasSemanais` contém `{perfilId, semana, regioesAusentes}`. No resumo são exatamente 16 referências: todos os perfis na última segunda-feira da janela e na segunda-feira imediatamente anterior. Gerar essas datas pelo calendário, mesmo sem preços; não procurar as duas últimas datas com registros. Ordenar por semana e ordem do perfil. `regioesAusentes` segue a ordem das regiões, sem duplicatas; lista vazia significa cobertura completa, dez identidades significam semana inteiramente ausente.

`precos` contém somente registros disponíveis: `{perfilId, regiaoId, semana, preco, moeda, unidadePreco, natureza, conjuntoId, condicoesComerciaisId}`. Ordenar por semana, ordem do perfil e ordem da região. Não incluir preço nulo, média, preço por kg, percentual ou linha interpolada.

O histórico inclui `perfilId` e os mesmos metadados comuns do resumo; não repete os oito perfis nem a composição municipal. Suas referências incluem **todas** as segundas-feiras da janela e `semanaAnterior`, de 53 a 54 referências. Todos os registros são daquele perfil e versão solicitados. O cliente associa o histórico ao cadastro do resumo da mesma versão; nunca o aceita isoladamente com um cadastro de outra fotografia.

Além da validação estrutural, servidor e navegador verificam:

1. A janela corresponde a 12 meses civis completos; suas datas derivadas e contagem coincidem com o calendário. Só as referências autorizadas aparecem.
2. O resumo tem os oito perfis e as dez regiões previstos, sem duplicatas, com coerência de categoria, sexo e grupo racial. Código IMB, ordem, nomes, pesos e referências preservam o cadastro da fotografia.
3. Cada chave `(perfilId, semana, regiaoId)` é única, identifica cadastros existentes e uma condição da mesma versão; origem, natureza e unidades coincidem com os metadados.
4. Para cada referência, regiões presentes e ausentes são conjuntos disjuntos cuja união é exatamente as dez regiões. Cada preço aparece em uma referência; não omitir uma semana inteira nem declarar presente um registro que não veio.
5. O histórico tem o perfil e a versão pedidos. Seus metadados coincidem com o resumo: publicação, origem, janela, natureza, território, condições, aviso e fontes. Nas duas semanas comuns, preços e ausências coincidem também.
6. Identidades de fontes citadas pelos cadastros existem em `referenciasFontes`; não confundir a associação territorial com uma fonte de preços observados.

JSON Schema não verifica sozinho relações entre campos, unicidade por chave composta, calendários derivados ou igualdade entre respostas. Essa validação semântica é parte obrigatória do contrato. Falha no servidor não publica uma resposta parcial; falha no navegador não altera a consulta exibida ou salva. A ausência validada de preços é um resultado legítimo e não vira `503`.

## Entrada, validação e erros

Aceitar apenas consultas `GET` aos dois caminhos. Não aceitar período, região, ordenação ou paginação na API; esses recortes são locais e a janela publicada limita o volume. Resumo não recebe parâmetros; histórico exige os dois parâmetros nomeados. A parte de consulta da URL é limitada a 1.024 bytes UTF-8 antes da decodificação. Cada identificador decodificado tem no máximo 80 caracteres.

Rejeitar campos desconhecidos, ausência, valor vazio, espaços, listas e repetição de um parâmetro, mesmo com valores iguais. Validar a codificação percentual e UTF-8, decodificar uma única vez e não normalizar por remoção de espaços ou mudança de caixa. A análise deve preservar as ocorrências antes de produzir o objeto validado; um analisador que guarda somente o último valor não atende ao contrato. Após validar, formar a chave normalizada pela operação e valores, independentemente da ordem dos parâmetros na URL.

Usar Ajv Draft 7 com `strict: true`, `coerceTypes: false`, `useDefaults: false`, `removeAdditional: false` e `allErrors: false`; registrar `ajv-formats` em modo completo. As opções padrão do Fastify podem modificar entradas: configurar o compilador de validação explicitamente. No navegador, usar validadores pré-compilados gerados na compilação, sem compilação dinâmica em execução. Validar dados locais com as mesmas regras do corpo HTTP antes de restaurá-los.

Fonte: [validação e serialização no Fastify](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/). O serializador restringe a saída, mas não substitui verificar seu conteúdo antes de responder; não ocultar falhas de integridade removendo campos.

| HTTP | Código público | Condição |
| --- | --- | --- |
| `400` | `PARAMETROS_INVALIDOS` | Consulta inválida na forma, codificação, campos ou limites. |
| `404` | `PERFIL_INEXISTENTE` | Identificador válido na forma, mas perfil não pertence ao catálogo da versão disponível. |
| `409` | `VERSAO_INDISPONIVEL` | Identificador válido na forma, mas fotografia publicada não está disponível. Não substituir pela atual. |
| `429` | `LIMITE_REQUISICOES` | Cota conjunta por IP esgotada; `Retry-After` inteiro positivo. |
| `503` | `SERVICO_OCUPADO` | Capacidade global de consulta esgotada; `Retry-After: 5`. |
| `503` | `CONTROLE_INDISPONIVEL` | Mecanismo de admissão indisponível; preservar proteção; `Retry-After: 5`. |
| `503` | `DADOS_INDISPONIVEIS` | Ainda não há fotografia publicada ou banco temporariamente indisponível. |
| `500` | `ERRO_INTERNO` | Falha inesperada, inclusive violação interna do contrato de saída. |

Verificar forma antes de existência; no histórico, verificar versão disponível antes da existência do perfil. Assim, dois identificadores inexistentes recebem `409`. A limitação de entrada precede consultas e respostas de cache, conforme a arquitetura. Todos os erros usam `Cache-Control: no-store`, `Content-Type: application/json` e o corpo `{schemaVersion, erro: {codigo, mensagem}}`; mensagens não contêm SQL, pilha de execução nem campos internos de validadores. As mensagens concretas estão nos exemplos.

`400`, `404`, `409`, `500` e falha de contrato não usam repetição automática de recuperação. Em `409`, iniciar a reconstrução com novo resumo segundo a arquitetura, conservando o resultado anterior. Rede, `429` e `503` seguem os prazos, duas novas tentativas e coordenação já definidos; esta especificação não altera a política.

## HTTP condicional e metadados locais

Respostas `200` usam `Content-Type: application/json`, `Cache-Control: public, max-age=60, must-revalidate` e `ETag` fraco `W/"v1-resumo-<sha256>"` ou `W/"v1-historico-<sha256>"`. O resumo criptográfico considera os bytes UTF-8 do corpo JSON compacto antes da compressão: ordenar lexicograficamente as chaves de todos os objetos, preservar a ordem das listas definida no contrato e serializar sem espaços ou quebra final. Escapar somente caracteres de controle, aspas e barras invertidas; preservar demais caracteres em UTF-8. Números inteiros usam notação decimal. A serialização da resposta e o cálculo da etiqueta devem usar esses mesmos bytes, sem uma segunda serialização que mude sua ordem. Inclui todos os metadados, a versão e o perfil quando aplicável; não inclui datas de recebimento nem campos voláteis por requisição. O indicador fraco admite diferenças de codificação/compressão com o mesmo conteúdo semântico. Encaminhar o `ETag` sem substituí-lo no proxy e aplicar `Vary: Accept-Encoding` quando houver variantes comprimidas.

Avaliar `If-None-Match` por comparação fraca e regras HTTP, incluindo lista de etiquetas e `*`; não exigir que todos os cabeçalhos de um cliente sigam a forma gerada pelo servidor. Antes de responder `304` ao resumo, fixar a versão atual: a etiqueta de uma versão anterior não confirma a nova. No histórico, conferir a disponibilidade da versão pedida antes da resposta condicional. `304` não tem corpo e mantém `ETag`, política de cache e `Vary` pertinentes; não validar um corpo JSON inexistente.

Nas verificações, o cliente usa `fetch` com `cache: "no-cache"` para exigir revalidação HTTP, preservando o protocolo condicional. Envia sua etiqueta apenas se tiver corpo correspondente previamente validado, da mesma URL normalizada, esquema, versão e perfil. Uma resposta `200` exposta pelo navegador é validada normalmente, inclusive quando seu cache HTTP resolve a revalidação; não exigir que toda revalidação apareça como `304` para o JavaScript.

`recebidoEm` registra no relógio local o recebimento de um corpo `200` aceito; `verificadoEm` registra a confirmação bem-sucedida. Num `304` explícito com corpo local válido, preservar `recebidoEm` e atualizar somente `verificadoEm`. Sem esse corpo, não marcar sucesso: executar a recuperação sem etiqueta dentro do limite de tentativas, sem apagar resultados. Uma resposta inválida não promove sua etiqueta nem seu instante de verificação.

Fontes: [RFC 9110 — If-None-Match e 304](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-none-match) e [revalidação com Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache).

## Estrutura IndexedDB

Banco por origem: `pecuaria-inteligente`, versão estrutural inteira `1`. Abrir com `idb.openDB`; não usar `localStorage` para os corpos. As chaves são fornecidas separadamente ao valor, sem incremento automático. Criar três armazéns, sem índices secundários nesta escala; as chaves primárias e a enumeração dos poucos históricos bastam.

| Armazém | Chave externa | Valor |
| --- | --- | --- |
| `resumos` | `[schemaVersion, versaoDados]` | `ResumoSalvo`. |
| `historicos` | `[schemaVersion, versaoDados, perfilId]` | `HistoricoSalvo`. |
| `metadados` | `"consultaSalva"` | `ConsultaSalva`; referência única, com revisão local. |

Cada recurso salvo contém `schemaVersion`, `versaoDados`, `dados`, `etag`, `recebidoEm`, `verificadoEm` e `ordemUso`; histórico inclui ainda `perfilId`. As identidades da chave, do envelope e do corpo devem coincidir; a etiqueta deve corresponder ao tipo de recurso e ao corpo validado. O cálculo da etiqueta usa a mesma serialização determinística definida acima. Instantes locais seguem o formato UTC do contrato; não comparar `verificadoEm >= recebidoEm`, pois o relógio pode retroceder.

`ordemUso` é o número da revisão local em que o recurso foi usado na consulta salva, inteiro positivo seguro de JavaScript. Permite descarte dos históricos menos usados sem depender do relógio. `revisao` começa em 1 e cresce a cada confirmação, inclusive atualização dos metadados de verificação da consulta. Se alcançar `9007199254740991`, suspender gravações e informar uso apenas em memória; não reiniciar o contador ou apagar dados para continuar.

A referência salva contém os filtros efetivamente exibidos, `perfilAtivoId`, `etapa` e `perfisHistorico` indispensáveis para restaurar o resultado. Não salvar filtros de uma solicitação ainda não concluída. Nos filtros, `null` significa todas as opções de categoria, sexo ou grupo racial e “Todo o estado — Goiás” para `regiaoId`; não é ausência de preço. Intervalo precisa existir, ter `inicio <= fim` e estar contido na janela. Combinações contraditórias podem resultar em nenhum perfil elegível; persistir o estado vazio com perfil ativo nulo, sem trocar os filtros silenciosamente.

`modoTabela: "recente"` identifica a etapa inicial atendida pelo resumo e usa toda a janela; `"periodo"` exige os históricos de todos os perfis elegíveis, mesmo se o intervalo também abranger a janela inteira. Na etapa `resumo`, apenas a tabela recente está concluída: `perfisHistorico` é vazio e indicadores do período e histórico permanecem pendentes. Na etapa `completa`, a consulta recente exige o histórico do perfil ativo; a consulta de período exige todos os perfis elegíveis. Com nenhum perfil elegível, o conjunto necessário é vazio e o resultado é completo. O perfil ativo pertence sempre ao conjunto elegível, ou é nulo somente quando esse conjunto é vazio.

Salvar o resumo inicial não promete que o histórico foi salvo. Na preparação de uma atualização de versão sobre uma consulta completa existente, conservar sua etapa e todas as dependências; não substituí-la por uma etapa de resumo para antecipar a troca. Até oito históricos usados da versão corrente podem permanecer, sem carregamento antecipado obrigatório.

Fonte: [API e transações de `idb`](https://github.com/jakearchibald/idb).

## Confirmação, recuperação e concorrência entre abas

1. Ao iniciar a resolução de uma consulta, capturar sua geração na aba e a revisão do ponteiro salvo, ou ausência do ponteiro. Buscar, validar, calcular e preparar todos os valores fora da transação. Uma resposta superada pode alimentar um recurso reutilizável em memória, mas não substituir a consulta atual.
2. Abrir uma única transação `readwrite` envolvendo os três armazéns. Reler o ponteiro e comparar com a revisão capturada. Se outra confirmação mudou a revisão, abortar a persistência desse candidato; conservar os dados para uso em memória. Não sobrescrever a consulta confirmada por outra aba nem anunciar salvamento.
3. Se a revisão coincidir e a geração ainda for atual, gravar o resumo, os históricos necessários e a referência com a revisão seguinte. Atualizar `ordemUso` dos recursos usados. O corpo, chaves e dependências estão completos antes da primeira escrita. Dentro da transação, aguardar somente operações IndexedDB e `tx.done`, nunca rede, temporizadores, validação externa ou geração de resumos criptográficos.
4. Somente após `tx.done` resolvido marcar a consulta como salva. Um erro de quota, uma interrupção ou falha em qualquer escrita aborta toda a troca. O candidato completo pode ser exibido em memória com indicação de que não foi salvo; a consulta anterior permanece recuperável.
5. Depois da confirmação, limpar versões e recursos não protegidos em outra transação com os três armazéns. Reler o ponteiro e confirmar sua revisão; se mudou, pular essa limpeza. Proteger sempre o resumo e todos os históricos referenciados pelo ponteiro atual. Nunca remover a consulta anterior para abrir espaço **antes** da confirmação nova.

Leitura para recuperação também usa uma transação única `readonly` nos três armazéns: obter ponteiro, resumo e históricos requeridos da mesma confirmação. Depois validá-los fora da transação, incluindo os vínculos e a completude descritos acima. Dados inválidos ou dependências faltantes não representam uma consulta restaurada; preservar o armazenamento para recuperação compatível e buscar dados online. Não usar validação parcial para promover uma fotografia.

Uma aba que detectou conflito não repete a escrita antiga com uma revisão recém-lida. Na próxima consulta, reler a referência salva; se sua versão divergir da memória da aba, verificar o resumo no servidor antes de permitir uma nova confirmação. Assim, a resolução pendente de uma aba não desfaz a troca concluída por outra. A revisão local ordena confirmações de armazenamento, não publicações do servidor.

Com resultado salvo válido, exibir “Dados salvos — verificando atualização” e revalidar o resumo. Os eventos, prioridades e tratamento de falhas seguem a arquitetura. `304` bem-sucedido pode confirmar metadados em uma nova transação; falha dessa escrita mantém a verificação em memória e a confirmação anterior no disco. Nenhuma aba altera automaticamente os filtros exibidos em outra.

Em `blocking`/`versionchange`, fechar a conexão antiga para permitir migração; operações pendentes podem falhar e seguem o tratamento acima. Em `blocked`, informar impedimento do salvamento e manter consulta em memória. Em `terminated`, descartar a conexão, tentar reabertura controlada e não declarar persistência concluída. Migrações futuras são transacionais e preservam recursos compatíveis; falha ou versão estrutural desconhecida não autoriza `deleteDB` automático.

Fontes: [ciclo de vida das transações e confirmação em `idb`](https://github.com/jakearchibald/idb#transaction-lifetime) e [IndexedDB: transações e atualização estrutural](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB).

## Espaço e verificação antes da implementação

O resumo e os históricos indispensáveis da consulta salva são protegidos. Descartar primeiro históricos menos usados que não sejam dependências dessa consulta; empates seguem `perfilId`. Reavaliar proteção no mesmo escopo transacional da limpeza. Dados antigos não são removidos apenas pela idade. Após confirmação nova, recursos não referenciados de versões antigas podem ser removidos; retenção integral no PostgreSQL não exige retenção integral no navegador.

Adotar o orçamento total configurável de **10.240 KiB (10 MiB; 10.485.760 bytes)** para todos os navegadores. Contabilizar conservadoramente JSON compacto UTF-8 de envelopes, chaves e referência, sem compressão, incluindo o pico de coexistência antes da limpeza; não confundir essa política com ocupação física do IndexedDB. Substituições contam somente seu valor resultante, e recursos de versões diferentes coexistem até confirmar a troca. Se não couber, manter a consulta salva e usar novos dados em memória com aviso. A [decisão aprovada](2026-10-07-apresentacao-e-armazenamento-v0.1-design.md) registra projeção e medição no Chrome; o autor dispensou medições adicionais nos outros navegadores. Quota da origem não equivale ao tamanho deste banco, nem o limite garante disponibilidade física.

O navegador pode negar ou remover armazenamento; `tx.done` confirma a transação, sem oferecer garantia contra remoção posterior. Não prometer funcionamento offline completo nem interpretar ausência do banco como ausência de preços.

A validação documental usa JSON Schema com formatos, conferência dos exemplos contra os arquivos fixos e partição entre preços presentes e ausências. A implementação deverá verificar adicionalmente: equivalência TypeBox/Ajv e validadores pré-compilados; entradas duplicadas e limites; metadados cruzados; `200`/`304` e troca de versão; erro de quota em cada escrita; interrupção da confirmação; duas abas com respostas fora de ordem; migração bloqueada; recuperação de etapa inicial e consulta completa; filtros vazios; descarte protegendo dependências. Não há testes executáveis da aplicação nesta etapa.

## Evidências desta definição

Em 07/10/2026, a checagem documental com Python 3 e `jsonschema` 4.19.2 validou Draft 7, exemplos completos, envelopes locais e projeções dos oito históricos contra o CSV fixo. O ambiente não tinha o verificador opcional de `date-time`; foi registrado um verificador explícito de calendário e UTC com milissegundos para a checagem. Foram rejeitados 41 casos inválidos, incluindo valores zero, unidades divergentes, campos extras, listas incompletas, semana integralmente omitida, LF final e horários fora do contrato. Padrões também foram conferidos no motor ECMAScript. Isso não constitui execução de TypeBox, Ajv, Fastify ou IndexedDB.

A projeção dos corpos JSON compactos, com chaves ordenadas, UTF-8 e gzip nível 9, produziu 2.933 bytes para o resumo e de 5.452 a 5.571 bytes por histórico. São estimativas dos corpos previstos, abaixo dos orçamentos de transferência já definidos; não medem cabeçalhos, compressão do servidor, tempos da aplicação ou ocupação do IndexedDB. A medição posterior no Chrome e a decisão do orçamento estão registradas na [definição de armazenamento](2026-10-07-apresentacao-e-armazenamento-v0.1-design.md); medições adicionais nos demais navegadores foram dispensadas pelo autor.

A revisão independente não apontou problemas críticos ou importantes; as divergências de padrões foram corrigidas e verificadas. Os seis arquivos da base demonstrativa continuam com os mesmos resumos SHA-256. README e lista central de pendências foram atualizados, preservando a distinção entre definição e implementação.
