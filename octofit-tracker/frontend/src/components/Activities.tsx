import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
const TYPE_LABEL: Record<string, string> = { run: 'Corrida', cycle: 'Ciclismo', swim: 'Natação', walk: 'Caminhada', strength: 'Força' };
const loadActivities = () => getJson<{ activities: Activity[] }>('/api/activities');

export default function Activities() {
  return (
    <CapabilityCard<{ activities: Activity[] }>
      title="Atividades"
      description="Acompanhe os minutos de atividade e os pontos das pessoas participantes."
      load={loadActivities}
      isEmpty={(data) => data.activities.length === 0}
      emptyText="Nenhuma atividade registrada ainda."
      render={(data) => (
        <ul className="list-unstyled mb-0">
          {data.activities.map((activity, index) => (
            <li key={activity._id ?? index}>{TYPE_LABEL[activity.type] ?? activity.type}: {activity.minutes} min, {activity.points} pts</li>
          ))}
        </ul>
      )}
    />
  );
}
