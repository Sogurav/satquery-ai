# SatQuery AI — App Flow
**Prototype version — Frontend/Backend interaction sequence**

---

## 1. Full User Journey (step by step)

1. **User lands on the app** → sees full-screen map
2. **User draws a bounding box** on the map (selects area of interest) using the map picker tool
3. **User selects mode:** "Single Image" or "Compare Two Time Periods"
4. **User picks date(s):**
   - Single mode → one date
   - Comparison mode → two dates (T1, T2)
5. **User clicks "Fetch Image"**
   → Frontend sends `POST /api/fetch-image` with `{bbox, date(s), resolution}`
   → Backend calls Sentinel Hub Processing API with these parameters
   → Backend returns PNG(s) to frontend
   → Frontend displays the fetched image(s)
6. **User types a natural-language question** in the query box (e.g. "What changed in vegetation here?")
7. **User clicks "Ask"**
   → Frontend sends `POST /api/query` with `{image_id(s), question, mode}`
   → Backend's **Agentic Controller** classifies the query:
      - Keyword/intent check: does the question reference change/comparison, or single-image description?
      - Routes to the correct pipeline
8. **Backend processing:**
   - **Single-image path:** image + question sent to the Vision-Language Model endpoint (Hugging Face Space) → returns text answer
   - **Comparison path:** both images run through OpenCV alignment + HSV metric computation (vegetation %, urban %, water %) → if the question is open-ended beyond these metrics, also sent to the VLM with computed context included in the prompt
9. **Backend assembles response:**
   `{answer_text, execution_summary: {task, model_used, parameters}, metrics (if applicable), evidence_image (if applicable)}`
10. **Frontend receives response** → renders Answer Card + Execution Summary + Metrics Display
11. **User can:** ask a follow-up question (same images), or start a new location/date selection
12. **(If logged in)** query + result saved to Supabase under the user's session for history

## 2. API Endpoints (Backend)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/fetch-image` | POST | Takes bbox + date(s), calls Sentinel Hub, returns PNG(s) |
| `/api/query` | POST | Takes image reference(s) + question, runs agentic routing, returns answer |
| `/api/history` | GET | Returns past queries for logged-in user (from Supabase) |
| `/api/auth/*` | — | Handled by Supabase Auth directly (frontend SDK) |

## 3. Data Passed at Each Step

```
Frontend → Backend (/api/fetch-image):
{
  "bbox": [minLon, minLat, maxLon, maxLat],
  "dates": ["2015-12-07"] or ["2015-12-07", "2026-04-23"],
  "mode": "single" | "comparison"
}

Backend → Frontend (response):
{
  "image_urls": ["https://.../t1.png"] or ["...t1.png", "...t2.png"],
  "image_ids": ["img_abc123"]
}

Frontend → Backend (/api/query):
{
  "image_ids": ["img_abc123"],
  "question": "What changed in vegetation here?",
  "mode": "comparison"
}

Backend → Frontend (response):
{
  "answer": "Vegetation cover changed from 23.0% to 4.7% (-18.3 points).",
  "execution_summary": {
    "task": "Temporal Comparison",
    "model_used": "HSV pixel computation + RS-LLaVA (fallback: base LLaVA)",
    "parameters": {"threshold": 35, "min_area": 500}
  },
  "metrics": {"vegetation_t1": 23.0, "vegetation_t2": 4.7, "urban_t1": ..., "urban_t2": ...},
  "evidence_image_url": "https://.../change_heatmap.jpg"
}
```

## 4. Error Handling Flow

- **Image fetch fails** (bad bbox, no data for date range) → frontend shows clear error: "No satellite data available for this area/date — try a different selection."
- **Model inference fails/times out** → backend falls back to metrics-only response (if comparison mode) with an honest note: "AI reasoning unavailable — showing computed metrics only." Never silently return a fake/hardcoded answer.
- **Rate limit hit** → clear message: "Too many requests — please wait a moment."

## 5. Session/State Management (Frontend)

- Current bounding box, selected date(s), mode → held in frontend state (React state/context), not persisted unless user is logged in
- Fetched image references and last query/answer → held in state for the current session, optionally saved to Supabase on submit if logged in
