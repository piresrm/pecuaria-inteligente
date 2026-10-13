# Projeto acadêmico — Pecuária Inteligente

> **NOTA**
>
> Por orientação do curso, este arquivo é versionado como registro acadêmico do processo de desenvolvimento assistido por IA, sob supervisão do autor. Ele documenta as instruções utilizadas e contextualiza decisões e artefatos produzidos. Os prompts devem ser considerados instrutivos, e não um recurso suficiente para reconstruir o desenvolvimento ou reproduzir seus resultados. A reprodução determinística é inviável, pois os resultados também dependem do modelo, das personalizações do usuário, das configurações da sessão e das rodadas de ajustes e refinamentos realizadas ao longo da colaboração.

## 1. Definição da proposta

**Contexto**: Considere um MVP acadêmico de inteligência de mercado pecuário brasileiro, chamado Pecuária Inteligente, com apoio de IA no desenvolvimento.  
**Objetivo**: Defina a proposta, o público, as funcionalidades e as fases de entrega. Abranja cria, recria, engorda, abate e leite na visão do produto; restrinja o início à reposição em Goiás. Exclua gestão individual do rebanho.  
**Estilo**: Use português, títulos hierárquicos, parágrafos curtos e escopo explícito.  
**Tom**: Adote linguagem clara, objetiva e proporcional ao MVP.  
**Audiência**: Produtores, gestores, consultores e avaliadores acadêmicos (na versão inicial).  
**Resposta**: Crie README.md; diferencie a v0.1 demonstrativa, a v0.2 acadêmica e a evolução posterior até uma versão pública. Apresente funcionalidades como planejadas.

## 2. Estabelecimento das convenções

**Contexto**: Considere a proposta do projeto e a colaboração entre autor e IA no desenvolvimento de um MVP acadêmico.  
**Objetivo**: Documente o contexto em ABOUT.md e as orientações de contribuição em AGENTS.md. Adote TDD, commits granulares e revisão de entregas.  
**Estilo**: Escreva ABOUT.md em português e AGENTS.md em inglês. Organize regras por assunto.  
**Tom**: Use instruções práticas e verificáveis.  
**Audiência**: Autor, colaboradores e agentes de desenvolvimento.  
**Resposta**: Defina *branches* de trabalho, PRs para `main`, *Conventional Commits* em português e identificação do modelo realmente utilizado no rodapé. Preserve credenciais fora do Git e não invente comandos de teste antes da configuração.

## 3. Especificação dos requisitos

**Contexto**: Considere a proposta de reposição para cria e recria em Goiás, com consulta pública em conexões rurais instáveis.  
**Objetivo**: Especifique oito perfis de bezerros, bezerras, garrotes e novilhas, nas variantes Nelore e mestiça; contemple dez regiões do IMB e doze meses de histórico semanal. Defina filtros, unidades, média estadual, variações e lacunas.  
**Estilo**: Identifique requisitos, regras de negócio e critérios de aceitação; use exemplos calculáveis.  
**Tom**: Evite ambiguidades e promessas de dados reais.  
**Audiência**: Implementadores e revisores dos requisitos.  
**Resposta**: Crie a especificação e atualize o README. Exclua ausências da média, exiba cobertura e arredonde somente na apresentação. Exemplo: R$ 3.000,00 ÷ 200 kg = R$ 15,00/kg; trate-o como entrada isolada de teste.

## 4. Definição da arquitetura

**Contexto**: Considere os requisitos de consulta pública, preços demonstrativos e tolerância a falhas de rede.  
**Objetivo**: Defina componentes, responsabilidades e fluxos. Priorize tabela e filtros; carregue gráficos posteriormente. Atribua cálculos ao navegador e leitura dos dados à API.  
**Estilo**: Use diagramas Mermaid e descrições curtas de decisões e consequências.  
**Tom**: Mantenha precisão técnica e simplicidade.  
**Audiência**: Desenvolvedores e revisores da arquitetura.  
**Resposta**: Documente publicação atômica, versões coerentes dos dados, persistência da última consulta e preservação de resultados diante de falhas. Evite prometer operação integral sem conexão. Separe decisões arquiteturais das futuras escolhas de bibliotecas.

## 5. Seleção das tecnologias

