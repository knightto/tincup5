import { excelRound } from "./round";

export type ScrambleTeamResult = {
  id: string;
  total: number;
  rank: number;
  points: number;
};

export function computeScrambleResults(
  teams: { id: string; total: number }[],
  pointsTable = [3, 2, 1, 0]
): ScrambleTeamResult[] {
  const sorted = [...teams].sort((a, b) => a.total - b.total);
  const ranks: Record<string, number> = {};
  let currentRank = 1;

  sorted.forEach((team, index) => {
    if (index > 0 && team.total !== sorted[index - 1].total) {
      currentRank = index + 1;
    }
    ranks[team.id] = currentRank;
  });

  const byRank: Record<number, string[]> = {};
  teams.forEach((team) => {
    const rank = ranks[team.id];
    byRank[rank] = byRank[rank] ?? [];
    byRank[rank].push(team.id);
  });

  let placeIndex = 1;
  const pointsById: Record<string, number> = {};

  Object.keys(byRank)
    .map((value) => Number(value))
    .sort((a, b) => a - b)
    .forEach((rank) => {
      const group = byRank[rank];
      const start = placeIndex - 1;
      const end = start + group.length - 1;
      const slice = pointsTable.slice(start, end + 1);
      const average = slice.length
        ? slice.reduce((sum, value) => sum + value, 0) / slice.length
        : 0;
      group.forEach((id) => {
        pointsById[id] = excelRound(average, 2);
      });
      placeIndex += group.length;
    });

  return teams.map((team) => ({
    id: team.id,
    total: team.total,
    rank: ranks[team.id],
    points: pointsById[team.id] ?? 0
  }));
}
