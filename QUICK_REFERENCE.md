# SolPay - Quick Reference Guide

**Last Updated:** May 2, 2026 | **Status:** MVP Complete ✅

---

## 🚀 Start Here

### First Time Setup (5 minutes)
```bash
# 1. Configure database
cd server && cp .env.example .env
# Edit .env, add DATABASE_URL

# 2. Setup database
npx prisma migrate dev --name init
npm run prisma:seed

# 3. Install all dependencies
npm install --prefix server && npm install --prefix client

# 4. Run both servers
npm run dev --prefix server &
npm run dev --prefix client
# or use concurrently: npm run dev (from root)

# 5. Open browser
# http://localhost:5173
```

### Demo Credentials
```
Email: user1@example.com
Password: password123
```

---

## 📖 Documentation Map

| Document | Read If | Key Content |
|----------|---------|------------|
| **README.md** | You're starting | Features, setup, deployment |
| **PROJECT_SUMMARY.md** | You want overview | What was built, deliverables |
| **ARCHITECTURE.md** | Understanding design | System diagrams, data flows |
| **API_DOCS.md** | Building features | All 13 endpoints, examples |
| **SETUP_CHECKLIST.md** | In 12-hour sprint | Fastest path, common fixes |
| **This file** | Need quick answers | FAQs, terminal commands |

---

## 🛠️ Common Commands

### Terminal - Backend
```bash
cd server

# Development
npm run dev                    # Watch mode with reload

# Database
npx prisma migrate dev        # Create new migration
npx prisma migrate deploy     # Production migrations
npx prisma studio            # Visual database editor
npm run prisma:seed          # Reseed demo data

# Production
npm start                     # Run server
```

### Terminal - Frontend
```bash
cd client

# Development
npm run dev                   # Vite dev server (port 5173)

# Production
npm run build                # Build to /dist
npm run preview              # Preview production build
```

### Git & Version Control
```bash
git add .
git commit -m "Initial SolPay MVP"
git push origin main
```

---

## 📁 File Navigation

### Backend Entry Points
- **Main Server:** `server/src/server.js`
- **Routes (APIs):** `server/src/routes/*.js` (5 files)
- **Database Schema:** `server/prisma/schema.prisma`
- **Config:** `server/.env`

### Frontend Entry Points
- **App Router:** `client/src/App.jsx`
- **Auth State:** `client/src/context/AuthContext.jsx`
- **Pages:** `client/src/pages/*.jsx` (4 files)
- **Styles:** `client/src/index.css`

### Configuration Files
- **Vite:** `client/vite.config.js`
- **Tailwind:** `client/tailwind.config.js`
- **PostCSS:** `client/postcss.config.js`
- **Prisma:** `server/prisma/schema.prisma`

---

## 🔍 Quick API Reference

### Auth
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","username":"test","password":"pass"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","password":"pass"}'
```

### Get Contacts (with token)
```bash
curl -X GET http://localhost:5000/api/contact/ \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Send Payment
```bash
curl -X POST http://localhost:5000/api/transfer/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{"receiverUsername":"alice","amountUi":1.5,"isPrivate":false}'
```

**See API_DOCS.md for all 13 endpoints + examples**

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL running
psql -U postgres -c "SELECT version();"

# Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:password@host:5432/dbname

# Test connection
npx prisma db push
```

### Port Already in Use
```bash
# macOS/Linux: Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Windows: Use Task Manager or
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "Cannot find module" Error
```bash
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### Vite Not Loading Page
- Check: `http://localhost:5173` (not 5000)
- Ensure backend on 5000
- Check `CLIENT_URL` in server/.env

### Transfers Not Appearing
```bash
# Reseed demo data
cd server
npm run prisma:seed

# Check API is running
curl http://localhost:5000/api/health
```

---

## 🚀 Deployment Checklist

### Before Deploying
- [ ] Create `.env` from `.env.example` in both dirs
- [ ] Test locally: `npm run dev`
- [ ] Run all migrations: `npx prisma migrate deploy`
- [ ] Seed production data if needed
- [ ] Update SOLANA_RPC_URL to mainnet (if needed)

### Frontend Deployment (Vercel)
```bash
cd client
npm run build
# Upload /dist folder to Vercel
# Or connect GitHub repo
```

### Backend Deployment (Railway/Render)
```bash
# Push to GitHub
git push origin main

# Connect repo to Railway/Render
# Set environment variables:
# - DATABASE_URL
# - JWT_SECRET
# - SOLANA_RPC_URL
# - PORT (usually 8080 on deployment)

npm start
```

---

## 💡 Feature Walkthrough

