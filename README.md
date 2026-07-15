# StackBid Mobile

React Native / Expo (TypeScript) client for [stackbid.app](https://stackbid.app).

Talks directly to the same backend as the web app (`https://stackbid.app/api/...`)
— no logic is duplicated on-device. Pricing generation, the freemium gate,
and the Stripe paywall are all server-side, exactly like on the web.

## Phase 1-2 scope (this build)

- **Home** — estimate form (description, ZIP, project type, supplier) → `/api/estimate`
- **Photo** — take/upload a photo of a material, AI-identify + price it (vision prompt via `/api/estimate`)
- **Results** — 3-column price breakdown (retail / wholesale / local), same numbers as web
- **Gate** — first free estimate on a new device shows a preview (3 items) + email capture, mirrors the web's `gate-overlay`
- **Paywall** — second estimate on the same email opens a real Stripe Checkout session via `/api/create-checkout-session` (opens in the system browser)

## Running locally

```bash
cd app
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

## Structure

```
app/
  App.tsx                    # navigation root
  src/
    lib/
      api.ts                 # calls to stackbid.app backend
      storage.ts              # AsyncStorage (mirrors web's localStorage keys)
      theme.ts                # colors/spacing tokens
      types.ts                # shared TS types
    components/
      EstimateResults.tsx     # 3-column price table
      GateModal.tsx           # free-estimate email gate
      PaywallModal.tsx        # $9.99/mo Stripe paywall
    screens/
      HomeScreen.tsx
      PhotoScreen.tsx
      ResultsScreen.tsx
```
