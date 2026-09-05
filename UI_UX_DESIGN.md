# SatQuery AI — UI/UX Design Guide
**Prototype version**

---

## 1. Design Philosophy

This is a **government/analyst-facing tool**, not a consumer app. Prioritize clarity, trust, and evidence over flashiness — but that doesn't mean boring. Aim for **clean, modern, confident** design: think "professional research tool" (like a well-designed dashboard), not "generic AI chatbot template."

## 2. Visual Style — Current Best Practices to Use

- **Dark mode by default, with light mode toggle** — satellite/map imagery reads better against a dark UI, and it's now the expected default for technical/data tools.
- **Glassmorphism panels (subtle)** — semi-transparent, blurred-background panels for the query box and results panel floating over the map — modern, gives depth without clutter. Use sparingly, not everywhere.
- **Micro-interactions** — subtle loading animations (skeleton loaders, not spinning wheels) while the model is processing; smooth transitions when switching between single-image and comparison modes.
- **Monospace accents for technical data** — use a monospace font (e.g. JetBrains Mono, Fira Code) specifically for the "execution summary" (model used, task type, coordinates) — visually signals "this is a technical/verifiable detail," separate from the conversational answer text.
- **Color palette:** Deep navy/charcoal background, one accent color (recommend a satellite-blue or ISRO-adjacent orange/blue) for interactive elements, muted greens/reds only for data (vegetation up/down indicators), not decoration.
- **Typography:** Clean sans-serif for UI (Inter, or system font stack) — highly legible, not decorative.

## 3. Key Screens

### Screen 1 — Landing / Map Selection
- Full-screen interactive map (Leaflet) as the primary element
- Draggable/resizable bounding-box tool to select area of interest
- Date picker(s) — single date for single-image mode, two date pickers for comparison mode
- Mode toggle: "Single Image Analysis" / "Compare Two Time Periods" — clearly visible tab or segmented control at the top
- "Fetch Image" button — triggers the backend call to Sentinel Hub

