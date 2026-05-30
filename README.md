# Causality 🕵️‍♂️

Causality is a corporate investigation engine built to help you trace the root causes of major company events, market shifts, or business failures. Just type in an event (like _"How did Nvidia become so valuable?"_), and it will automatically crawl the web, batch the findings, and feed them to an LLM to generate a clean timeline of why things happened.

It's built on **TanStack Start** (React 19 + TanStack Router) and styled with a dark UI.

---

## ⚡ How it works under the hood

1. **Search**: You input an event, and the backend generates a few target queries (like history, causes, etc.). It runs these in parallel via the **Bright Data SERP API**.
2. **Collect**: It pulls organic search results, pulls out snippets/descriptions, deduplicates the URLs, and packs them into text chunks.
3. **Analyze**: The chunks are queued up and sent to an LLM (using DeepSeek-V4-Pro on Featherless by default) with custom formatting rules.
4. **Stream**: The frontend hooks into a server-sent events (SSE) stream, rendering each cause card with its sources and favicons as soon as the model spits them out.

---

## 🛠️ The Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (combining React 19, Vite, and Nitro).
- **Styling**: Tailwind CSS v4 with custom dark mode colors and high-contrast scrollbars.
- **APIs**: Bright Data SERP API for crawling Google search results, and the OpenAI SDK pointing to Featherless.

---

## ⚙️ Setting up your environment

Grab a `.env.local` file and drop these config keys in:

```env
# SERP Scraper API
BRIGHTDATA_API_KEY="your-brightdata-api-key"
BRIGHTDATA_ZONE="serp_api1"

# LLM Configs
OPENAI_API_BASE_URL="https://api.featherless.ai/v1"
OPENAI_API_KEY="your-featherless-api-key"
OPENAI_MODEL="deepseek-ai/DeepSeek-V4-Pro"

# Batching & Rate Limits
MAX_CHARS_PER_DOC=10000       # Max characters kept per page snippet
MAX_CHARS_PER_BATCH=400000    # How much context to send to the LLM per batch
MAX_CONCURRENT=1              # Number of concurrent LLM API calls allowed
MAX_SITES_TO_SCRAPE=10        # Limit on search results to parse
```

---

## 💻 Running it locally

### 1. Install & Spin up the dev server

Install dependencies and start Vite:

```bash
pnpm install
pnpm dev
```

Open up [http://localhost:3000](http://localhost:3000) and you're good to go!

## 📦 Production & Builds

If you want to bundle it up for production:

```bash
pnpm build
node .output/server/index.mjs
```

The app uses Nitro as its server engine, meaning the build output is just a simple, self-contained Node.js server. You can drop it on VPS setups, Fly.io, Render, or customize it for serverless platforms like Vercel or Cloudflare.

---

## 📂 Key files to look at

- [index.tsx](file:///home/al-ameen/Documents/Projects/causality/src/routes/index.tsx) - The main page interface (search input, status indicators, and streaming cards).
- [analyze.ts](file:///home/al-ameen/Documents/Projects/causality/src/routes/api/analyze.ts) - The SSE API endpoint handling the search queries and streaming LLM batches.
- [useAnalysis.ts](file:///home/al-ameen/Documents/Projects/causality/src/hooks/useAnalysis.ts) - The React hook that streams events and manages state.
- [serp.ts](file:///home/al-ameen/Documents/Projects/causality/src/server/serp.ts) - The search wrapper hitting Bright Data.
- [llm.ts](file:///home/al-ameen/Documents/Projects/causality/src/server/llm.ts) - The LLM client prompting and parsing NDJSON stream outputs.
