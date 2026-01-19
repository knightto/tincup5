# Tin Cup XX Tournament App

## Requirements
- Node.js 20+
- npm

## Setup
1) npm install
2) cp .env.example .env
3) npm run prisma:migrate
4) npm run seed
5) npm run verify:seed
6) npm run dev

## Seed Scores (optional)
- Populate `seed/tincup-2022-scores.json` with hole-by-hole scores to enable full recompute verification.
- To temporarily allow golden-total verification without scores, set `VERIFY_ALLOW_GOLDEN_FALLBACK=true` when running `npm run verify:seed`.

## Scripts
- npm run dev: start dev server
- npm run build: compile TypeScript
- npm run start: run compiled server
- npm run test: unit tests
- npm run prisma:migrate: create SQLite DB and apply migrations
- npm run prisma:studio: open Prisma Studio
- npm run seed: seed database from seed/tincup-2022-seed.json
- npm run verify:seed: recompute and validate seed outputs
