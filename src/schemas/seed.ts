import { z } from "zod";

const handicapAdjustmentSchema = z.object({
  name: z.string(),
  type: z.enum(["flat", "multiplier"]),
  value: z.number()
});

const tournamentSchema = z.object({
  name: z.string(),
  year: z.number(),
  buyInPerPlayer: z.number(),
  handicap: z.object({
    avgSlope: z.number(),
    factor: z.number(),
    cap18: z.number(),
    adjustments: z.array(handicapAdjustmentSchema),
    par3Multiplier: z.number()
  }),
  points: z.object({
    matchPlay: z.object({
      win: z.number(),
      tie: z.number(),
      loss: z.number()
    }),
    strokePlayFull: z.record(z.string(), z.number()),
    scramble: z.record(z.string(), z.number()),
    strokePlayTop8Fixed: z.object({
      topN: z.number(),
      points: z.number()
    })
  }),
  payouts: z.object({
    overall: z.record(z.string(), z.number()),
    sideContests: z.record(z.string(), z.number()),
    notes: z.array(z.string()).optional()
  })
});

const playerSeedSchema = z.object({
  name: z.string(),
  index: z.number(),
  adjustmentCategory: z.string().nullable(),
  penaltyApplied: z.number(),
  hc9_raw: z.number(),
  hc18_raw: z.number(),
  hc9: z.number(),
  hc18: z.number(),
  hcPar3: z.number(),
  paid: z.number()
});

const courseSeedSchema = z.object({
  name: z.string(),
  type: z.string(),
  tee: z.string().optional(),
  yardage: z.number().optional(),
  slope: z.number().optional(),
  par_total: z.number(),
  holes: z.array(
    z.object({
      n: z.number(),
      par: z.number(),
      si: z.number()
    })
  )
});

const schedulePairingSchema = z.object({
  a: z.string(),
  b: z.string()
});

const daySeedSchema = z.object({
  id: z.string(),
  name: z.string(),
  course: z.string(),
  segments: z.array(z.string()),
  matchRounds: z.array(
    z.object({
      id: z.string(),
      segment: z.string(),
      label: z.string()
    })
  ),
  strokePlayRule: z.string(),
  scramble: z
    .object({
      course: z.string(),
      teams: z.array(
        z.object({
          team: z.number(),
          players: z.array(z.string()),
          total: z.number(),
          rank: z.number()
        })
      )
    })
    .optional()
});

const scoreSeedSchema = z.object({
  day: z.string(),
  segment: z.string(),
  player: z.string(),
  holeNumber: z.number(),
  gross: z.number().nullable().optional()
});

const goldenSchema = z.object({
  pointsByPlayer: z.record(z.any()),
  detailPointsByPlayer: z.record(z.any()),
  resultsByPlayer: z.record(z.any()),
  cashByPlayer: z.record(z.any())
});

export const seedSchema = z.object({
  tournament: tournamentSchema,
  players: z.array(playerSeedSchema),
  courses: z.array(courseSeedSchema),
  sideContestHolesByCourse: z.record(
    z.object({
      longDriveHole: z.number(),
      ctpHole: z.number(),
      longPuttHole: z.number()
    })
  ),
  scheduleByCourse: z.record(z.record(z.string(), z.array(schedulePairingSchema))),
  days: z.array(daySeedSchema),
  scores: z.array(scoreSeedSchema).optional(),
  golden: goldenSchema
});

export type SeedData = z.infer<typeof seedSchema>;