**Contexto**: Considere a arquitetura do projeto e um ambiente *fullstack* TypeScript com hospedagem acadêmica local.  
**Objetivo**: Preserve Vite, React, Tailwind, Fastify e PostgreSQL no Docker Compose. Detalhe Drizzle e pg, TypeBox/Ajv, big.js, idb e Chart.js conforme suas responsabilidades.  
**Estilo**: Registre decisões, justificativas e limitações em um documento central.  
**Tom**: Faça recomendações fundamentadas; evite complexidade desnecessária.  
**Audiência**: Autor e futuros implementadores.  
**Resposta**: Pesquise documentação oficial e registre compatibilidade. Avalie Vercel para versões futuras. Mantenha uma instância da API na entrega local e adie Valkey/Redis; explique a coordenação necessária antes de ampliar instâncias. Atualize o README sem alegar instalação concluída.

## 6. Planejamento do ambiente

**Contexto**: Considere as decisões tecnológicas e a futura execução local por Docker Compose.  
**Objetivo**: Defina versões de referência, imagens, módulos, migrações, convenções, formatação e verificações estáticas. Considere interface, API, contratos compartilhados e preparação dos dados.  
**Estilo**: Apresente uma especificação reproduzível com organização de diretórios e responsabilidades.  
**Tom**: Diferencie planejamento de execução comprovada.  
**Audiência**: Implementadores e responsáveis pela avaliação acadêmica.  
**Resposta**: Documente Caddy para interface e HTTPS local, PostgreSQL com volume persistente e preparação separada da consulta pública. Liste arquivos e comandos a formalizar na implementação. Não crie infraestrutura executável nesta etapa nem inclua segredos no repositório.

## 7. Preparação dos dados demonstrativos

**Contexto**: Considere os requisitos da demonstração e as referências públicas de reposição, regiões do IMB e códigos municipais do IBGE.  
**Objetivo**: Monte uma base fixa com preços fictícios plausíveis, pesos de referência, histórico semanal e lacunas controladas. Registre fontes, datas, condições comerciais e limitações de uso.  
**Estilo**: Produza CSV e JSON legíveis, uma receita determinística e cenários esperados.  
**Tom**: Identifique claramente a natureza demonstrativa.  
**Audiência**: Desenvolvedores e avaliadores dos dados e cálculos.  
**Resposta**: Crie data/demonstrativa/v0.1/, manifesto, perfis, regiões, preços, receita, cenários e SHA-256. Confira integridade e ordem de grandeza, sem copiar séries comerciais. Exemplo de registro: `perfil=bezerro-macho-nelore; preco=3000.00; moeda=BRL; unidade=cabeca; natureza=demonstrativa`. Defina identificadores e uma janela fixa para a demonstração.

## 8. Definição do modelo físico

**Contexto**: Considere a arquitetura, os cadastros e a receita demonstrativa, com PostgreSQL, Drizzle e migrações SQL revisáveis.  
**Objetivo**: Especifique tabelas, relações, chaves, índices e tipos decimais exatos. Separe versões, conteúdos e referência da publicação atual.  
**Estilo**: Use um diagrama relacional e tabelas de restrições e permissões.  
**Tom**: Explicite integridade, atomicidade e limites.  
**Audiência**: Implementadores do banco de dados e da importação.  
**Resposta**: Documente preparação idempotente, publicação transacional, imutabilidade e retenção das versões. Separe permissões de migração, publicação e leitura. Defina verificações contra duplicatas e referências incompatíveis; não execute migrações nem declare o banco operacional.

## 9. Formalização dos contratos

**Contexto**: Considere os requisitos, a arquitetura, o modelo físico e os dados, com respostas consistentes por versão.  
**Objetivo**: Especifique contratos da API de leitura e da consulta salva no IndexedDB, incluindo resumo, histórico, erros e metadados.  
**Estilo**: Use JSON Schema e exemplos completos, com validação estrutural e semântica.  
**Tom**: Declare limites e comportamentos observáveis.  
**Audiência**: Implementadores da API, da interface e dos testes.  
**Resposta**: Produza esquemas e exemplos verificáveis. Preserve decimais como cadeias, calendário com lacunas, versões explícitas e validação antes da persistência. Defina ETag, troca atômica e concorrência entre abas. Registre o orçamento e as medições disponíveis, sem inventar evidências nem implementar rotas.

## 10. Definição dos critérios de qualidade

