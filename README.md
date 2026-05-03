# SolPay

SolPay is a **mobile-first Solana payment prototype** inspired by Google Pay: username-based identity, a contact-centric home screen, chat-style P2P history, **standard SOL transfers** (Solana Pay QR + `@solana/web3.js`), **shielded sends** via [**Cloak**](https://www.npmjs.com/package/@cloak-dev/sdk), and **live portfolio data** from the [**Dune Sim SVM Balances API**](https://docs.sim.dune.com/svm/balances).

This repo is structured as a lean **12-hour hackathon MVP**: `/client` (Vite + React + Tailwind + wallet adapter) and `/server` (Express + Prisma + PostgreSQL).

## Architecture

- **Auth:** Email + password, `bcrypt` hashing, **JWT** returned in JSON and set as an **httpOnly cookie** (`solpay_token`). The SPA stores the same token in `localStorage` for `Authorization: Bearer` calls.
- **Identity:** Each `User` has a unique `username`. `WalletAccount` stores their Solana **public** address (never a private key). `GET /api/users/resolve?username=` maps `@alice` → primary `public_address`.
- **Contacts / chat:** `Contact` rows power **Recent** (horizontal) and **People** (vertical). `/transfer/:id` loads **messages** and **transfers** between the logged-in user and the peer, rendered as a single timeline (text bubbles + payment bubbles).
- **Standard pay:** The browser wallet signs a `SystemProgram.transfer`. The hash is persisted in `Transfer.tx_hash`.
- **Shielded pay:** The **privacy toggle** runs **Cloak in the browser** (`createSignerFromAdapter` + `CloakSDK`). The server only exposes **relayer URL + ALT** via `GET /api/wallet/cloak-config` and an optional `GET /api/wallet/cloak-health` probe (no private keys on the server).
- **Balances:** `GET /api/wallet/balances/:address` proxies Dune Sim `GET https://api.sim.dune.com/beta/svm/balances/{address}` with `X-Sim-Api-Key`, then returns a compact **SOL / USDC / total USD** summary for the dashboard sheet.

## Prisma schema (summary)

| Model        | Purpose |
|-------------|---------|
| `User`      | `email`, unique `username`, `password_hash` |
| `UserProfile` | `full_name`, `avatar_url`, `bio`, `trust_score` (default 100) |
| `WalletAccount` | `public_address`, `label`, `is_primary` |
| `Contact`   | `owner_id`, `contact_user_id`, `display_name`, `is_recent` |
| `Transfer`  | `amount_ui`, `amount_usd`, `status`, `is_private`, `tx_hash` |
| `Message`   | `text`, optional `related_transfer_id` |

Full definitions: `server/prisma/schema.prisma`.

## Environment variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon (or any) PostgreSQL URL |
| `JWT_SECRET` | Long random string for JWT signing |
| `PORT` | Default `4000` |
| `CLIENT_ORIGIN` | Vite origin, e.g. `http://localhost:5173` |
| `DUNE_SIM_API_KEY` | From [Sim by Dune](https://sim.dune.com/) |
| `CLOAK_RELAYER_URL` | Cloak relayer base URL (required for real shielded sends) |
| `SOLANA_CLUSTER` | Optional: `mainnet-beta` or `devnet` |
| `SOLANA_RPC_URL` | Optional RPC override |
| `CLOAK_ALT_ADDRESS` | Optional; defaults to known Cloak ALT for cluster |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Leave empty in dev to use same-origin `/api` proxy; set to `http://localhost:4000` if not proxying |
| `VITE_SOLANA_CLUSTER` | `devnet` or `mainnet-beta` |
| `VITE_SOLANA_RPC` | Optional RPC URL for the wallet `ConnectionProvider` |

## Primary frontend modules

- **`src/pages/Dashboard.jsx`** — GPay-style shell: search, Solana Pay receive QR, recent + people lists, **Check balance** (Dune).
- **`src/components/PrivatePaymentSheet.jsx`** — Pay sheet with **Privacy mode (Cloak)** toggle; standard vs shielded execution; records `Transfer` + `Message` after success.
- **`src/pages/Transfer.jsx`** — Chat thread with merged **messages** and **transfers**.
- **`src/lib/cloakTransfer.js`** — Cloak `fullTransfer` with **fallback** `depositSol` + `withdrawSol` to recipient.

## API outline

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/register` | Optional `public_address` seeds primary wallet |
| POST | `/api/auth/login` | Sets cookie + returns `token` |
| GET | `/api/auth/me` | Current user + profile + wallets |
| GET | `/api/users/resolve?username=` | Username → Solana pubkey |
| GET | `/api/users/:id` | Peer profile (auth) |
| GET | `/api/contacts` | Contacts for current user |
| GET | `/api/transfers/with/:userId` | Pairwise transfers |
| POST | `/api/transfers` | Record completed on-chain tx |
| GET/POST | `/api/messages/...` | Chat |
| GET | `/api/wallet/balances/:address` | Dune Sim summary |
| GET | `/api/wallet/cloak-config` | Relayer + ALT for client Cloak |

## Security notes (MVP)

- Shielded flows depend on **real Cloak infrastructure** (relayer, cluster, funded wallet). Without `CLOAK_RELAYER_URL`, the UI explains the missing config.
- Never store **private keys** in Postgres; only public addresses.
- Use **HTTPS** and a strong `JWT_SECRET` in production.

## License

Hackathon prototype — use and modify freely for Solana Frontier.
