import { Router } from "express";
import { prisma } from "../db/client";
import { computeHandicap, computeMatchPlay, computeStrokeResults, applyStrokePlayFull, applyStrokePlayTop8Fixed, computeScrambleResults, computeFinishPayout, computeTotalCash, excelRound } from "../engine";
import { tournamentExportSchema } from "../schemas/import";
import { parseJsonField } from "../utils/json";

export const tournamentDetailRouter = Router();

tournamentDetailRouter.get("/t/:tournamentId/setup", async (req, res) => {
  const tournamentId = req.params.tournamentId;
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true, courses: { include: { holes: true } }, days: { include: { course: true } } }
  });
  if (!tournament) return res.status(404).send("Not found");

  const playerCount = tournament.players.length;
  const rosterOk = playerCount % 4 === 0;
  const categories = parseJsonField<any[]>(tournament.handicapCategories, [])
    .map((c) => c.key)
    .filter((value) => value.length > 0);
  const fallbackCategories = ["None", "Lifetime", "Rookie", "Champ", "Double Deuce", "2X Champ", "3X Champ"];
  const resolvedCategories = categories.length ? categories : fallbackCategories;

  res.render("setup", { tournament, playerCount, rosterOk, categories: resolvedCategories });
});

tournamentDetailRouter.post("/t/:tournamentId/players", async (req, res) => {
  const tournamentId = req.params.tournamentId;
  const name = String(req.body.name ?? "").trim();
  const index = Number(req.body.index ?? 0);
  const categoryKey = String(req.body.categoryKey ?? "").trim();

  if (!name || !categoryKey || Number.isNaN(index)) {
    return res.status(400).send("Invalid player input");
  }

  await prisma.player.create({
    data: { tournamentId, name, index, categoryKey }
  });

  res.redirect(`/t/${tournamentId}/setup`);
});

tournamentDetailRouter.post("/t/:tournamentId/players/:playerId", async (req, res) => {
  const { tournamentId, playerId } = req.params;
  const name = String(req.body.name ?? "").trim();
  const index = Number(req.body.index ?? 0);
  const categoryKey = String(req.body.categoryKey ?? "").trim();

  if (!name || !categoryKey || Number.isNaN(index)) {
    return res.status(400).send("Invalid player input");
  }

  await prisma.player.update({
    where: { id: playerId },
    data: { name, index, categoryKey }
  });

  res.redirect(`/t/${tournamentId}/setup`);
});


tournamentDetailRouter.post("/t/:tournamentId/courses", async (req, res) => {
  const tournamentId = req.params.tournamentId;
  const name = String(req.body.name ?? "").trim();
  if (!name) return res.status(400).send("Course name required");

  await prisma.course.create({
    data: {
      tournamentId,
      name,
      type: String(req.body.type ?? "").trim() || null,
      tee: String(req.body.tee ?? "").trim() || null,
      yardage: req.body.yardage ? Number(req.body.yardage) : null,
      slope: req.body.slope ? Number(req.body.slope) : null,
      rating: req.body.rating ? Number(req.body.rating) : null,
      parTotal: req.body.parTotal ? Number(req.body.parTotal) : null
    }
  });

  res.redirect(`/t/${tournamentId}/setup`);
});

tournamentDetailRouter.post("/t/:tournamentId/courses/:courseId", async (req, res) => {
  const { tournamentId, courseId } = req.params;
  const name = String(req.body.name ?? "").trim();
  if (!name) return res.status(400).send("Course name required");

  await prisma.course.update({
    where: { id: courseId },
    data: {
      name,
      type: String(req.body.type ?? "").trim() || null,
      tee: String(req.body.tee ?? "").trim() || null,
      yardage: req.body.yardage ? Number(req.body.yardage) : null,
      slope: req.body.slope ? Number(req.body.slope) : null,
      rating: req.body.rating ? Number(req.body.rating) : null,
      parTotal: req.body.parTotal ? Number(req.body.parTotal) : null
    }
  });

  res.redirect(`/t/${tournamentId}/setup`);
});

tournamentDetailRouter.post("/t/:tournamentId/courses/:courseId/holes", async (req, res) => {
  const { tournamentId, courseId } = req.params;
  const holeNumber = Number(req.body.holeNumber ?? 0);
  const par = Number(req.body.par ?? 0);
  const strokeIndex = Number(req.body.strokeIndex ?? 0);
  const segment = String(req.body.segment ?? "front");

  await prisma.hole.upsert({
    where: {
      courseId_holeNumber_segment: { courseId, holeNumber, segment: segment as any }
    },
    update: { par, strokeIndex },
    create: { courseId, holeNumber, par, strokeIndex, segment: segment as any }
  });

  res.redirect(`/t/${tournamentId}/setup`);
});

