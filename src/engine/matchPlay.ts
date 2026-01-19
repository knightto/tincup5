export type HoleInfo = {
  holeNumber: number;
  strokeIndex: number;
};

export type MatchHoleResult = {
  holeNumber: number;
  grossA: number;
  grossB: number;
  netA: number;
  netB: number;
  result: "A" | "B" | "T";
};

export type MatchResult = {
  holes: MatchHoleResult[];
  pointsA: number;
  pointsB: number;
  outcome: "A" | "B" | "T";
};

export function allocateStrokes(diff: number, holes: HoleInfo[]): Record<number, number> {
  const strokes: Record<number, number> = {};
  holes.forEach((hole) => {
    strokes[hole.holeNumber] = 0;
  });

  if (diff <= 0) {
    return strokes;
  }

  const ordered = [...holes].sort((a, b) => a.strokeIndex - b.strokeIndex);
  let remaining = diff;

  while (remaining > 0) {
    for (const hole of ordered) {
      if (remaining <= 0) {
        break;
      }
      strokes[hole.holeNumber] += 1;
      remaining -= 1;
    }
  }

  return strokes;
}

export function computeMatchPlay(
  playerA: { hc9: number; gross: Record<number, number> },
  playerB: { hc9: number; gross: Record<number, number> },
  holes: HoleInfo[]
): MatchResult {
  const diff = playerA.hc9 - playerB.hc9;
  const strokesForA = diff > 0 ? allocateStrokes(diff, holes) : {};
  const strokesForB = diff < 0 ? allocateStrokes(Math.abs(diff), holes) : {};

  let winsA = 0;
  let winsB = 0;

  const holeResults = holes.map((hole) => {
    const grossA = playerA.gross[hole.holeNumber] ?? 0;
    const grossB = playerB.gross[hole.holeNumber] ?? 0;
    const netA = grossA - (strokesForA[hole.holeNumber] ?? 0);
    const netB = grossB - (strokesForB[hole.holeNumber] ?? 0);

    let result: "A" | "B" | "T" = "T";
    if (netA < netB) {
      result = "A";
      winsA += 1;
    } else if (netB < netA) {
      result = "B";
      winsB += 1;
    }

    return {
      holeNumber: hole.holeNumber,
      grossA,
      grossB,
      netA,
      netB,
      result
    };
  });

  let outcome: "A" | "B" | "T" = "T";
  if (winsA > winsB) {
    outcome = "A";
  } else if (winsB > winsA) {
    outcome = "B";
  }

  const pointsA = outcome === "A" ? 2 : outcome === "T" ? 1 : 0;
  const pointsB = outcome === "B" ? 2 : outcome === "T" ? 1 : 0;

  return {
    holes: holeResults,
    pointsA,
    pointsB,
    outcome
  };
}
