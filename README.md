This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Extension Guide

### Overview

This project implements a chat-based quick diagnosis and a detailed diagnosis (MBTI + Big Five) using fully free, local AI via `@xenova/transformers`. All backend is handled by Next.js API routes.

### APIs

- POST `/api/session` — create a session (in-memory + SQLite if available)
- POST `/api/chat?sessionId=...` — quick diagnosis chat turn. Auto-creates session if missing.
- GET `/api/result?sessionId=...` — returns MBTI axes, type, and generated story
- GET `/api/questions/detail` — returns the 30-question detailed questionnaire
- POST `/api/diagnose/detail?sessionId=...` — computes MBTI/Big Five and returns summary and optional story

### Database (SQLite)

- Library: `better-sqlite3`
- Default file: `./data.sqlite` (set with `DB_PATH` to override)
- Tables: `user_session`, `conversation_log`, `mbti_result`, `detail_result`
- If SQLite is unavailable, the app continues with in-memory store only.

### Free AI Model

- Default: `Xenova/Qwen2.5-0.5B-Instruct` via `@xenova/transformers` (no API keys)
- Configure with `LLM_MODEL` env var to switch models
- First run downloads the model to cache; subsequent runs use local cache

### Consent UI

- Site-wide banner informs users and stores consent in `localStorage` key `consent.v1` (`agree`/`later`)

### Detailed Diagnosis (UI)

- Start: `/detail` → `/detail/take`
- Progress indicator shows answered/total
- Submit sends answers to `/api/diagnose/detail`
- Result shows MBTI, Big Five, summary, and generated story

### Development Notes

- Node runtime is required for server routes (uses SQLite and transformers)
- If you deploy without SQLite, the app still works; persistence is optional
- Windows users may need build tools for `better-sqlite3`

### Roadmap Ideas

- Persist consent and results per user with encryption
- Charts for Big Five on results page
- Session history screen and re-diagnosis compare
