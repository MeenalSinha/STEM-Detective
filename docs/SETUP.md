# STEM Detective — Setup & Deployment Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Frontend runtime |
| Python | 3.11+ | Backend runtime |
| Docker | 24+ | Containerization |
| PostgreSQL | 15+ | Primary database |
| Redis | 7+ | Caching & queues |

---

## 1. Supabase Setup

1. Create a new project at https://supabase.com
2. Go to **Settings → Database** and copy the connection string
3. Go to **Settings → API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY`
4. Go to **SQL Editor** and run `docs/database_schema.sql`
5. Go to **Database → Extensions** and enable `pgvector`

---

## 2. OpenAI / Gemini Keys

### OpenAI (Required)
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `OPENAI_API_KEY` — GPT-4o is used for mystery generation

### Google Gemini (Optional — enhances story generation)
1. Visit https://aistudio.google.com/app/apikey
2. Create a key and add to `GEMINI_API_KEY`

---

## 3. Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your keys

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be running at http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...

npm run dev
```

Frontend runs at http://localhost:3000

---

## 4. Full Docker Stack

```bash
# From project root
cp backend/.env.example backend/.env    # Fill in your keys
cp frontend/.env.example frontend/.env.local

docker-compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Redis: localhost:6379

---

## 5. Deploying Frontend to Vercel

```bash
cd frontend
npm install -g vercel
vercel login
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-api.onrender.com
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

Or connect your GitHub repository in the Vercel dashboard for automatic deployments.

---

## 6. Deploying Backend to Render

1. Push your code to GitHub
2. Create a new **Web Service** at https://render.com
3. Select your repository and the `backend/` directory
4. Use the settings from `backend/render.yaml`
5. Add environment variables in the Render dashboard
6. Add the CORS origin: `https://your-app.vercel.app`

The `render.yaml` file automates most of this configuration.

---

## 7. Environment Variables Reference

### Backend (`backend/.env`)

```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/stemdetective
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
OPENAI_API_KEY=sk-...
SECRET_KEY=<random-32-char-string>

# Optional
SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=AIza...
REDIS_URL=redis://localhost:6379
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app
ENVIRONMENT=development
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 8. Hackathon Demo Flow

For a 2-minute demo that hits all the wow moments:

1. **Register as "Detective Raccoon"** — shows the onboarding
2. **Generate mystery** — enter "Photosynthesis", select Environmental, Medium
   - AI generates "The Greenhouse Crisis" in ~5 seconds
3. **Click "Continue Case"** — lands on investigation page
4. **Type**: "I inspect the river water" — AI dungeon master responds dramatically
5. **Type**: "I talk to Dr. Chen" — new clue is revealed
6. **Switch to Crime Lab tab** → Open Chemistry Lab → Run pH Test on "river_water_contaminated"
   - Shows pH gauge: 2.1 (dangerously acidic)
7. **Switch to Hypothesis tab** → Type hypothesis → Submit
   - AI evaluates and awards XP
8. **Show Dashboard** — XP bar fills, knowledge graph updates, achievements unlock

Total time: ~90 seconds, 4+ wow moments.

---

## 9. Testing

```bash
cd backend
source venv/bin/activate
pytest tests/ -v

# Run specific test
pytest tests/test_main.py::test_chemistry_simulation -v
```

---

## 10. Architecture Overview

```
                    ┌─────────────────┐
                    │   Next.js 15    │  ← Vercel
                    │   (Frontend)    │
                    └────────┬────────┘
                             │ HTTPS REST API
                    ┌────────▼────────┐
                    │   FastAPI       │  ← Render
                    │   (Backend)     │
                    └──┬──────────┬───┘
                       │          │
           ┌───────────▼──┐  ┌────▼──────────┐
           │  PostgreSQL  │  │  OpenAI GPT-4o │
           │  + pgvector  │  │  (Mystery AI)  │
           │  (Supabase)  │  └───────────────-┘
           └──────────────┘
                    │
           ┌────────▼────────┐
           │     Redis       │  ← Render
           │  (Cache/Queue)  │
           └─────────────────┘
```

---

## 11. Key Files Reference

```
stem-detective/
├── backend/
│   ├── app/
│   │   ├── main.py                      ← FastAPI app entry point
│   │   ├── api/v1/
│   │   │   ├── endpoints/auth.py        ← Auth: register, login, me
│   │   │   ├── endpoints/cases.py       ← Mystery generation, DM, hints
│   │   │   ├── endpoints/lab.py         ← Virtual lab experiments
│   │   │   └── endpoints/other.py       ← Evidence, users, leaderboard, teacher
│   │   ├── services/
│   │   │   ├── ai/mystery_ai.py         ← All GPT-4o AI calls
│   │   │   ├── lab/simulations.py       ← Physics/chem/bio/env simulations
│   │   │   └── learning/engine.py       ← XP, levels, knowledge graph
│   │   ├── models/models.py             ← All SQLAlchemy models
│   │   └── schemas/schemas.py           ← All Pydantic schemas
│   └── alembic/                         ← Database migrations
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/page.tsx           ← Main dashboard (matches screenshot)
│   │   ├── cases/
│   │   │   ├── page.tsx                 ← Cases list + mystery generator
│   │   │   └── [id]/page.tsx            ← Investigation + DM chat + lab
│   │   ├── lab/page.tsx                 ← STEM Crime Lab with simulations
│   │   ├── knowledge-graph/page.tsx     ← Interactive knowledge graph
│   │   ├── achievements/page.tsx        ← Badges and achievements
│   │   ├── leaderboard/page.tsx         ← Global rankings
│   │   └── teacher/page.tsx             ← Teacher dashboard + mystery studio
│   ├── components/
│   │   └── knowledge-graph/
│   │       └── KnowledgeGraphMini.tsx   ← Canvas-based mini graph
│   ├── lib/
│   │   ├── api.ts                       ← All API calls (axios)
│   │   └── store/auth.ts                ← Zustand auth state
│   └── types/index.ts                   ← All TypeScript types
│
└── docs/
    ├── database_schema.sql              ← Full Supabase SQL schema
    ├── kubernetes.yaml                  ← K8s deployment manifest
    └── SETUP.md                         ← This file
```
