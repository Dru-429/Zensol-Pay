# SolPay API Documentation

**Base URL:** `http://localhost:5000/api`  
**Authentication:** Bearer JWT token in `Authorization` header

---

## 🔐 Authentication Endpoints

### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "myusername",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cl1234567890abcdef",
    "email": "user@example.com",
    "username": "myusername"
  }
}
```

**Error (400):**
```json
{
  "error": "Email or username already exists"
}
```

---

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cl1234567890abcdef",
    "email": "user@example.com",
    "username": "myusername"
  }
}
```

**Error (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

## 💳 Wallet Endpoints

### Get User's Wallets
```
GET /wallet/
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "clw1234567890",
    "userId": "cl1234567890abcdef",
    "publicAddress": "So11111111111111111111111111111111111111112",
    "label": "My Primary Wallet",
    "isPrimary": true,
    "createdAt": "2026-05-02T10:00:00Z",
    "updatedAt": "2026-05-02T10:00:00Z"
  }
]
```

---

### Add Wallet Account
```
POST /wallet/
Authorization: Bearer <token>
Content-Type: application/json

{
  "publicAddress": "7xKXtg2CW87d98jJC2U3B4P2cFnwGdZMgLnokNBpVwn",
  "label": "My Secondary Wallet",
  "isPrimary": false
}
```

**Response (201):**
```json
{
  "id": "clw9876543210",
  "userId": "cl1234567890abcdef",
  "publicAddress": "7xKXtg2CW87d98jJC2U3B4P2cFnwGdZMgLnokNBpVwn",
  "label": "My Secondary Wallet",
  "isPrimary": false,
  "createdAt": "2026-05-02T10:05:00Z",
  "updatedAt": "2026-05-02T10:05:00Z"
}
```

---

### Get Wallet Balance (Dune/RPC)
```
GET /wallet/balance/So11111111111111111111111111111111111111112
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "sol": 5.234,
  "usdc": 523.45,
  "totalUsd": 1868.22
}
```

**Note:** Currently returns mock data. To integrate real Dune API:
1. Add `DUNE_API_KEY` to `.env`
2. Implement Dune query in `wallet.js`

---

## 💸 Transfer Endpoints

### Create Transfer (Standard or Private)
```
POST /transfer/
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": "cl9876543210abcdef",
  "amountUi": 1.5,
  "amountUsd": 210,
  "isPrivate": false
}
```

**Alternative (resolve by username):**
```json
{
  "receiverUsername": "alice",
  "amountUi": 2.0,
  "amountUsd": 280,
  "isPrivate": true
}
```

**Response (201):**
```json
{
  "id": "clt1234567890",
  "senderId": "cl1234567890abcdef",
  "receiverId": "cl9876543210abcdef",
  "amountUi": 1.5,
  "amountUsd": 210,
  "status": "completed",
  "isPrivate": false,
  "txHash": "5RDfYZ7qXi9e7Nt2mK3pQ4rSt5uVwXyZ6aB7cD8eF9gH0iJ1kL2mN3oPqRsT",
  "cloakDepositHash": null,
  "createdAt": "2026-05-02T10:10:00Z",
  "updatedAt": "2026-05-02T10:10:00Z"
}
```

**For Private Transfer:**
```json
{
  "txHash": null,
  "cloakDepositHash": "cloak_5RDfYZ7qXi9e7Nt2mK3pQ4rSt5uVwXyZ",
  "status": "completed"
}
```

**Error (400):**
```json
{
  "error": "Receiver not found"
}
```

---

### Get Transfer History
```
GET /transfer/history/:contactId
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "clt1234567890",
    "senderId": "cl1234567890abcdef",
    "receiverId": "cl9876543210abcdef",
    "amountUi": 1.5,
    "amountUsd": 210,
    "status": "completed",
    "isPrivate": false,
    "txHash": "5RDf...",
    "createdAt": "2026-05-02T10:10:00Z",
    "sender": {
      "id": "cl1234567890abcdef",
      "username": "alice"
    },
    "receiver": {
      "id": "cl9876543210abcdef",
      "username": "bob"
    }
  },
  {
    "id": "clt9876543210",
    "senderId": "cl9876543210abcdef",
    "receiverId": "cl1234567890abcdef",
    "amountUi": 0.5,
    "amountUsd": 70,
    "status": "completed",
    "isPrivate": true,
    "txHash": null,
    "cloakDepositHash": "cloak_9876...",
    "createdAt": "2026-05-02T09:50:00Z",
    "sender": {
      "id": "cl9876543210abcdef",
      "username": "bob"
    },
    "receiver": {
      "id": "cl1234567890abcdef",
      "username": "alice"
    }
  }
]
```

---

## 👥 Contact Endpoints

### Get All Contacts
```
GET /contact/
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "clc1234567890",
    "ownerId": "cl1234567890abcdef",
    "contactUserId": "cl9876543210abcdef",
    "displayName": "Alice",
    "isRecent": true,
    "createdAt": "2026-05-02T09:00:00Z",
    "updatedAt": "2026-05-02T10:00:00Z",
    "contactUser": {
      "id": "cl9876543210abcdef",
      "username": "alice",
      "email": "alice@example.com",
      "profile": {
        "id": "clup1234567890",
        "fullName": "Alice Smith",
        "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
        "bio": "Building on Solana 🚀"
      }
    }
  }
]
```

---

### Add Contact
```
POST /contact/
Authorization: Bearer <token>
Content-Type: application/json

{
  "contactUsername": "bob",
  "displayName": "Bob Smith"
}
```

**Response (201):**
```json
{
  "id": "clc9876543210",
  "ownerId": "cl1234567890abcdef",
  "contactUserId": "clb1234567890abcdef",
  "displayName": "Bob Smith",
  "isRecent": false,
  "createdAt": "2026-05-02T10:15:00Z",
  "contactUser": {
    "id": "clb1234567890abcdef",
    "username": "bob",
    "email": "bob@example.com",
    "profile": { ... }
  }
}
```

**Error (404):**
```json
{
  "error": "User not found"
}
```

---

### Mark Contact as Recent
```
PATCH /contact/:contactId/recent
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "clc1234567890",
  "ownerId": "cl1234567890abcdef",
  "contactUserId": "cl9876543210abcdef",
  "displayName": "Alice",
  "isRecent": true,
  "createdAt": "2026-05-02T09:00:00Z",
  "updatedAt": "2026-05-02T10:20:00Z"
}
```

---

## 👤 Profile Endpoints

### Get Current User Profile
```
GET /profile/
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "cl1234567890abcdef",
  "email": "user@example.com",
  "username": "myusername",
  "profile": {
    "id": "clup1234567890",
    "userId": "cl1234567890abcdef",
    "fullName": "My Name",
    "avatarUrl": "https://...",
    "bio": "Love crypto",
    "trustScore": 100,
    "createdAt": "2026-05-02T08:00:00Z",
    "updatedAt": "2026-05-02T08:00:00Z"
  },
  "walletAccounts": [
    {
      "id": "clw1234567890",
      "publicAddress": "So11111111111111111111111111111111111111112",
      "label": "Primary",
      "isPrimary": true
    }
  ]
}
```

---

### Search User by Username
```
GET /profile/search/:username
```

**Response (200):**
```json
{
  "id": "clb1234567890abcdef",
  "username": "bob",
  "email": "bob@example.com",
  "profile": {
    "id": "clup9876543210",
    "fullName": "Bob Smith",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    "bio": "Builder"
  },
  "walletAccounts": [
    {
      "publicAddress": "7xKXtg2CW87d98jJC2U3B4P2cFnwGdZMgLnokNBpVwn"
    }
  ]
}
```

**Note:** No authorization required for search (public lookup)

**Error (404):**
```json
{
  "error": "User not found"
}
```

---

### Update Profile
```
PATCH /profile/
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "My New Name",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "New bio text"
}
```

**Response (200):**
```json
{
  "id": "clup1234567890",
  "userId": "cl1234567890abcdef",
  "fullName": "My New Name",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "New bio text",
  "trustScore": 100,
  "createdAt": "2026-05-02T08:00:00Z",
  "updatedAt": "2026-05-02T10:25:00Z"
}
```

---

## 🔌 Health Check

```
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-05-02T10:30:00.000Z"
}
```

---

## 📋 Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing fields) |
| 401 | Unauthorized (invalid/missing token) |
| 404 | Not Found (user/contact doesn't exist) |
| 500 | Server Error |

---

## 🧪 cURL Examples

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "pass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "pass123"
  }'
```

### Get Contacts (with token)
```bash
curl -X GET http://localhost:5000/api/contact/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Send Transfer
```bash
curl -X POST http://localhost:5000/api/transfer/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "receiverUsername": "alice",
    "amountUi": 1.5,
    "amountUsd": 210,
    "isPrivate": false
  }'
```

---

## 🔗 Integration Hooks

### For Dune API (Real Balances)
- **File:** `/server/src/routes/wallet.js`
- **Function:** `GET /wallet/balance/:publicAddress`
- **TODO:** Replace mock with actual Dune query

### For Cloak Private Transfers
- **File:** `/server/src/services/web3.js`
- **Function:** `processPrivateTransfer()`
- **TODO:** Initialize Cloak SDK and create shielded pool deposits

### For Real Solana Transfers
- **File:** `/server/src/services/web3.js`
- **Function:** `processSolanaTransfer()`
- **TODO:** Sign transactions with real keypair and send to network

---

**Last Updated:** May 2, 2026  
**Status:** MVP - Ready for integration testing
