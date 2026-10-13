# SOBRE

Este diretório contém um miniprojeto de software desenvolvido com o apoio de Inteligência Artificial, como parte de um módulo do curso de especialização lato sensu em Engenharia de Software Apoiada por IA.

O objetivo não é construir um sistema complexo e completo, mas um MVP que permita explorar e aplicar as capacidades da GenAI em diferentes estágios do SDLC, com foco no aprendizado e na experimentação. O sucesso do miniprojeto está em uma fundação sólida: uma ideia bem delineada, uma arquitetura clara e escalável, e um controle de versão robusto e eficiente.

---

## Fluxo de Trabalho com a IA

### 1. Requisitos e Arquitetura

Antes da codificação, a IA auxiliará na definição dos requisitos e no planejamento arquitetural: geração de ideias, diagramas de componentes (Mermaid ou PlantUML), listas de dependências e discussão de vantagens e desvantagens de diferentes abordagens. O resultado deve ser uma estrutura lógica que promova a manutenibilidade e a escalabilidade do projeto.

### 2. Tecnologias e Dependências

Com a arquitetura definida, a IA auxiliará na identificação das tecnologias e dependências necessárias para a implementação.

### 3. Versionamento

O GitHub será utilizado como repositório central de código, documentação e plataforma de CI. A IA poderá criar todo o conteúdo Git local e conectar ao repositório remoto, observando as seguintes regras:

- Criar o `.gitignore` adequado às tecnologias adotadas **antes** do primeiro commit.
- Usar mensagens de commit claras e descritivas, seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification), em pt-BR, sem erros ortográficos ou gramaticais — o histórico de commits servirá de insumo para a geração automática de *changelogs*.

---

## Preferências Pessoais

- Commits granulares, agrupando apenas arquivos relacionados a uma mesma mudança.
- Toda mensagem de commit deve incluir obrigatoriamente, no rodapé, a linha `LLM-Model: nome-do-modelo (Provedor)`. Exemplos:
  - `LLM-Model: GPT-4.1 (OpenAI)`
  - `LLM-Model: Claude-Opus-4 (Anthropic)`
  - `LLM-Model: Gemini-2.5-Pro (Google)`
  - `LLM-Model: Nova-Pro (Amazon)`
- Todo desenvolvimento em *feature branches*, com *pull requests* para o branch `main`, a fim de enriquecer o histórico do projeto. Todo PR deve garantir que o `README.md` esteja atualizado e reflita o estado atual do projeto.
- Adotar TDD com o ciclo Red-Green-Refactor.
- Seguir as [recomendações de segurança do GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories#secure-your-repository).

---

## Licença e Visibilidade do Repositório

O repositório permanecerá **privado** até que a primeira release seja publicada. Antes de torná-lo público para avaliação, é obrigatório garantir que o arquivo `LICENSE.txt` esteja presente no repositório, com o seguinte conteúdo:

```
Copyright (c) 2026 [Seu Nome Completo]. Todos os direitos reservados.

TERMOS DE USO E AVALIAÇÃO ACADÊMICA:

Este repositório contém software proprietário e confidencial, disponibilizado publicamente EXCLUSIVAMENTE para fins de avaliação acadêmica pelos professores e membros da banca examinadora do curso de especialização do autor.

Fica estritamente PROIBIDA a cópia, redistribuição, modificação, comercialização, engenharia reversa ou reuso total ou parcial deste código-fonte, de sua interface ou de suas funcionalidades por qualquer terceiro não autorizado.

Após o encerramento do período de avaliação acadêmica, este repositório poderá ser tornado privado novamente a critério do autor.
```

---

## Checklist de Submissão

Para que o miniprojeto seja considerado completo e pronto para avaliação, deve atender aos seguintes requisitos:

- [ ] Repositório público, acessível para revisão, sem informações sensíveis expostas.
- [ ] Histórico de commits consistente.
- [ ] `README.md` detalhado, contendo:
  - Título e breve descrição do projeto;
  - Instruções de configuração do ambiente e execução local;
  - Exemplos de uso ou de interação com a aplicação/API;
  - Lista de tecnologias utilizadas, incluindo modelos de IA e assistentes de código;
  - Seção "Limitações e Próximos Passos", discutindo o que não foi implementado e como o projeto poderia ser expandido.
  - Créditos e licença.
- [ ] Arquivo de gerenciamento de dependências (ex.: `requirements.txt`, `package.json`).
- [ ] Testes automatizados (unitários ou de integração) executáveis e passando com sucesso.
- [ ] Release ou tag (ex.: `v1.0.0`) marcando a versão de entrega no GitHub.
