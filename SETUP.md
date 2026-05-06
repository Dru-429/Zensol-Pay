# SolPay — setup (quick)

## Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech/) (or other) PostgreSQL database
- Dune Sim API key from [sim.dune.com](https://sim.dune.com/) (for **Check balance**)
- Optional: Cloak relayer URL for **Privacy mode** (see `README.md`)

## 1. Database and server

```bash
cd server
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, DUNE_SIM_API_KEY, CLIENT_ORIGIN, optional CLOAK_RELAYER_URL
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```
//Seed OK. Demo login: alice@solpay.demo / demo1234
API: `http://localhost:4000`

## 2. Client

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

## 3. Try the demo

1. Sign in as **alice@solpay.demo** / **demo1234** (from seed).
2. Home shows **Recent** and **People** (Bob, Carol).
3. Open a contact → chat + **Pay** (connect Phantom/Solflare on devnet for real txs).
4. Tap **Check balance** (uses Dune Sim for the resolved wallet address).

Full architecture and env reference: **`README.md`**.