tournamentDetailRouter.post("/t/:tournamentId/days", async (req, res) => {
  const tournamentId = req.params.tournamentId;
  const dayNumber = String(req.body.dayNumber ?? "").trim();
  const roundSuffix = String(req.body.roundSuffix ?? "").trim();
  const nameRaw = String(req.body.name ?? "").trim();
  const courseId = String(req.body.courseId ?? "");
  const isMatchPlay = req.body.isMatchPlay === "on";
  const isScramble = req.body.isScramble === "on";
  const strokePlayRule = String(req.body.strokePlayRule ?? "none");

  const name = nameRaw || (dayNumber ? `Day ${dayNumber}${roundSuffix ? roundSuffix : ""}` : "");
  if (!name || !courseId) return res.status(400).send("Day name and course required");

  const playerCount = await prisma.player.count({ where: { tournamentId } });
  if (playerCount % 4 !== 0) {
    return res.status(400).send("Roster must be a multiple of 4 before creating days.");
  }

  await prisma.day.create({
    data: {
      tournamentId,
      name,
      courseId,
      isMatchPlay,
      isScramble,
      strokePlayRule: strokePlayRule as any
    }
  });

  res.redirect(`/t/${tournamentId}/setup`);
});

tournamentDetailRouter.post("/t/:tournamentId/days/:dayId/side-contests", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const type = String(req.body.type ?? "");
  const holeNumber = Number(req.body.holeNumber ?? 0);
  if (!type || Number.isNaN(holeNumber)) {
    return res.status(400).send("Invalid side contest data");
  }

  await prisma.daySideContestConfig.upsert({
    where: { dayId_type: { dayId, type: type as any } },
    update: { holeNumber },
    create: { dayId, type: type as any, holeNumber }
  });

  res.redirect(`/t/${tournamentId}/setup`);
});

tournamentDetailRouter.post("/t/:tournamentId/days/:dayId/auto-pairings", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const players = await prisma.player.findMany({ where: { tournamentId } });
  const rosterOk = players.length % 4 === 0;
  if (!rosterOk) return res.status(400).send("Roster must be multiple of 4");

  await prisma.matchPairing.deleteMany({ where: { matchRound: { dayId } } });
  await prisma.matchRound.deleteMany({ where: { dayId } });

  const roundDefs = [
    { label: "Front 9", segmentType: "front", order: 1 },
    { label: "Back 9 A", segmentType: "back", order: 2 },
    { label: "Back 9 B", segmentType: "back", order: 3 }
  ];

  const rounds = [] as { id: string; segmentType: string }[];
  for (const def of roundDefs) {
    const round = await prisma.matchRound.create({
      data: {
        dayId,
        label: def.label,
        segmentType: def.segmentType as any,
        order: def.order
      }
    });
    rounds.push(round);
  }

  const groups = [] as typeof players[];
  for (let i = 0; i < players.length; i += 4) {
    groups.push(players.slice(i, i + 4));
  }

  const roundRobin = [
    [0, 1, 2, 3],
    [0, 2, 1, 3],
    [0, 3, 1, 2]
  ];

  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex += 1) {
    const round = rounds[roundIndex];
    for (const group of groups) {
      const map = roundRobin[roundIndex];
      const [a1, b1, a2, b2] = map;
      await prisma.matchPairing.createMany({
        data: [
          { matchRoundId: round.id, playerAId: group[a1].id, playerBId: group[b1].id },
          { matchRoundId: round.id, playerAId: group[a2].id, playerBId: group[b2].id }
        ]
      });
    }
  }

  res.redirect(`/t/${tournamentId}/setup`);
});

