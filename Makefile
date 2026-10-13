.DEFAULT_GOAL := help

NPM ?= npm

.PHONY: help install data check test build e2e verify acceptance local-up local-down local-publish

help:
	@printf '%s\n' \
		'make install         instala as dependências do lockfile' \
		'make data            verifica a base demonstrativa fixa' \
		'make check           executa tipos, formatação e lint' \
		'make test            executa as suítes rápidas' \
		'make build           compila contratos, domínio, API e interface' \
		'make e2e             executa a aceitação do navegador com Docker' \
		'make verify          executa dados, qualidade, testes, build e segurança' \
		'make acceptance      executa a aceitação completa, incluindo Docker e E2E' \
		'make local-up        prepara e sobe o ambiente HTTPS local' \
		'make local-down      encerra o ambiente local preservando volumes' \
		'make local-publish   prepara, sobe e publica a base demonstrativa'

install:
	$(NPM) ci

data:
	$(NPM) run check:data

check:
	$(NPM) run check

test:
	$(NPM) test

build:
	$(NPM) run build

e2e:
	$(NPM) run test:e2e

verify:
	$(NPM) run check:data
	$(NPM) run check
	$(NPM) test
	$(NPM) run build
	$(NPM) run check:bundle
	$(NPM) run test:local
	$(NPM) run security

acceptance:
	$(NPM) run check:data
	$(NPM) run check
	$(NPM) test
	$(NPM) run test:integration
	$(NPM) run build
	$(NPM) run check:bundle
	$(NPM) run performance:measure
	$(NPM) run test:e2e
	$(NPM) run security

local-up:
	$(NPM) run local:prepare
	$(NPM) run local:up
	$(NPM) run local:ca

local-down:
	$(NPM) run local:down

local-publish:
	$(NPM) run local:prepare
	$(NPM) run local:up
	$(NPM) run local:publish
