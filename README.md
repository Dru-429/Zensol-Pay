# ZenSol Pay

![ZenSol Pay OpenGraph Banner](/client/public/opengraph-image.jpg++)

> **"Making Payment Private & Simple"** > A premium, mobile-first Web3 peer-to-peer payment network built for the **Solana Frontier Hackathon**. 

ZenSol Pay brings the familiar, frictionless user experience of modern mobile banking (like Google Pay) to the high-performance Solana ecosystem. Engineered with an absolute emphasis on privacy, speed, and minimalism, the platform lets users transact instantly via simple usernames while keeping complex public keys and transaction history shielded beneath deep cryptography.

---

## ✨ Product Highlights & Core Features

* **📱 Identity-First UX:** Say goodbye to copying and pasting 44-character public keys. Search, find, and pay friends using simple `@username` handles.
* **💬 Conversational Transacting:** Payments shouldn't feel like filling out forms. ZenSol Pay features a unified chat timeline combining real-time text messaging with interactive payment bubbles.
* **🛡️ Cryptographic Privacy (Shielded Mode):** Powered by the [**Cloak SDK**](https://www.npmjs.com/package/@cloak-dev/sdk), users can toggle a high-performance privacy layer directly inside the client browser. Shielded transfers leverage zero-knowledge primitives and Address Lookup Tables (ALTs) to decouple the sender from the recipient on-chain.
* **📊 Institutional-Grade Analytics:** Real-time asset balances, portfolio monitoring, and multi-token valuation summaries derived instantly via the [**Dune Sim SVM Balances API**](https://docs.sim.dune.com/svm/balances).
* **⚡ High-Fidelity Mechanics:** Completely responsive, optimized design that delivers smooth transitions and native app interactions built for instant execution.

---

## 🛠️ Architecture Overview

ZenSol Pay was completely architected and shipped as a lean **12-hour hackathon MVP** featuring a robust, decoupled architecture:
* **Frontend (`/client`):** React, Vite, Tailwind CSS, Framer Motion, and `@solana/wallet-adapter-react`.
* **Backend (`/server`):** Node.js, Express, Prisma ORM, and PostgreSQL.

### 🔐 Security Implementation
* **Zero-Custody Server:** The backend *never* touches or stores user private keys. All cryptographic signatures occur purely on the client side via the user's connected browser wallet.
* **Secure Authentication Flows:** Protected endpoints use `bcrypt` password hashing alongside high-entropy **JSON Web Tokens (JWT)** issued simultaneously through an `httpOnly` secure cookie (`ZenSol Pay_token`) and fallback `Authorization: Bearer` storage.

---

## 💾 Prisma Data Schema

The relational database layer uses a highly optimized, relationally mapped structure to process both communication and state transitions simultaneously:

| Model | Purpose | Main Structural Attributes |
| :--- | :--- | :--- |
| **`User`** | Global account entity | Unique `email`, unique `@username`, password crypts. |
| **`UserProfile`** | Public presentation layer | `full_name`, `avatar_url`, and a modular dynamic `trust_score`. |
| **`WalletAccount`** | Verified cluster addresses | Mapped `public_address`, user assignments, primary states. |
| **`Contact`** | Personalized graph index | `owner_id`, mapped target relationships, sorting parameters. |
| **`Transfer`** | Cryptographic ledger states | Native `amount_ui`, fiat exchange value `amount_usd`, `is_private` flag, `tx_hash`. |
| **`Message`** | Communication timeline data | Raw conversational text threads explicitly linked to transfers. |

---

## ⚙️ Environment Configuration

### Backend Layer (`server/.env`)
```env
DATABASE_URL="postgresql://..."            # Neon or native PostgreSQL connection string
JWT_SECRET="your_high_entropy_secret"       # Random key used for verifying active sessions
PORT=4000                                  # Target local execution runtime port
CLIENT_ORIGIN="http://localhost:5173"      # Whitelisted origin cross-origin requests (CORS)
DUNE_SIM_API_KEY="your_dune_sim_key"       # Core analytics ingestion authorization token
CLOAK_RELAYER_URL="https://..."            # Fully qualified Cloak infrastructure endpoint
SOLANA_CLUSTER="devnet"                    # Targeting node behavior cluster environments