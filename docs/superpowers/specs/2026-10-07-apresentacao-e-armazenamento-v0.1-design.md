# Apresentação e orçamento de armazenamento da v0.1

Data: 7 de outubro de 2026.  
Estado: decisões aprovadas pelo autor; interface e persistência ainda não implementadas.

## Objetivo e escopo

Concluir a apresentação visual, os navegadores suportados e o orçamento local antes do plano de implementação. Preservar os [requisitos](2026-10-04-requisitos-v0.1-design.md), a [arquitetura](2026-10-04-arquitetura-v0.1-design.md) e os [contratos](2026-10-07-contratos-api-e-indexeddb-v0.1-design.md). O painel apoia consulta de reposição em Goiás, com preços demonstrativos, uso em celular e computador e conexão rural limitada.

## Apresentação aprovada

Adotar painel claro, verde profundo e detalhes em tons de terra, com indicadores em destaque. Usar ícones discretos relacionados ao agro e à pecuária. A faixa de apresentação terá gado no pasto no computador e um recorte de boi no curral no celular, com sobreposição verde escura e degradê de transição para o painel. Os efeitos serão aplicados por CSS; não gerar cópias de imagens para cada efeito. Não introduzir alternância automática nem animação obrigatória.

Manter filtros, indicadores, gráfico e tabela em superfícies legíveis. A ordem será: apresentação e aviso “Dados demonstrativos”; filtros de categoria, sexo, grupo racial, região e período, com limpeza; indicadores de preço médio, variação semanal e cobertura regional; histórico e tabela. A variação no período, datas comparadas, unidades, condições comerciais e limitações continuarão disponíveis conforme os requisitos. Os indicadores respeitam o perfil ativo e a região; não misturar preços de perfis diferentes numa média.

No celular, reduzir a faixa e reorganizar os blocos sem perder funcionalidades. Preservar filtros solicitados e exibidos, resultados anteriores, estados pendentes, ausência de dados e recuperação. Identificar variações por texto e sinais além de cores; oferecer rótulos, foco visível, teclado e valores textuais do gráfico. Verificar contraste sobre as imagens e nas superfícies de consulta. A rotação não recarrega a página nem busca novamente recursos de dados já recebidos.

## Imagens responsivas

Preparar diferentes dimensões de cada imagem escolhida, mantendo qualidade e recortes que preservem os animais. Usar `picture`, `srcset` e `sizes` com escolha de composição por largura de tela e de resolução por largura e densidade de pixels. O navegador deve carregar somente a variante necessária à apresentação inicial; uma mudança de largura pode exigir outra variante. Não montar duas imagens ocultas para selecionar uma por CSS.

Usar formatos comprimidos e alternativa compatível, dimensões declaradas e imagens locais com uso autorizado e origem registrada. As imagens são decorativas, com alternativa textual vazia; título e aviso demonstrativo permanecem texto. A ausência ou falha da fotografia não impede a consulta. Os arquivos participam dos orçamentos de transferência e de tempo da arquitetura; não autorizar aumento desses limites pela identidade visual.

A produção dos arquivos, a seleção final das imagens e a verificação dos recortes integram a implementação. Nenhuma imagem foi produzida nesta etapa.

## Navegadores suportados

Adotar Chrome, Edge, Firefox e Safari, em computador e celular nas plataformas em que estiverem disponíveis. Não há aparelho adicional exigido pelo autor. Registrar versões de navegador e sistema usadas na entrega; testes de motores Chromium, Firefox e WebKit não equivalem sozinhos a evidência de todos os produtos e aparelhos. Os testes funcionais, de acessibilidade e rotação permanecem no plano de qualidade.

## Orçamento aprovado e contabilização

Adotar **10.240 KiB = 10 MiB = 10.485.760 bytes** como orçamento total configurável dos recursos de consulta persistidos no IndexedDB em todos os navegadores. Inclui resumo, históricos, envelopes, chaves, referência da consulta e coexistência de versões durante a troca. O autor dispensou explicitamente novas medições de ocupação nos demais navegadores e pediu prosseguir. Essa dispensa não remove testes de transação, conflito entre abas, limite e falha de quota.

O limite é uma política da aplicação, não uma reserva física garantida pelo navegador. Para aplicação uniforme, contabilizar conservadoramente os bytes UTF-8 do JSON compacto de cada envelope, chave e referência persistidos, sem compressão, recalculando substituições sem contar duas vezes o mesmo registro. Considerar recursos existentes e novos no pico anterior à limpeza. Essa contabilidade lógica não pretende medir a ocupação interna do IndexedDB; não usar a quota ou estimativa de toda a origem como tamanho deste banco.

Preservar resumo e históricos indispensáveis à consulta salva. Descartar primeiro históricos não protegidos menos usados, com desempate por `perfilId`. Nunca apagar a consulta anterior para abrir espaço antes de confirmar a nova. Se o conjunto protegido e os novos recursos ultrapassarem o limite, ou uma transação falhar, conservar a consulta salva e continuar com os dados novos em memória, informando que não puderam ser salvos. A limpeza posterior segue a revisão local e a transação já especificadas.

## Evidência obtida nesta conversa

A projeção da base fixa incluiu resumo, oito históricos, envelopes e chaves, além da referência de consulta por período com todos os perfis. Preços e ausências foram derivados do CSV e do calendário dos exemplos. O instante de publicação usado foi ilustrativo; não houve publicação real. O total JSON compacto sem compressão foi **1.227.700 bytes**, aproximadamente 1,17 MiB, para uma fotografia. Duas fotografias correspondem a aproximadamente 2,34 MiB nessa representação; o segundo conjunto usa uma identidade de mesmo comprimento e compartilha a referência única.

| Recurso | Corpo JSON compacto, bytes | Envelope e chave, bytes |
| --- | ---: | ---: |
| Resumo | 48.526 | 48.836 |
| Bezerro, Macho, Nelore | 145.804 | 146.174 |
| Bezerro, Macho, Mestiço | 147.399 | 147.771 |
| Bezerra, Fêmea, Nelore | 146.314 | 146.684 |
| Bezerra, Fêmea, Mestiça | 147.399 | 147.771 |
| Garrote, Macho, Nelore | 146.826 | 147.196 |
| Garrote, Macho, Mestiço | 147.399 | 147.771 |
| Novilha, Fêmea, Nelore | 146.826 | 147.196 |
| Novilha, Fêmea, Mestiça | 147.399 | 147.771 |

Em perfil temporário isolado do Chrome 154.0.0.0, Linux, uma origem HTTP local e três armazéns IndexedDB, `navigator.storage.estimate().usageDetails.indexedDB` informou **2.679 bytes** após criar o banco, **168.013 bytes** com uma fotografia e **333.847 bytes** com duas. São estimativas do navegador, incluindo a estrutura inicial; não são medidas diretas dos arquivos físicos. O perfil foi descartado depois da execução. O segundo conjunto serviu para medir coexistência; não constitui uma publicação semanticamente validada nem teste do protocolo de atualização.

A margem do limite de 10 MiB supera em cerca de quatro vezes a projeção JSON de duas fotografias da base atual. O limite foi adotado por decisão do autor, sem condicionar o plano a medições em Firefox, Edge ou Safari. A ocupação física e a disponibilidade efetiva continuam dependentes do navegador. Não afirmar que a matriz completa foi medida.