### Screen 2 — Image Preview + Query
- Fetched image(s) displayed prominently (side-by-side if comparison mode)
- Query input box below/beside the image — plain text field with placeholder examples ("e.g. What changed in vegetation between these dates?")
- Suggested example queries as clickable chips (helps judges who don't know what to type)
- "Ask" button, loading state while processing

### Screen 3 — Results / Answer View
- Answer text displayed prominently, clear typography
- **Execution summary** shown as a distinct, monospace-styled block below the answer: task type, model/method used, computed metrics if applicable (this is your "proof" — make it visually distinct, almost like a receipt or technical log)
- If change-detection: show computed percentages (vegetation/urban/water) as simple stat cards or a small bar/heatmap visual, not just text
- "Ask another question" / "New location" actions to loop back

### Screen 4 — History (optional, if time allows)
- Simple list of past queries (from Supabase), timestamp, location thumbnail, re-open capability

## 4. Component List (for frontend team to build)

- `MapPicker` — Leaflet map + bounding box draw tool + date picker(s)
- `ModeToggle` — single vs. comparison mode switch
- `ImagePreview` — displays fetched satellite image(s)
- `QueryInput` — text input + example query chips + submit button
- `LoadingState` — skeleton loader / progress indicator during model inference
- `AnswerCard` — main answer text display
- `ExecutionSummary` — monospace technical detail block
- `MetricsDisplay` — stat cards for vegetation/urban/water % (comparison mode only)
- `HistoryList` — optional session history view

## 5. Accessibility & Usability Notes

- Ensure sufficient color contrast (especially important with dark mode + accent colors)
- Loading states must be clear — model inference can take 10-20+ seconds, users (and judges) need to know it's working, not frozen
- Error states must be honest and clear (e.g. "Model temporarily unavailable — showing computed metrics only" rather than a silent failure) — ties back to the honesty principle from your prototype testing

## 6. Design Tools / References

- Reference apps for visual inspiration: Vercel's own dashboard (clean dark UI), Linear (modern SaaS aesthetic), Planet Labs' platform (satellite-imagery-specific product, worth looking at for domain-appropriate visual language)
- Build with **Tailwind CSS** for fast, consistent styling — pairs well with React/Next.js and is the current standard for fast prototype UI work
- Component library: **shadcn/ui** (if using React) — gives clean, modern pre-built components (buttons, cards, dialogs) that match current design trends without custom-building everything from scratch

---

## 7. Golden Rules of UI Design (Shneiderman's 8 Golden Rules — must be followed)

Every screen and component in this app should be checked against these before being considered "done":

1. **Strive for consistency** — same button styles, spacing, icons, and terminology across every screen (e.g. "Fetch Image" should always be called that, never "Get Image" on one screen and "Load Image" on another).
2. **Enable frequent users to use shortcuts** — power users (repeat judges/testers) should be able to move fast: keyboard shortcut to submit a query (Enter key), recently-used locations quick-access.
3. **Offer informative feedback** — every action gets a visible response: button press states, loading indicators during model inference, success/error messages after image fetch or query submission. Never leave the user wondering if something happened.
4. **Design dialogs to yield closure** — every flow (select location → fetch image → ask question → get answer) should have a clear "done" state, not leave the user unsure if they're mid-process or finished.
5. **Offer simple error handling** — errors must be in plain language ("No satellite data available for this date — try another") not technical jargon or raw stack traces (ties directly to TRD security item #17).
6. **Permit easy reversal of actions** — user can change their bounding box, switch modes, or ask a new question without needing to reload the page or lose their place.
7. **Support internal locus of control** — the user should feel in charge of the tool (they pick location, dates, question), not like the system is making decisions for them without visibility — this is why the Execution Summary matters, it shows the user what the system did, not just an opaque answer.
8. **Reduce short-term memory load** — don't make the user remember what bounding box or dates they picked earlier; keep selections visible on-screen throughout the flow (e.g. a persistent small summary bar: "Area: [lat,lon] | Dates: T1, T2 | Mode: Comparison").

**Practical checklist for the frontend team:** before marking any screen complete, verify it satisfies all 8 rules above — this should be a standard review step in `IMPLEMENTATION_PLAN.md` Phase 3 polish, not an afterthought.

---

## 8. Future Features — "Locked" Demo Presentation (like a demo build of a game)

Rather than hiding unbuilt features entirely, **show them in the UI as visibly present but locked** — this signals product vision and roadmap depth to judges without requiring the feature to actually work. Style this the way demo builds of games show a grayed-out level or feature with a "🔒 Available in full version" tag.

**Features to show as locked (not built) in the prototype UI:**

- **Optical + SAR Fusion mode** — show as a third tab/mode option alongside "Single Image" and "Compare Two Time Periods," visually present but disabled, with a lock icon and tooltip: *"🔒 Optical + SAR Fusion — Coming in full version. Combines radar and optical imagery for deeper analysis, even through cloud cover."*
- **Voice query input** — a microphone icon next to the text query box, disabled, tooltip: *"🔒 Voice queries — coming soon."*
- **Multilingual support** — a language selector dropdown, showing English active and other languages (Hindi, regional languages) grayed out with a lock icon.
- **Automated report/PDF export** — a "Download Report" button, visible but locked, tooltip: *"🔒 Full analysis reports — available in production version."*
- **Region-wide batch analysis** — e.g. "Analyze entire district" option, shown but locked: *"🔒 Batch region analysis — full version feature."*
- **Historical trend graphs (multi-date, not just two-date comparison)** — a "View Trend Over Time" button, locked with the same tooltip pattern.

**Implementation guidance for frontend:**
- Use a consistent lock treatment: grayed-out (reduced opacity ~50%), a small 🔒 icon, and a tooltip/hover text explaining what it would do — do NOT make locked features look broken or like an error; they should look like an intentional, polished "coming soon" state.
- Clicking a locked feature can optionally show a small modal: *"This feature is part of our full-version roadmap. Ask us about it!"* — turns a limitation into a talking point for judges.
- This is explicitly a presentation/scoping technique, not a technical requirement — it directly supports the PRD's "Out of Scope" section by making scope boundaries visible and intentional rather than something judges have to ask about.

---

## 9. Onboarding Tutorial Flow (first-time user experience)

When a user first opens the app (or logs in for the first time), show a simple prompt before dropping them into the main interface:

> **"Want a quick guide?"**
> [ Yes, show me ] [ Skip ]

**If "Yes, show me" is selected:**
Run a short, game-style step-by-step walkthrough overlay (spotlight/highlight pattern — dim the rest of the screen, highlight one UI element at a time with a short caption and a "Next" button). Suggested steps:

1. Highlight the map: *"Drag to select the area you want to analyze."*
2. Highlight the mode toggle: *"Choose whether you want to look at one image, or compare two time periods."*
3. Highlight the date picker: *"Pick the date(s) for your satellite image."*
4. Highlight the "Fetch Image" button: *"Click here to get the real satellite image for your selection."*
5. Highlight the query box: *"Type a question in plain English — no coding needed."*
6. Highlight the Execution Summary area (once an example answer is shown): *"Every answer comes with proof — see exactly what was used to generate it."*
7. Final step: *"That's it! Try it out."* → dismiss overlay, user lands on the real interface ready to use.

**If "Skip" is selected:** go straight to the main interface, no further interruption.

**Implementation notes:**
- Store the user's choice (seen tutorial / skipped) in Supabase or local state so it doesn't repeat on every login — but always offer a small persistent "?" help icon in the corner that can re-trigger the tutorial anytime.
- Keep tutorial captions short (one sentence per step) — this is a walkthrough, not documentation.
- This pattern (spotlight overlay + step captions + skip option) is a well-established onboarding pattern (similar to how many mobile apps and games introduce first-time users) — use a lightweight library like `react-joyride` (React) if available, rather than building the spotlight/overlay mechanics from scratch.
