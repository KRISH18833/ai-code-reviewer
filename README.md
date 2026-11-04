# AI Code Reviewer

Paste your code, pick a language, and get a structured AI-powered review streamed directly to your browser.

## Features

- **Streaming review** — results appear word-by-word as the model responds
- **5 structured sections** — Summary, Bugs, Security, Style & Readability, Improved Code
- **Input validation** — rejects empty input and enforces an 8 000-character limit
- **Loading & error states** — spinner during generation, clear error messages on failure
- **Stop button** — cancel mid-stream at any time
- **Model fallback chain** — automatically retries with the next model if one is unavailable or quota-exceeded
- **API key stays server-side** — the Gemini key is never exposed to the browser

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI SDK | Vercel AI SDK (`ai` + `@ai-sdk/google`) |
| AI Model | Google Gemini (via Gemini API) |
| Hosting | Vercel |

## How It Works

1. The browser POSTs `{ code, language }` to `/api/review`
2. The server validates the input, then calls the Gemini API via the Vercel AI SDK
3. The model's response is streamed back as plain-text Markdown
4. The client renders sections live using `react-markdown`

If the primary model is unavailable, the server automatically falls through the configured model chain before returning an error.

## Local Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd ai-code-reviewer

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Open .env.local and replace the placeholder with your real key
# Get a free key at https://aistudio.google.com/apikey

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Purpose |
|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key (required) |
| `GEMINI_MODELS` | Comma-separated model fallback chain (optional; defaults to `gemini-3.8-flash,gemini-3.5-flash`) |

## Deploy to Vercel

1. Push this repo to GitHub (or GitLab / Bitbucket)
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add the environment variables from the table above in the Vercel dashboard
4. Click **Deploy** — Vercel picks up `next build --webpack` automatically from `package.json`

## Live Demo

Live URL: *(add after deploy)*