tournamentDetailRouter.get("/t/:tournamentId/dashboard", async (req, res) => {
  const tournamentId = req.params.tournamentId;
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true, days: true, sideContestDefinitions: true }
  });
  if (!tournament) return res.status(404).send("Not found");

  const handicapCategories = parseJsonField<any[]>(tournament.handicapCategories, []);
  const pointSchemes = parseJsonField<any>(tournament.pointSchemes, {});
  const payouts = parseJsonField<any>(tournament.payouts, {});

  const config = {
    factor: tournament.handicapFactor,
    cap18: tournament.handicapCap18,
    par3Multiplier: tournament.par3Multiplier,
    categories: handicapCategories
  };

  const pointsByPlayer: Record<string, number> = {};
  tournament.players.forEach((player) => {
    pointsByPlayer[player.id] = 0;
  });

  const days = await prisma.day.findMany({
    where: { tournamentId },
    include: {
      course: { include: { holes: true } },
      matchRounds: { include: { pairings: true } },
      segmentScores: true,
      scrambleTeams: { include: { players: true } },
      scrambleScores: true
    }
  });

  for (const day of days) {
    const holesFront = day.course.holes.filter((h) => h.segment === "front");
    const holesBack = day.course.holes.filter((h) => h.segment === "back");
    const scoreMap: Record<string, Record<string, Record<number, number>>> = {};
    day.segmentScores.forEach((score) => {
      scoreMap[score.playerId] = scoreMap[score.playerId] ?? {};
      const segmentKey = score.segmentType;
      scoreMap[score.playerId][segmentKey] = scoreMap[score.playerId][segmentKey] ?? {};
      scoreMap[score.playerId][segmentKey][score.holeNumber] = score.gross;
    });

    if (day.isMatchPlay) {
      for (const round of day.matchRounds) {
        const holes = round.segmentType === "front" ? holesFront : holesBack;
        for (const pairing of round.pairings) {
          const playerA = tournament.players.find((p) => p.id === pairing.playerAId);
          const playerB = tournament.players.find((p) => p.id === pairing.playerBId);
          if (!playerA || !playerB) continue;

          const hcA = computeHandicap(playerA.index, playerA.categoryKey, config).hc9;
          const hcB = computeHandicap(playerB.index, playerB.categoryKey, config).hc9;

          const grossA = scoreMap[playerA.id]?.[round.segmentType] ?? {};
          const grossB = scoreMap[playerB.id]?.[round.segmentType] ?? {};

          const result = computeMatchPlay(
            { hc9: hcA, gross: grossA },
            { hc9: hcB, gross: grossB },
            holes.map((h) => ({ holeNumber: h.holeNumber, strokeIndex: h.strokeIndex }))
          );

          pointsByPlayer[playerA.id] += result.pointsA;
          pointsByPlayer[playerB.id] += result.pointsB;
        }
      }
    }

    if (day.strokePlayRule !== "none") {
      const strokePlayers = tournament.players.map((player) => {
        const frontScores = scoreMap[player.id]?.front ?? {};
        const backScores = scoreMap[player.id]?.back ?? {};
        const grossFront = Object.values(frontScores).reduce((sum, value) => sum + value, 0);
        const grossBack = Object.values(backScores).reduce((sum, value) => sum + value, 0);
        const hc18 = computeHandicap(player.index, player.categoryKey, config).hc18;
        return { id: player.id, grossFront, grossBack, hc18 };
      });

      let results = computeStrokeResults(strokePlayers);
      if (day.strokePlayRule === "strokePlayTop8Fixed") {
        results = applyStrokePlayTop8Fixed(results);
      } else if (day.strokePlayRule === "strokePlayFull") {
      const pointsTable = pointSchemes?.strokePlayFullPoints ?? [];
      results = applyStrokePlayFull(results, pointsTable);
      }

      results.forEach((result) => {
        pointsByPlayer[result.id] += result.points;
      });
    }

    if (day.isScramble) {
      const teamTotals = day.scrambleScores.map((score) => ({
        id: score.teamId,
        total: score.total
      }));
      const teamResults = computeScrambleResults(teamTotals);
      teamResults.forEach((teamResult) => {
        const team = day.scrambleTeams.find((t) => t.id === teamResult.id);
        team?.players.forEach((player) => {
          pointsByPlayer[player.playerId] += teamResult.points;
        });
      });
    }
  }

  const leaderboard = tournament.players
    .map((player) => ({
      player,
      points: excelRound(pointsByPlayer[player.id] ?? 0, 0)
    }))
    .sort((a, b) => b.points - a.points);

  res.render("dashboard", { tournament, leaderboard });
});

