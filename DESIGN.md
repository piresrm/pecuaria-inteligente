---
version: alpha
name: Pecuária Inteligente
description: Consulta demonstrativa de reposição em Goiás, legível em conexão rural.
colors:
  primary: '#174d36'
  earth: '#80694b'
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
  page-max: '64rem'
components:
  button:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
  page:
    backgroundColor: '{colors.background}'
    textColor: '{colors.text}'
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

Este contexto inicial registra somente os valores mínimos implementados na T7. A composição com fotografias, filtros completos, indicadores, gráfico e tabela pertence às T8–T9. Não há tela irmã anterior: `App` é a primeira superfície mínima.

## Colors

`primary` identifica a consulta e sua ação; `earth` separa apresentação e conteúdo. `text` sobre `background` mantém leitura. `surface` é a cor do texto na ação verde. As variáveis homônimas em `apps/web/src/styles.css` implementam este mapa; cores não se repetem em componentes. `scroll-*` governa os scrollbars globais, com cores do sistema em modo forçado. Tema claro, sem alternância automática.

## Typography

Fonte do sistema para carregar sem transferência adicional. Valores são arredondados pelo domínio na apresentação; texto e unidades permanecem presentes. Não há fonte remota nem imagem necessária à consulta.

## Layout

Largura máxima `page-max`, margem automática e espaçamento `section-gap`. Documento com rolagem natural. O estado reserva duas linhas de mensagem; controles preservam sua geometria durante verificações. A superfície mínima adapta título à largura sem modificar estado nem iniciar I/O.

## Elevation & Depth

Sem sombras ou sobreposições nesta etapa. Hierarquia por tipografia, espaço e borda de terra.

## Shapes

A ação usa raio `DEFAULT` e altura mínima de 2,75 rem. Nenhum ornamento cria ação falsa.

## Components

`App` é a superfície sem fórmulas ou timers. `QueryCoordinator` mantém solicitado/exibido, geração, erros e fotografia; `MercadoClient` aceita contratos e etiquetas; `VerificationScheduler` coordena gatilhos; `RequestScheduler` admite até duas requisições. Regras de comportamento são as da [arquitetura](docs/superpowers/specs/2026-10-04-arquitetura-v0.1-design.md), sem contrato concorrente. Aviso demonstrativo sempre visível, estado com região viva, botão nativo com foco/hover/pressionado/desabilitado. Não há formulários, seletores, CRUD, autenticação nem diálogos nesta superfície.

| Capability           | Canonical owner                     | Source of truth                 | Allowed variants                       | Verification                       |
| -------------------- | ----------------------------------- | ------------------------------- | -------------------------------------- | ---------------------------------- |
| Consulta HTTP        | `apps/web/src/query/client.ts`      | Arquitetura e contratos API     | resumo / histórico                     | `client.test.ts`                   |
| Consulta progressiva | `apps/web/src/query/coordinator.ts` | Arquitetura cliente             | resumo inicial / completa              | `coordinator.test.ts`              |
| Atualização          | `apps/web/src/query/scheduler.ts`   | Arquitetura cache e recuperação | periódica / retorno / conexão / manual | `scheduler.test.ts`                |
| Scrollbar            | `apps/web/src/styles.css`           | Cores neste DESIGN              | global / forced-colors                 | auditoria estática; runtime T9–T10 |
| Estado de consulta   | `apps/web/src/App.tsx`              | Estado do coordenador           | inicial / pendente / erro / disponível | `App.test.tsx`                     |

## Do's and Don'ts

Preservar consultas anteriores em falha e distinguir histórico pendente de ausência. Nunca converter ausência em zero, misturar fotografias ou inferir versão por relógio. A matriz visual real e acessibilidade completa serão verificadas com o painel T9 e ambiente HTTPS T10; jsdom e auditoria estática não provam esses resultados.
