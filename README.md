# Immailer — Private Email Open Tracker

## Project Structure
```
immailer/
├── backend/          ← FastAPI server (deploy to Render.com)
│   ├── app/
│   │   ├── main.py       ← Pixel endpoint + API
│   │   └── database.py   ← Supabase (PostgreSQL) queries
│   ├── requirements.txt
│   └── supabase_schema.sql
├── extension/        ← Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   └── icons/
└── dashboard/        ← Coming in Phase 2
```

---

## STEP 1: Supabase Setup (Database)

1. Go to https://supabase.com → Sign up with GitHub
2. Click **New project** → Name it `immailer` → Set a DB password → Save it
3. Wait ~2 minutes for provisioning
4. Go to **SQL Editor** → Paste full content of `backend/supabase_schema.sql` → Click Run
5. Go to **Settings → Database** → Copy the **Connection string (URI)**
   - Format: `postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres`
   - Save this — you need it for Render

---

## STEP 2: Deploy Backend to Render.com

1. Push this project to GitHub:
   ```bash
   cd immailer
   git init
   git add .
   git commit -m "Initial immailer setup"
   # Create repo on github.com named 'immailer'
   git remote add origin https://github.com/YOURUSERNAME/immailer.git
   git push -u origin main
   ```

2. Go to https://render.com → **New → Web Service**
3. Connect your GitHub repo → Select `immailer`
4. Settings:
   - **Root directory**: `backend`
   - **Runtime**: Python 3
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add **Environment Variables**:
   - `DATABASE_URL` = your Supabase connection string
   - `API_KEY` = pick any secret string (e.g. `immailer_secret_2024`)
6. Click **Deploy** → Wait ~3 minutes
7. Test: visit `https://immailer.onrender.com/health` → should return `{"status":"ok"}`

---

## STEP 3: Install Chrome Extension

1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → Select the `immailer/extension/` folder
4. Extension appears in toolbar
5. Click the Immailer icon → **Settings tab**:
   - **API Key**: enter the same value you set in Render (`API_KEY`)
   - **Server URL**: `https://immailer.onrender.com`
   - Click **Save Settings**

---

## STEP 4: Send Your First Tracked Email

1. Open Gmail in Chrome
2. Click **Compose**
3. You'll see the green **"Immailer tracking ON"** bar at the bottom
4. Send your email as normal — pixel is injected automatically
5. When the recruiter opens it, click Immailer icon → see open time, location, device

---

## What Data You Get

| Data point | Desktop Gmail | Mobile Gmail |
|---|---|---|
| Open timestamp | ✅ Exact | ✅ Exact |
| Open count | ✅ | ✅ |
| City / Country | ✅ Recruiter's location | ⚠️ Google proxy location |
| ISP / Company | ✅ Often shows company name | ❌ Google LLC |
| Device / Browser | ✅ Full user-agent | ⚠️ Google ImageProxy |

---

## Privacy Note
The tracking pixel is a standard 1×1 GIF — invisible to recipients.
No third party sees your data. All events stored in your own Supabase DB.