tournamentDetailRouter.get("/t/:tournamentId/standings", async (req, res) => {
  const tournamentId = req.params.tournamentId;
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true, days: true }
  });
  if (!tournament) return res.status(404).send("Not found");
  const sideContestResults = await prisma.sideContestResult.findMany({
    where: { day: { tournamentId } }
  });

  const handicapCategories = parseJsonField<any[]>(tournament.handicapCategories, []);
  const pointSchemes = parseJsonField<any>(tournament.pointSchemes, {});
  const payouts = parseJsonField<any>(tournament.payouts, {});
  const finishPayouts = payouts.finish ?? { winner: 0, second: 0, third: 0 };
  const sideContestPayouts = payouts.sideContests ?? {};

  const config = {
    factor: tournament.handicapFactor,
    cap18: tournament.handicapCap18,
    par3Multiplier: tournament.par3Multiplier,
    categories: handicapCategories
  };

  const pointsByPlayer: Record<string, number> = {};
  const pointsByDay: Record<string, Record<string, number>> = {};
  tournament.players.forEach((player) => {
    pointsByPlayer[player.id] = 0;
  });

  const days = await prisma.day.findMany({
    where: { tournamentId },
    include: {
      course: { include: { holes: true } },
      matchRounds: { include: { pairings: true } },
      segmentScores: true,
      scrambleTeams: { include: { players: true } },
      scrambleScores: true
    }
  });

  for (const day of days) {
    const holesFront = day.course.holes.filter((h) => h.segment === "front");
    const holesBack = day.course.holes.filter((h) => h.segment === "back");
    const scoreMap: Record<string, Record<string, Record<number, number>>> = {};
    day.segmentScores.forEach((score) => {
      scoreMap[score.playerId] = scoreMap[score.playerId] ?? {};
      const segmentKey = score.segmentType;
      scoreMap[score.playerId][segmentKey] = scoreMap[score.playerId][segmentKey] ?? {};
      scoreMap[score.playerId][segmentKey][score.holeNumber] = score.gross;
    });

    if (day.isMatchPlay) {
      for (const round of day.matchRounds) {
        const holes = round.segmentType === "front" ? holesFront : holesBack;
        for (const pairing of round.pairings) {
          const playerA = tournament.players.find((p) => p.id === pairing.playerAId);
          const playerB = tournament.players.find((p) => p.id === pairing.playerBId);
          if (!playerA || !playerB) continue;

          const hcA = computeHandicap(playerA.index, playerA.categoryKey, config).hc9;
          const hcB = computeHandicap(playerB.index, playerB.categoryKey, config).hc9;

          const grossA = scoreMap[playerA.id]?.[round.segmentType] ?? {};
          const grossB = scoreMap[playerB.id]?.[round.segmentType] ?? {};

          const result = computeMatchPlay(
            { hc9: hcA, gross: grossA },
            { hc9: hcB, gross: grossB },
            holes.map((h) => ({ holeNumber: h.holeNumber, strokeIndex: h.strokeIndex }))
          );

          pointsByPlayer[playerA.id] += result.pointsA;
          pointsByPlayer[playerB.id] += result.pointsB;
          pointsByDay[day.name] = pointsByDay[day.name] ?? {};
          pointsByDay[day.name][playerA.id] = (pointsByDay[day.name][playerA.id] ?? 0) + result.pointsA;
          pointsByDay[day.name][playerB.id] = (pointsByDay[day.name][playerB.id] ?? 0) + result.pointsB;
        }
      }
    }

    if (day.strokePlayRule !== "none") {
      const strokePlayers = tournament.players.map((player) => {
        const frontScores = scoreMap[player.id]?.front ?? {};
        const backScores = scoreMap[player.id]?.back ?? {};
        const grossFront = Object.values(frontScores).reduce((sum, value) => sum + value, 0);
        const grossBack = Object.values(backScores).reduce((sum, value) => sum + value, 0);
        const hc18 = computeHandicap(player.index, player.categoryKey, config).hc18;
        return { id: player.id, grossFront, grossBack, hc18 };
      });

      let results = computeStrokeResults(strokePlayers);
      if (day.strokePlayRule === "strokePlayTop8Fixed") {
        results = applyStrokePlayTop8Fixed(results);
      } else if (day.strokePlayRule === "strokePlayFull") {
        const pointsTable = pointSchemes?.strokePlayFullPoints ?? [];
        results = applyStrokePlayFull(results, pointsTable);
      }

      results.forEach((result) => {
        pointsByPlayer[result.id] += result.points;
        pointsByDay[day.name] = pointsByDay[day.name] ?? {};
        pointsByDay[day.name][result.id] = (pointsByDay[day.name][result.id] ?? 0) + result.points;
      });
    }

    if (day.isScramble) {
      const teamTotals = day.scrambleScores.map((score) => ({
        id: score.teamId,
        total: score.total
      }));
      const teamResults = computeScrambleResults(teamTotals);
      teamResults.forEach((teamResult) => {
        const team = day.scrambleTeams.find((t) => t.id === teamResult.id);
        team?.players.forEach((player) => {
          pointsByPlayer[player.playerId] += teamResult.points;
          pointsByDay[day.name] = pointsByDay[day.name] ?? {};
          pointsByDay[day.name][player.playerId] =
            (pointsByDay[day.name][player.playerId] ?? 0) + teamResult.points;
        });
      });
    }
  }

  const sideContestWins: Record<string, Record<string, number>> = {};
  sideContestResults.forEach((result) => {
    sideContestWins[result.playerId] = sideContestWins[result.playerId] ?? {};
    sideContestWins[result.playerId][result.type] = (sideContestWins[result.playerId][result.type] ?? 0) + 1;
  });

  const ranked = tournament.players
    .map((player) => {
      const roundedDayPoints = Object.fromEntries(
        tournament.days.map((day) => [
          day.name,
          excelRound(pointsByDay[day.name]?.[player.id] ?? 0, 0)
        ])
      );
      const roundedTotal = Object.values(roundedDayPoints).reduce((sum, value) => sum + value, 0);
      return { player, points: roundedTotal, roundedDayPoints };
    })
    .sort((a, b) => b.points - a.points);

  let currentRank = 1;
  ranked.forEach((row, index) => {
    if (index > 0 && row.points !== ranked[index - 1].points) {
      currentRank = index + 1;
    }
    (row as any).rank = currentRank;
  });

  const rows = ranked.map((row: any) => {
    const finish = computeFinishPayout(row.rank, finishPayouts);
    const wins = sideContestWins[row.player.id] ?? {};
    const totalCash = computeTotalCash(finish, wins, sideContestPayouts);
    return {
      player: row.player,
      rank: row.rank,
      totalPoints: row.points,
      dayPoints: row.roundedDayPoints,
      totalCash
    };
  });

  res.render("standings", {
    tournament,
    days: tournament.days,
    rows
  });
});

