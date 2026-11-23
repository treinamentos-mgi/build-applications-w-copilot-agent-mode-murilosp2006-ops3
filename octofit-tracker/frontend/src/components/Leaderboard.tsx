import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return (
    <CapabilityCard<{ leaderboard: Entry[] }>
      title="Placar"
      description="Compare a pontuação total das equipes."
      path="/api/leaderboard"
      isEmpty={(data) => data.leaderboard.length === 0}
      emptyText="Sem pontuação registrada ainda."
      render={(data) => (
        <ul className="list-unstyled mb-0">
          {data.leaderboard.map((entry) => (
            <li key={entry.teamName}><strong>{entry.rank}º</strong> {entry.teamName}: {entry.totalPoints} pts</li>
          ))}
        </ul>
      )}
    />
  );
}
