# README e Guia de Avaliação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganizar a documentação para que banca e colegas encontrem rapidamente o escopo entregue, a execução e as evidências, sem remover as informações técnicas existentes.

**Architecture:** O `README.md` será uma porta de entrada curta, com resumo, tutorial e atalhos Linux via `make`. A documentação detalhada será organizada por público e finalidade em `docs/`, mantendo as especificações e evidências existentes como referências técnicas.

**Tech Stack:** Markdown, GNU Make, npm, scripts de qualidade já existentes.

**Spec:** Design aprovado na conversa de 2026-10-13; requisitos atuais em `AGENTS.md`, `ABOUT.md` e nos documentos de `docs/superpowers/specs/`.

## Global Constraints

- Manter o escopo da v0.1: monitoramento demonstrativo de cria e recria em Goiás.
- Preservar os comandos npm existentes como interface canônica.
- Oferecer atalhos Linux por GNU Make sem alterar o comportamento dos scripts do projeto.
- Não apresentar dados fictícios como cotações reais.
- Manter contributor guide e código em inglês quando aplicável; documentação de produto em pt-BR.
- Não apagar informações técnicas; redistribuí-las por links e guias focados.

## Review Focus

- O caminho rápido da banca deve funcionar a partir de um clone limpo.
- Os atalhos `make` devem corresponder exatamente aos scripts npm existentes.
- Links relativos devem funcionar tanto no README quanto nos arquivos dentro de `docs/`.
- O README deve distinguir claramente entregue, planejado e fora do escopo.
- A documentação deve manter limites de dados, segurança, HTTPS local e validação visíveis.

## Tasks

### Task 1 — Atualizar atalhos GNU Make e criar README de entrada

- [ ] Adicionar atalhos individuais para dados, checagem, testes, build e E2E.
- [ ] Atualizar `help` com uma ordem de avaliação recomendada.
- [ ] Substituir o README por uma entrada curta com resumo, tutorial, comandos, escopo, limitações e índice.
- [ ] Verificar comandos e links estruturais.

### Task 2 — Criar índice e guia de avaliação

- [ ] Criar `docs/README.md` com o mapa de documentação por público.
- [ ] Criar `docs/guia-de-avaliacao.md` com pré-requisitos, fluxo Linux, roteiro manual e evidências esperadas.
- [ ] Referenciar a aceitação integrada existente e os artefatos de qualidade.

### Task 3 — Separar documentação de produto e operação

- [ ] Criar `docs/visao-produto-e-roadmap.md` com contexto, escopo, proposta de valor e releases.
- [ ] Criar `docs/arquitetura-e-implementacao.md` com estado atual, módulos, dados e referências técnicas.
- [ ] Criar `docs/execucao-local.md` com Compose, HTTPS, CA, publicação e encerramento.
- [ ] Criar `docs/qualidade-e-limitacoes.md` com testes, segurança, critérios e limitações.
- [ ] Conferir que cada informação retirada da página de entrada permanece em um destino explícito.

### Task 4 — Verificação e revisão

- [ ] Executar verificações apropriadas para documentação e Makefile.
- [ ] Revisar diff, links, whitespace e consistência dos comandos.
- [ ] Executar a suíte relevante do projeto antes de concluir.
