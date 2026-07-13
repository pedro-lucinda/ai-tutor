# AI Tutor Frontend

React SPA for the AI Tutor learning platform. Learners sign in with Auth0, create goal-driven courses, follow structured modules, read streamed markdown lessons, take quizzes, and complete module final tests.

For agent architecture, backend APIs, and full-stack quick start, see the [root README](../README.md).

## Requirements

- Node.js 22+
- npm
- A running [backend](../backend/README.md) (or Docker Compose from the repo root)
- Auth0 SPA application configured for this origin

## Local setup

### Install dependencies

```bash
npm ci
```

### Environment variables

Copy `.env.example` to `.env`:

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | API base path. Use `/api` in dev so Vite proxies to the backend (default). |
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA client ID |
| `VITE_AUTH0_AUDIENCE` | Auth0 API identifier (must match backend `AUTH0_AUDIENCE`) |

Optional for local dev without Docker:

| Variable | Description |
| --- | --- |
| `VITE_DEV_API_PROXY_TARGET` | Backend URL for the Vite dev proxy (default `http://localhost:8000`) |

### Run locally

Start the backend first, then:

```bash
npm run dev
```

The app runs at http://localhost:5173. Requests to `/api/*` are proxied to the backend and rewritten without the `/api` prefix.

### Other scripts

```bash
npm run build    # Typecheck + production bundle → dist/
npm run preview  # Serve the production build locally
npm run lint     # ESLint
```

## Docker

From the repo root, `docker compose up` starts the frontend with hot reload on port 5173. Compose sets `VITE_API_URL=/api`, proxies to the `backend` service, and passes Auth0 vars from the root `.env`.

The frontend `Dockerfile` is a dev-oriented image (`npm run dev`). For production, build static assets with `npm run build` and serve `dist/` behind your reverse proxy or CDN.

## Routes

| Path | Page | Description |
| --- | --- | --- |
| `/` | Home | Course list, create-course CTA |
| `/courses/new` | Create course | Goal input; streams supervisor agent progress |
| `/courses/:courseId` | Course detail | Module/subtopic tree and progress |
| `/courses/:courseId/subtopics/:subtopicId/lesson` | Lesson | Markdown lesson (cached or streamed) |
| `/courses/:courseId/subtopics/:subtopicId/quiz` | Quiz | Multiple-choice quiz |
| `/courses/:courseId/modules/:moduleId/final-test` | Final test | Module-level assessment |
| `/settings` | Settings | BYOK OpenAI API key management |

All routes except Auth0 login are behind `ProtectedRoute`.

## Features

### Authentication

Auth0 (`@auth0/auth0-react`) wraps the app in `AppAuthProvider`. `AuthTokenSync` attaches the access token to API requests. Missing or expired tokens trigger a redirect to login.

Users must add their own OpenAI API key on **Settings** before course creation or content generation (BYOK). `OpenAIKeyBanner` reminds users on key pages when no key is stored.

### Server-Sent Events

Long-running agent work (course creation, lessons, quizzes, final tests) uses SSE instead of polling.

- `src/api/stream.ts` — generic SSE consumer for GET and POST
- `src/hooks/use-agent-progress.ts` — agent step UI and progressive lesson markdown (`useStreamingLesson`, `lesson_delta` events)

Cached content returns JSON immediately; cache misses stream until a `complete` event.

### Internationalization

UI strings use `react-i18next` with English and Brazilian Portuguese (`en`, `pt-BR`). Language is detected from `localStorage` (`ai-tutor-lang`) or the browser. Course content language is chosen separately when creating a course.

### Theming

Light/dark mode is stored in a Zustand theme store and synced to the document via `ThemeSync`. Toggle is in the navbar.

## Project structure

```
src/
├── api/              # HTTP client, Auth0 headers, SSE, endpoint modules
├── components/
│   ├── auth/         # Auth0 provider, protected routes, token sync
│   ├── modules/      # Feature components (sidebar, quiz, markdown, etc.)
│   ├── providers/    # Theme sync
│   └── ui/           # shadcn/ui primitives
├── hooks/            # React Query wrappers, agent progress, streaming
├── i18n/             # i18next config and locale files
├── layouts/          # App shell, course workspace, page scroll
├── lib/              # Utilities, course progress/level helpers
├── pages/            # Route-level page components
├── store/            # Zustand stores (theme, course UI state)
└── types/            # Shared TypeScript API types
```

Path alias `@/` maps to `src/` (see `vite.config.ts` and `tsconfig.app.json`).

## Tech stack

| Area | Libraries |
| --- | --- |
| Framework | React 19, TypeScript, Vite 8 |
| Routing | react-router-dom 7 |
| Data fetching | TanStack Query 5, native `fetch` |
| Auth | Auth0 React SDK |
| Styling | Tailwind CSS 4, shadcn/ui (Base UI) |
| Markdown | react-markdown, remark-gfm |
| State | Zustand |
| i18n | i18next, react-i18next |
| Icons | lucide-react |

UI components follow the shadcn setup in `components.json`. Add new primitives with the shadcn CLI from this directory.
