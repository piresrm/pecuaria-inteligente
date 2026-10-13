# T11 — segurança e integração contínua

Data de execução: 11 de outubro de 2026. Base: `f4c03fbc998d0e13137c05a7dc473d248d532b92`. Implementação no branch `ci/tarefa-11-seguranca`.

Ambiente local: Node.js 24.21.0 e npm 11.19.0. `npm ci` foi executado no worktree limpo antes da implementação; auditoria baseline: 4 moderados, sem altos/críticos.

## Entregas

- `npm run security:audit`: captura relatório JSON bruto, metadados e decisão separada; qualquer falha do comando bruto ou achado alto/crítico não coberto bloqueia a decisão. Baixos e moderados permanecem visíveis.
- Semgrep CE 1.179.0 executado em imagem oficial fixada por digest, sem rede dentro do contêiner, filesystem somente leitura, capacidades removidas, limites de memória/CPU e timeout por arquivo/regra de 10 s. Inventário é comparado com os alvos esperados; achados, erros de análise, arquivos omitidos, timeout, JSON inválido e divergências de hashes impedem aprovação. `--error` é usado na análise normal; códigos brutos e relatórios não são mascarados.
- As dez regras comunitárias são buscadas de uma revisão imutável, verificadas por SHA-256 e guardadas somente em `.cache/semgrep/<revisão>/` (ignorado pelo Git). Manifesto e avisos de licença permanecem versionados; cópias comunitárias e seus testes não são anexados.
- Três regras próprias e os 28 casos da referência foram materializados com equivalência byte a byte. O runner verifica 14 positivos, 14 negativos, todos os 28 alvos analisados e o conjunto exato de achados.
- `.github/workflows/ci.yml` declara qualidade, integração PostgreSQL, E2E, auditoria, Semgrep e agregador `aprovacao`, com permissões `contents: read`, concorrência cancelável, prazos, ações por SHA completo e publicação de evidências `always()`. O agregador exige sucesso de todos os cinco jobs.

## TDD e verificações executadas

Os avaliadores foram exercitados contra fixtures adversariais antes da implementação final. Com avaliador placeholder permissivo, a suíte de auditoria teve RED comportamental em 7 casos: JSON inválido, inventário ausente/inconsistente, alerta alto inesperado, exceção alterada ou vencida e código bruto não zero. O registro bruto está em `.local/task-11/audit-red.log` (exit 1, 0/7); GREEN está em `.local/task-11/audit-green-test.log` (7/7). Restaurado o avaliador, `npm run security:audit` passou 7/7 e produziu decisão aprovada.

O avaliador Semgrep também teve RED comportamental contra placeholder: falharam as decisões para JSON inválido, alvos ausentes/ignorados, hash divergente, achado inesperado e código bruto não zero; o caso independente que verifica o primitivo de hash permaneceu válido. Exit 1 (1/6); log em `.local/task-11/semgrep-evaluator-red.log`; GREEN 6/6 em `.local/task-11/semgrep-evaluator-green.log`. Com a implementação final, `npm run security:rules:test` passou os testes do avaliador (6/6) e os casos reais: 28/28 alvos, 14/14 achados positivos, zero achados nos 14 negativos, dez regras comunitárias e três próprias. Não foram executadas as operações representadas pelos snippets.

`npm run security:rules:prepare` verificou a equivalência dos arquivos de referência, revisão, licença e hashes. `npm run security:semgrep` foi executado em seguida: código bruto 0; 125 alvos esperados e 125 analisados; zero achados; zero exceções aplicadas; zero erros de análise. O scanner registrou duração e códigos brutos em `artifacts/security/semgrep-*` (arquivos locais ignorados pelo Git). `npm run security:audit` foi executado após `npm ci`; suíte 7/7; código bruto npm 0; zero altos/críticos. Artefatos brutos e decisão estão em `artifacts/security/npm-audit-*`.

A T11 não executou suíte global, integração, build, browsers ou E2E neste branch: esses gates dependem da integração das alterações T10 e foram deixados para execução conjunta. O CI remoto ainda não foi publicado/executado. `npm run test:e2e` é o contrato integrado informado por T10; esta configuração não invoca `test:e2e:run` diretamente.

## Pins e inventário Semgrep

