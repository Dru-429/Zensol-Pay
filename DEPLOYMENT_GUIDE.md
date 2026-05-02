# SolPay - Deployment Guide

**For:** Solana Frontier Hackathon Submission  
**Status:** Production-ready MVP

---

## 📋 Pre-Deployment Checklist

- [ ] All local tests pass
- [ ] `.env` files created and configured
- [ ] Database migrations completed
- [ ] Demo data seeded
- [ ] Git repository initialized with all files
- [ ] No sensitive data in commits (check `.gitignore`)
- [ ] Both servers run without errors locally

---

## 🌐 Deployment Options

### Option 1: Railway (Recommended - Easiest)

#### Frontend to Railway
```bash
# Push to GitHub
git add .
git commit -m "SolPay MVP"
git push origin main

# 1. Go to railway.app
# 2. Click "New Project"
# 3. Select "Deploy from GitHub repo"
# 4. Connect your GitHub account & select sol-Pay repo
# 5. Railway auto-detects Vite project
# 6. Deploy client/
```

#### Backend to Railway
```bash
# Same repo, new service
# 1. In your Railway project, click "New"
# 2. Select "Database" → PostgreSQL
# 3. Note the DATABASE_URL
# 4. Click "New Service" → GitHub repo
# 5. Select "server/" as root directory
# 6. Set environment variables:
#    - DATABASE_URL: (from PostgreSQL service)
#    - JWT_SECRET: (generate random key)
#    - SOLANA_RPC_URL: https://api.devnet.solana.com
#    - SOLANA_NETWORK: devnet
#    - PORT: 8080 (Railway default)
#    - CLIENT_URL: (your deployed frontend URL)
```

---

### Option 2: Vercel (Frontend) + Render (Backend)

#### Frontend to Vercel
```bash
# 1. Go to vercel.com
# 2. Import GitHub repo
# 3. Framework: Vite
# 4. Root directory: client/
# 5. Deploy
# 6. Set environment: VITE_API_BASE=https://your-backend.onrender.com/api
```

#### Backend to Render
```bash
# 1. Go to render.com
# 2. Create new Web Service
# 3. Connect GitHub repo
# 4. Runtime: Node
# 5. Build command: npm install --prefix server
# 6. Start command: node server/src/server.js
# 7. Environment variables:
#    - DATABASE_URL: (Neon PostgreSQL)
#    - JWT_SECRET
#    - SOLANA_RPC_URL
#    - SOLANA_NETWORK
#    - PORT: 8080
#    - CLIENT_URL
```

---

### Option 3: AWS (Most Control)

#### Frontend to S3 + CloudFront
```bash
# Build client
cd client
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# CloudFront handles distribution
```

#### Backend to EC2
```bash
# SSH into EC2 instance
ssh -i key.pem ec2-user@your-instance-ip

# Clone repo
git clone <your-repo-url>
cd sol-Pay/server

# Setup environment
cp .env.example .env
nano .env  # Edit variables

# Install & run
npm install
npm start  # Uses PM2 for process management (production)

# For production process management:
npm install -g pm2
pm2 start src/server.js --name "solpay"
pm2 startup
pm2 save
```

---

## 🗄️ Database Setup (Production)

### Neon PostgreSQL (Free Tier)
```bash
# 1. Go to neon.tech
# 2. Sign up free account
# 3. Create PostgreSQL database
# 4. Copy connection string
# 5. Add to .env: DATABASE_URL="postgresql://user:password@host/dbname"
# 6. Run migration: npx prisma migrate deploy
```

### AWS RDS PostgreSQL
```bash
# 1. Create RDS instance (t3.micro free tier)
# 2. Setup security groups (allow port 5432)
# 3. Get connection string
# 4. Set DATABASE_URL in production .env
# 5. Run migration: npx prisma migrate deploy
```

### Connection String Format
```
postgresql://username:password@hostname:5432/dbname

Example:
postgresql://admin:mySecurePassword123@db.neon.tech:5432/solpay
```

---

## 🔑 Environment Variables (Production)

### Backend `server/.env` (Production)
```bash
# Database (use Neon or AWS RDS)
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="generate-a-secure-random-key-256-chars"
# Generate with: openssl rand -base64 32

# Solana
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"  # Mainnet
SOLANA_NETWORK="mainnet-beta"

# Web3 Services
DUNE_API_KEY="your-dune-api-key"
CLOAK_API_KEY="your-cloak-api-key"

# Server
PORT=8080  # Railway/Render default
CLIENT_URL="https://your-deployed-frontend.vercel.app"  # Or your domain
NODE_ENV="production"
```

### Frontend `client/.env` (Production)
```bash
VITE_API_BASE="https://your-deployed-backend.onrender.com/api"
```

---

## ✅ Post-Deployment Verification

### Health Check
```bash
curl https://your-backend-url/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Database Connection
```bash
# Backend logs should show connection success
# No "Cannot connect to database" errors
```

### API Test
```bash
# Register new user
curl -X POST https://your-backend-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"pass123"}'

