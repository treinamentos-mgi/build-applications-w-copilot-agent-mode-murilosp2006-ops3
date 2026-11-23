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

Registre seu plano aqui antes de editar o código.

- Decisão da camada de apresentação: cada tela consome o cliente em `src/api/client.ts` e trata os estados de carregamento, vazio, erro (`role="alert"`) e dados. Os componentes não contêm regra de negócio.
- Decisão da camada de lógica: as rotas apenas delegam para `services/octofitService.ts`. Entradas inválidas geram 4xx explícito, nunca 500 por falha de conversão de ID.
- Decisão da camada de dados: os modelos Mongoose declaram os campos obrigatórios (`User`: nome, e-mail, meta; `Team`: nome, mascote; `Activity`: pessoa, equipe, tipo, minutos, pontos, data; `Workout`: foco, minutos, dificuldade). O seed continua passando pelos modelos.
- Abordagem para registro de atividades: validar `userId` e `teamId` como IDs bem formados e existentes; calcular `points` e `occurredAt` no servidor; retornar 400 ou 404 para entradas inválidas.
- Abordagem para gerenciamento de equipes: exigir `name` com retorno 400; persistir `name`, `mascot` e `members`; listar sem transformações.
- Abordagem para o placar: agregar os pontos das atividades por equipe, ordenar de forma decrescente e atribuir `rank` a partir de 1.
- Abordagem para sugestões de treino: buscar a pessoa pelo e-mail (404 se não existir); derivar `focus` da meta ou da atividade recente mais frequente; preencher `reason` com o motivo.

## Plano de testes

Registre os comandos executados e o significado de cada falha.

- Testes da camada de dados: `npm run test:data --prefix octofit-tracker/backend`
- Testes da API: `npm run test:api --prefix octofit-tracker/backend`
- Testes do frontend: `npm test --prefix octofit-tracker/frontend`
- Compilação do backend: `npm run build --prefix octofit-tracker/backend`
- Compilação do frontend: `npm run build --prefix octofit-tracker/frontend`

Execução inicial (antes da implementação):

- Dados: 4 de 5 falham. Os modelos não declaram campos obrigatórios, então `validateSync()` retorna `undefined`. O teste de seed passa.
- API: 4 de 4 falham. `createActivity` e `createTeam` lançam 501 em vez de 400; `getLeaderboard` retorna `[]`; `suggestWorkouts` retorna um treino genérico sem `focus` nem `reason` derivados da pessoa.
- Frontend: 15 de 15 falham. As telas exibem "Implementação pendente", não têm `role="alert"` nem estados de carregamento e vazio. O teste de sugestões expira por tempo.

Ordem de execução dos testes a cada etapa: dados, API e frontend, seguidos das compilações do backend e do frontend.
