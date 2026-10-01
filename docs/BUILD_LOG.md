# Build log (build-in-public notes)

## What existed before
FastAPI + Postgres backend with AI mystery generation (Gemini/OpenAI), XP/levels, achievements, knowledge graph, multiplayer and teacher screens; a desktop-style Next.js frontend with a sidebar layout copied into every page.

## Problems found
- Hypothesis evaluation returned `is_correct: true, score 0.95` for *any* input when no AI key was set
- App crashed at import without `OPENAI_API_KEY`
- Anyone could register with `role: "admin"`
- 8 TypeScript errors; Next 15.0.0 with a published CVE; Google Fonts fetched at build time
- "First Case" achievement could never unlock (no code fired its event)
- Dynamic routes prevented a static export for Capacitor

## What was added
- Authored, deterministic flagship case + engine + 26 tests
- RevenueCat SDK integration, server-verified entitlements, webhook, Pro gating
- Mobile shell, 14 polished screens, paywall, lab, board, case-closed sequence
- Capacitor Android/iOS projects, account deletion, docs

## Iterations worth noting
- End-to-end browser run caught a stale-cache bug that bounced players off the "Case closed" screen after a correct answer; fixed by refetching before navigating
- First lab data had the pH crossing the threshold on the same day as symptoms, which contradicted the story; reseeded so cause precedes effect

## Still to fill in honestly
User feedback, pricing experiments and launch learnings: `TODO`.
