# Monetization

## Principle
The free game is complete. Pro adds depth for players who want to go further, not a gate on the story.

## Entitlement model
One entitlement, `pro` ("Detective Pro"), unlocked by the monthly or annual subscription.

| Capability | Free | Pro |
|---|---|---|
| The Silent Greenhouse (full case, solvable) | yes | yes |
| Scene, witnesses, evidence board, pH probe, nutrient model, fertilizer comparison | yes | yes |
| XP, levels, achievements, knowledge graph | yes | yes |
| Hints | 3 per case | unlimited, plus overlooked-relationship insight |
| Advanced Evidence Analysis (logger timeline + correlation) | no | yes |
| Advanced lab: controlled lime trial | no | yes |
| Generated AI case files | 2 | unlimited |

Only features that exist and are enforced are listed on the paywall. Planned (not built): premium story arcs, exclusive cases.

## Free-to-paid moment
After a player has gathered four pieces of evidence the **Advanced Evidence Analysis** card appears on the board. Tapping it as a free user opens the paywall with copy about *their* evidence ("Your evidence needs deeper analysis"). Other natural moments: the 4th hint, the lime trial, the 3rd generated case. The paywall never appears at launch.

## Pricing strategy (to be validated)
Monthly + annual with the annual plan shown first and a savings badge computed from the store's own prices. Price points are set in App Store Connect / Play Console and read via RevenueCat at runtime. `TODO: record chosen prices and any intro offer here.` No figures are hardcoded in the app.

## Architecture
```
App (Capacitor)                      API (FastAPI)                     RevenueCat
Purchases.configure + logIn(userId)                                    
getOfferings / purchasePackage ----------------------------------------> store purchase
restorePurchases
                          GET /billing/entitlement  --REST + secret key--> /v1/subscribers/{userId}
                          gated endpoints -> require pro (cached 5 min)  
                          POST /billing/webhook/revenuecat <-- webhook -- purchase/renewal/expiry
```
- Source of truth for gating is the server. A tampered client cannot unlock Pro.
- If RevenueCat is unreachable, the last confirmed state is honoured for 24 h (paying users are not locked out by an outage), then falls back to free.
- Webhook auth is a shared secret compared in constant time; unconfigured = rejected.
- Tests: `backend/tests/test_flagship.py` (gating, grace period, webhook auth), `frontend/tests/purchases.test.ts` (offering mapping, savings math, no web fake).

## Restore / account flows
Restore purchases is on the paywall and in Profile. Deleting an account does not cancel the store subscription; the app says so and points to store settings.

## Expansion
Premium story arcs, more flagship-quality cases, classroom licences (teacher tools already exist in the legacy screens), regional pricing experiments via RevenueCat Experiments.
