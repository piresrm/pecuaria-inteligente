# Guia de avaliação

Este é o caminho recomendado para reproduzir e avaliar a entrega acadêmica da v0.1. A aplicação usa uma base fixa de dados fictícios, identificados como demonstrativos, para que o fluxo seja verificável sem depender de uma fonte externa.

## Pré-requisitos

No Linux, usar Node.js `24.21.0`, npm `11.19.0` e GNU Make. Para a aplicação completa, a máquina também precisa de Docker Engine e Docker Compose. As versões adotadas estão registradas em `.node-version` e no `package.json`.

## Verificação rápida

Na raiz do repositório:

```sh
make install
make data
make check
make test
make build
```

Esses comandos instalam o lockfile, validam os arquivos demonstrativos, verificam tipos/formatação/lint, executam as quatro suítes rápidas e compilam contratos, domínio, API e interface.

Para repetir a verificação consolidada, incluindo orçamento do pacote, políticas locais e segurança:

```sh
make verify
```

O `make verify` para no primeiro erro. Os scripts npm equivalentes estão no `Makefile` e podem ser executados individualmente quando for necessário investigar uma etapa.

## Aplicação completa com HTTPS

```sh
make local-up
make local-publish
```

O primeiro comando prepara segredos locais, sobe PostgreSQL e Caddy, aplica as migrações, prepara a CA local e aguarda a prontidão dos serviços. O segundo publica explicitamente a base demonstrativa fixa.

Abra `https://localhost`. O certificado público fica em `.local/root.crt`. A confiança deve ser configurada deliberadamente no navegador ou no sistema; os scripts não alteram automaticamente os armazenamentos de confiança do host.

Para a aceitação automatizada em ambiente isolado:

```sh
make e2e
```

Essa suíte cria sua própria rede, volumes, segredos e CA e executa o fluxo em Chromium, Firefox e WebKit. Não use exceções de certificado. Para encerrar a execução acadêmica preservando os volumes:

```sh
make local-down
```

O fluxo completo, que também inclui integração PostgreSQL, desempenho e segurança, é:

```sh
make acceptance
```

## Roteiro manual

1. Abra `https://localhost` depois da publicação demonstrativa.
2. Confirme o aviso de que os dados são demonstrativos.
3. Selecione um perfil de bezerro ou garrote e altere região e período.
4. Confira a tabela de preços, o histórico, as datas, as unidades e as condições comerciais.
5. Compare os indicadores e a variação entre períodos compatíveis.
6. Observe que lacunas permanecem ausentes; elas não são convertidas em preço zero.
7. Se o gráfico falhar, confirme que as tabelas e os valores textuais continuam acessíveis.
8. Execute `make test` e `make e2e` para registrar a validação automatizada.

## Evidências esperadas

`make data` verifica os seis hashes da base, reproduz o conteúdo, confere calendário, território, lacunas e cenários. A base fixa contém oito perfis, dez regiões do IMB, 246 municípios e 4.146 preços fictícios, cobrindo outubro de 2025 a setembro de 2026 e a semana anterior necessária para comparação.

A aceitação detalhada está em [qualidade/v0.1-aceitacao.md](qualidade/v0.1-aceitacao.md). Os relatórios de E2E, segurança e desempenho ficam em `artifacts/` e são ignorados pelo Git.

## Windows

GNU Make é um atalho para Linux. No Windows, use os scripts equivalentes: `npm ci`, `npm run check:data`, `npm run check`, `npm test`, `npm run build`, `npm run local:prepare`, `npm run local:up`, `npm run local:publish`, `npm run test:e2e` e `npm run local:down`.
