# SatQuery AI 🛰️

> **Evidence-backed Geospatial Intelligence & Temporal Satellite Analysis**  
> Problem Statement: **SIH26167 (ISRO)**

---

## 📌 Overview

**SatQuery AI** is an intelligent Earth Observation assistant designed for analysts, researchers, and government decision-makers. It enables users to select any Area of Interest (AOI) on a world map, retrieve multi-temporal satellite imagery via the Sentinel Hub Processing API, and ask natural-language questions to receive evidence-backed answers.

The system combines Vision-Language Models (RS-LLaVA) with automated computer vision (OpenCV alignment & HSV metric computation) to quantify environmental, urban, and hydrological changes over time.

---

## 🚀 Key Features

- **Interactive AOI Map Selector:** Leaflet-powered interface with Esri World Imagery and Dark Matter tiles, supporting interactive bounding-box placement and demo presets (Delhi NCR, Bengaluru, Sundarbans, Joshimath).
- **Dual Analysis Modes:**
  - **Single Image Analysis:** Visual scene breakdown and land-cover identification.
  - **Temporal Comparison (T1 vs. T2):** Side-by-side satellite image comparison and automated land-use change detection.
- **Evidence-Backed Responses:** Answers accompanied by an **Execution Summary** detailing the model used, parameters, and computed vegetation/urban/water coverage percentages.
- **Future Roadmap Capabilities (Locked Preview):** Optical + SAR Fusion preview, multilingual support, and automated PDF dossier export.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Leaflet, Lucide Icons
- **Backend:** FastAPI (Python), OpenCV, NumPy
- **Satellite Data Provider:** Sentinel Hub Processing API (Copernicus Sentinel-2 L2A)
- **Model Inference:** RS-LLaVA (Remote Sensing Vision-Language Model) hosted on Hugging Face Spaces
- **Database & Auth:** Supabase (PostgreSQL with Row-Level Security)
- **Hosting:** Vercel (Frontend), Render / Hugging Face Spaces (Backend)

---

## 📂 Project Structure

```
├── APP_FLOW.md             # End-to-end data flow specification
├── BACKEND_SCHEMA.md       # Database schema & table design
├── IMPLEMENTATION_PLAN.md  # Scrum-based delivery phases
├── PRD.md                  # Product Requirements Document
├── TRD.md                  # Technical Requirements & Security Checklist
├── UI_UX_DESIGN.md         # Design system & visual specifications
├── frontend/               # Next.js web application
│   ├── src/
│   │   ├── app/            # App router pages & API endpoints
│   │   └── components/     # UI components (MapPicker, ModeToggle, Navbar, etc.)
│   └── package.json
└── README.md               # Public project documentation
```

---

## ⚡ Getting Started

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Run the local development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Compliance

This repository complies with the project security guidelines outlined in [TRD.md](TRD.md):
- Zero hardcoded credentials or API keys committed.
- Environment variables managed strictly via `.env` files (excluded by `.gitignore`).
- Server-side validation on geographic bounds, dates, and query payloads.
