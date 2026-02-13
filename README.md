# Secure Transactions Mini-App

Turbo monorepo with:

- `apps/web` - Next.js UI
- `apps/api` - Fastify API
- `packages/crypto` - Envelope encryption logic

## Prerequisites

- Node.js 20+
- pnpm

## Local setup

1. Copy `.env.example` to `.env`
2. Set a 32-byte master key as hex (`MASTER_KEY_HEX`)
3. Install and run:

```bash
pnpm install
pnpm dev
```

Default ports:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

## Verify locally

1. Open `http://localhost:3000`
2. Use:
   - `partyId`: `party_123`
   - payload:

```json
{
  "amount": 100,
  "currency": "AED"
}
```

3. Click `Encrypt & Save`, then `Fetch`, then `Decrypt`.
4. Confirm decrypted payload equals original payload.

Optional API-only check:

```bash
curl -X POST http://localhost:3001/tx/encrypt \
	-H "Content-Type: application/json" \
	-d '{"partyId":"party_123","payload":{"amount":100,"currency":"AED"}}'
```

## API

- `POST /tx/encrypt`
- `GET /tx/:id`
- `POST /tx/:id/decrypt`

## Deployment

Deploy `apps/web` and `apps/api` as separate Vercel projects.

- `apps/web` env: `NEXT_PUBLIC_API_URL=<api url>`
- `apps/api` env: `MASTER_KEY_HEX=<64 hex chars>`

### Suggested Vercel settings

- API project root: `apps/api`
- Web project root: `apps/web`
- Install command: `pnpm install`
- Build command: keep defaults from each app

After deploy:

1. Update `NEXT_PUBLIC_API_URL` in web project to API production URL
2. Redeploy web
3. Run the same `Encrypt & Save` → `Fetch` → `Decrypt` flow in production

## Bug fixed during implementation

- The API originally loaded `.env` only from `apps/api/.env`.
- In Turbo monorepo runs, environment is often stored at repo root (`.env`).
- Fixed by loading env from both app-level and root-level paths.

## Loom walkthrough checklist

- Turbo setup and package structure
- Envelope encryption flow (DEK + wrapped DEK)
- Vercel deployment setup
- One bug fixed during implementation
- Next improvements
