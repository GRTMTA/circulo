# Circulo

Circulo is a non-custodial, invite-only rotating savings circle for trusted groups. Members contribute a fixed stablecoin amount on a fixed schedule, one member receives the pool each round, and a Soroban contract enforces collateral rules for missed contributions.

## Tech Stack

- Frontend: Next.js App Router, React, Tailwind CSS
- Wallet and chain: Stellar Wallet Kit, `@stellar/stellar-sdk`, Soroban
- Smart contract: Rust, `soroban-sdk`
- Backend: Next.js route handlers and serverless cron-style polling
- Database and auth: Supabase
- Deployment: Vercel for app/API, Stellar network for contract

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` into a local env file when wiring Supabase, Soroban RPC, the deployed contract ID, and SEP-24 anchor settings.

## Useful Scripts

- `npm run dev` starts the Next.js app.
- `npm run build` verifies the app build.
- `npm run lint` runs ESLint.
- `npm run contract:test` runs the Soroban starter tests.
- `npm run contract:build` builds the Soroban contract with the Stellar CLI.