tournamentDetailRouter.get("/t/:tournamentId/day/:dayId/scores", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true }
  });
  if (!tournament) return res.status(404).send("Not found");

  const day = await prisma.day.findUnique({
    where: { id: dayId },
    include: {
      course: { include: { holes: true } },
      matchRounds: { include: { pairings: true } },
      sideContestConfigs: true,
      sideContestResults: true,
      secretSnowmanDraw: true,
      segmentScores: true
    }
  });
  if (!day) return res.status(404).send("Not found");

  const holesFront = day.course.holes.filter((h) => h.segment === "front");
  const holesBack = day.course.holes.filter((h) => h.segment === "back");

  const scoreMap: Record<string, Record<string, Record<number, number>>> = {};
  day.segmentScores.forEach((score) => {
    scoreMap[score.playerId] = scoreMap[score.playerId] ?? {};
    const segmentKey = score.segmentType;
    scoreMap[score.playerId][segmentKey] = scoreMap[score.playerId][segmentKey] ?? {};
    scoreMap[score.playerId][segmentKey][score.holeNumber] = score.gross;
  });

  const handicapConfig = {
    factor: tournament.handicapFactor,
    cap18: tournament.handicapCap18,
    par3Multiplier: tournament.par3Multiplier,
    categories: parseJsonField<any[]>(tournament.handicapCategories, [])
  };

  const matchResults = day.matchRounds.map((round) => {
    const holes = round.segmentType === "front" ? holesFront : holesBack;
    return {
      round,
      results: round.pairings
        .map((pairing) => {
        const playerA = tournament.players.find((p) => p.id === pairing.playerAId);
        const playerB = tournament.players.find((p) => p.id === pairing.playerBId);
        if (!playerA || !playerB) return null;
        const hcA = computeHandicap(playerA.index, playerA.categoryKey, handicapConfig).hc9;
        const hcB = computeHandicap(playerB.index, playerB.categoryKey, handicapConfig).hc9;
        const grossA = scoreMap[playerA.id]?.[round.segmentType] ?? {};
        const grossB = scoreMap[playerB.id]?.[round.segmentType] ?? {};
        const result = computeMatchPlay(
          { hc9: hcA, gross: grossA },
          { hc9: hcB, gross: grossB },
          holes.map((h) => ({ holeNumber: h.holeNumber, strokeIndex: h.strokeIndex }))
        );
        return { playerA, playerB, result };
      })
        .filter(
          (item): item is { playerA: typeof tournament.players[number]; playerB: typeof tournament.players[number]; result: ReturnType<typeof computeMatchPlay> } =>
            item !== null
        )
    };
  });

  let strokeResults: ReturnType<typeof computeStrokeResults> = [];
  if (day.strokePlayRule !== "none") {
    const strokePlayers = tournament.players.map((player) => {
      const frontScores = scoreMap[player.id]?.front ?? {};
      const backScores = scoreMap[player.id]?.back ?? {};
      const grossFront = Object.values(frontScores).reduce((sum, value) => sum + value, 0);
      const grossBack = Object.values(backScores).reduce((sum, value) => sum + value, 0);
      const hc18 = computeHandicap(player.index, player.categoryKey, handicapConfig).hc18;
      return { id: player.id, grossFront, grossBack, hc18 };
    });
    strokeResults = computeStrokeResults(strokePlayers);
    if (day.strokePlayRule === "strokePlayTop8Fixed") {
      strokeResults = applyStrokePlayTop8Fixed(strokeResults);
    } else if (day.strokePlayRule === "strokePlayFull") {
      const pointsTable = parseJsonField<any>(tournament.pointSchemes, {})?.strokePlayFullPoints ?? [];
      strokeResults = applyStrokePlayFull(strokeResults, pointsTable);
    }
  }

  res.render("day-scores", {
    tournament,
    day,
    holesFront,
    holesBack,
    players: tournament.players,
    scoreMap,
    matchResults,
    strokeResults
  });
});

tournamentDetailRouter.post("/t/:tournamentId/day/:dayId/scores", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const day = await prisma.day.findUnique({
    where: { id: dayId },
    include: { course: { include: { holes: true } } }
  });
  if (!day) return res.status(404).send("Not found");
  if (day.lockedAt) return res.status(400).send("Day is locked.");

  const players = await prisma.player.findMany({ where: { tournamentId } });
  const holes = day.course.holes;

  for (const player of players) {
    for (const hole of holes) {
      const field = `${hole.segment}-${player.id}-${hole.holeNumber}`;
      const raw = req.body[field];
      if (raw === undefined || raw === "") continue;
      const gross = Number(raw);
      if (Number.isNaN(gross)) continue;

      await prisma.daySegmentScore.upsert({
        where: {
          dayId_segmentType_playerId_holeNumber: {
            dayId,
            segmentType: hole.segment,
            playerId: player.id,
            holeNumber: hole.holeNumber
          }
        },
        update: { gross },
        create: {
          dayId,
          segmentType: hole.segment,
          playerId: player.id,
          holeNumber: hole.holeNumber,
          gross
        }
      });
    }
  }

  res.redirect(`/t/${tournamentId}/day/${dayId}/scores`);
});

