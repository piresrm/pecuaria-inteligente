.DEFAULT_GOAL := help

NPM ?= npm

.PHONY: help install verify acceptance local-up local-down local-publish

help:
	@printf '%s\n' \
		'make install         instala as dependências do lockfile' \
		'make verify          executa dados, qualidade, testes, build e segurança' \
		'make acceptance      executa a aceitação completa, incluindo Docker e E2E' \
		'make local-up        prepara e sobe o ambiente HTTPS local' \
		'make local-down      encerra o ambiente local preservando volumes' \
		'make local-publish   prepara, sobe e publica a base demonstrativa'

install:
	$(NPM) ci

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
