-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handicapFactor" DOUBLE PRECISION NOT NULL,
    "handicapCap18" DOUBLE PRECISION NOT NULL,
    "par3Multiplier" DOUBLE PRECISION NOT NULL,
    "handicapCategories" TEXT NOT NULL,
    "pointSchemes" TEXT NOT NULL,
    "payouts" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "index" DOUBLE PRECISION NOT NULL,
    "categoryKey" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "tee" TEXT,
    "yardage" INTEGER,
    "slope" INTEGER,
    "rating" DOUBLE PRECISION,
    "parTotal" INTEGER,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hole" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "holeNumber" INTEGER NOT NULL,
    "par" INTEGER NOT NULL,
    "strokeIndex" INTEGER NOT NULL,
    "segment" TEXT NOT NULL,

    CONSTRAINT "Hole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Day" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isMatchPlay" BOOLEAN NOT NULL DEFAULT false,
    "strokePlayRule" TEXT NOT NULL DEFAULT 'none',
    "isScramble" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DaySegmentScore" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "segmentType" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "holeNumber" INTEGER NOT NULL,
    "gross" INTEGER NOT NULL,

    CONSTRAINT "DaySegmentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchRound" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "segmentType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "MatchRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPairing" (
    "id" TEXT NOT NULL,
    "matchRoundId" TEXT NOT NULL,
    "playerAId" TEXT NOT NULL,
    "playerBId" TEXT NOT NULL,

    CONSTRAINT "MatchPairing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SideContestDefinition" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SideContestDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DaySideContestConfig" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "holeNumber" INTEGER NOT NULL,

    CONSTRAINT "DaySideContestConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SideContestResult" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "measurement" DOUBLE PRECISION,
    "isManualWinnerOverride" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SideContestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretSnowmanDraw" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "drawnAt" TIMESTAMP(3) NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SecretSnowmanDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretSnowmanDrawHistory" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "previousPlayerId" TEXT NOT NULL,
    "newPlayerId" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "drawnAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretSnowmanDrawHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrambleTeam" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ScrambleTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrambleTeamPlayer" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "ScrambleTeamPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrambleScore" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "perHole" TEXT,

    CONSTRAINT "ScrambleScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hole_courseId_holeNumber_segment_key" ON "Hole"("courseId", "holeNumber", "segment");

-- CreateIndex
CREATE UNIQUE INDEX "DaySegmentScore_dayId_segmentType_playerId_holeNumber_key" ON "DaySegmentScore"("dayId", "segmentType", "playerId", "holeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SideContestDefinition_tournamentId_type_key" ON "SideContestDefinition"("tournamentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "DaySideContestConfig_dayId_type_key" ON "DaySideContestConfig"("dayId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SecretSnowmanDraw_dayId_key" ON "SecretSnowmanDraw"("dayId");

-- CreateIndex
CREATE UNIQUE INDEX "ScrambleTeamPlayer_teamId_playerId_key" ON "ScrambleTeamPlayer"("teamId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "ScrambleScore_dayId_teamId_key" ON "ScrambleScore"("dayId", "teamId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hole" ADD CONSTRAINT "Hole_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DaySegmentScore" ADD CONSTRAINT "DaySegmentScore_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DaySegmentScore" ADD CONSTRAINT "DaySegmentScore_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRound" ADD CONSTRAINT "MatchRound_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPairing" ADD CONSTRAINT "MatchPairing_matchRoundId_fkey" FOREIGN KEY ("matchRoundId") REFERENCES "MatchRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPairing" ADD CONSTRAINT "MatchPairing_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPairing" ADD CONSTRAINT "MatchPairing_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SideContestDefinition" ADD CONSTRAINT "SideContestDefinition_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DaySideContestConfig" ADD CONSTRAINT "DaySideContestConfig_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SideContestResult" ADD CONSTRAINT "SideContestResult_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SideContestResult" ADD CONSTRAINT "SideContestResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretSnowmanDraw" ADD CONSTRAINT "SecretSnowmanDraw_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretSnowmanDraw" ADD CONSTRAINT "SecretSnowmanDraw_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretSnowmanDrawHistory" ADD CONSTRAINT "SecretSnowmanDrawHistory_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrambleTeam" ADD CONSTRAINT "ScrambleTeam_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrambleTeamPlayer" ADD CONSTRAINT "ScrambleTeamPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ScrambleTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrambleTeamPlayer" ADD CONSTRAINT "ScrambleTeamPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrambleScore" ADD CONSTRAINT "ScrambleScore_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrambleScore" ADD CONSTRAINT "ScrambleScore_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ScrambleTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
