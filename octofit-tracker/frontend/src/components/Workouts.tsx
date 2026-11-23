import { CapabilityCard } from './CapabilityCard.js';

const DEMO_EMAIL = 'mona@example.com';

type Suggestion = { _id?: string; title: string; reason: string };

export default function Workouts() {
  return (
    <CapabilityCard<{ suggestions: Suggestion[] }>
      title="Sugestões de treino"
      description="Receba recomendações de treino com base nos seus padrões de atividade."
      path={`/api/workouts/suggestions/${encodeURIComponent(DEMO_EMAIL)}`}
      isEmpty={(data) => data.suggestions.length === 0}
      emptyText="Nenhuma sugestão de treino disponível."
      render={(data) => (
        <ul className="list-unstyled mb-0">
          {data.suggestions.map((suggestion, index) => (
            <li key={suggestion._id ?? index}><strong>{suggestion.title}</strong><br />{suggestion.reason}</li>
          ))}
        </ul>
      )}
    />
  );
}
