import { describe, expect, it } from "vitest";
import { allocateStrokes } from "../src/engine/matchPlay";

describe("match stroke allocation", () => {
  const holes = Array.from({ length: 9 }).map((_, index) => ({
    holeNumber: index + 1,
    strokeIndex: index + 1
  }));

  it("allocates strokes on hardest holes first", () => {
    const strokes = allocateStrokes(5, holes);
    expect(strokes[1]).toBe(1);
    expect(strokes[5]).toBe(1);
    expect(strokes[6]).toBe(0);
  });

  it("allocates second strokes when diff exceeds 9", () => {
    const strokes = allocateStrokes(10, holes);
    expect(strokes[1]).toBe(2);
    expect(strokes[2]).toBe(1);
    expect(strokes[9]).toBe(1);
  });
});
