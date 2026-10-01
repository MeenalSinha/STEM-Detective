# STEM Detective

**Use science to solve mysteries.** A mobile detective game where you inspect evidence, question witnesses, run real experiments and defend a hypothesis. You have to understand the science to crack the case.

> Status: hackathon build for RevenueCat Shipaton 2026. Store links, demo video and screenshots are placeholders until published (see [docs/SHIPATON.md](docs/SHIPATON.md)).

## Why it exists
Students rarely get to *use* science the way scientists do: measure, control variables, rule things out, argue from evidence. STEM Detective turns that into a mystery. It is a game first and a lesson second. There are no quiz questions; the answer must be inferred.

## How the game works
`Case briefing -> Investigate the scene -> Question witnesses -> Lab experiments -> Connect clues -> Hypothesis -> Review -> Case closed -> XP / level-up`

## Flagship case: The Silent Greenhouse
Two benches of tomato seedlings are dying while a third thrives, and everyone swears the care routine is unchanged. The player must find out why.

- 8 inspectable locations, 19 pieces of evidence, 3 witnesses with different attitudes (one only talks when confronted with evidence)
- Lab: pH probe, live nutrient-availability model, fertilizer acidity comparison, controlled lime trial
- Evidence board: connect clues into 9 validated inferences
- Free-text hypothesis scored against a rubric (acidity, cause, mechanism, ruled-out alternatives) and **requires cited evidence**. Nonsense, or a right answer with no support, does not solve the case
- Red herrings (light, temperature, pests, water) can be ruled out with real data

The science: the cheaper ammonium sulfate fertilizer is acid-forming; the substrate pH slid from ~6.3 to ~4.7; at that pH Ca/Mg/P/Mo become scarce and Mn/Al turn toxic.

## Key features
- Mobile-first UI: 5-tab navigation, safe areas, 48px+ touch targets, bottom-sheet dialogs, skeleton loaders, error states with recovery actions
- XP, levels, ranks, achievements, knowledge graph, server-persisted progress
- Tiered contextual hints; Pro hints point out relationships the player overlooked
- Works fully without any AI key; AI only enriches (see below)
- Account deletion in-app (App Store 5.1.1(v))

## AI architecture
**The game logic is deterministic and server-side; AI is an enhancement, never the judge.**
- Scoring, evidence unlocks, lab models and witness knowledge are authored and testable (`backend/app/services/flagship/`)
- When Gemini/OpenAI keys exist, AI (a) phrases a witness reply for questions the scripted matcher does not cover, using *only* facts the player is entitled to hear, and (b) rewrites hypothesis feedback as Socratic guidance. It cannot change a verdict or reveal the solution
- Legacy AI mystery generation is kept. With no AI configured it returns HTTP 503 with a recovery message instead of fake output (previously it auto-approved any hypothesis)

## RevenueCat integration
- `@revenuecat/purchases-capacitor` for offerings, purchase, restore. Prices come from the live offering; nothing is hardcoded (`frontend/lib/purchases.ts`)
- RevenueCat `app_user_id` = our backend user id (`Purchases.logIn`)
- **Server-verified entitlements**: the API checks RevenueCat's REST API with a secret key (cached 5 min, 24 h offline grace), and a webhook invalidates the cache on purchase/renewal/expiry (`backend/app/services/billing/revenuecat.py`)
- Gated endpoints return `403 {code: PRO_REQUIRED}`; the client turns that into the paywall. A modified client cannot unlock Pro
- Full details: [docs/MONETIZATION.md](docs/MONETIZATION.md)

## Monetization
Free: complete Silent Greenhouse, basic lab, 3 hints per case, XP, 2 generated cases. **Detective Pro**: Advanced Evidence Analysis, advanced lab (controlled trials), unlimited hints with overlooked-relationship insights, unlimited generated cases. The paywall appears only when a player reaches a gated tool after real play.

## Mobile architecture
Next.js 15 static export (`output: 'export'`) wrapped by Capacitor 8 for Android and iOS. Same bundle runs in the browser. FastAPI + Postgres/pgvector backend.

## Tech stack
Next.js 15 / React 18 / Tailwind / Framer Motion / TanStack Query / Zustand / Capacitor 8 / RevenueCat Capacitor SDK 13 / FastAPI / SQLAlchemy / PostgreSQL + pgvector

## Local development
See [docs/SETUP.md](docs/SETUP.md). Short version:
```bash
# backend
cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL and SECRET_KEY
uvicorn app.main:app --reload
# frontend
cd frontend && npm install && cp .env.example .env.local && npm run dev
```

## Environment variables
`backend/.env.example` and `frontend/.env.example` list every variable. Never commit real keys; the RevenueCat **secret** key lives only on the server.

## Build instructions
```bash
cd frontend
npm run build            # static export -> out/
npx cap sync             # copy into android/ and ios/
npx cap open android     # build/run in Android Studio
npx cap open ios         # build/run in Xcode (macOS)
```

## Tests
```bash
cd backend && pytest tests            # 38 tests (needs Postgres with pgvector)
cd frontend && npm run type-check && npm test   # 10 unit tests
```

## Demo / Screenshots
- Demo video: `TODO: add URL`
- Google Play: `TODO` · App Store: `TODO`
- Screenshots: `docs/screenshots/` `TODO`

## Awards / categories targeted
`TODO: confirm against the official rules.` See [docs/SHIPATON.md](docs/SHIPATON.md).

## License
MIT, see [LICENSE](LICENSE).