tournamentDetailRouter.post("/t/:tournamentId/day/:dayId/pairings", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const pairingId = String(req.body.pairingId ?? "");
  const playerAId = String(req.body.playerAId ?? "");
  const playerBId = String(req.body.playerBId ?? "");
  if (!pairingId || !playerAId || !playerBId) {
    return res.status(400).send("Invalid pairing");
  }

  const day = await prisma.day.findUnique({ where: { id: dayId } });
  if (!day) return res.status(404).send("Not found");
  if (day.lockedAt) return res.status(400).send("Day is locked.");

  await prisma.matchPairing.update({
    where: { id: pairingId },
    data: { playerAId, playerBId }
  });

  res.redirect(`/t/${tournamentId}/day/${dayId}/scores`);
});

tournamentDetailRouter.post("/t/:tournamentId/day/:dayId/side-contest", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const type = String(req.body.type ?? "");
  const playerId = String(req.body.playerId ?? "");
  const measurement = Number(req.body.measurement ?? 0);
  const isManualWinnerOverride = req.body.isManualWinnerOverride === "on";

  if (!type || !playerId) return res.status(400).send("Invalid side contest data");
  const day = await prisma.day.findUnique({ where: { id: dayId } });
  if (!day) return res.status(404).send("Not found");
  if (day.lockedAt) return res.status(400).send("Day is locked.");
  if (type === "SecretSnowman") {
    return res.status(400).send("Secret Snowman must be drawn, not manually entered.");
  }
  if (Number.isNaN(measurement)) {
    return res.status(400).send("Measurement required.");
  }

  const existing = await prisma.sideContestResult.findMany({
    where: { dayId, type: type as any }
  });
  const tieExists = existing.some((result) => result.measurement === measurement);
  if (tieExists && !isManualWinnerOverride) {
    return res.status(400).send("Tie detected. Select manual winner override to break ties.");
  }

  await prisma.sideContestResult.create({
    data: {
      dayId,
      type: type as any,
      playerId,
      measurement,
      isManualWinnerOverride
    }
  });

  res.redirect(`/t/${tournamentId}/day/${dayId}/scores`);
});

tournamentDetailRouter.post("/t/:tournamentId/day/:dayId/secret-snowman/draw", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const day = await prisma.day.findUnique({ where: { id: dayId }, include: { secretSnowmanDraw: true } });
  if (!day) return res.status(404).send("Not found");
  if (day.lockedAt && day.secretSnowmanDraw?.isLocked) {
    return res.status(400).send("Day locked");
  }

  const players = await prisma.player.findMany({ where: { tournamentId } });
  if (!players.length) return res.status(400).send("No players");

  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const index = Math.floor(Math.random() * players.length);
  const playerId = players[index].id;

  if (day.secretSnowmanDraw) {
    await prisma.secretSnowmanDrawHistory.create({
      data: {
        dayId,
        previousPlayerId: day.secretSnowmanDraw.playerId,
        newPlayerId: playerId,
        seed,
        drawnAt: new Date()
      }
    });
    await prisma.secretSnowmanDraw.update({
      where: { dayId },
      data: { playerId, seed, drawnAt: new Date(), isLocked: day.lockedAt != null }
    });
  } else {
    await prisma.secretSnowmanDraw.create({
      data: { dayId, playerId, seed, drawnAt: new Date(), isLocked: day.lockedAt != null }
    });
  }

  res.redirect(`/t/${tournamentId}/day/${dayId}/scores`);
});

tournamentDetailRouter.post("/t/:tournamentId/day/:dayId/lock", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const lock = req.body.lock === "true";
  await prisma.day.update({
    where: { id: dayId },
    data: { lockedAt: lock ? new Date() : null }
  });
  if (lock) {
    await prisma.secretSnowmanDraw.updateMany({
      where: { dayId },
      data: { isLocked: true }
    });
  } else {
    await prisma.secretSnowmanDraw.updateMany({
      where: { dayId },
      data: { isLocked: false }
    });
  }
  res.redirect(`/t/${tournamentId}/day/${dayId}/scores`);
});

tournamentDetailRouter.get("/t/:tournamentId/day/:dayId/scramble", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true }
  });
  if (!tournament) return res.status(404).send("Not found");

  const day = await prisma.day.findUnique({
    where: { id: dayId },
    include: {
      scrambleTeams: { include: { players: true } },
      scrambleScores: true
    }
  });
  if (!day) return res.status(404).send("Not found");

  res.render("scramble", { tournament, day, players: tournament.players });
});

