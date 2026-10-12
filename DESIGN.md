---
version: alpha
name: Pecuária Inteligente
description: Consulta demonstrativa de reposição em Goiás, legível em conexão rural.
colors:
  primary: '#174d36'
  primary-deep: '#103c2b'
  earth: '#80694b'
  highlight: '#e6ba72'
  background: '#f8faf6'
  surface: '#ffffff'
  text: '#203529'
  border: '#c4d0c3'
  scroll-thumb: '#677e67'
  scroll-hover: '#476247'
  scroll-active: '#174d36'
typography:
  sans:
    fontFamily: 'system-ui, sans-serif'
rounded:
  DEFAULT: '0.25rem'
spacing:
  section-gap: '1.5rem'
  page-max: '80rem'
components:
  button:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
  page:
    backgroundColor: '{colors.background}'
    textColor: '{colors.text}'
  hero:
    backgroundColor: '{colors.primary-deep}'
  notice-indicator:
    backgroundColor: '{colors.highlight}'
  focus:
    backgroundColor: '{colors.earth}'
  button-disabled:
    backgroundColor: '{colors.border}'
    textColor: '{colors.text}'
  scrollbar:
    backgroundColor: '{colors.scroll-thumb}'
  scrollbar-hover:
    backgroundColor: '{colors.scroll-hover}'
  scrollbar-active:
    backgroundColor: '{colors.scroll-active}'
---

# Pecuária Inteligente

## Overview

Painel de consulta para reposição em Goiás, em português brasileiro, usado em celular e computador com conexão rural limitada. Registro de produto: números, unidades e recuperação têm prioridade visual. A referência é a apresentação aprovada em [apresentação e armazenamento](docs/superpowers/specs/2026-10-07-apresentacao-e-armazenamento-v0.1-design.md): painel claro, verde profundo e detalhes de terra. Evitar estética de negociação especulativa, excesso de ornamento e animação obrigatória.

Este contexto registra o painel de mercado da T9, incluindo fotografia local para pasto e curral e superfícies de filtro, indicadores, gráfico e tabela, junto dos estados de persistência e recuperação da T8. Não há tela irmã anterior: `App` é a primeira superfície de mercado.

## Colors

`primary` identifica a consulta e sua ação; `primary-deep` ancora a sobreposição escura da fotografia; `earth` separa apresentação e conteúdo; `highlight` marca o aviso demonstrativo. `text` sobre `background` mantém leitura. `surface` é a cor do texto na ação verde. As variáveis homônimas em `apps/web/src/styles.css` implementam este mapa. `scroll-*` governa os scrollbars globais, com cores do sistema em modo forçado. Tema claro, sem alternância automática.

## Typography

Fonte do sistema para carregar sem transferência adicional. Valores são arredondados pelo domínio na apresentação; texto e unidades permanecem presentes. Não há fonte remota nem imagem necessária à consulta.

## Layout

Largura máxima `page-max`, margem automática e espaçamento `section-gap`. Documento com rolagem natural. A faixa usa proporção 4:1 para a imagem de pasto em telas largas e 16:9 para o recorte de curral em celular. Uma sombra estática mantém o título legível. Filtros, indicadores, histórico e preços reorganizam em uma coluna sem perder funções em tela estreita.

## Elevation & Depth

Sem sombras. Hierarquia por tipografia, espaço e borda de terra. A sobreposição da faixa é estática e faz parte da composição da imagem.

## Shapes

A ação usa raio `DEFAULT` e altura mínima de 2,75 rem. Nenhum ornamento cria ação falsa.

## Components

`QueryCoordinator` mantém solicitado/exibido, geração, erros, fotografia e aviso de armazenamento; `BrowserPersistence` confirma consultas completas e restaura dados validados, sempre com revalidação do resumo; `MercadoClient` aceita contratos e etiquetas; `VerificationScheduler` coordena gatilhos; `RequestScheduler` admite até duas requisições. `App` compõe `Hero`, `Filters`, `Indicators`, `PriceTable`, `QueryStatus`, `HistoryTable` e `HistoryChart`. Os componentes apresentam cálculos do domínio sem repetir fórmulas. A fotografia decorativa e seu módulo são carregados depois dos primeiros preços utilizáveis, preservando a faixa e o aviso desde o início; `sizes` considera a largura real da faixa. O gráfico é importado após o histórico; uma falha ou nova tentativa do gráfico não dispara consulta de preços e mantém a tabela textual. O HTML conserva descrição e aviso demonstrativo sem JavaScript.

| Capability           | Canonical owner                                              | Source of truth                                          | Allowed variants                                              | Verification                          |
| -------------------- | ------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------- |
| Consulta HTTP        | `apps/web/src/query/client.ts`                               | Arquitetura e contratos API                              | resumo / histórico                                            | `client.test.ts`                      |
| Consulta progressiva | `apps/web/src/query/coordinator.ts`                          | Arquitetura cliente                                      | resumo inicial / completa                                     | `coordinator.test.ts`                 |
| Atualização          | `apps/web/src/query/scheduler.ts`                            | Arquitetura cache e recuperação                          | periódica / retorno / conexão / manual                        | `scheduler.test.ts`                   |
| Scrollbar            | `apps/web/src/styles.css`                                    | Cores neste DESIGN                                       | global / forced-colors                                        | auditoria estática; runtime T9–T10    |
| Estado de consulta   | `apps/web/src/query/coordinator.ts`                          | Estado do coordenador                                    | inicial / pendente / erro / disponível / recuperado / memória | `App.test.tsx`, `coordinator.test.ts` |
| Select/Listbox       | `apps/web/src/components/Filters.tsx`                        | Decisão do usuário 12/10/2026                            | native                                                        | teclado e popup em navegador; T10/T12 |
| Date                 | `apps/web/src/components/Filters.tsx`                        | Decisão do usuário 12/10/2026; datas civis dos contratos | native                                                        | locale, teclado e validação; T10/T12  |
| Filtros              | `apps/web/src/components/Filters.tsx`                        | Contrato dos filtros salvos                              | estado / região; recente / período                            | `App.test.tsx`                        |
| Tabela e histórico   | `apps/web/src/components/PriceTable.tsx`, `HistoryTable.tsx` | `ConsultaCalculada`                                      | Goiás / região                                                | `App.test.tsx`                        |

Os filtros usam controles nativos por decisão explícita do usuário em 12/10/2026: listas, calendários, idioma da interface interna, geometria dos popups e comportamento de teclado pertencem ao navegador/sistema operacional. Os rótulos, validação textual, datas civis e foco após erro pertencem ao painel. A verificação em Chrome/Linux nesta tarefa e a matriz de motores em T10/T12 devem registrar versões e limites; não comprovam produtos ou aparelhos ausentes.

## Do's and Don'ts

Preservar consultas anteriores em falha e distinguir histórico pendente de ausência. Nunca converter ausência em zero, misturar fotografias ou inferir versão por relógio. A matriz visual real e acessibilidade completa serão verificadas com o painel T9 e ambiente HTTPS T10; jsdom e auditoria estática não provam esses resultados.
