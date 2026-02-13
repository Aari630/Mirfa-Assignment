# Secure Transactions Mini-App

This repository contains my implementation of the Mirfa Secure Transactions challenge.

## Stack

- `apps/web`: Next.js frontend
- `apps/api`: Fastify backend
- `packages/crypto`: shared envelope encryption logic
- Workspace: TurboRepo + pnpm + TypeScript

## What the app does

The UI lets you:

1. enter `partyId` and a JSON payload,
2. encrypt and store it,
3. fetch the encrypted record,
4. decrypt it back to the original payload.

The backend exposes:

- `POST /tx/encrypt`
- `GET /tx/:id`
- `POST /tx/:id/decrypt`

Storage is an in-memory `Map`.

## Encryption design

I implemented envelope encryption with `AES-256-GCM`:

1. generate a random 32-byte DEK,
2. encrypt payload JSON with DEK,
3. wrap DEK using the master key,
4. store nonce/ciphertext/tag values as hex.

Implemented in `packages/crypto/src/index.ts`.

Validation includes:

- invalid hex rejection,
- nonce length check (12 bytes),
- auth tag length check (16 bytes),
- tamper detection on ciphertext/tag,
- decryption failure handling.

Tests are in `packages/crypto/tests/crypto.test.ts`.

## Local run

Prerequisites:

- Node.js 20+
- pnpm

Setup:

1. Copy `.env.example` to `.env`.
2. Set `MASTER_KEY_HEX` to a 64-char hex key.
3. Run:

```bash
pnpm install
pnpm dev
```

Local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

Quick verification payload:

```json
{
  "amount": 100,
  "currency": "AED"
}
```

## Deployment (Vercel)

Deploy as two projects:

1. API project root: `apps/api`
2. Web project root: `apps/web`

Environment variables:

- API: `MASTER_KEY_HEX`
- Web: `NEXT_PUBLIC_API_URL=<deployed api url>`

After deployment, run the same flow in production:

`Encrypt & Save` → `Fetch` → `Decrypt`

## Implementation note

One issue I fixed was environment loading in monorepo dev mode. The API now reads `.env` from both `apps/api` and repo root, so `pnpm dev` from the workspace root works consistently.
