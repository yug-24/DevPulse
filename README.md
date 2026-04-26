# DevPulse — GitHub Analytics Dashboard

Your GitHub story, beautifully told. Connect your GitHub account and get a stunning analytics dashboard with commit heatmaps, streak tracking, language trends, and a shareable profile link.

## Stack

**Frontend:** React 18, Vite, TailwindCSS, Recharts  
**Backend:** Node.js, Express, MongoDB, Passport.js (GitHub OAuth), JWT  
**Deploy:** Vercel (frontend) + Railway (backend) + MongoDB Atlas

## Features

- GitHub OAuth — one-click connect, read-only access
- Commit heatmap (365 days of contributions)
- Current + longest streak tracker
- Language breakdown by bytes written
- PR velocity and merge rate analytics
- Shareable public profile with custom slug
- Dark GitHub-inspired UI

## Local Setup

### 1. Create a GitHub OAuth App

Go to **github.com/settings/developers** → New OAuth App:
- Homepage URL: `http://localhost:5173`
- Callback URL: `http://localhost:5000/api/auth/github/callback`

Copy the **Client ID** and **Client Secret**.

### 2. Install dependencies

```bash
npm install
cd server && npm install && cd ..
cd client && npm install --legacy-peer-deps && cd ..
```

### 3. Configure environment

```bash
cp server/.env.example server/.env
# Fill in: MONGODB_URI, JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Run

```bash
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:5000
```

Click **Connect GitHub** on the landing page → authorise → dashboard loads.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 64-char random hex string |
| `JWT_EXPIRES_IN` | Token lifetime (default: `7d`) |
| `GITHUB_CLIENT_ID` | From your GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | From your GitHub OAuth App |
| `GITHUB_CALLBACK_URL` | `http://localhost:5000/api/auth/github/callback` |
| `CLIENT_URL` | `http://localhost:5173` (Vercel URL in production) |

## Deployment

- **Frontend** → Vercel (root dir: `client/`)
- **Backend** → Railway (root dir: `server/`)
- **Database** → MongoDB Atlas (free M0 tier)

Update `GITHUB_CALLBACK_URL` to your Railway URL before deploying.

## Built by

Yug Bhatt — [github.com/yug-24](https://github.com/yug-24)