tournamentDetailRouter.post("/t/:tournamentId/day/:dayId/scramble/teams", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const teamName = String(req.body.teamName ?? "").trim();
  if (!teamName) return res.status(400).send("Team name required");
  const day = await prisma.day.findUnique({ where: { id: dayId } });
  if (!day) return res.status(404).send("Not found");
  if (day.lockedAt) return res.status(400).send("Day is locked.");

  await prisma.scrambleTeam.create({
    data: { dayId, name: teamName }
  });

  res.redirect(`/t/${tournamentId}/day/${dayId}/scramble`);
});

tournamentDetailRouter.post("/t/:tournamentId/day/:dayId/scramble/assign", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const teamId = String(req.body.teamId ?? "");
  const playerId = String(req.body.playerId ?? "");

  if (!teamId || !playerId) return res.status(400).send("Team and player required");
  const day = await prisma.day.findUnique({ where: { id: dayId } });
  if (!day) return res.status(404).send("Not found");
  if (day.lockedAt) return res.status(400).send("Day is locked.");

  await prisma.scrambleTeamPlayer.create({
    data: { teamId, playerId }
  });

  res.redirect(`/t/${tournamentId}/day/${dayId}/scramble`);
});

tournamentDetailRouter.post("/t/:tournamentId/day/:dayId/scramble/score", async (req, res) => {
  const { tournamentId, dayId } = req.params;
  const teamId = String(req.body.teamId ?? "");
  const total = Number(req.body.total ?? 0);

  const day = await prisma.day.findUnique({ where: { id: dayId } });
  if (!day) return res.status(404).send("Not found");
  if (day.lockedAt) return res.status(400).send("Day is locked.");

  await prisma.scrambleScore.upsert({
    where: { dayId_teamId: { dayId, teamId } },
    update: { total },
    create: { dayId, teamId, total }
  });

  res.redirect(`/t/${tournamentId}/day/${dayId}/scramble`);
});

tournamentDetailRouter.get("/t/:tournamentId/export", async (req, res) => {
  const tournamentId = req.params.tournamentId;
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      players: true,
      courses: { include: { holes: true } },
      days: {
        include: {
          matchRounds: { include: { pairings: true } },
          sideContestConfigs: true,
          sideContestResults: true,
          secretSnowmanDraw: true,
          segmentScores: true,
          scrambleTeams: { include: { players: true } },
          scrambleScores: true
        }
      },
      sideContestDefinitions: true
    }
  });
  if (!tournament) return res.status(404).send("Not found");

  const exportPayload = {
    ...tournament,
    handicapCategories: parseJsonField<any>(tournament.handicapCategories, []),
    pointSchemes: parseJsonField<any>(tournament.pointSchemes, {}),
    payouts: parseJsonField<any>(tournament.payouts, {})
  };

  res.render("export", { tournament, json: JSON.stringify(exportPayload, null, 2) });
});

tournamentDetailRouter.get("/t/:tournamentId/import", async (req, res) => {
  const tournamentId = req.params.tournamentId;
  res.render("import", { tournamentId });
});

