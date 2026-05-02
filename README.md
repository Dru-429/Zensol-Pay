# SolPay - Solana Payment App MVP

A mobile-first GPay-like payment application built on Solana, featuring private/shielded transfers using Cloak protocol, real-time balance tracking, and a chat-like P2P transfer UI.

**For:** Solana Frontier Hackathon 2026  
**Status:** 12-hour MVP (Functional Prototype)  
**Tech Stack:** React (Vite) + Express + PostgreSQL (Prisma) + Solana Web3

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use Neon DB for free)
- npm or yarn

### 1. Setup PostgreSQL Database

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL and create a database
createdb solpay
```

#### Option B: Neon DB (Recommended for MVP)
1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a free PostgreSQL database
3. Copy the connection string (format: `postgresql://user:password@host/dbname`)

### 2. Clone & Install Dependencies

```bash
git clone <this-repo>
cd sol-Pay

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 3. Configure Environment Variables

#### Server (.env)
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your actual values:
```
DATABASE_URL="postgresql://user:password@localhost:5432/solpay"
JWT_SECRET="your-secure-random-secret-key"
SOLANA_RPC_URL="https://api.devnet.solana.com"
SOLANA_NETWORK="devnet"
PORT=5000
CLIENT_URL="http://localhost:5173"
DUNE_API_KEY="your-dune-api-key"
CLOAK_API_KEY="your-cloak-api-key"
```

#### Client (.env)
```bash
cd ../client
cp .env.example .env
# Default is already set: VITE_API_BASE=http://localhost:5000/api
```

### 4. Setup Database & Seed Data

```bash
cd server
npx prisma migrate dev --name init
npm run prisma:seed
```

This will:
- Create the database schema (Users, Wallets, Transfers, Contacts, Messages)
- Seed with 3 demo users (demouser1, demouser2, demouser3)
- Create sample contacts and wallet accounts

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### 6. Test Credentials

Use the seeded demo accounts:
- **Email:** user1@example.com | **Password:** password123
- **Email:** user2@example.com | **Password:** password123
- **Email:** user3@example.com | **Password:** password123

Or register a new account on the sign-up page.

---

## 📱 Features

### Dashboard (Home)
- **Search bar** with @username lookup
- **QR code scan icon** (UI stub for hackathon)
- **Balance card** showing real-time SOL/USDC balances
- **Horizontal "Recent Contacts"** scroll
- **Vertical "People" list** (all contacts)
- **"Check Balance"** button triggering Dune API simulation

### Payment Flow
1. Click a contact → Opens `/transfer/:id` page
2. **Chat-like interface** showing transaction history
3. **Privacy Toggle** (🔒 Shielded or 🔓 Standard)
4. **Amount input** & **Send button**
5. Transfers displayed as message bubbles

### Identity Mapping
- Search and add contacts by `@username`
- Backend resolves usernames to Solana public keys
- Automatic contact creation

### Private Transfers (Cloak)
- **Privacy Toggle ON** → Uses Cloak shielded pool
- Breaks sender/receiver link on-chain
- Ideal for grant qualification

---

## 🗄️ Database Schema (Prisma)

### User
- `id` (String, PK)
- `email` (String, unique)
- `username` (String, unique, for @mentions)
- `passwordHash` (String, bcrypt)
- Relations: profile, walletAccounts, transfers, messages

### UserProfile
- `userId` (FK)
- `fullName`, `avatarUrl`, `bio`
- `trustScore` (default: 100)

### WalletAccount
- `userId` (FK)
- `publicAddress` (Solana public key, unique)
- `label`, `isPrimary` (boolean)

### Contact
- `ownerId` (FK to User)
- `contactUserId` (FK to User)
- `displayName`
- `isRecent` (for sorting)

### Transfer
- `senderId`, `receiverId` (FKs)
- `amountUi` (human-readable, e.g., 1.5 SOL)
- `amountUsd` (conversion)
- `status` (pending, completed, failed)
- `isPrivate` (boolean, Cloak flag)
- `txHash` (Solana transaction ID)
- `cloakDepositHash` (for shielded transfers)

### Message
- `senderId`, `receiverId` (FKs)
- `text` (optional chat message)
- `relatedTransferId` (FK to Transfer)
- Shows transaction history in chat interface

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login with email/password

### Wallet
- `GET /api/wallet/` - List user's wallets
- `POST /api/wallet/` - Add wallet account
- `GET /api/wallet/balance/:publicAddress` - Fetch balance (Dune/RPC)

### Transfer
- `POST /api/transfer/` - Create transfer (standard or private)
- `GET /api/transfer/history/:contactId` - Transaction history

### Contact
- `GET /api/contact/` - List all contacts
- `POST /api/contact/` - Add new contact
- `PATCH /api/contact/:contactId/recent` - Mark as recent

### Profile
- `GET /api/profile/` - Get current user profile
- `GET /api/profile/search/:username` - Search user by username
- `PATCH /api/profile/` - Update profile

---

## 🧠 Architecture

### Frontend (React + Vite)
```
/client/src
├── context/AuthContext.jsx        # JWT token & auth state
├── pages/
│   ├── Login.jsx                 # Email/password login
│   ├── Register.jsx              # Account creation
│   ├── Dashboard.jsx             # Main home screen
│   └── Transfer.jsx              # P2P payment chat UI
├── App.jsx                       # Router setup
└── index.css                     # Tailwind styles
```

**Key Libraries:**
- `react-router-dom` - Page navigation
- `axios` - API calls
- `lucide-react` - Icons
- `tailwindcss` - Styling (native app feel)

### Backend (Express + Node.js)
```
/server/src
├── server.js                     # Express setup & routes
├── middleware/auth.js            # JWT verification
├── routes/
│   ├── auth.js                  # Register/login
│   ├── wallet.js                # Wallet management
│   ├── transfer.js              # Payment logic
│   ├── contact.js               # Contact management
│   └── profile.js               # Profile & search
├── services/web3.js             # Solana & Cloak integration
└── prisma/seed.js               # Demo data
```

**Authentication:** JWT tokens with RS-side validation

### Database (PostgreSQL + Prisma)
- 7 models (User, UserProfile, WalletAccount, Contact, Transfer, Message)
- Relational integrity with FKs & cascading deletes
- Seeded with 3 demo users + contacts

---

## 🌐 Web3 Integration

### Solana Transfers (`/server/src/services/web3.js`)

**Standard Transfer:**
```javascript
processSolanaTransfer(senderPK, receiverPK, amountUi)
// Returns: Transaction hash
// In MVP: Mock implementation (ready for real @solana/web3.js)
```

**Private Transfer (Cloak):**
```javascript
processPrivateTransfer(senderPK, receiverPK, amountUi)
// Returns: Cloak deposit hash
// Breaks sender/receiver link on-chain
```

### Dune API Integration
Currently mocked in `/server/src/routes/wallet.js` at `/api/wallet/balance/:publicAddress`

**To implement real Dune API:**
1. Get API key from [dune.com](https://dune.com/api)
2. Replace mock in `wallet.js`:
```javascript
const response = await axios.post(
  `${process.env.DUNE_SIM_ENDPOINT}/query/execute`,
  { query: `SELECT sol_balance, usdc_balance FROM wallets WHERE address = '${publicAddress}'` },
  { headers: { 'X-DUNE-API-KEY': process.env.DUNE_API_KEY } }
);
```

### Cloak SDK Integration
Currently mocked. To integrate:
1. Install: `npm install @cloak-dev/sdk`
2. Replace mock in `web3.js`:
```javascript
import CloakSDK from '@cloak-dev/sdk';
const cloak = new CloakSDK(process.env.CLOAK_API_KEY);
const deposit = await cloak.createShieldedPool(amount);
```

---

## 🎨 UI/UX Design

- **Mobile-first** (max-width: 428px container)
- **Dark mode** with accent color `#14F195` (Solana green)
- **Native app feel** via Tailwind
- **Lucide icons** for clean, modern iconography
- **Chat-like transfer UI** for familiar UX

