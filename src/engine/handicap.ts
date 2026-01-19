import { excelRound } from "./round";

export type HandicapCategory = {
  key: string;
  type: "flat" | "multiplier";
  value: number;
};

export type HandicapConfig = {
  factor: number;
  cap18: number;
  par3Multiplier: number;
  categories: HandicapCategory[];
};

export type HandicapResult = {
  hc18Raw: number;
  hc18: number;
  hc9Raw: number;
  hc9: number;
  hcPar3: number;
};

export function computeHandicap(
  index: number,
  categoryKey: string,
  config: HandicapConfig
): HandicapResult {
  const category = config.categories.find((c) => c.key === categoryKey);
  if (!category) {
    throw new Error(`Unknown handicap category: ${categoryKey}`);
  }

  const base = index * (1 + config.factor);
  const adjustment =
    category.type === "flat"
      ? category.value
      : base * category.value;

  let hc18Raw = base + adjustment;
  if (hc18Raw > config.cap18) {
    hc18Raw = config.cap18;
  }

  const hc18 = excelRound(hc18Raw, 0);
  const hc9Raw = hc18Raw / 2;
  const hc9 = excelRound(hc9Raw, 0);
  const hcPar3 = excelRound(hc18Raw * config.par3Multiplier, 0);

  return { hc18Raw, hc18, hc9Raw, hc9, hcPar3 };
}
