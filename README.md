# 🛡️ RxGuard

**AI-Powered Medication Safety & Interaction Analyzer**  

*[![Demo Video](https://img.shields.io/badge/Watch-Video_Pitch-8b5cf6?style=for-the-badge&logo=youtube)](https://drive.google.com/file/d/1hYJu8qDVQOWCxThDhtJ10ma4-G4uDaMH/view?usp=drive_link)*

---

## 🎯 Project Purpose
RxGuard is an intelligent healthcare companion designed to prevent dangerous drug-drug interactions. Patients often take multiple medications prescribed by different doctors, leading to blind spots in their medication safety. RxGuard solves this by allowing users to instantly scan their prescriptions. The platform utilizes a true autonomous AI Agent to read the prescriptions, normalize the medical terminology, and cross-reference the medications with the openFDA database to flag critical, major, or moderate health risks before a patient takes their next dose.

The app is designed to help teams and reviewers quickly identify medication risk signals without replacing clinical judgment. It provides a short readable summary on the capture/results flow, while preserving the full FDA interaction text behind a dedicated details view.

## Project Purpose

- Scan prescription images from a camera or gallery upload.
- Extract medication names with an AI vision workflow.
- Normalize drug names before checking safety data.
- Query FDA/openFDA sources for interaction details.
- Show a concise safety summary and a full official document view.
- Save scan history for signed-in users through Supabase.

## Tech Stack

This repository uses the following stack:

- Frontend: React 18, Vite, Tailwind CSS, Framer Motion, React Router
- Camera/Input: `react-camera-pro`, file upload support
- Backend: Node.js, Express, LangChain, Google Gemini integration
- Normalizer service: Python FastAPI-style service in `normalizer/`
- Database/Auth: Supabase
- External data: openFDA drug labeling data
- UI utilities: Lucide icons, React Hot Toast

## Repository Layout

- `frontend/` - Vite React app for capture, analysis, results, history, alerts, and profile screens
- `backend/` - Express API plus AI agent orchestration
- `normalizer/` - Python service that normalizes medication names
- `README.md` - Project overview and setup guide

## Core Features

- Prescription capture using live camera or image upload.
- Multi-image analysis for prescriptions spread across multiple photos.
- AI-powered OCR and medication extraction.
- Drug name normalization before safety lookup.
- FDA interaction lookup with concise summary output.
- Full official FDA interaction document available from the results screen.
- Severity-aware warning badges and alert styling.
- Saved scan history, dashboard metrics, and alerts for authenticated users.

## AI Agent Workflow

RxGuard uses an agent pipeline that works well because it is modular and easy to explain:

1. Capture team members collect one or more prescription images from the mobile or web UI.
2. The frontend sends the image set to the backend `analyze` endpoint.
3. The vision agent reads the prescription text and extracts medication names.
4. The normalizer service standardizes the names so different spellings map to the same drug.
5. The FDA interaction checker queries official FDA/openFDA label data for pairwise interactions.
6. The agent produces three outputs:
	- `fda_summary`: a short human-readable summary for the capture/results page
	- `fda_raw_text`: the full official FDA text shown only in the details view
	- `severity_level`: a structured severity value used to color warnings correctly
7. The frontend shows the summary, the detected medications, and a severity badge.
8. Signed-in scans are stored in Supabase so teams can review history, alerts, and trends.


## Setup Instructions

### Prerequisites

- Node.js 18 or newer
- Python 3.10+ for the normalizer service
- A Supabase project
- A Google Gemini API key for the backend agent

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd rxguard-app
```

### 2. Configure the backend

Create a backend environment file in `backend/.env` with the required values:

```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_AGENT_MODEL=gemini-3.1-flash-lite
GEMINI_VISION_MODEL=gemini-3.1-flash-lite
PYTHON_NORMALIZER_URL=http://127.0.0.1:8000
FDA_API_BASE_URL=https://api.fda.gov
```

Install backend dependencies and start the API:

```bash
cd backend
npm install
npm run dev
```

### 3. Configure the normalizer service

Create a Python virtual environment if needed, then install the Python dependencies in `normalizer/requirements.txt`.

The backend expects the normalizer service to be available at the URL defined by `PYTHON_NORMALIZER_URL`.

### 4. Configure the frontend

Create a frontend environment file in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Install frontend dependencies and start the app:

```bash
cd frontend
npm install
npm run dev
```

### 5. Build for production

```bash
cd frontend
npm run build
```

## Usage Flow

1. Open the app and go to the capture screen.
2. Take a photo or upload one or more prescription images.
3. Wait while RxGuard extracts, normalizes, and checks the medication list.
4. Review the short FDA summary and severity badge on the results screen.
5. Click `Read Full Official Document` to inspect the complete FDA text.
6. Sign in to save scans, view alerts, and revisit prior results in history.

## Notes

- The full FDA text is intentionally separated from the short summary so the results view stays readable.
- Severity badges are driven by the structured `severity_level` field rather than free-form text.
- Existing saved scans may need to be refreshed by rescanning if you want the updated summary/severity format.

## License

No license has been specified for this repository yet.