### Key Screens
1. **Login/Register** - Dark gradient background
2. **Dashboard** - Balance card, recent contacts, people list
3. **Transfer** - Chat interface with transaction bubbles
4. **Privacy Toggle** - Visual indicator (🔒 vs 🔓)

---

## 📦 Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
# Deploy /dist folder to Vercel
```

### Backend (Railway, Render, or Heroku)
```bash
cd server
npm run build  # (if needed)
git push heroku main
```

### Database (Neon)
- Already hosted, just update `DATABASE_URL` in production `.env`

---

## 🐛 Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
cd server
npm install
npx prisma generate
```

### "POST /api/auth/register → 404"
- Ensure Express server is running on port 5000
- Check API_BASE in client `.env`

### Database connection error
- Verify `DATABASE_URL` format: `postgresql://user:password@host:5432/dbname`
- Test with `psql $DATABASE_URL`

### Port 5000/5173 already in use
```bash
# macOS/Linux: Kill process
lsof -ti:5000 | xargs kill -9

# Windows: Use Task Manager or
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 🎯 Next Steps (Post-Hackathon)

1. **Real Solana Integration**
   - Connect real keypairs (Phantom, Ledger)
   - Implement token swaps

2. **Dune Analytics**
   - Pull real portfolio data
   - Track balance history

3. **Cloak Full Implementation**
   - Real shielded pool deposits
   - Privacy verification

4. **QR Code Scanning**
   - Mobile camera integration
   - Payment request generation

5. **Push Notifications**
   - Transaction alerts
   - Contact requests

6. **Multi-chain**
   - Ethereum, Polygon support
   - Cross-chain bridges

---

## 📄 File Structure

```
sol-Pay/
├── server/
│   ├── src/
│   │   ├── server.js              # Express app
│   │   ├── middleware/auth.js
│   │   ├── routes/                # 5 route files
│   │   ├── services/web3.js
│   │   └── prisma/seed.js
│   ├── prisma/
│   │   └── schema.prisma          # Database models
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── client/
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/                 # 4 page components
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── .env.example
│
└── README.md                       # This file
```

---

## 🤝 Team

Built for the **Solana Frontier Hackathon** by a Web3 full-stack developer team.

---

## 📝 License

MIT License - Feel free to fork and build upon this MVP!

---

## 💬 Support

For issues during setup:
1. Check `.env.example` files
2. Ensure PostgreSQL is running
3. Verify Node.js version (18+)
4. Check firewall/port availability

**Status:** MVP ready for hackathon judging ✅
