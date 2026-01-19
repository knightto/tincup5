import { describe, expect, it } from "vitest";
import { excelRound } from "../src/engine/round";

describe("excelRound", () => {
  it("rounds half away from zero", () => {
    expect(excelRound(1.5, 0)).toBe(2);
    expect(excelRound(1.4, 0)).toBe(1);
    expect(excelRound(-1.5, 0)).toBe(-2);
    expect(excelRound(-1.4, 0)).toBe(-1);
  });
});
