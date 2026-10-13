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

O repositório permanecerá **privado** até que a primeira release seja publicada. Antes de torná-lo público para avaliação, é obrigatório garantir que o arquivo [`LICENSE.txt`](LICENSE.txt) esteja presente no repositório, com uma licença própria de avaliação acadêmica e uso restrito. Ela reserva os direitos sobre os materiais do projeto e concede à banca somente o uso necessário à avaliação, preservando direitos de terceiros e exceções legais.

---

## Checklist de Submissão Final

Antes de enviar o link do repositório para avaliação, conferir todos os itens abaixo:

- [ ] **Repositório público e acessível:** o projeto está público no GitHub, todos os arquivos necessários estão presentes e o `.gitignore` não exclui nenhum artefato essencial.
- [ ] **README.md completo e profissional:** contém descrição, configuração, execução, exemplos de uso ou interação com a aplicação/API, tecnologias utilizadas — incluindo modelos de IA e assistentes de código —, seção de limitações e próximos passos, créditos e licença; a formatação Markdown foi revisada no renderizador.
- [ ] **Histórico de commits consistente:** os commits são claros, descritivos, seguem Conventional Commits e há pelo menos cinco commits significativos demonstrando a evolução do projeto.
- [ ] **Gerenciamento de dependências:** o arquivo adequado ao ecossistema, como `package.json` e `package-lock.json`, está versionado e lista as bibliotecas necessárias com versões definidas.
- [ ] **Testes automatizados:** existem testes unitários e/ou de integração, eles passam com sucesso e o README explica como executá-los.
- [ ] **Variáveis de ambiente e credenciais:** chaves, senhas e demais credenciais sensíveis foram removidas do código e do histórico; a configuração usa variáveis de ambiente ou arquivos ignorados, como `.env`.
- [ ] **Branch principal limpo:** `main` está sem commits de trabalho em andamento e sem arquivos temporários ou artefatos indevidos.
- [ ] **Release ou tag:** uma release ou tag, como `v1.0.0`, marca a versão submetida no GitHub.
- [ ] **Licença:** `LICENSE.txt` está presente e define os termos de uso do código conforme a seção de licença acima.
