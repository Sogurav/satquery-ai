# SatQuery AI — Technical Requirements Document (TRD)
**Prototype version**

---

## 1. Architecture Overview

```
[Browser: React/Next.js frontend]
     |
     |-- Map picker (Leaflet/Mapbox) --> user selects bounding box + date
     |
     |-- HTTP request --> Satellite Imagery API (Sentinel Hub Processing API)
     |         returns PNG image for that exact location/date
     |
     |-- User types question --> sent to Backend API
     |
[Backend API: FastAPI/Flask, hosted on Render or similar]
     |
     |-- Agentic Controller: classifies query type (single-image / comparison)
     |
     |-- Routes to:
     |     - Vision-Language Model inference (hosted on Hugging Face Spaces / Colab-backed endpoint)
     |     - OpenCV-based change detection + HSV metrics (runs on backend directly)
     |
     |-- Returns: answer text + image evidence + execution summary
     |
[Supabase: Auth + Database]
     |-- Stores user sessions, query history, image metadata
```

## 2. Why this stack

- **Frontend (Vercel):** Vercel is excellent for React/Next.js static + serverless frontend hosting, free tier, fast deploys from GitHub. Not suitable for hosting the ML model itself (no persistent GPU, serverless timeout limits).
- **Model inference (Hugging Face Spaces):** Free GPU-backed hosting for exactly this use case — running a vision-language model behind an API. Avoids the Colab-session-dies problem for a live judged demo.
- **Backend logic (Render or Hugging Face Spaces backend):** Handles routing, OpenCV processing, and calls to the model endpoint. Render's free tier works for lightweight Python APIs.
- **Database/Auth (Supabase):** Postgres-based, built-in auth, free tier, generous enough for a prototype demo. Avoids needing to build custom auth.

## 3. Map + Image Fetch — Recommended Approach

Use the **Sentinel Hub Processing API** (not just the EO Browser UI) — it accepts a bounding box + date range + output format via HTTP request and returns an image directly. This solves several problems from your earlier manual-screenshot workflow:
- No UI overlay contamination (clean image, API-returned)
- Consistent, reproducible extent between two time-comparison images (same bounding box = perfectly aligned images, no manual alignment needed)
- No zoom/pan inconsistency between captures

**Frontend map library:** Leaflet (free, open-source, well-documented) or Mapbox GL JS (nicer visuals, has a generous free tier) for the draggable/zoomable picker. Leaflet is simpler to implement fast for a prototype.

**Flow:** User draws/selects a bounding box on the map → frontend sends `{bbox, date, resolution}` to backend → backend calls Sentinel Hub Processing API with proper auth → returns PNG → frontend displays it and enables the query input.

*(Requires a free Sentinel Hub account + API credentials — sign up at sentinel-hub.com, note there are usage limits on the free tier, sufficient for demo purposes.)*

## 4. Model Serving

- Primary: **RS-LLaVA** (LLaVA-1.5-7B + remote-sensing LoRA adapter), hosted on Hugging Face Spaces with GPU, exposed via a simple inference API endpoint.
- Fallback: if adapter compatibility issues persist (as encountered previously), serve base LLaVA-1.5-7B or a smaller VLM (e.g. BLIP-2) with clear labeling that RS-specific fine-tuning is a next-step item.
- Change-detection/metrics: runs as plain Python (OpenCV + NumPy) on the backend — no GPU required for this part.

## 5. Non-Functional Requirements

- **Response time:** target under 15-20 seconds per query for the demo (acceptable for a judged prototype, not production SLA).
- **Availability:** must stay up and reachable for the duration of judging — avoid free-tier services that sleep/cold-start badly under first request (test this ahead of time).
- **Public accessibility:** deployed URL, no login required to view the demo (optional login for saving history).

## 6. Security Requirements (Prototype-Appropriate — from known "vibe coding" pitfalls)

Every one of these must be checked before deployment, since AI-assisted/"vibe coded" prototypes commonly ship with these exact gaps:

| # | Risk | Mitigation for this project |
|---|---|---|
| 1 | Committing `.env` to GitHub | Add `.env` to `.gitignore` from commit #1; never hardcode keys in code |
| 2 | Real API keys in frontend | Sentinel Hub / Hugging Face API keys stay backend-only; frontend never holds secrets |
| 3 | No row-level security (RLS) | Enable Supabase RLS on all tables — users can only read/write their own rows |
| 4 | Permissions checked only on frontend | All authorization checks re-verified server-side, not just hidden UI |
| 5 | No rate limiting | Add basic rate limiting on the query endpoint (even a simple in-memory limiter) to prevent abuse during public demo |
| 6 | SQL built with string concatenation | Use Supabase client library / parameterized queries only, never raw string SQL |
| 7 | No server-side input validation | Validate bounding box coordinates, date ranges, and query text length on the backend, not just frontend forms |
| 8 | Rendering user content as raw HTML | Sanitize/escape any user-submitted text before rendering in the UI |
| 9 | Plain-text passwords | N/A if using Supabase Auth (handles hashing) — don't build custom auth |
| 10 | Auth tokens in localStorage | Use Supabase's recommended session handling (secure cookies where possible) |
| 11 | Unauthenticated admin panel | If any admin/debug view exists, gate it behind auth + role check |
| 12 | CORS set to `*` | Restrict CORS to your actual deployed frontend domain only |
| 13 | No email verification | Acceptable to skip for a prototype demo, but note as a known gap |
| 14 | Predictable IDs, no ownership check | Use UUIDs for records (Supabase default) and always filter queries by the authenticated user's ID |
| 15 | Saving whole request body on updates | Only update the specific fields intended, not blind overwrite |
| 16 | Webhooks with no signature check | N/A unless webhooks are added later — if so, verify signatures |
| 17 | Exposing stack traces in production | Return generic error messages to the frontend; log full traces only server-side |
| 18 | Never updating dependencies | Run `npm audit` / `pip list --outdated` at least once before final submission |
| 19 | No password strength/breach check | Supabase Auth has basic protections built-in; don't disable them |
| 20 | File uploads with no validation | Validate image file type/size on both frontend and backend before processing |

## 7. Environments

- **Local dev:** `.env.local` for each developer, never committed
- **Staging/Demo:** Vercel preview deploys (auto-generated per PR) for testing before judging
- **Production/Demo-day:** main branch auto-deployed to Vercel + Hugging Face Space, tested at least once fully end-to-end the day before presenting