### 1. Register New Account
1. Go to `http://localhost:5173/register`
2. Fill email, username, password
3. Click "Sign Up"
4. Redirected to dashboard

### 2. View Dashboard
1. See balance card (top)
2. Scroll right for "Recent Contacts"
3. Scroll down for "People" (all contacts)
4. Click "Check Balance" to fetch Dune data (mock)

### 3. Send Payment
1. Click on a contact
2. Enter amount in SOL
3. Toggle privacy (🔒 or 🔓)
4. Click Send
5. Transfer appears as chat bubble

### 4. Search Contact
1. On dashboard, type in search box
2. Results appear as you type
3. Click to view that user
4. Send payment directly

---

## 🔐 Security Notes

### Never in Production
- Don't commit `.env` files (in `.gitignore`)
- Don't log passwords/tokens
- Don't expose JWT_SECRET
- Use HTTPS only (not HTTP)

### Passwords
- Hashed with bcryptjs (10 rounds)
- Never stored in plain text
- 8+ characters recommended

### Tokens
- JWT tokens valid for 7 days
- Stored in browser localStorage
- Always send in `Authorization: Bearer` header
- Validated on each protected route

---

## 📊 Monitoring & Debugging

### Check Server Health
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### View Database
```bash
cd server
npx prisma studio
# Opens visual DB explorer at http://localhost:5555
```

### Check Database Migrations
```bash
cd server
npx prisma migrate status
# Shows pending/applied migrations
```

### View Backend Logs
```bash
# Terminal running server will show:
# - Request logs
# - Database queries (if debug enabled)
# - Errors
```

---

## 🎨 Customization Tips

### Change Colors
- Edit `client/tailwind.config.js`
- Primary color: `#14F195` (Solana green)
- Dark color: `#0A0E27`

### Change UI Text
- Search files: `client/src/pages/`
- Edit component strings

### Add New Route
1. Create file in `server/src/routes/`
2. Import in `server/src/server.js`
3. Add `app.use('/api/newroute', routeHandler)`

### Add Database Model
1. Edit `server/prisma/schema.prisma`
2. Run: `npx prisma migrate dev --name add_model`
3. Use new model in routes

---

## 📚 Learning Resources

### Prisma ORM
- Docs: https://www.prisma.io/docs
- Studio: `npx prisma studio`

### Solana Web3.js
- Docs: https://docs.solana.com
- Examples: https://github.com/solana-labs/web3.js

### React & Vite
- React: https://react.dev
- Vite: https://vitejs.dev

### Tailwind CSS
- Docs: https://tailwindcss.com
- Dark mode: https://tailwindcss.com/docs/dark-mode

---

## 🎯 Next Steps After MVP

1. **Real Solana Integration**
   - Connect to Phantom wallet
   - Sign real transactions
   - Devnet → Mainnet transition

2. **Cloak Privacy**
   - Integrate Cloak SDK
   - Real shielded pool deposits
   - Zero-knowledge proofs

3. **Dune Analytics**
   - Fetch real portfolio data
   - Historical balance tracking
   - Charts & visualizations

4. **Mobile App**
   - React Native version
   - Push notifications
   - Camera QR scanning

---

## 🆘 Emergency Fixes

### "Lost auth token"
```bash
# Clear browser cache
# localStorage.clear() in console
# Login again
```

### "Database is locked"
```bash
# Stop all processes accessing DB
# Kill any orphaned connections
# Restart PostgreSQL
```

### "Transfer failed silently"
```bash
# Check browser console for errors
# Check server logs
# Verify wallet accounts exist
# Check DB status: npx prisma studio
```

---

## 📞 Support

### Official Docs
- Solana: https://docs.solana.com
- Prisma: https://www.prisma.io
- React: https://react.dev

### Community Help
- Solana Discord: https://discord.gg/solana
- GitHub Issues: (Your repo)

### Local Debugging
- Browser DevTools: F12
- Prisma Studio: `npx prisma studio`
- Network Tab: Check API calls
- Console: JavaScript errors

---

## ✅ Pre-Hackathon Checklist

- [ ] All tests pass locally
- [ ] `.env` files created (not committed)
- [ ] Database seeded with demo data
- [ ] Both servers running without errors
- [ ] UI loads at http://localhost:5173
- [ ] Can login with demo credentials
- [ ] Can create transfers
- [ ] Can view transaction history
- [ ] Privacy toggle works
- [ ] Recent contacts show correctly
- [ ] Search finds users
- [ ] Documentation complete

---

**Ready to submit! 🚀**

For full details, see **PROJECT_SUMMARY.md**
