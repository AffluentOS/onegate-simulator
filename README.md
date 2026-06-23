# OneGate — Payment Growth & GP Simulator

Next.js scenario-planning app for OneGate (Affluent Consultant). Models new-client
acquisition across verticals and tiers into processing volume, net revenue and
gross profit. OneGate financials only — no commission. Styled in the Affluent
Consultant Design System.

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- Pure engine in `lib/engine.ts` (testable)
- Password gate via `middleware.ts` + `/login`
- Dockerfile (Next standalone) for Coolify

## Run locally
```bash
pnpm install
cp .env.example .env   # set APP_PASSWORD and SESSION_TOKEN
pnpm dev               # http://localhost:3000
```

## Environment
| Var | Purpose |
|---|---|
| `APP_PASSWORD` | Shared password to enter the app |
| `SESSION_TOKEN` | Long random string used as the session cookie value (`openssl rand -hex 32`) |

## Deploy (Coolify, AffluentOS server)
Build via the Dockerfile. Set `APP_PASSWORD` and `SESSION_TOKEN` env vars, point the
domain at `onegate.affluentconsultant.ai`. Login lives at `/login`; link
`affluentconsultant.ai/onegate` to it.

## Model
Five markets (Gaming, E-commerce/Retail, Hospitality, Forex, Platforms). Platforms
use an aggregate downstream book at a lower wholesale take. Each tier has its own
volume, take rate, GP margin, and a per-month/per-quarter onboarding cadence. Sales
cycle and ramp are editable in the Assumptions panel. Known (CallPay published)
figures vs assumed dials are labelled in-app.