# Should return JWT token
```

### Frontend Load
```bash
# Visit https://your-frontend-url
# Should load login page without errors
# Network tab shows successful API calls
```

---

## 🔒 Security Considerations (Production)

### HTTPS Only
- ✅ Always use HTTPS (not HTTP)
- ✅ Vercel/Railway/Render provide free SSL

### Environment Secrets
- ✅ Never commit `.env` files
- ✅ Use deployment platform's secret manager
- ✅ Rotate `JWT_SECRET` regularly
- ✅ Use strong, random secrets (32+ characters)

### Database
- ✅ Enable encryption at rest (Neon/RDS)
- ✅ Use strong database passwords
- ✅ Restrict IP access (if possible)
- ✅ Regular backups enabled

### API Security
- ✅ CORS configured for your domain only
- ✅ Rate limiting (add express-rate-limit)
- ✅ Input validation on all endpoints
- ✅ No sensitive data in logs

---

## 📊 Monitoring & Logs

### Railway Logs
```bash
# View real-time logs in Railway dashboard
# Or use CLI:
railway logs
```

### Render Logs
```bash
# View in Render dashboard
# Settings → Logs
```

### Vercel Logs
```bash
# View in Vercel dashboard
# Deployments → Logs
```

### Error Tracking (Optional)
```bash
# Add Sentry for production error tracking
npm install @sentry/node

# Initialize in server.js:
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

## 🚀 Scaling Tips (Post-MVP)

### Caching
```bash
# Add Redis for session caching
npm install redis
# Store JWT tokens in Redis instead of browser
```

### CDN for Frontend
```bash
# Vercel/Railway provide global CDN automatically
# Or use Cloudflare for additional optimization
```

### Database Optimization
```bash
# Add indexes for frequent queries:
# - User.username
# - Transfer.senderId, receiverId
# - Contact.ownerId

# See schema.prisma for @@index directives
```

### Load Balancing
```bash
# Railway/Render handle load balancing automatically
# For self-hosted, use Nginx reverse proxy
```

---

## 🔄 Continuous Deployment (CI/CD)

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: nicklasforsman/railway-action@v1
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 🆘 Deployment Troubleshooting

### Build Fails: "Cannot find module"
```bash
# Ensure package.json has all dependencies
npm install --prefix server
npm install --prefix client

# Check node_modules not in git
cat .gitignore | grep node_modules
```

### Runtime Error: "DATABASE_URL undefined"
```bash
# Check environment variable is set in deployment platform
# Verify format: postgresql://user:pass@host/db
# Test connection locally first
```

### CORS Errors on Frontend
```bash
# Update server/.env CLIENT_URL to match deployment domain
# Example: CLIENT_URL="https://mydomain.com"
```

### 502 Bad Gateway
```bash
# Check backend service is running
# Verify PORT is accessible (not blocked)
# Check logs for crash/error messages
```

### Timeout on First Deploy
```bash
# Prisma migrations may take time
# Backend waits for database
# Increase Railway timeout to 10+ minutes
```

---

## 📈 Monitoring Dashboard

### Key Metrics to Track
- ✅ API response time (target: < 500ms)
- ✅ Database query time (target: < 100ms)
- ✅ Error rate (target: < 1%)
- ✅ Uptime (target: 99%+)
- ✅ Active users

### Setup Monitoring
```bash
# Railway includes built-in monitoring
# Render includes metrics dashboard
# Vercel shows performance analytics

# Or use external services:
# - Datadog
# - New Relic
# - Sentry (error tracking)
```

---

## 🎯 Final Deployment Steps

1. **Prepare Repository**
   ```bash
   git add .
   git commit -m "SolPay MVP - Ready for deployment"
   git push origin main
   ```

2. **Choose Platform**
   - Railway (easiest all-in-one)
   - Vercel + Render (more control)
   - AWS (most scalable)

3. **Deploy Frontend**
   - Connect GitHub repo
   - Set build command: `npm install --prefix client && npm run build`
   - Output: `client/dist`

4. **Deploy Backend**
   - Connect GitHub repo
   - Set build command: `npm install --prefix server`
   - Set start command: `node server/src/server.js`
   - Add environment variables

5. **Verify**
   - Check health endpoint
   - Test API calls
   - Login with demo account
   - Send test transfer

6. **Share Links**
   - Frontend: https://your-frontend-url
   - Backend: https://your-backend-url
   - Repo: https://github.com/your-repo

---

## 🎤 For Hackathon Judges

**Deployment URLs:**
- 🌐 Frontend: https://...
- 🔌 API: https://...
- 📁 GitHub: https://github.com/...

**Test Account:**
- Email: user1@example.com
- Password: password123

**Key Features to Demo:**
1. Register → Dashboard → Send Payment
2. Privacy Toggle (🔒 Shielded mode)
3. Search Contacts by @username
4. Chat-like Transfer Interface
5. Balance Display (Dune-ready)

---

**Status:** Ready for production! 🚀

See **README.md** for local setup and **QUICK_REFERENCE.md** for commands.
