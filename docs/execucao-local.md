# Execução local

## Atalhos Linux

O `Makefile` encadeia os scripts npm sem substituir sua interface canônica:

| Comando              | Uso                                                                     |
| -------------------- | ----------------------------------------------------------------------- |
| `make install`       | Instala as dependências do lockfile.                                    |
| `make data`          | Verifica hashes, receita, calendário, território e cenários.            |
| `make check`         | Executa tipos, formatação e lint.                                       |
| `make test`          | Executa as suítes rápidas.                                              |
| `make build`         | Compila contratos, domínio, API e interface.                            |
| `make verify`        | Executa dados, qualidade, testes, build, pacote, políticas e segurança. |
| `make local-up`      | Prepara segredos, sobe Compose e gera a CA local.                       |
| `make local-publish` | Publica a base demonstrativa no ambiente local.                         |
| `make e2e`           | Executa a aceitação isolada em Chromium, Firefox e WebKit.              |
| `make acceptance`    | Executa integração PostgreSQL, build, desempenho, E2E e segurança.      |
| `make local-down`    | Encerra o ambiente preservando os volumes.                              |

Consulte todos os atalhos com `make help`.

## Fluxo padrão

```sh
make install
make local-up
make local-publish
```

A aplicação fica em `https://localhost`. Para encerrar sem apagar a base acadêmica:

```sh
make local-down
```

Não usar `docker compose down --volumes` para encerrar a consulta acadêmica.

## HTTPS e CA

O certificado público é copiado para `.local/root.crt`; as chaves da autoridade permanecem no volume exclusivo do Caddy. A confiança é deliberadamente manual. No Ubuntu, se desejado:

```sh
sudo install -m 0644 .local/root.crt /usr/local/share/ca-certificates/pecuaria-inteligente-local.crt
sudo update-ca-certificates
```

Para remover a confiança do sistema:

```sh
sudo rm /usr/local/share/ca-certificates/pecuaria-inteligente-local.crt
sudo update-ca-certificates --fresh
```

O navegador pode manter seu próprio armazenamento de certificados. Não desative a validação TLS. O cliente Node pode usar `NODE_EXTRA_CA_CERTS=.local/root.crt` quando necessário.

## Rede local temporária

Por padrão, somente `127.0.0.1:80` e `127.0.0.1:443` são publicados. Para avaliação temporária em outro dispositivo de uma rede confiável:

```sh
BIND_ADDRESS=0.0.0.0 ALLOW_LAN=1 SITE_HOST=192.168.1.50 npm run local:up
```

Substitua o endereço pelo IP LAN do computador e encerre com `make local-down`. API e PostgreSQL continuam sem portas publicadas. O modo LAN não substitui uma configuração de produção.

## Segredos e persistência

`local:prepare` cria quatro arquivos independentes em `.local/secrets/`, com diretório `0700` e arquivos `0600`, preservando os existentes. A API, a migração e a publicação recebem papéis distintos. O fluxo não remove volumes nem corrige proprietários automaticamente.

O ambiente usa uma única instância da API. Caddy serve a interface, encaminha `/api/` pela mesma origem HTTPS e não encaminha `/internal/ready`. O controle por IP, a concorrência e as métricas ficam em memória na v0.1; Redis ou Valkey serão avaliados somente antes de múltiplas instâncias.

## Testes locais

```sh
make test
make e2e
make local-down
```

`make e2e` cria recursos isolados, falha em ausência de Docker ou erro TLS, e guarda logs, configurações e traços de falha em `artifacts/e2e/`.
