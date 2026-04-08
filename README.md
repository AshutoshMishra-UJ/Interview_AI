# InterviewAI

A full-stack AI-powered interview preparation platform with personalized interview plans, ATS analysis, mock interviews, analytics, leaderboard, and resume PDF generation.

## Tech Stack

- Frontend: React + Vite + Sass + Recharts
- Backend: Node.js + Express + MongoDB + Gemini API
- Auth: JWT (cookie-based)

## Repository Structure

- `Backend/` Express API + MongoDB models/services
- `Frontend/` React application (Vite)

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd interview-ai-yt-main
cd Backend && npm install
cd ../Frontend && npm install
```

### 2. Configure environment variables

Create `Backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
PORT=3000
```

Create `Frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Run locally

Backend:

```bash
cd Backend
npm run dev
```

Frontend:

```bash
cd Frontend
npm run dev
```

## Deployment Ready Notes

### Backend

- Start command: `npm start`
- Required env vars:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `GEMINI_API_KEY`
  - `CLIENT_URL` (frontend deployed URL)
  - `PORT` (provided by hosting platform)

### Frontend

- Build command: `npm run build`
- Output directory: `dist`
- Required env vars:
  - `VITE_API_BASE_URL` (deployed backend base URL)

## Suggested Deployment

### Backend (Render / Railway)

- Root directory: `Backend`
- Build command: `npm install`
- Start command: `npm start`
- Add all backend env vars above

### Frontend (Vercel / Netlify)

- Root directory: `Frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Set `VITE_API_BASE_URL` to deployed backend URL

## Features

- AI interview report generation
- Technical and behavioral question prep
- Coding challenge practice flow
- ATS resume analysis
- Salary negotiation assistant
- Dashboard analytics and trend charts
- Mock interview mode
- Shareable interview reports
- Resume PDF generation

## Experimental GenAI (Safe / Isolated)

An isolated Company-aware RAG prep endpoint is included for advanced experimentation.
It is disabled by default and does not affect existing interview routes.

- Endpoint: `POST /api/experimental/rag-plan`
- Guarded by auth and feature flag
- Enable with backend env:

```env
ENABLE_EXPERIMENTAL_RAG=true
```

Sample payload:

```json
{
  "jobDescription": "Senior Frontend Engineer role...",
  "docs": [
    { "title": "Company Engineering Blog", "content": "..." },
    { "title": "Interview Experience Notes", "content": "..." }
  ]
}
```

If the model fails or quota is exhausted, the endpoint falls back safely with a deterministic prep response.

## Development Commands

### Backend Commands

```bash
npm run dev
npm start
```

### Frontend Commands

```bash
npm run dev
npm run build
npm run preview
```
