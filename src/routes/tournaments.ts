import { Router } from "express";
import { prisma } from "../db/client";

export const tournamentRouter = Router();

tournamentRouter.get("/", async (_req, res) => {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" }
  });
  res.render("home", { tournaments });
});

tournamentRouter.post("/tournaments", async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  if (!name) {
    return res.status(400).send("Name required");
  }
  const tournament = await prisma.tournament.create({
    data: {
      name,
      handicapFactor: 0,
      handicapCap18: 36,
      par3Multiplier: 0.5,
      handicapCategories: JSON.stringify([
        { key: "None", type: "flat", value: 0 },
        { key: "Lifetime", type: "flat", value: -1 },
        { key: "Rookie", type: "multiplier", value: -0.2 },
        { key: "Champ", type: "flat", value: -3 },
        { key: "Double Deuce", type: "multiplier", value: -0.15 },
        { key: "2X Champ", type: "flat", value: -4 },
        { key: "3X Champ", type: "flat", value: -5 }
      ]),
      pointSchemes: "{}",
      payouts: "{}"
    }
  });
  return res.redirect(`/t/${tournament.id}/setup`);
});

tournamentRouter.post("/tournaments/:tournamentId/delete", async (req, res) => {
  const tournamentId = req.params.tournamentId;
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
  return res.redirect("/");
});
