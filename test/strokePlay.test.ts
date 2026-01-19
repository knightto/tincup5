import { describe, expect, it } from "vitest";
import { applyStrokePlayFull } from "../src/engine/strokePlay";

describe("stroke play tie averaging", () => {
  it("averages points across tied places", () => {
    const results = [
      { id: "a", gross18: 70, net: 70, rank: 1, points: 0 },
      { id: "b", gross18: 70, net: 70, rank: 1, points: 0 },
      { id: "c", gross18: 72, net: 72, rank: 3, points: 0 },
      { id: "d", gross18: 74, net: 74, rank: 4, points: 0 }
    ];

    const pointsTable = [10, 8, 6, 4];
    const updated = applyStrokePlayFull(results, pointsTable);

    const byId: Record<string, number> = {};
    updated.forEach((row) => {
      byId[row.id] = row.points;
    });

    expect(byId["a"]).toBe(9);
    expect(byId["b"]).toBe(9);
    expect(byId["c"]).toBe(6);
    expect(byId["d"]).toBe(4);
  });
});
