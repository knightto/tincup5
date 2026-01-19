import { z } from "zod";

const playerSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    index: z.number(),
    categoryKey: z.string(),
    tournamentId: z.string().optional()
  })
  .passthrough();

const holeSchema = z
  .object({
    id: z.string(),
    holeNumber: z.number(),
    par: z.number(),
    strokeIndex: z.number(),
    segment: z.enum(["front", "back"]),
    courseId: z.string().optional()
  })
  .passthrough();

const courseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    tournamentId: z.string().optional(),
    holes: z.array(holeSchema)
  })
  .passthrough();

const matchPairingSchema = z
  .object({
    id: z.string(),
    matchRoundId: z.string().optional(),
    playerAId: z.string(),
    playerBId: z.string()
  })
  .passthrough();

const matchRoundSchema = z
  .object({
    id: z.string(),
    dayId: z.string().optional(),
    segmentType: z.enum(["front", "back"]),
    label: z.string(),
    order: z.number(),
    pairings: z.array(matchPairingSchema)
  })
  .passthrough();

const sideContestConfigSchema = z
  .object({
    id: z.string(),
    dayId: z.string().optional(),
    type: z.string(),
    holeNumber: z.number()
  })
  .passthrough();

const sideContestResultSchema = z
  .object({
    id: z.string(),
    dayId: z.string().optional(),
    type: z.string(),
    playerId: z.string(),
    measurement: z.number().nullable(),
    isManualWinnerOverride: z.boolean()
  })
  .passthrough();

const secretSnowmanSchema = z
  .object({
    id: z.string(),
    dayId: z.string().optional(),
    playerId: z.string(),
    seed: z.string(),
    drawnAt: z.string(),
    isLocked: z.boolean()
  })
  .passthrough();

const segmentScoreSchema = z
  .object({
    id: z.string(),
    dayId: z.string().optional(),
    segmentType: z.enum(["front", "back"]),
    playerId: z.string(),
    holeNumber: z.number(),
    gross: z.number()
  })
  .passthrough();

const scrambleTeamPlayerSchema = z
  .object({
    id: z.string(),
    teamId: z.string().optional(),
    playerId: z.string()
  })
  .passthrough();

const scrambleTeamSchema = z
  .object({
    id: z.string(),
    dayId: z.string().optional(),
    name: z.string(),
    players: z.array(scrambleTeamPlayerSchema)
  })
  .passthrough();

const scrambleScoreSchema = z
  .object({
    id: z.string(),
    dayId: z.string().optional(),
    teamId: z.string(),
    total: z.number(),
    perHole: z.any().optional().nullable()
  })
  .passthrough();

const daySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    courseId: z.string(),
    tournamentId: z.string().optional(),
    isMatchPlay: z.boolean(),
    strokePlayRule: z.enum(["none", "strokePlayTop8Fixed", "strokePlayFull"]),
    isScramble: z.boolean(),
    lockedAt: z.string().nullable().optional(),
    matchRounds: z.array(matchRoundSchema),
    sideContestConfigs: z.array(sideContestConfigSchema),
    sideContestResults: z.array(sideContestResultSchema),
    secretSnowmanDraw: secretSnowmanSchema.nullable().optional(),
    segmentScores: z.array(segmentScoreSchema),
    scrambleTeams: z.array(scrambleTeamSchema),
    scrambleScores: z.array(scrambleScoreSchema)
  })
  .passthrough();

const sideContestDefinitionSchema = z
  .object({
    id: z.string(),
    tournamentId: z.string().optional(),
    type: z.string(),
    amount: z.number()
  })
  .passthrough();

export const tournamentExportSchema = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    handicapFactor: z.number(),
    handicapCap18: z.number(),
    par3Multiplier: z.number(),
    handicapCategories: z.any(),
    pointSchemes: z.any(),
    payouts: z.any(),
    createdAt: z.string().optional(),
    players: z.array(playerSchema),
    courses: z.array(courseSchema),
    days: z.array(daySchema),
    sideContestDefinitions: z.array(sideContestDefinitionSchema)
  })
  .passthrough();
