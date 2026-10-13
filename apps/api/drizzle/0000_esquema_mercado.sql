CREATE SCHEMA "mercado";
--> statement-breakpoint
CREATE TABLE "mercado"."condicoes_comerciais" (
	"versao_dados" text NOT NULL,
	"condicoes_id" text NOT NULL,
	"pagamento" text NOT NULL,
	"frete" text NOT NULL,
	"tributos" text NOT NULL,
	"descricao" text NOT NULL,
	CONSTRAINT "condicoes_comerciais_versao_dados_condicoes_id_pk" PRIMARY KEY("versao_dados","condicoes_id"),
	CONSTRAINT "condicao_identificador" CHECK ("mercado"."condicoes_comerciais"."condicoes_id" ~ '^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$'),
	CONSTRAINT "condicao_pagamento" CHECK ("mercado"."condicoes_comerciais"."pagamento" = 'à vista'),
	CONSTRAINT "condicao_frete" CHECK ("mercado"."condicoes_comerciais"."frete" = 'excluído'),
	CONSTRAINT "condicao_tributos" CHECK ("mercado"."condicoes_comerciais"."tributos" = 'excluídos'),
	CONSTRAINT "condicao_descricao" CHECK (length(btrim("mercado"."condicoes_comerciais"."descricao")) > 0 AND length("mercado"."condicoes_comerciais"."descricao") <= 512)
);
--> statement-breakpoint
CREATE TABLE "mercado"."municipios" (
	"versao_dados" text NOT NULL,
	"codigo_ibge" text NOT NULL,
	"regiao_id" text NOT NULL,
	"nome" text NOT NULL,
	"nome_fonte_imb" text NOT NULL,
	"linha_fonte_imb" integer NOT NULL,
	CONSTRAINT "municipios_versao_dados_codigo_ibge_pk" PRIMARY KEY("versao_dados","codigo_ibge"),
	CONSTRAINT "municipio_codigo" CHECK ("mercado"."municipios"."codigo_ibge" ~ '^52[0-9]{5}$'),
	CONSTRAINT "municipio_nome" CHECK (length(btrim("mercado"."municipios"."nome")) > 0 AND length("mercado"."municipios"."nome") <= 160),
	CONSTRAINT "municipio_nome_fonte" CHECK (length(btrim("mercado"."municipios"."nome_fonte_imb")) > 0 AND length("mercado"."municipios"."nome_fonte_imb") <= 160),
	CONSTRAINT "municipio_linha" CHECK ("mercado"."municipios"."linha_fonte_imb" > 0)
);
--> statement-breakpoint
CREATE TABLE "mercado"."perfis" (
	"versao_dados" text NOT NULL,
	"perfil_id" text NOT NULL,
	"ordem" smallint NOT NULL,
	"categoria" text NOT NULL,
	"sexo" text NOT NULL,
	"grupo_racial" text NOT NULL,
	"idade_referencia_meses" smallint NOT NULL,
	"peso_referencia" numeric(8, 2) NOT NULL,
	"unidade_peso" text NOT NULL,
	"referencia_parametros_id" text NOT NULL,
	CONSTRAINT "perfis_versao_dados_perfil_id_pk" PRIMARY KEY("versao_dados","perfil_id"),
	CONSTRAINT "perfis_ordem" UNIQUE("versao_dados","ordem"),
	CONSTRAINT "perfis_combinacao" UNIQUE("versao_dados","categoria","sexo","grupo_racial"),
	CONSTRAINT "perfil_identificador" CHECK ("mercado"."perfis"."perfil_id" ~ '^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$'),
	CONSTRAINT "referencia_identificador" CHECK ("mercado"."perfis"."referencia_parametros_id" ~ '^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$'),
	CONSTRAINT "perfil_ordem" CHECK ("mercado"."perfis"."ordem" BETWEEN 1 AND 8),
	CONSTRAINT "perfil_coerencia" CHECK (("mercado"."perfis"."categoria" IN ('Bezerro','Garrote') AND "mercado"."perfis"."sexo" = 'Macho' AND "mercado"."perfis"."grupo_racial" IN ('Nelore','Mestiço')) OR ("mercado"."perfis"."categoria" IN ('Bezerra','Novilha') AND "mercado"."perfis"."sexo" = 'Fêmea' AND "mercado"."perfis"."grupo_racial" IN ('Nelore','Mestiça'))),
	CONSTRAINT "perfil_idade" CHECK ("mercado"."perfis"."idade_referencia_meses" > 0),
	CONSTRAINT "perfil_peso" CHECK ("mercado"."perfis"."peso_referencia" > 0 AND "mercado"."perfis"."peso_referencia" NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
	CONSTRAINT "perfil_unidade" CHECK ("mercado"."perfis"."unidade_peso" = 'kg')
);
--> statement-breakpoint
CREATE TABLE "mercado"."precos" (
	"versao_dados" text NOT NULL,
	"perfil_id" text NOT NULL,
	"semana" date NOT NULL,
	"regiao_id" text NOT NULL,
	"condicoes_id" text NOT NULL,
	"preco" numeric(12, 2) NOT NULL,
	"moeda" text NOT NULL,
	"unidade_preco" text NOT NULL,
	"natureza" text NOT NULL,
	CONSTRAINT "precos_versao_dados_perfil_id_semana_regiao_id_pk" PRIMARY KEY("versao_dados","perfil_id","semana","regiao_id"),
	CONSTRAINT "preco_semana" CHECK (isfinite("mercado"."precos"."semana") AND extract(isodow FROM "mercado"."precos"."semana") = 1),
	CONSTRAINT "preco_positivo" CHECK ("mercado"."precos"."preco" > 0 AND "mercado"."precos"."preco" NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
	CONSTRAINT "preco_moeda" CHECK ("mercado"."precos"."moeda" = 'BRL'),
	CONSTRAINT "preco_unidade" CHECK ("mercado"."precos"."unidade_preco" = 'cabeca'),
	CONSTRAINT "preco_natureza" CHECK ("mercado"."precos"."natureza" = 'demonstrativa')
);
--> statement-breakpoint
CREATE TABLE "mercado"."publicacao_atual" (
	"id" smallint PRIMARY KEY NOT NULL,
	"versao_dados" text,
	CONSTRAINT "publicacao_unica" CHECK ("mercado"."publicacao_atual"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "mercado"."regioes" (
	"versao_dados" text NOT NULL,
	"regiao_id" text NOT NULL,
	"ordem" smallint NOT NULL,
	"codigo_imb" text NOT NULL,
	"nome" text NOT NULL,
	"nome_fonte_imb" text NOT NULL,
	"folha_fonte_imb" text NOT NULL,
	CONSTRAINT "regioes_versao_dados_regiao_id_pk" PRIMARY KEY("versao_dados","regiao_id"),
	CONSTRAINT "regioes_ordem" UNIQUE("versao_dados","ordem"),
	CONSTRAINT "regioes_codigo" UNIQUE("versao_dados","codigo_imb"),
	CONSTRAINT "regiao_identificador" CHECK ("mercado"."regioes"."regiao_id" ~ '^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$'),
	CONSTRAINT "regiao_ordem" CHECK ("mercado"."regioes"."ordem" BETWEEN 1 AND 10),
	CONSTRAINT "regiao_codigo" CHECK ("mercado"."regioes"."codigo_imb" ~ '^(00[1-9]|010)$'),
	CONSTRAINT "regiao_nome" CHECK (length(btrim("mercado"."regioes"."nome")) > 0 AND length("mercado"."regioes"."nome") <= 160),
	CONSTRAINT "regiao_nome_fonte" CHECK (length(btrim("mercado"."regioes"."nome_fonte_imb")) > 0 AND length("mercado"."regioes"."nome_fonte_imb") <= 160),
	CONSTRAINT "regiao_folha" CHECK (length(btrim("mercado"."regioes"."folha_fonte_imb")) > 0 AND length("mercado"."regioes"."folha_fonte_imb") <= 80)
);
--> statement-breakpoint
CREATE TABLE "mercado"."versoes_dados" (
	"versao_dados" text PRIMARY KEY NOT NULL,
	"conjunto_id" text NOT NULL,
	"versao_formato_arquivos" text NOT NULL,
	"natureza" text NOT NULL,
	"versao_territorial" text NOT NULL,
	"preparado_em" date NOT NULL,
	"janela_inicio" date NOT NULL,
	"janela_fim" date NOT NULL,
	"primeira_semana" date NOT NULL,
	"ultima_semana" date NOT NULL,
	"semana_anterior" date NOT NULL,
	"hash_conjunto_sha256" text NOT NULL,
	"manifesto" jsonb NOT NULL,
	"estado" text NOT NULL,
	"publicado_em" timestamp (3) with time zone,
	CONSTRAINT "versao_identificador" CHECK ("mercado"."versoes_dados"."versao_dados" ~ '^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$'),
	CONSTRAINT "conjunto_identificador" CHECK ("mercado"."versoes_dados"."conjunto_id" ~ '^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$'),
	CONSTRAINT "territorio_identificador" CHECK ("mercado"."versoes_dados"."versao_territorial" ~ '^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$'),
	CONSTRAINT "versao_formato" CHECK ("mercado"."versoes_dados"."versao_formato_arquivos" = '1'),
	CONSTRAINT "versao_natureza" CHECK ("mercado"."versoes_dados"."natureza" = 'demonstrativa'),
	CONSTRAINT "preparado_finito" CHECK (isfinite("mercado"."versoes_dados"."preparado_em")),
	CONSTRAINT "janela_civil" CHECK (isfinite("mercado"."versoes_dados"."janela_inicio") AND isfinite("mercado"."versoes_dados"."janela_fim") AND extract(day FROM "mercado"."versoes_dados"."janela_inicio") = 1 AND "mercado"."versoes_dados"."janela_fim" = ("mercado"."versoes_dados"."janela_inicio" + interval '1 year' - interval '1 day')::date),
	CONSTRAINT "calendario_semanal" CHECK (isfinite("mercado"."versoes_dados"."primeira_semana") AND extract(isodow FROM "mercado"."versoes_dados"."primeira_semana") = 1 AND isfinite("mercado"."versoes_dados"."ultima_semana") AND extract(isodow FROM "mercado"."versoes_dados"."ultima_semana") = 1 AND isfinite("mercado"."versoes_dados"."semana_anterior") AND extract(isodow FROM "mercado"."versoes_dados"."semana_anterior") = 1 AND "mercado"."versoes_dados"."primeira_semana" BETWEEN "mercado"."versoes_dados"."janela_inicio" AND "mercado"."versoes_dados"."janela_inicio" + 6 AND "mercado"."versoes_dados"."ultima_semana" BETWEEN "mercado"."versoes_dados"."janela_fim" - 6 AND "mercado"."versoes_dados"."janela_fim" AND "mercado"."versoes_dados"."semana_anterior" = "mercado"."versoes_dados"."primeira_semana" - 7),
	CONSTRAINT "hash_sha256" CHECK ("mercado"."versoes_dados"."hash_conjunto_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "manifesto_objeto" CHECK (jsonb_typeof("mercado"."versoes_dados"."manifesto") = 'object'),
	CONSTRAINT "estado_publicacao" CHECK (("mercado"."versoes_dados"."estado" = 'preparacao' AND "mercado"."versoes_dados"."publicado_em" IS NULL) OR ("mercado"."versoes_dados"."estado" = 'publicada' AND "mercado"."versoes_dados"."publicado_em" IS NOT NULL AND isfinite("mercado"."versoes_dados"."publicado_em")))
);
--> statement-breakpoint
ALTER TABLE "mercado"."condicoes_comerciais" ADD CONSTRAINT "condicoes_comerciais_versao_dados_versoes_dados_versao_dados_fk" FOREIGN KEY ("versao_dados") REFERENCES "mercado"."versoes_dados"("versao_dados") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mercado"."municipios" ADD CONSTRAINT "municipios_versao_dados_versoes_dados_versao_dados_fk" FOREIGN KEY ("versao_dados") REFERENCES "mercado"."versoes_dados"("versao_dados") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mercado"."municipios" ADD CONSTRAINT "municipios_versao_dados_regiao_id_regioes_versao_dados_regiao_id_fk" FOREIGN KEY ("versao_dados","regiao_id") REFERENCES "mercado"."regioes"("versao_dados","regiao_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mercado"."perfis" ADD CONSTRAINT "perfis_versao_dados_versoes_dados_versao_dados_fk" FOREIGN KEY ("versao_dados") REFERENCES "mercado"."versoes_dados"("versao_dados") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mercado"."precos" ADD CONSTRAINT "precos_versao_dados_versoes_dados_versao_dados_fk" FOREIGN KEY ("versao_dados") REFERENCES "mercado"."versoes_dados"("versao_dados") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mercado"."precos" ADD CONSTRAINT "precos_versao_dados_perfil_id_perfis_versao_dados_perfil_id_fk" FOREIGN KEY ("versao_dados","perfil_id") REFERENCES "mercado"."perfis"("versao_dados","perfil_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mercado"."precos" ADD CONSTRAINT "precos_versao_dados_regiao_id_regioes_versao_dados_regiao_id_fk" FOREIGN KEY ("versao_dados","regiao_id") REFERENCES "mercado"."regioes"("versao_dados","regiao_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mercado"."precos" ADD CONSTRAINT "precos_versao_dados_condicoes_id_condicoes_comerciais_versao_dados_condicoes_id_fk" FOREIGN KEY ("versao_dados","condicoes_id") REFERENCES "mercado"."condicoes_comerciais"("versao_dados","condicoes_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mercado"."publicacao_atual" ADD CONSTRAINT "publicacao_atual_versao_dados_versoes_dados_versao_dados_fk" FOREIGN KEY ("versao_dados") REFERENCES "mercado"."versoes_dados"("versao_dados") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mercado"."regioes" ADD CONSTRAINT "regioes_versao_dados_versoes_dados_versao_dados_fk" FOREIGN KEY ("versao_dados") REFERENCES "mercado"."versoes_dados"("versao_dados") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "municipios_composicao" ON "mercado"."municipios" USING btree ("versao_dados","regiao_id","codigo_ibge");--> statement-breakpoint
CREATE INDEX "precos_resumo" ON "mercado"."precos" USING btree ("versao_dados","semana","perfil_id","regiao_id");