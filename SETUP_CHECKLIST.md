# SolPay MVP - Quick Setup Checklist

## ✅ Pre-Flight Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL running locally OR Neon DB account ready
- [ ] Git initialized in project
- [ ] Internet connection (for downloading dependencies)

## ⚡ 12-Hour Sprint Setup (Fastest Path)

### Phase 1: Database (5 min)
```bash
# Option A: Neon DB (Recommended)
# 1. Go to console.neon.tech
# 2. Create free PostgreSQL database
# 3. Copy connection string

# Option B: Local PostgreSQL
psql -U postgres
CREATE DATABASE solpay;
\q
```

### Phase 2: Server Setup (3 min)
```bash
cd server
npm install
cp .env.example .env
# Edit .env, add DATABASE_URL
npx prisma migrate dev --name init
npm run prisma:seed
```

### Phase 3: Client Setup (2 min)
```bash
cd ../client
npm install
# .env already configured
```

### Phase 4: Run (1 min)
**Terminal A:**
```bash
cd server && npm run dev
```

**Terminal B:**
```bash
cd client && npm run dev
```

**Test URL:** http://localhost:5173

## 🎯 MVP Feature Priority

### Must Have (12-hour):
- ✅ User registration/login
- ✅ Dashboard with balance card
- ✅ Recent contacts + people list
- ✅ Transfer UI (chat-like interface)
- ✅ Privacy toggle (Cloak integration stub)
- ✅ Seeded demo data

### Should Have (if time):
- [ ] Real Solana transfer execution
- [ ] QR code generation
- [ ] Dune API real balance fetch
- [ ] Email verification
- [ ] Avatar upload

### Nice to Have (post-hackathon):
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Transaction history exports
- [ ] Multi-sig support

## 🚀 Deployment (1 hour before deadline)

### Frontend to Vercel (10 min)
```bash
cd client
npm run build
# Upload /dist to Vercel via GitHub
```

### Backend to Railway (10 min)
```bash
cd server
# Push to GitHub
# Connect to Railway
# Set DATABASE_URL env var
```

### Demo User Accounts
```
Email: user1@example.com | Password: password123
Email: user2@example.com | Password: password123
Email: user3@example.com | Password: password123
```

## 🐛 Common Pitfalls (Avoid!)

| Issue | Solution |
|-------|----------|
| "Module not found" | Run `npm install` in both /server & /client |
| Port 5000 in use | Kill: `lsof -ti:5000 \| xargs kill -9` |
| Database won't connect | Check `DATABASE_URL` format, verify DB is running |
| CORS errors | Ensure `CLIENT_URL` is set in server/.env |
| Vite not loading | Check that Vite runs on 5173, proxy to 5000 |
| Prisma schema errors | Run `npx prisma validate` to debug |

## 📊 Testing Scenarios

### Scenario 1: Register & Login
1. Go to http://localhost:5173/register
2. Create account with email/username/password
3. Should redirect to dashboard
4. Can logout and login again

### Scenario 2: View Dashboard
1. Login with demo credentials
2. Should see balance card, recent contacts, people list
3. Click "Check Balance" → Balance updates
4. Scroll horizontal contacts

### Scenario 3: Send Payment
1. Click on a contact
2. Enter amount (e.g., 0.5 SOL)
3. Toggle privacy (🔒 shielded or 🔓 standard)
4. Click Send
5. Transfer appears as chat bubble
6. Contact marked as "Recent"

### Scenario 4: Search Contact
1. On dashboard, search "@username"
2. User found in people list
3. Click to send payment

## 📈 Performance Metrics (MVP Target)

- Dashboard load: < 2s
- API response time: < 500ms
- Database query time: < 100ms
- Build size: < 200KB (gzipped)

## 🎤 Pitch Points for Hackathon Judges

1. **Speed:** 12-hour MVP ready
2. **Privacy:** Cloak integration for shielded payments
3. **UX:** Mobile-first, chat-like interface (familiar to users)
4. **Architecture:** Scalable, type-safe, Prisma-powered
5. **Web3:** Identity mapping (@username), real Solana integration-ready
6. **Dune Integration:** Portfolio tracking framework in place

## 📞 Support Contacts

- **Solana Discord:** Get help on #builders channel
- **Cloak Docs:** https://docs.cloak.dev
- **Prisma Docs:** https://www.prisma.io/docs
- **Vite Docs:** https://vitejs.dev

---

**Status:** Ready to deploy! 🚀
