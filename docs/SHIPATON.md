# RevenueCat Shipaton 2026: submission readiness

> Verify every requirement against the official rules page before submitting. Dates below were read from the public Devpost page when this was written and may change.

## Deadline and track (read this first)
- Submission deadline per the Devpost page: **Sept 30, 2026, 11:45 PM PDT**.
- The standard track requires an eligible store release (App Store / Google Play) within the event window. Store review can take days, so a *first* release started on deadline day is unlikely to clear.
- The student "Next Gen" track does not require a store listing but requires: public repo, full source, assets, setup instructions, open-source license, functional demo, RevenueCat integration, demo video. This repo is built to satisfy that route.

## Checklist
| Item | Status |
|---|---|
| Public repository, complete source | Ready (make repo public) |
| Open-source license | Done (MIT) |
| Setup instructions | Done (docs/SETUP.md) |
| RevenueCat powering a purchase | Code done and unit/integration tested with a test double. **Not yet verified on a device against your RevenueCat project** |
| Working demo | Web build verified end to end; native build `TODO` |
| Demo video | `TODO: URL` |
| App icon, store screenshots | `TODO` (placeholder Capacitor icon in use) |
| Privacy policy / terms URLs | Draft pages in app; `TODO` host reviewed versions |
| Store listing URLs | `TODO` |
| Test account for judges | `TODO` |

## Configure before submitting
1. Change `appId` in `frontend/capacitor.config.ts`.
2. Create products, entitlement `pro`, offering `default`, API keys, webhook (docs/SETUP.md).
3. Deploy the API over https; set `NEXT_PUBLIC_API_URL`.
4. Run a sandbox purchase and a restore on a real device; confirm `GET /billing/entitlement` flips to `is_pro: true`.
5. Record the demo; add screenshots to `docs/screenshots/`.

## Honest status
Nothing here claims traction. Add real numbers only if they exist.