tournamentDetailRouter.post("/t/:tournamentId/import", async (req, res) => {
  const tournamentId = req.params.tournamentId;
  const payload = String(req.body.payload ?? "");
  if (!payload) return res.status(400).send("Payload required");

  let data: any;
  try {
    data = JSON.parse(payload);
  } catch (error) {
    return res.status(400).send("Invalid JSON payload");
  }

  const parsed = tournamentExportSchema.safeParse(data);
  if (!parsed.success) {
    return res.status(400).send(parsed.error.message);
  }
  data = parsed.data;

  await prisma.$transaction([
    prisma.scrambleScore.deleteMany({ where: { day: { tournamentId } } }),
    prisma.scrambleTeamPlayer.deleteMany({ where: { team: { day: { tournamentId } } } }),
    prisma.scrambleTeam.deleteMany({ where: { day: { tournamentId } } }),
    prisma.secretSnowmanDrawHistory.deleteMany({ where: { day: { tournamentId } } }),
    prisma.secretSnowmanDraw.deleteMany({ where: { day: { tournamentId } } }),
    prisma.sideContestResult.deleteMany({ where: { day: { tournamentId } } }),
    prisma.daySideContestConfig.deleteMany({ where: { day: { tournamentId } } }),
    prisma.matchPairing.deleteMany({ where: { matchRound: { day: { tournamentId } } } }),
    prisma.matchRound.deleteMany({ where: { day: { tournamentId } } }),
    prisma.daySegmentScore.deleteMany({ where: { day: { tournamentId } } }),
    prisma.day.deleteMany({ where: { tournamentId } }),
    prisma.hole.deleteMany({ where: { course: { tournamentId } } }),
    prisma.course.deleteMany({ where: { tournamentId } }),
    prisma.sideContestDefinition.deleteMany({ where: { tournamentId } }),
    prisma.player.deleteMany({ where: { tournamentId } }),
    prisma.tournament.deleteMany({ where: { id: tournamentId } })
  ]);

  const tournament = await prisma.tournament.create({
    data: {
      id: data.id ?? tournamentId,
      name: data.name,
      handicapFactor: data.handicapFactor,
      handicapCap18: data.handicapCap18,
      par3Multiplier: data.par3Multiplier,
      handicapCategories: JSON.stringify(data.handicapCategories ?? []),
      pointSchemes: JSON.stringify(data.pointSchemes ?? {}),
      payouts: JSON.stringify(data.payouts ?? {})
    }
  });

  if (data.players?.length) {
    await prisma.player.createMany({
      data: data.players.map((player: any) => ({
        id: player.id,
        tournamentId: tournament.id,
        name: player.name,
        index: player.index,
        categoryKey: player.categoryKey
      }))
    });
  }

  if (data.sideContestDefinitions?.length) {
    await prisma.sideContestDefinition.createMany({
      data: data.sideContestDefinitions.map((def: any) => ({
        id: def.id,
        tournamentId: tournament.id,
        type: def.type,
        amount: def.amount
      }))
    });
  }

  if (data.courses?.length) {
    for (const course of data.courses) {
      await prisma.course.create({
        data: {
          id: course.id,
          tournamentId: tournament.id,
          name: course.name
        }
      });
      if (course.holes?.length) {
        await prisma.hole.createMany({
          data: course.holes.map((hole: any) => ({
            id: hole.id,
            courseId: course.id,
            holeNumber: hole.holeNumber,
            par: hole.par,
            strokeIndex: hole.strokeIndex,
            segment: hole.segment
          }))
        });
      }
    }
  }

  if (data.days?.length) {
    for (const day of data.days) {
      await prisma.day.create({
        data: {
          id: day.id,
          tournamentId: tournament.id,
          name: day.name,
          courseId: day.courseId,
          isMatchPlay: day.isMatchPlay,
          strokePlayRule: day.strokePlayRule,
          isScramble: day.isScramble,
          lockedAt: day.lockedAt ? new Date(day.lockedAt) : null
        }
      });

      if (day.matchRounds?.length) {
        for (const round of day.matchRounds) {
          await prisma.matchRound.create({
            data: {
              id: round.id,
              dayId: day.id,
              segmentType: round.segmentType,
              label: round.label,
              order: round.order
            }
          });
          if (round.pairings?.length) {
            await prisma.matchPairing.createMany({
              data: round.pairings.map((pairing: any) => ({
                id: pairing.id,
                matchRoundId: round.id,
                playerAId: pairing.playerAId,
                playerBId: pairing.playerBId
              }))
            });
          }
        }
      }

      if (day.sideContestConfigs?.length) {
        await prisma.daySideContestConfig.createMany({
          data: day.sideContestConfigs.map((config: any) => ({
            id: config.id,
            dayId: day.id,
            type: config.type,
            holeNumber: config.holeNumber
          }))
        });
      }

      if (day.sideContestResults?.length) {
        await prisma.sideContestResult.createMany({
          data: day.sideContestResults.map((result: any) => ({
            id: result.id,
            dayId: day.id,
            type: result.type,
            playerId: result.playerId,
            measurement: result.measurement,
            isManualWinnerOverride: result.isManualWinnerOverride
          }))
        });
      }

      if (day.secretSnowmanDraw) {
        await prisma.secretSnowmanDraw.create({
          data: {
            id: day.secretSnowmanDraw.id,
            dayId: day.id,
            playerId: day.secretSnowmanDraw.playerId,
            seed: day.secretSnowmanDraw.seed,
            drawnAt: new Date(day.secretSnowmanDraw.drawnAt),
            isLocked: day.secretSnowmanDraw.isLocked
          }
        });
      }

      if (day.segmentScores?.length) {
        await prisma.daySegmentScore.createMany({
          data: day.segmentScores.map((score: any) => ({
            id: score.id,
            dayId: day.id,
            segmentType: score.segmentType,
            playerId: score.playerId,
            holeNumber: score.holeNumber,
            gross: score.gross
          }))
        });
      }

      if (day.scrambleTeams?.length) {
        for (const team of day.scrambleTeams) {
          await prisma.scrambleTeam.create({
            data: {
              id: team.id,
              dayId: day.id,
              name: team.name
            }
          });
          if (team.players?.length) {
            await prisma.scrambleTeamPlayer.createMany({
              data: team.players.map((player: any) => ({
                id: player.id,
                teamId: team.id,
                playerId: player.playerId
              }))
            });
          }
        }
      }

      if (day.scrambleScores?.length) {
        await prisma.scrambleScore.createMany({
          data: day.scrambleScores.map((score: any) => ({
            id: score.id,
            dayId: day.id,
            teamId: score.teamId,
            total: score.total,
            perHole: score.perHole ? JSON.stringify(score.perHole) : null
          }))
        });
      }
    }
  }

  res.redirect(`/t/${tournament.id}/dashboard`);
});

