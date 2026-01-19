-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "handicapFactor" REAL NOT NULL,
    "handicapCap18" REAL NOT NULL,
    "par3Multiplier" REAL NOT NULL,
    "handicapCategories" TEXT NOT NULL,
    "pointSchemes" TEXT NOT NULL,
    "payouts" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "index" REAL NOT NULL,
    "categoryKey" TEXT NOT NULL,
    CONSTRAINT "Player_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "tee" TEXT,
    "yardage" INTEGER,
    "slope" INTEGER,
    "rating" REAL,
    "parTotal" INTEGER,
    CONSTRAINT "Course_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "holeNumber" INTEGER NOT NULL,
    "par" INTEGER NOT NULL,
    "strokeIndex" INTEGER NOT NULL,
    "segment" TEXT NOT NULL,
    CONSTRAINT "Hole_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Day" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isMatchPlay" BOOLEAN NOT NULL DEFAULT false,
    "strokePlayRule" TEXT NOT NULL DEFAULT 'none',
    "isScramble" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" DATETIME,
    CONSTRAINT "Day_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Day_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DaySegmentScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "segmentType" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "holeNumber" INTEGER NOT NULL,
    "gross" INTEGER NOT NULL,
    CONSTRAINT "DaySegmentScore_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DaySegmentScore_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "segmentType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "MatchRound_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchPairing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchRoundId" TEXT NOT NULL,
    "playerAId" TEXT NOT NULL,
    "playerBId" TEXT NOT NULL,
    CONSTRAINT "MatchPairing_matchRoundId_fkey" FOREIGN KEY ("matchRoundId") REFERENCES "MatchRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchPairing_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchPairing_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SideContestDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    CONSTRAINT "SideContestDefinition_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DaySideContestConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "holeNumber" INTEGER NOT NULL,
    CONSTRAINT "DaySideContestConfig_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SideContestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "measurement" REAL,
    "isManualWinnerOverride" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SideContestResult_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SideContestResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecretSnowmanDraw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "drawnAt" DATETIME NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SecretSnowmanDraw_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SecretSnowmanDraw_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecretSnowmanDrawHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "previousPlayerId" TEXT NOT NULL,
    "newPlayerId" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "drawnAt" DATETIME NOT NULL,
    CONSTRAINT "SecretSnowmanDrawHistory_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScrambleTeam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "ScrambleTeam_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScrambleTeamPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    CONSTRAINT "ScrambleTeamPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ScrambleTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScrambleTeamPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScrambleScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "perHole" TEXT,
    CONSTRAINT "ScrambleScore_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScrambleScore_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ScrambleTeam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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

