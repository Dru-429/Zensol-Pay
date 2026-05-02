# SolPay Architecture Overview

## System Design

```
┌─────────────────┐          ┌──────────────────┐          ┌─────────────────┐
│   React Client  │ ◄────────►│  Express Server  │ ◄────────►│   PostgreSQL    │
│  (Vite + Auth)  │   JSON    │  (REST API JWT)  │   Prisma  │  (Neon DB)      │
└─────────────────┘          └──────────────────┘          └─────────────────┘
      Port 5173                    Port 5000
   http://localhost:               :5000/api/...
     5173


     ┌─────────────────────────────────────┐
     │      Solana Blockchain              │
     │  ┌─────────────────────────────┐   │
     │  │  Standard Transfers (Web3.js) │   │
     │  │  Private Transfers (Cloak)    │   │
     │  └─────────────────────────────┘   │
     │  Devnet: https://api.devnet...     │
     └─────────────────────────────────────┘


┌─────────────────────────────────────┐
│   External Services (Future)        │
├─────────────────────────────────────┤
│ • Dune API: Portfolio tracking      │
│ • Cloak SDK: Shielded transfers    │
│ • Phantom/Sollet: Wallet connect   │
└─────────────────────────────────────┘
```

## Data Flow Example: Send Payment

```
User clicks "Send" (Transfer page)
    │
    ├─ Frontend validates amount & recipient
    │
    ├─ POST /api/transfer/ (with Bearer token)
    │     ├─ Verify JWT in auth middleware
    │     ├─ Resolve receiver by ID or username
    │     ├─ Create Transfer record (status: pending)
    │     ├─ Call processSolanaTransfer() or processPrivateTransfer()
    │     │   ├─ [Standard] Sign & send Tx via @solana/web3.js
    │     │   └─ [Private] Deposit to Cloak pool → get cloakDepositHash
    │     ├─ Update Transfer record (status: completed, txHash set)
    │     └─ Return updated Transfer to frontend
    │
    ├─ Frontend displays transfer in chat bubble
    │
    └─ UI updates "Recent Contacts" list

```

## Authentication Flow

```
1. User registers/logs in → Backend hashes password with bcryptjs
2. Backend returns JWT token (signed with JWT_SECRET)
3. Client stores token in localStorage
4. All API calls include: Authorization: Bearer <token>
5. verifyAuth middleware validates token before processing request
6. On logout, token cleared from localStorage
```

## Privacy Flow (Cloak Integration)

```
Privacy OFF (Standard):
  User A → [Solana Network] → User B
  (Transaction visible on-chain)

Privacy ON (Shielded):
  User A → [Cloak Pool Deposit] → [Private Circuit] → User B
  (Sender/receiver link broken, amount hidden)
  
Benefits for hackathon:
  • Qualifies for "Privacy" grant
  • Demonstrates Web3 sophistication
  • Unique competitive advantage vs. other payment apps
```

## Contact & Identity Mapping

```
User searches: "@alice"
    │
    ├─ Frontend: GET /api/profile/search/alice
    │
    ├─ Backend queries: User { username: "alice" }
    │     ├─ Fetches UserProfile + WalletAccount (isPrimary: true)
    │     └─ Returns: { id, username, publicAddress, profile }
    │
    ├─ Frontend displays result card
    │
    └─ User clicks "Add Contact"
         └─ POST /api/contact/ { contactUsername: "alice" }
              └─ Creates Contact record + marks isRecent: true
```

## Recent vs. All Contacts

```
Dashboard loads /api/contact/:
  [
    { id: "c1", contactUserId: "u2", isRecent: true, displayName: "Alice" },
    { id: "c2", contactUserId: "u3", isRecent: false, displayName: "Bob" }
  ]

Horizontal Scroll (Recent):
  Filter: isRecent: true
  Display as circular avatars

Vertical List (People):
  Display all contacts
  Ordered by isRecent DESC (recent first)

User sends transfer:
  Contact marked isRecent: true (via /api/contact/:id/recent)
```

## Database Normalization

```
✓ No data duplication (username stored once in User)
✓ Referential integrity (FKs with onDelete: Cascade)
✓ Efficient queries (indexes on userId, publicAddress)
✓ Scalability (relational design vs. embedding)

Example:
- User table: email, username (unique constraints prevent duplicates)
- Contact table: owns references to two users (not embedding data)
- Transfer: references both sender & receiver (no data copy)
```

---

## Key Design Decisions

1. **JWT + Bearer Tokens**
   - Stateless auth (scales better)
   - No session cookies (mobile-friendly)

2. **Prisma ORM**
   - Type-safe queries (TypeScript future-ready)
   - Auto-migrations (faster iteration)
   - Seeding capability (demo data in seconds)

3. **Tailwind CSS**
   - Utility-first (rapid mobile UI building)
   - Dark mode ready
   - No custom CSS needed

4. **Vite + React**
   - Fast HMR (hot reload development)
   - Modern ES modules
   - Smaller bundle size vs. CRA

5. **Solana Devnet**
   - Free testnet for development
   - No real SOL needed
   - Easy to switch to mainnet later

6. **Cloak for Privacy**
   - Industry-standard for shielded transactions
   - On-chain privacy guarantees
   - Competitive advantage for hackathon
