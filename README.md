# Revisionsassistent

KI-gestützte Prüfungssoftware für eingeschränkte Revisionen nach SER 2022.

## Stack

- React + Vite
- Supabase (Auth + DB + Storage)
- Vercel (Hosting)
- Claude API (KI-Analyse)

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
```

## Deploy

Push to `main` → Vercel auto-deploys.