- Executor: `semgrep/semgrep:1.179.0@sha256:93963d9295a366f59e4850127b1550400ee7b388f04fe144e4a1f6325d96e01b`.
- Repositório: `semgrep/semgrep-rules`, revisão `a84ff9cc2453ca91d581380de4b8b3f272f6f4be`, data declarada `2026-09-22T15:34:05Z`.
- Licença: Semgrep Rules License v1.0; SHA-256 do `LICENSE`: `1a6466ae5f1c68631bbd13e3f1aa8f380d84219853c08f0456b853fccfacee1d`; redistribuição desabilitada.
- Arquivos individuais: `eval-detected` 356589363d16cda8bd2ca1d296ce2b6953105ee4c751ddbbc9bcde5849341811; `ajv-allerrors-true` 6ca5fea0744a265e8625a59031acda251386341382947e1a3d1551699d2b5276; `last-user-is-root` 1ebbcbf8038494c1ed59808ea91d93cd762acdec0ed7f94fc6e025e922f87ec2; `secret-in-build-arg` e7b68be0c5e059aa290d6f58459e063bfb7e6dfe3da06f05320a6beb2ffeb717; `run-shell-injection` 156d9ce4dad539528d9e54a2acc88fa1d7e68b70bd6f3e8db37c826fc3d4941c; `pull-request-target-code-checkout` 64c8c419726b8ed1854c75de04b7e8fb944e86d54990b65a98bca9c216b65ceb; `spawn-shell-true` 452fb593301edca721a151ed3c051f428ca1df1fc1af613380d58b076601b5ba; `insecure-innerhtml` 3f2854f92c3c8a1ba3a107a140a5b31789650851be57586fd21a409e129193e4; `github-actions-mutable-action-tag` 62388a265c3474244b68158523916164660719185c3c50129665ab2a548f0d33; `missing-user` cc2f014994c12afaffeefdf14f480b398181fc65db8c8e12deb3477f27e63d97.
- Regras próprias: `pi-react-raw-html`, `pi-compose-privileged`, `pi-compose-host-socket`. Timeouts: 10 s por regra/arquivo, um erro de timeout é suficiente para bloquear. Arquivo acima de 1 MiB é tratado como lacuna de inventário e bloqueia aprovação.
- Ações do workflow: checkout v7.0.1 `3d3c42e5aac5ba805825da76410c181273ba90b1`; setup-node v7.0.0 `820762786026740c76f36085b0efc47a31fe5020`; upload-artifact v7.0.2 `cf430e030ddbb5b0abf93d22962f4752f3646cd9`.

## Auditoria de dependências e aplicabilidade

A saída bruta `npm audit --include=dev --audit-level=high --json` reportou 4 moderados, 0 altos, 0 críticos (total 4), código bruto 0. Todos são do GHSA-67mh-4wv8-2f99, com alcance `esbuild <=0.24.2`, em dependências de desenvolvimento: `@esbuild-kit/core-utils` 3.3.2, `@esbuild-kit/esm-loader` 2.6.5, `drizzle-kit` 0.31.11 e `esbuild` 0.18.20. O caminho vulnerável divulgado é o servidor de desenvolvimento do esbuild; a auditoria desta revisão não demonstrou que a aplicação de produção inicie essa interface. A exposição permanece relevante para uso de ferramentas de desenvolvimento, portanto os achados ficam no relatório, sem exceção, correção forçada, downgrade de severidade ou mascaramento. Não há bloqueador alto/crítico. `docs/qualidade/excecoes.json` contém exatamente `[]`.

`fast-deep-equal` 3.1.3 está travado transitivamente pelo Ajv; não apareceu como vulnerabilidade na saída atual. Foi mantido sem atualização oportunista.

## Limites e contrato de integração

A configuração da CI está escrita, mas não houve execução de GitHub Actions. A execução E2E e o artefato `artifacts/e2e/` dependem do executor `npm run test:e2e` da T10; a ausência atual desse script nesta base não foi tratada como aprovação nem substituída por chamada direta ao Playwright. A primeira execução dos jobs requer a integração dos branches T9/T10/T11 e publicação pelo controlador. Nenhuma proteção remota ou branch foi alterada.

## Correções da revisão independente

O avaliador de `npm audit` agora exige igualdade entre as contagens de cada severidade no resumo e o inventário detalhado. O caso RED de metadados `high=1,total=1` com lista de vulnerabilidades vazia foi rejeitado; a suíte focada passou 8/8.

O arquivo global de exceções é validado integralmente pelos dois esquemas aprovados e encaminha cada entrada somente ao gate correspondente. `id`/`pacote`/`versao` identificam auditoria; `regraId` identifica Semgrep. Entradas ambíguas, desconhecidas, com campos extras ou campos obrigatórios ausentes são rejeitadas. Teste focal com lista mista comprovou que cada gate aplica somente sua exceção; um achado Semgrep adicional sem correspondência continua bloqueando.

Evidência da revisão: o teste da lista mista falhou com exit 1 ao substituir temporariamente o roteamento por um placeholder que entregava toda a lista aos dois avaliadores, e passou ao restaurar o roteamento. Logs focados RED/GREEN em `.local/task-11/shared-exceptions-{red,green}.log`. Os testes combinados de auditoria, roteamento e Semgrep passaram 18/18; build, scanners e suítes globais não foram executados nesta rodada.
