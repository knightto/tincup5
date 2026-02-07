# Tin Cup XX Tournament App

## Requirements
- Node.js 20+
- npm

## Setup
1) npm install
2) cp .env.example .env
3) Set `DATABASE_URL` to your hosted Postgres connection string (Neon recommended for free hosting).
4) npm run prisma:migrate
5) npm run dev (auto-seeds when the DB is empty)
6) npm run verify:seed (optional)

## Seed Scores (optional)
- Populate `seed/tincup-2022-scores.json` with hole-by-hole scores to enable full recompute verification.
- To temporarily allow golden-total verification without scores, set `VERIFY_ALLOW_GOLDEN_FALLBACK=true` when running `npm run verify:seed`.

## Environment
- `DATABASE_URL`: Postgres connection string.
- `AUTO_SEED_ON_STARTUP`: set to `false` to disable auto-seeding (default is enabled).

## Scripts
- npm run dev: start dev server
- npm run build: compile TypeScript
- npm run start: run compiled server
- npm run test: unit tests
- npm run prisma:migrate: apply migrations to Postgres
- npm run prisma:generate: generate Prisma client
- npm run prisma:studio: open Prisma Studio
- npm run seed: seed database from seed/tincup-2022-seed.json
- npm run verify:seed: recompute and validate seed outputs
