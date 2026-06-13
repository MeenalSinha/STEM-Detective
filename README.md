# STEM Detective: Multiverse of Mysteries

An AI-powered STEM education platform where students become detectives solving science mysteries.

## Architecture

```
stem-detective/
├── frontend/          Next.js 15 + TypeScript + TailwindCSS
├── backend/           FastAPI + Python
└── docs/              API docs and setup guides
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Supabase account
- OpenAI API key (or Azure OpenAI)

### 1. Clone and install

```bash
git clone <repo>
cd stem-detective
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Fill in your keys
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # Fill in your keys
npm run dev
```

### 4. Docker (full stack)

```bash
docker-compose up --build
```

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://user:pass@localhost:5432/stemdetective
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=your-gemini-key
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-32-chars-min
```

### Frontend `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Features

- AI Mystery Generator (Gemini 2.5 Pro + GPT-4o)
- AI Dungeon Master (live adaptive storytelling)
- STEM Crime Lab (Chemistry, Biology, Physics, Environment)
- Evidence Analysis with AI feedback
- Dynamic World Simulation
- Personalized Learning Engine
- Knowledge Graph visualization
- Adaptive Hint System
- XP & Gamification
- Teacher Dashboard
- Multiplayer Detective Mode
- Mystery Generator Studio
- Accessibility (TTS, STT, dyslexia mode)

## Deployment

- Frontend: Vercel
- Backend: Render
- Database: Supabase (managed PostgreSQL + pgvector)