**Contexto**: Considere os artefatos das etapas anteriores, com TDD e Semgrep obrigatório.  
**Objetivo**: Especifique testes de domínio, contratos, PostgreSQL e navegador, auditoria de dependências e GitHub Actions. Use Vitest, Testing Library, Playwright e Testcontainers conforme a responsabilidade.  
**Estilo**: Priorize cenários críticos, evidências e verificações proporcionais ao MVP.  
**Tom**: Diferencie definição, verificação isolada e execução da aplicação.  
**Audiência**: Implementadores e revisores acadêmicos.  
**Resposta**: Documente suítes, isolamento, critérios e CI; produza seleção Semgrep com revisão, hashes e licença. Exemplo: exija alerta para `dangerouslySetInnerHTML` e ausência de alerta para texto renderizado normalmente; verifique ambos. Não redistribua regras sem permissão. Atualize o README e registre resultados, limites e pendências efetivamente verificadas.

## 11. Definição da apresentação e do armazenamento

**Contexto**: Considere a consulta demonstrativa em Goiás, os contratos e o acesso em computador e celular com conexão limitada.  
**Objetivo**: Defina um painel com indicadores em destaque e identidade agropecuária: fundo claro, verde profundo, tons de terra, gado no pasto no computador e boi no curral no celular, com sobreposição e degradê.  
**Estilo**: Preserve legibilidade e acessibilidade. Use imagens decorativas locais com origem e uso autorizado, variantes de dimensões e formatos comprimidos; selecione arquivos por `picture`, `srcset` e `sizes`.  
**Tom**: Diferencie decisões aprovadas de recursos ainda não implementados.  
**Audiência**: Implementadores da interface, da persistência e dos testes.  
**Resposta**: Registre suporte a Chrome, Edge, Firefox e Safari. Meça a projeção do resumo, dos oito históricos e dos envelopes e a coexistência em IndexedDB num perfil temporário do Chrome. Adote, por decisão do autor, 10.240 KiB (10 MiB) como orçamento total em todos os navegadores, sem exigir medições adicionais de ocupação nos demais. Preserve testes de limite, quota, transações e conflitos; falhas não podem apagar a consulta salva. Registre as evidências disponíveis sem alegar medições não realizadas. Atualize os documentos e o README, revise e comite as decisões.

## 12. Elaboração do plano de implementação

**Contexto**: Considere as especificações aprovadas de requisitos, arquitetura, tecnologias, dados, banco, contratos, qualidade, apresentação e armazenamento.  
**Objetivo**: Elabore um plano da v0.1 com tarefas sequenciais de TDD, arquivos, interfaces, comandos e resultados verificáveis.  
**Estilo**: Use passos com caixas de seleção, responsabilidades claras e critérios de falha e aprovação.  
**Tom**: Seja conciso e preciso; diferencie planejamento de implementação concluída.  
**Audiência**: Autor, implementadores e revisores.  
**Resposta**: Crie o plano em disco, cobrindo contratos, domínio, esquema, publicação, API, limites, coordenação, IndexedDB, painel, imagens, HTTPS local, segurança, CI e aceitação. Formalize compilação, inicialização, segredos e confiança da autoridade local. Preserve os orçamentos de desempenho e o limite de 10 MiB. Atualize o README, confira referências e integridade, comite e apresente o plano para revisão e escolha do método antes de implementar. Publique os commits na branch existente quando solicitado.

## 13. Implementação e validação da v0.1

**Contexto**: Considere as especificações, o plano aprovado e a colaboração entre autor, IA e subagents.  
**Objetivo**: Implemente contratos, domínio, banco, API, cliente web, persistência, interface, execução local, segurança e integração contínua.  
**Estilo**: Organize o trabalho em etapas verificáveis, com mudanças pequenas, testes e revisão.  
**Tom**: Seja objetivo, técnico e proporcional ao escopo do MVP.  
**Audiência**: Autor, implementadores, revisores e avaliadores acadêmicos.  
**Resposta**: Use subagents para implementar, testar, validar e corrigir as partes apropriadas, com o apoio do plugin Superpowers e das habilidades aplicáveis. Para cada tarefa, selecione o modelo LLM de menor custo e menor esforço capaz de cumprir o objetivo com qualidade suficiente e sem exigir refatoração posterior por uma escolha inadequada. Racionalize o uso de tokens, evitando contexto e iterações desnecessários sem sacrificar a validação. Integre as entregas, execute as verificações cabíveis, registre limites e mantenha a documentação alinhada ao estado efetivo do projeto.  
