# Setup

## Prerequisites
Node 20+, Python 3.11+, PostgreSQL 15+ **with the pgvector extension**. Android Studio (Android) and/or Xcode on macOS (iOS).

## 1. Backend
```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # fill DATABASE_URL and SECRET_KEY at minimum
uvicorn app.main:app --reload --port 8000
```
Tables are created on startup. `alembic upgrade head` is also supported. AI keys are optional.

## 2. Frontend (browser)
```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```
Open http://localhost:3000. Purchases are mobile-only; on the web the paywall says so and never fakes a purchase.

## 3. RevenueCat configuration (dashboard)
1. Create a project. Add an Android app (Google Play) and an iOS app (App Store). Package/bundle id must equal `appId` in `frontend/capacitor.config.ts` (default `com.stemdetective.app`; **change it to your own before creating store listings**).
2. In each store, create two auto-renewing subscriptions (monthly, annual) in one subscription group. `TODO: product ids`
3. RevenueCat: **Entitlements** -> create `pro`; attach both products.
4. **Offerings** -> `default` (current) with packages `$rc_monthly` and `$rc_annual`.
5. **API keys**: copy the *public* Android and iOS SDK keys into `frontend/.env.local` (`NEXT_PUBLIC_REVENUECAT_API_KEY_ANDROID/IOS`). Copy the *secret* key into `backend/.env` (`REVENUECAT_SECRET_API_KEY`). For development use a Test Store key.
6. **Webhook** -> URL `https://<your-api>/api/v1/billing/webhook/revenuecat`, Authorization header value = `REVENUECAT_WEBHOOK_AUTH`.
7. Test account: `TODO` (use RevenueCat promotional entitlement or sandbox tester for judges).

## 4. Android build
```bash
cd frontend
NEXT_PUBLIC_API_URL=https://<your-api> npm run build
npx cap sync android
npx cap open android      # Run on device, or Build > Generate Signed Bundle
```
The API must be reachable over **https** from the device. Add your keystore outside the repo (`*.keystore` is git-ignored).

## 5. iOS build (macOS only)
```bash
npx cap sync ios && npx cap open ios
```
Set your team, bundle id and enable the **In-App Purchase** capability in Xcode.

## 6. Tests
```bash
cd backend && pytest tests
cd frontend && npm run type-check && npm test
```
