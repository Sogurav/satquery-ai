# SatQuery AI — Implementation Plan
**Prototype version — Scrum-style parallel phases**

---

## Team Split

- **Frontend team:** Sarthak, Soham (+ Chinmay if available)
- **Backend team:** Karan (lead), Khushi, Ronit

Both teams work in parallel from Day 1 — they meet at integration points, not sequentially.

## Phase 0 — Setup (Day 1, first few hours)

**Both teams:**
- Create GitHub repo, agree on branch strategy (`main` + feature branches, PRs before merge)
- Set up `.env.example` (never commit real `.env`)
- Backend: create free accounts — Supabase, Sentinel Hub, Hugging Face
- Frontend: scaffold Next.js project, install Tailwind + shadcn/ui, connect to GitHub → Vercel (auto-deploy on push)
- Backend: scaffold FastAPI/Flask project, connect to GitHub → deployment target (Render/Hugging Face Space)

## Phase 1 — Core Skeleton (parallel)

**Frontend (Sarthak + Soham):**
- Build `MapPicker` component (Leaflet, draggable bounding box)
- Build `ModeToggle` (single vs comparison)
- Build basic page layout, dark mode theme, Tailwind design tokens per UI_UX_DESIGN.md
- Stub API calls (mock responses) so UI can be tested before backend is ready

**Backend (Karan + Khushi + Ronit):**
- Set up Supabase project, create tables per BACKEND_SCHEMA.md, enable RLS
- Build `/api/fetch-image` endpoint, integrate Sentinel Hub Processing API
- Test image fetch independently (Postman/curl) before wiring to frontend

**Sync point (end of Phase 1):** Frontend can fetch a real image from backend and display it.

## Phase 2 — Query + Model Integration (parallel)

**Frontend:**
- Build `QueryInput`, `LoadingState`, `AnswerCard`, `ExecutionSummary`, `MetricsDisplay` components
- Wire real `/api/query` calls, handle loading/error states

**Backend:**
- Build the Agentic Controller (query classification logic)
- Deploy RS-LLaVA (or fallback model) to Hugging Face Spaces, expose inference endpoint
- Build OpenCV change-detection + HSV metrics pipeline
- Build `/api/query` endpoint tying it all together, return structured response per APP_FLOW.md

**Sync point (end of Phase 2):** Full flow works locally — map select → image fetch → question → real answer.

## Phase 3 — Auth, History, Polish (parallel)

**Frontend:**
- Add Supabase Auth (login/signup) — keep simple, email/password is enough for prototype
- Build `HistoryList` (optional, if time allows)
- Polish UI: micro-interactions, glassmorphism panels, responsive check

**Backend:**
- Wire `/api/history` endpoint
- Add rate limiting on `/api/query`
- Run through the full TRD security checklist — this is a required step, not optional
- Add server-side input validation on all endpoints

## Phase 4 — Deployment & Testing (both teams together)

- Deploy frontend to Vercel (production build)
- Deploy backend to Render / Hugging Face Space (production)
- Full end-to-end test: at least 3 real location + question combinations, both modes
- Test cold-start behavior (does the demo work if nobody has used it in the last hour? Free-tier services can sleep — test this the day before presenting)
- Prepare fallback: if live model inference fails during judging, have the metrics-only path ready as a graceful degrade (per APP_FLOW.md error handling)

## Suggested Working Method (per your "isolated worktrees" idea)

Since different people may use different AI coding assistants, treat each phase's tasks as **isolated, scoped units** — one person/pair works on one component at a time with a clear, narrow instruction (not "build the whole frontend"), checks it in, then picks up the next scoped task. This keeps each AI assistant's context focused and avoids conflicting overlapping edits. Suggested cycle: **assign a scoped task (e.g. "build MapPicker component only") → build → commit/PR → review → next task** — short cycles, not one giant open-ended session per person.

## Timeline Guidance (adjust to your actual days available)

- Day 1: Phase 0 + Phase 1
- Day 2: Phase 2
- Day 3: Phase 3
- Day 4 (or final day before demo): Phase 4 + buffer for fixing whatever breaks
