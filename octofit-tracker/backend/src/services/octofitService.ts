import { Activity, Team, User, Workout } from '../models/index.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;
const FOCUS_LABEL: Record<string, string> = { endurance: 'resistência', strength: 'força' };
const ACTIVITY_LABEL: Record<string, string> = { run: 'corrida', cycle: 'ciclismo', swim: 'natação', walk: 'caminhada', strength: 'força' };
const FOCUS_BY_ACTIVITY: Record<string, string> = { run: 'endurance', cycle: 'endurance', swim: 'endurance', walk: 'endurance', strength: 'strength' };

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function requireObjectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !OBJECT_ID.test(value)) throw httpError(`${field} deve ser um ID válido`, 400);
  return value;
}

function requireText(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') throw httpError(`${field} é obrigatório`, 400);
  return value;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = (input ?? {}) as Record<string, unknown>;
  const userId = requireObjectId(body.userId, 'userId');
  const teamId = requireObjectId(body.teamId, 'teamId');
  const type = requireText(body.type, 'type');
  if (typeof body.minutes !== 'number' || !Number.isFinite(body.minutes) || body.minutes <= 0) {
    throw httpError('minutes deve ser um número positivo', 400);
  }
  const [userExists, teamExists] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!userExists) throw httpError('Pessoa não encontrada', 404);
  if (!teamExists) throw httpError('Equipe não encontrada', 404);
  const activity = await Activity.create({ user: userId, team: teamId, type, minutes: body.minutes, points: body.minutes, occurredAt: new Date() });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = (input ?? {}) as Record<string, unknown>;
  const name = requireText(body.name, 'name');
  const mascot = requireText(body.mascot, 'mascot');
  const members = Array.isArray(body.members) ? body.members.map((member) => requireObjectId(member, 'members')) : [];
  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
  ]);
  const pointsByTeam = new Map(totals.map((total) => [String(total._id), total.totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(String(team._id)) ?? 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError('Pessoa não encontrada', 404);
  const latest = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const goal = user.fitnessGoal ?? '';
  const focus = FOCUS_LABEL[goal] ? goal : FOCUS_BY_ACTIVITY[latest?.type ?? ''];
  if (!focus) return [];
  const source = latest ? `atividade recente de ${ACTIVITY_LABEL[latest.type] ?? latest.type}` : 'meta cadastrada';
  const reason = `Foco em ${FOCUS_LABEL[focus]}, alinhado à ${source}.`;
  const workouts = await Workout.find({ focus }).lean();
  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
