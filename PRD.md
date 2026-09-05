# SatQuery AI — Product Requirements Document (PRD)
**Prototype version — for SIH26167, ISRO / Department of Space**

---

## 1. Problem

Satellite imagery is used across agriculture, disaster management, urban planning, forest monitoring, and water-resource assessment — but extracting insight from it requires GIS (Geographic Information System) expertise, scripting, and manual tool selection. Non-expert users (field officers, planners, researchers) cannot easily ask a question and get an answer.

## 2. Target Department & Audience

**Owning department:** Department of Space / Indian Space Research Organisation (ISRO)

**Who actually uses this (per the PS background):**
- Agricultural monitoring teams
- Disaster management agencies
- Urban planning departments
- Forest and water-resource monitoring bodies
- Infrastructure mapping teams

**Design implication:** the prototype should look and feel like a tool a **government analyst or field officer** would trust — clear, low-clutter, evidence-first (not a flashy consumer app). Every answer must show its "proof" (source image region + model used), because these are the kinds of users who need to justify decisions to someone else.

## 3. Prototype Goal

Not a full production system. Goal: a **working, demoable prototype** that shows the full concept end-to-end — map-based image selection, natural-language querying, and evidence-grounded answers — deployed publicly so judges can try it themselves.

## 4. Core Features (Prototype Scope)

1. **Interactive map location picker** — user drags/zooms a map to select an area of interest, instead of manually screenshotting satellite images.
2. **Automatic image fetch** — selected area + date range sent as a request to a satellite imagery provider, returns a real PNG image of that exact location.
3. **Natural-language query input** — user types a question about the image(s).
4. **Two analysis modes:**
   - **Single image** — describe/ask questions about one image
   - **Two images (time comparison)** — detect and quantify change between two dates of the same area
5. **Agentic routing** — system determines which mode/task the query needs and runs the correct pipeline.
6. **Evidence-grounded response** — every answer includes: the text answer, the relevant image region highlighted (where applicable), and an execution summary (what model/method was used).
7. **Session history** — basic record of past queries per user (via Supabase).

## 5. Out of Scope (for prototype)

- Full optical+SAR fusion (documented as roadmap item, not built)
- Production-grade fine-tuning of the vision-language model
- Multi-user real-time collaboration
- Mobile app (web-only for now)
- Offline mode

## 6. Success Criteria for the Prototype

- A judge can open the deployed link, pick a location on a map, ask a question, and get a real, non-scripted answer within the demo.
- At least one full "before/after" comparison with real computed percentages works end-to-end.
- The system is deployed and publicly accessible (no local-only setup required for judges to try it).

## 7. Users / Personas (for UI design reference)

- **Government field officer** — limited technical skill, needs simple, guided interface
- **Disaster response analyst** — needs fast answers, values evidence/proof over aesthetics
- **Student/researcher (SIH judge persona)** — evaluates technical depth and correctness, will test edge cases
