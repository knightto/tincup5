import express from "express";
import path from "path";
import { prisma } from "./db/client";
import { tournamentRouter } from "./routes/tournaments";
import { tournamentDetailRouter } from "./routes/tournament";
import { seedDatabase } from "./seed/seed-db";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/", tournamentRouter);
app.use("/", tournamentDetailRouter);

const port = Number(process.env.PORT ?? 3000);

function shouldAutoSeed() {
  const raw = String(process.env.AUTO_SEED_ON_STARTUP ?? "").trim().toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "no";
}

async function ensureSeed() {
  if (!shouldAutoSeed()) return;
  const existing = await prisma.tournament.count();
  if (existing > 0) return;
  console.log("No tournament data found. Seeding database...");
  await seedDatabase();
  console.log("Seed complete.");
}

async function start() {
  await ensureSeed();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Startup failed:", error);
  process.exitCode = 1;
});
