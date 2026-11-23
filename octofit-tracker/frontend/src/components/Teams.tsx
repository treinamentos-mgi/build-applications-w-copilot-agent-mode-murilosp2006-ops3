import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot?: string; members: unknown[] };

export default function Teams() {
  return (
    <CapabilityCard<{ teams: Team[] }>
      title="Equipes"
      description="Gerencie equipes e integrantes."
      path="/api/teams"
      isEmpty={(data) => data.teams.length === 0}
      emptyText="Nenhuma equipe cadastrada ainda."
      render={(data) => (
        <ul className="list-unstyled mb-0">
          {data.teams.map((team, index) => (
            <li key={team._id ?? index}>
              <strong>{team.name}</strong>{team.mascot ? ` · mascote ${team.mascot}` : ''} · {team.members.length} {team.members.length === 1 ? 'integrante' : 'integrantes'}
            </li>
          ))}
        </ul>
      )}
    />
  );
}
