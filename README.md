# Bastar Mart (Production-Ready Setup)

This repository contains:
- `frontend/` → React + Tailwind app (deploy to **Vercel**)
- `backend/` → FastAPI API (deploy to **Render** or **Railway**)

## 1) Local development

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.template .env
python server.py
```
Backend runs on `PORT` from `.env` (default `8000`).

### Frontend
```bash
cd frontend
npm install
cp .env.template .env
npm start
```
Frontend uses `REACT_APP_API_URL` from `.env` (default `http://localhost:8000/api`).

---

## 2) Environment variables

### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:8000/api
PORT=3000
```

### Backend (`backend/.env`)
```env
PORT=8000
MONGO_URL=mongodb://localhost:27017
DB_NAME=bastarmart
CORS_ORIGINS=http://localhost:3000
JWT_SECRET=change-this-secret
ADMIN_EMAIL=admin@bastarmart.com
ADMIN_PASSWORD=Admin@123
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 3) Deployment

## Frontend → Vercel
1. Import repository in Vercel.
2. Set Root Directory to `frontend`.
3. Build command: `npm run build`
4. Output directory: `build`
5. Add env var:
   - `REACT_APP_API_URL=https://<your-backend-domain>/api`

`frontend/vercel.json` is included for SPA route rewrites.

## Backend → Render
1. Create a new Web Service from this repository.
2. Set Root Directory to `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add env vars from `backend/.env.template`.

`backend/Procfile` is included for compatibility.

## Backend → Railway
1. Create project from this repo.
2. Set service root to `backend`.
3. Start command: `python server.py` (or uvicorn command above).
4. Configure same environment variables as Render.

---

## 4) Notes
- CORS is configured via `CORS_ORIGINS` (comma-separated origins).
- Cart checkout now places orders using the current cart `session_id`.
- API URLs are environment-based; no hardcoded backend host required.
