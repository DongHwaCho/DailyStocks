# replit.md

## Overview

This is a Korean stock market "상한가" (upper limit / limit-up) tracker application. It displays stocks that hit their daily upper price limit on the Korean stock exchanges (KOSPI and KOSDAQ), crawls related news articles from Naver, and uses AI (OpenAI) to generate summaries explaining why each stock hit its upper limit. The UI is built for a Korean-speaking audience with Korean locale formatting, Korean fonts, and Korean stock market conventions (red = up, blue = down).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state (fetch, cache, mutations)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Animations**: Framer Motion for page transitions and card animations
- **Styling**: Tailwind CSS with CSS variables for theming, custom Korean-optimized fonts (Noto Sans KR, Inter)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Key pages**: Home page shows stock cards in a grid, with a detail dialog for individual stocks

### Backend
- **Framework**: Express.js running on Node with TypeScript (tsx for dev, esbuild for production)
- **API Pattern**: REST API with typed contracts defined in `shared/routes.ts` using Zod schemas
- **Key endpoints**:
  - `GET /api/stocks` — List all upper-limit stocks (optionally filtered by date)
  - `GET /api/stocks/:id` — Get single stock with related news
  - `POST /api/stocks/:id/analyze` — Trigger AI analysis of why a stock hit upper limit
  - `POST /api/stocks/crawl` — Crawl and seed stock data
- **Web scraping**: Uses axios + cheerio to crawl Naver News for stock-related articles
- **AI Integration**: OpenAI API (via Replit AI Integrations) for generating reason summaries
- **Static serving**: In production, serves built Vite output from `dist/public`; in development, uses Vite dev server middleware with HMR

### Database
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod validation
- **Schema location**: `shared/schema.ts` (main app tables), `shared/models/chat.ts` (chat integration tables)
- **Main tables**:
  - `upper_limit_stocks` — Stock records with date, symbol, name, price, change rate, sector, market type, AI reason summary
  - `news_articles` — News articles linked to stocks via `stock_id` foreign key
  - `conversations` and `messages` — Chat integration tables (from Replit AI integrations)
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)

### Shared Layer
- `shared/schema.ts` — Database table definitions, Drizzle relations, Zod insert schemas, and TypeScript types
- `shared/routes.ts` — API contract definitions with Zod validation schemas for request/response types
- Types like `Stock`, `News`, `StockWithNews`, `CreateStockRequest` are exported from the schema

### Replit Integrations
The project includes several Replit AI integration modules under `server/replit_integrations/` and `client/replit_integrations/`:
- **Chat** — Conversation storage and chat routes using OpenAI
- **Audio** — Voice recording, streaming playback, speech-to-text via AudioWorklet
- **Image** — Image generation using gpt-image-1
- **Batch** — Batch processing utilities with rate limiting and retries (p-limit, p-retry)

### Build System
- **Dev**: `tsx server/index.ts` with Vite dev middleware for HMR
- **Build**: Custom `script/build.ts` that runs Vite build for client and esbuild for server, outputting to `dist/`
- **Production**: `node dist/index.cjs`

## External Dependencies

- **PostgreSQL** — Primary database, connected via `DATABASE_URL` env var, using `pg` Pool with `connect-pg-simple` for sessions
- **OpenAI API** — Used for AI-powered stock analysis summaries and chat; configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
- **Naver Search** — Web scraping Naver News search results for stock-related articles (no API key needed, uses HTTP requests with cheerio parsing)
- **Google Fonts** — Noto Sans KR, Inter, DM Sans, Fira Code, Geist Mono loaded via CDN
- **Key npm packages**: express, drizzle-orm, @tanstack/react-query, framer-motion, wouter, axios, cheerio, zod, date-fns, lucide-react, shadcn/ui components (Radix UI)