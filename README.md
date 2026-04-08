# Bastar Mart (Production-Ready Setup)

E-commerce web app with:
- **Frontend**: React + Tailwind (CRA + CRACO)
- **Backend**: FastAPI + MongoDB

## Project Structure

- `frontend/` → client app (deploy to Vercel)
- `backend/` → FastAPI API (deploy to Render/Railway)

## Environment Variables

### Frontend (`frontend/.env`)

Copy from `frontend/.env.example`:

```bash
REACT_APP_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)

Copy from `backend/.env.example` and set real values:

```bash
PORT=8000
MONGO_URL=mongodb://localhost:27017
DB_NAME=bastarmart
JWT_SECRET=change-me
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.vercel.app
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Production Build

```bash
cd frontend
npm run build
```

## Deployment

### Frontend → Vercel

1. Import `frontend/` as project root.
2. Build command: `npm run build`
3. Output directory: `build`
4. Set env var: `REACT_APP_API_URL=https://<your-backend-domain>`

`frontend/vercel.json` is included for CRA output defaults.

### Backend → Render / Railway

1. Use `backend/` as service root.
2. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - `backend/Procfile` is included.
3. Add environment variables from `backend/.env.example`.
4. Ensure MongoDB and Cloudinary credentials are configured.

## Improvements Included

- Unified frontend API config through `REACT_APP_API_URL`.
- Better frontend request error handling and loading states.
- Cart checkout now uses the **current session cart** (fixes cross-user order bug).
- Backend validates product existence for cart operations.
- Backend CORS config is environment-driven and safer for credentialed requests.
- Backend supports dynamic `PORT` in runtime.
