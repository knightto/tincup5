import { excelRound } from "./round";

export type StrokePlayer = {
  id: string;
  grossFront: number;
  grossBack: number;
  hc18: number;
};

export type StrokeResult = {
  id: string;
  gross18: number;
  net: number;
  rank: number;
  points: number;
};

export function computeStrokeResults(players: StrokePlayer[]): StrokeResult[] {
  const base = players.map((player) => {
    const gross18 = player.grossFront + player.grossBack;
    const net = gross18 - player.hc18;
    return { id: player.id, gross18, net };
  });

  const sorted = [...base].sort((a, b) => a.net - b.net);
  const ranks: Record<string, number> = {};
  let currentRank = 1;

  sorted.forEach((player, index) => {
    if (index > 0 && player.net !== sorted[index - 1].net) {
      currentRank = index + 1;
    }
    ranks[player.id] = currentRank;
  });

  return base.map((player) => ({
    ...player,
    rank: ranks[player.id],
    points: 0
  }));
}

export function applyStrokePlayTop8Fixed(results: StrokeResult[]): StrokeResult[] {
  return results.map((result) => ({
    ...result,
    points: result.rank <= 8 ? 2 : 0
  }));
}

export function applyStrokePlayFull(
  results: StrokeResult[],
  pointsTable: number[]
): StrokeResult[] {
  const byRank: Record<number, StrokeResult[]> = {};
  results.forEach((result) => {
    byRank[result.rank] = byRank[result.rank] ?? [];
    byRank[result.rank].push(result);
  });

  const sortedRanks = Object.keys(byRank)
    .map((value) => Number(value))
    .sort((a, b) => a - b);

  let placeIndex = 1;
  const pointsById: Record<string, number> = {};

  for (const rank of sortedRanks) {
    const group = byRank[rank];
    const start = placeIndex - 1;
    const end = start + group.length - 1;
    const slice = pointsTable.slice(start, end + 1);
    const average = slice.length
      ? slice.reduce((sum, value) => sum + value, 0) / slice.length
      : 0;

    group.forEach((player) => {
      pointsById[player.id] = average;
    });

    placeIndex += group.length;
  }

  return results.map((result) => ({
    ...result,
    points: pointsById[result.id] ?? 0
  }));
}
