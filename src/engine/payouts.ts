export type FinishPayouts = {
  winner: number;
  second: number;
  third: number;
};

export type SideContestPayouts = Record<string, number>;

export function computeFinishPayout(rank: number, payouts: FinishPayouts): number {
  if (rank === 1) return payouts.winner;
  if (rank === 2) return payouts.second;
  if (rank === 3) return payouts.third;
  return 0;
}

export function computeTotalCash(
  finishPayout: number | null,
  sideContestWins: Record<string, number>,
  sideContestPayouts: SideContestPayouts
): number {
  const base = finishPayout ?? 0;
  const side = Object.keys(sideContestWins).reduce((sum, key) => {
    const count = sideContestWins[key] ?? 0;
    const amount = sideContestPayouts[key] ?? 0;
    return sum + count * amount;
  }, 0);
  return base + side;
}
