# Arquitetura do OctoFit Tracker

O OctoFit Tracker é uma aplicação de três camadas para um programa de atividades físicas escolar. O código inicial inclui contratos de API e pontos de implementação intencionalmente incompletos para que você use o modo agent do GitHub Copilot em um ciclo guiado por testes.

```mermaid
flowchart LR
    Browser["Navegador"]
    UI["Apresentação<br/>React 19 · Vite · React Router · Bootstrap<br/>Porta 3000 · pública"]
    API["Lógica<br/>Express · TypeScript · serviços<br/>Porta 8000 · pública"]
    DB["Dados<br/>Mongoose · MongoDB<br/>Porta 27017 · privada"]
    Contracts["Contratos executáveis<br/>Atividades · Equipes · Placar · Sugestões"]

    Browser --> UI
    UI -->|HTTP /api via proxy Vite| API
    API -->|Mongoose| DB
    Contracts -. verificam .-> UI
    Contracts -. verificam .-> API
    Contracts -. verificam .-> DB
```

## Limites entre as camadas

- **Camada de apresentação**: React 19, Vite, React Router, Bootstrap e um cliente compartilhado da API em `octofit-tracker/frontend/src`.
- **Camada de lógica**: rotas e serviços Express com TypeScript em `octofit-tracker/backend/src` expõem o comportamento `/api/*` na porta `8000`.
- **Camada de dados**: modelos Mongoose e dados de demonstração em `octofit-tracker/backend/src/models` e `src/scripts/seed.ts` são persistidos no MongoDB na porta `27017`.

## Portas e regras de ambiente

- MongoDB: `27017` (privada)
- API Express: `8000` (pública)
- Interface Vite: `3000` (pública)
- O navegador acessa caminhos relativos `/api`. O Vite os encaminha para `http://localhost:8000`; `VITE_API_BASE_URL` pode substituir a URL-base.
- Não encaminhe nem torne públicas outras portas.

## Contrato da API

| Capacidade | Método e caminho | Comportamento esperado |
| --- | --- | --- |
| Registro de atividades | `GET /api/activities`, `POST /api/activities` | Lista e cria atividades válidas. POST recebe `userId`, `teamId`, `type` e `minutes`; `userId` e `teamId` devem ser IDs bem-formados de uma pessoa e uma equipe existentes, caso contrário a API retorna um 4xx intencional (nunca um 500 causado por erro de conversão). Uma atividade criada armazena `user`, `team`, `type` e `minutes` enviados, além de `points` e `occurredAt` calculados. |
| Equipes | `GET /api/teams`, `POST /api/teams` | Lista e cria equipes com integrantes. As equipes criadas e listadas mantêm os valores enviados em `name` e `mascot`. Rejeita uma equipe sem nome com `400`. |
| Placar | `GET /api/leaderboard` | Retorna as equipes ordenadas pela soma dos pontos de suas atividades, da maior para a menor. Cada item contém `teamName`, `totalPoints` e uma `rank` iniciada em 1. |
| Sugestões de treino | `GET /api/workouts/suggestions/:userEmail` | Recomenda treinos com base nos padrões de atividade recentes da pessoa correspondente ao e-mail seed. O foco da primeira sugestão (`focus`) corresponde à meta ou à atividade recente dessa pessoa, e o campo `reason` explica o motivo. Um e-mail sem pessoa correspondente retorna um 4xx intencional (por exemplo, `404`). |

## Decisões de implementação

As decisões adotadas mantêm apresentação, lógica e persistência separadas:

- Decisão da camada de apresentação: cada tela consome o cliente compartilhado em `src/api/client.ts` e trata carregamento, estado vazio, erro (`role="alert"`) e dados. Componentes não implementam regras de negócio.
- Decisão da camada de lógica: as rotas delegam para `services/octofitService.ts`. Entradas inválidas recebem 4xx explícito, sem expor falhas de conversão de ID como erro 500.
- Decisão da camada de dados: os modelos Mongoose declaram os campos obrigatórios: `User` (nome, e-mail, meta), `Team` (nome, mascote), `Activity` (pessoa, equipe, tipo, minutos, pontos, data) e `Workout` (foco, minutos, dificuldade). O seed persiste os dados pelos modelos.
- Abordagem para registro de atividades: validar `userId` e `teamId` quanto ao formato e existência; calcular `points` e `occurredAt` no servidor; responder com 400 ou 404 quando a entrada for inválida.
- Abordagem para gerenciamento de equipes: exigir `name` (400 quando ausente), persistir `name`, `mascot` e `members`, e listar os valores sem transformações.
- Abordagem para o placar: agregar os pontos das atividades por equipe, ordenar do maior para o menor e atribuir `rank` começando em 1.
- Abordagem para sugestões de treino: buscar a pessoa pelo e-mail (404 quando não encontrada), derivar `focus` da meta ou da atividade recente mais frequente e explicar a recomendação em `reason`.

## Plano de testes

Execute os comandos a partir da raiz do repositório, nesta ordem. Uma falha no teste de dados aponta para o contrato dos modelos ou do seed; no teste da API, para a capacidade indicada pelo caso; no frontend, para a integração ou o estado acessível da tela. Falhas de build indicam erros de tipos/compilação no backend ou de tipos/empacotamento no frontend.

| Etapa | Comando | Resultado verificado |
| --- | --- | --- |
| Dados | `npm run test:data --prefix octofit-tracker/backend` | 5 de 5 testes passaram. |
| API | `npm run test:api --prefix octofit-tracker/backend` | 4 de 4 testes passaram. |
| Frontend | `npm test --prefix octofit-tracker/frontend` | 20 de 20 testes passaram. |
| Build do backend | `npm run build --prefix octofit-tracker/backend` | Concluído sem erros. |
| Build do frontend | `npm run build --prefix octofit-tracker/frontend` | Typecheck e build Vite concluídos sem erros. |

### Baseline do scaffold (antes da implementação)

- Dados: 4 de 5 falham. Os modelos não declaram campos obrigatórios, então `validateSync()` retorna `undefined`. O teste de seed passa.
- API: 4 de 4 falham. `createActivity` e `createTeam` lançam 501 em vez de 400; `getLeaderboard` retorna `[]`; `suggestWorkouts` retorna um treino genérico sem `focus` nem `reason` derivados da pessoa.
- Frontend: 15 de 15 falham. As telas exibem "Implementação pendente", não têm `role="alert"` nem estados de carregamento e vazio. O teste de sugestões expira por tempo.

Essa baseline é histórica; não representa o estado verificado acima. Durante a implementação, execute os testes na ordem dados, API e frontend e, em seguida, compile backend e frontend.

### Resultado registrado

- Dados: 5 de 5 passam.
- API: 4 de 4 passam.
- Frontend: 20 de 20 passam.
- Compilação do backend e do frontend: sem erros.
- Validação do exercício (`node .github/scripts/validate-exercise.mjs`): 11 de 11 checks passam.
- Testes da raiz (`node --test tests/exercise-validation.test.mjs`): 42 de 42 passam.
- Verificação final (`node .github/scripts/grade-step.mjs step5-final`): passa.
