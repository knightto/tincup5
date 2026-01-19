export function excelRound(value: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  const scaled = value * factor;
  if (scaled >= 0) {
    return Math.floor(scaled + 0.5) / factor;
  }
  return Math.ceil(scaled - 0.5) / factor;
}
