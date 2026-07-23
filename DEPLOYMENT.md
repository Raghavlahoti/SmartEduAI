# EduPilot AI — Production Deployment Guide

This guide provides step-by-step instructions for deploying **EduPilot AI** to cloud infrastructure:
- **Frontend**: [Vercel](https://vercel.com/)
- **Backend API**: [Render](https://render.com/)
- **Database**: Cloud MySQL ([PlanetScale](https://planetscale.com/), [Aiven](https://aiven.io/), [Railway](https://railway.app/), [Render MySQL](https://render.com/), or [AWS RDS](https://aws.amazon.com/rds/))

---

## 📐 Architecture Overview

```
 ┌──────────────────────┐         HTTP / REST          ┌──────────────────────┐
 │   Vercel Frontend    │ ───────────────────────────> │    Render Backend    │
 │ (HTML / CSS / JS SPA)│ <─────────────────────────── │ (Express 5.x Server) │
 └──────────────────────┘                              └──────────┬───────────┘
                                                                  │
                                            ┌─────────────────────┴─────────────────────┐
                                            │                                           │
                                            ▼                                           ▼
                             ┌───────────────────────────┐               ┌───────────────────────────┐
                             │    OpenRouter AI API      │               │   Cloud MySQL Database    │
                             │ (LLM Model Dispatcher)    │               │  (SSL Encrypted Pool)     │
                             └───────────────────────────┘               └───────────────────────────┘
```

---

## 📋 Prerequisites

Before starting, ensure you have:
1. A **GitHub** account with this repository pushed.
2. A **Vercel** account linked to your GitHub.
3. A **Render** account linked to your GitHub.
4. An **OpenRouter API Key** (obtain free at [openrouter.ai/keys](https://openrouter.ai/keys)).
5. A **Cloud MySQL Instance** connection URI or host credentials.

---

## 1. 🐙 GitHub Setup

1. **Commit and Push Code to GitHub**:
   ```bash
   git add .
   git commit -m "chore: prepare project for production deployment"
   git push origin main
   ```

2. **Verify Repository Structure**:
   Ensure the following deployment blueprint files are present in the repository root:
   - [`vercel.json`](file:///d:/EduPilot-AI/vercel.json)
   - [`render.yaml`](file:///d:/EduPilot-AI/render.yaml)
   - [`.env.example`](file:///d:/EduPilot-AI/.env.example)

---

## 2. 🗄️ Cloud MySQL Database Setup

EduPilot AI includes automatic schema migration on boot for MySQL databases.

### Recommended Providers:
- **Aiven MySQL** (Free tier available)
- **Railway MySQL** ($5 free trial)
- **Render Managed MySQL**
- **PlanetScale** / **AWS RDS**

### Step-by-Step Configuration:
1. Create a MySQL database instance (e.g., named `edupilot_db`).
2. Note your database credentials:
   - `DB_HOST` (e.g., `mysql-aiven-instance.aivencloud.com`)
   - `DB_PORT` (default: `3306`)
   - `DB_USER` (e.g., `avnadmin` or `root`)
   - `DB_PASSWORD` (your secret database password)
   - `DB_NAME` (e.g., `edupilot_db`)
3. **SSL Security**: Most cloud providers require SSL connections. EduPilot AI natively supports SSL when `DB_SSL=true` is set.

---

## 3. 🚀 Render Backend Deployment

Render hosts the Express API server and dispatches requests to OpenRouter and MySQL.

### Option A: Automatic Blueprint Deployment (Recommended)
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** $\rightarrow$ **Blueprint**.
3. Select your `EduPilot-AI` GitHub repository.
4. Render will automatically detect [`render.yaml`](file:///d:/EduPilot-AI/render.yaml).
5. Fill in the prompted secret environment variables (`OPENROUTER_API_KEY`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`).
6. Click **Apply**.

### Option B: Manual Web Service Setup
1. On Render Dashboard, click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository.
3. Configure the following fields:
   - **Name**: `edupilot-ai-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to users (e.g., Oregon or Frankfurt)
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Health Check Path**: `/api/health`
4. Add Environment Variables (see table below).
5. Click **Create Web Service**.
6. Once deployed, copy your Render Web Service URL (e.g., `https://edupilot-ai-backend.onrender.com`).

---

## 4. ⚡ Vercel Frontend Deployment

Vercel hosts the static HTML, CSS, JavaScript frontend and routes API requests seamlessly.

### Step-by-Step Deployment:
1. Log in to [vercel.com](https://vercel.com/) and click **Add New...** $\rightarrow$ **Project**.
2. Import your `EduPilot-AI` GitHub repository.
3. Configure Project Settings:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (leave default)
   - **Build & Output Settings**: Default (static output from `frontend/`)
4. Click **Deploy**.
5. Once deployed, Vercel will provide your production URL (e.g., `https://edupilot-ai.vercel.app`).

### Update Vercel Backend Rewrite:
In [`vercel.json`](file:///d:/EduPilot-AI/vercel.json), replace `https://edupilot-ai-backend.onrender.com` with your exact Render web service URL if different:
```json
{
  "routes": [
    {
      "src": "/chat",
      "dest": "https://YOUR-RENDER-APP-NAME.onrender.com/chat"
    },
    {
      "src": "/api/(.*)",
      "dest": "https://YOUR-RENDER-APP-NAME.onrender.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

---

## 🔐 Environment Variables Reference

Configure these variables in your **Render Web Service Environment Settings**:

| Variable | Required | Production Value / Example | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Enables production optimisations |
| `PORT` | Yes | `10000` (or set automatically by Render) | Backend HTTP server port |
| `OPENROUTER_API_KEY` | **Yes** | `sk-or-v1-xxxxxxxxxxxx` | Secret OpenRouter API key |
| `OPENROUTER_MODEL` | No | `openrouter/free` | Primary AI model identifier |
| `APP_URL` | Yes | `https://edupilot-ai.vercel.app` | Vercel production frontend URL |
| `CORS_ORIGIN` | Yes | `https://edupilot-ai.vercel.app,*.vercel.app` | Allowed CORS origins |
| `DB_HOST` | No | `aws.connect.psdb.cloud` | Cloud MySQL host address |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_USER` | No | `avnadmin` | MySQL username |
| `DB_PASSWORD` | No | `secret_password` | MySQL password |
| `DB_NAME` | No | `edupilot_db` | MySQL database name |
| `DB_SSL` | No | `true` | Enables SSL for Cloud MySQL |
| `DB_SSL_REJECT_UNAUTHORIZED` | No | `false` | Disables self-signed cert rejection |

---

## 🧪 Post-Deployment Feature Verification Checklist

Verify that all key features function in production:

- [ ] **Health Check**: Open `https://edupilot-ai-backend.onrender.com/api/health` and verify HTTP 200 `{ status: "ok" }`.
- [ ] **AI Chat Stream**: Send a prompt in Student, Teacher, and Developer modes. Confirm markdown output renders cleanly.
- [ ] **PDF Parsing**: Upload a multi-page PDF in the input bar and verify client-side PDF.js text extraction.
- [ ] **Image OCR**: Upload an image containing text and verify Tesseract.js OCR extraction.
- [ ] **Voice Input**: Test browser microphone speech-to-text recording.
- [ ] **Markdown Export**: Click "Export Markdown" and confirm file download.
- [ ] **Session Persistence**: Refresh the page and confirm chat history loads from local memory/MySQL.

---

## ❓ Troubleshooting & Common Deployment Issues

### 1. **CORS Policy Error in Browser Console**
* **Symptom**: `Access to fetch at ... from origin ... has been blocked by CORS policy`.
* **Fix**: Ensure `CORS_ORIGIN` on Render includes your Vercel URL (e.g. `https://edupilot-ai.vercel.app`). Restart the Render service.

### 2. **Render Cold Start Delay**
* **Symptom**: First request after inactivity takes 30–50 seconds.
* **Fix**: Render's free tier spins down after 15 minutes of inactivity. Upgrade to Render Starter ($7/mo) or use a uptime monitor service (e.g. UptimeRobot pinging `/api/health` every 10 mins).

### 3. **MySQL SSL Handshake Error**
* **Symptom**: `Error: HANDSHAKE_SSL_ERROR` or `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`.
* **Fix**: Ensure `DB_SSL=true` and `DB_SSL_REJECT_UNAUTHORIZED=false` are configured in Render environment settings.

### 4. **OpenRouter 401 Unauthorized or 402 Insufficient Quota**
* **Symptom**: AI responses fail with "OPENROUTER_API_KEY is missing or invalid".
* **Fix**: Check `OPENROUTER_API_KEY` on Render. Ensure there are no surrounding quotes or extra spaces. Verify credit balance on [openrouter.ai/keys](https://openrouter.ai/keys).

### 5. **Vercel 404 on API Routes**
* **Symptom**: `GET /api/health` or `POST /chat` returns 404 on Vercel domain.
* **Fix**: Verify [`vercel.json`](file:///d:/EduPilot-AI/vercel.json) routes configuration and confirm the backend destination URL is pointing to your active Render web service.
