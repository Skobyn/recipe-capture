# Recipe Capture

A conversational web app that helps you capture recipes and export them to Recime format, complete with AI-generated food photography.

## What it does

1. Chat with an AI assistant to describe your recipe
2. The AI asks smart follow-up questions to fill in missing details
3. Generates the Recime-compatible structured text format
4. Creates a professional food photo using Gemini image generation

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **AI Chat:** OpenAI GPT-4o-mini
- **Image Gen:** Google Gemini 2.0 Flash Preview
- **Deployment:** GCP Cloud Run

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o-mini |
| `GEMINI_API_KEY` | Google Gemini API key for image generation |
| `PORT` | Server port (default: 8080) |

## Local Development

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Frontend dev server runs on :5173 with API proxy to :8080.

## Deployment

Deployed automatically to Cloud Run via GitHub Actions on push to `main`.
