# HIVE COMMAND — Setup Guide

This document walks a fresh developer from `git clone` to running dashboard.

---

## 1. Clone & install

```bash
git clone <your-fork-url> hive-command
cd hive-command
npm install
```

## 2. Configure environment variables

```bash
cp .env.example .env
```

Then open `.env` and fill in:

### Required — Airtable

| Variable                    | Where to find it                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `VITE_AIRTABLE_API_KEY`     | https://airtable.com/create/tokens — Personal Access Token with `data.records:read` + `data.records:write` |
| `VITE_AIRTABLE_BASE_ID`     | In your base URL: `https://airtable.com/`**`appXXXXXXXXXX`**`/...`                            |
| `VITE_AT_TBL_AGENTS`        | Click the Agents table → the URL contains `/tblXXXXXXXXX`                                     |
| `VITE_AT_TBL_DIRECTIVES`    | Directives table ID (same trick)                                                              |
| `VITE_AT_TBL_TASKS`         | Tasks table ID                                                                                |
| `VITE_AT_TBL_OUTPUTS`       | Outputs table ID                                                                              |
| `VITE_AT_TBL_ACTIVITY`      | Activity Log table ID                                                                         |

### Optional — AI providers

If you skip these, the dashboard runs in "local data" mode without AI assistance.

There are **two layers** of AI env vars in this project:

**(a) Client-side (VITE_*)** — inlined into the browser bundle. Visible to anyone who opens DevTools. Only use these for dev/local Ollama URLs or when you've accepted the exposure risk.

**(b) Server-side (no VITE_ prefix)** — read by the `/api/ai` Vercel serverless function. **Never sent to the browser.** This is the safe path for production.

The `/api/ai` proxy tries providers in this order: **Anthropic → OpenAI → Ollama** for chat/generate, **Gemini → OpenAI DALL-E 3** for image generation. It returns whichever first succeeds.

#### Server-side (recommended for production)

Set these in **Vercel → Project Settings → Environment Variables** (not in your local `.env` unless you want the local dev server to use them via `vercel dev`).

| Variable                | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `HIVE_ACCESS_TOKEN`     | **Required for production.** Random string. Browser must send it as `X-Hive-Token` header. Without this set, `/api/ai` accepts anonymous calls — anyone can rack up your AI bill. |
| `ALLOWED_ORIGIN`        | **Required for production.** e.g. `https://hive-command-lemon.vercel.app`. Without this, CORS defaults to `*`. |
| `ANTHROPIC_API_KEY`     | Claude API key. Used by Commander Loop for decompose / execute / review phases. |
| `OPENAI_API_KEY`        | OpenAI API key. Used as chat fallback AND for DALL-E 3 image generation. |
| `GEMINI_API_KEY`        | Google AI key for Gemini 2.5 Flash Image (Nano Banana). Primary image-gen provider when set. Get at https://aistudio.google.com/app/apikey |
| `OLLAMA_URL`            | Default `http://localhost:11434`. Override if your Ollama is on another host. |

#### Client-side (visible in bundle)

Only `VITE_*`-prefixed vars are usable in browser code. The dashboard reads these for UI labels and the optional client-direct fallback path.

| Variable                    | Notes                                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| `VITE_OLLAMA_URL`           | Used by the `useOllama` direct-call path. Default `http://localhost:11434` |
| `VITE_OLLAMA_MODEL`         | Default `llama3.2`                                                     |
| `VITE_ANTHROPIC_MODEL`      | Default `claude-sonnet-4-20250514`. Used as the UI's "default model" hint. |
| `VITE_OPENAI_MODEL`         | Default `gpt-4o-mini`                                                  |
| `VITE_HIVE_ACCESS_TOKEN`    | If you set `HIVE_ACCESS_TOKEN` server-side, set the **same value** here too so the browser sends it. Yes, this exposes the token client-side — that's fine if its only job is rate-limit gating, not real secrets. |

### Rate limits on `/api/ai` (built in)

The proxy applies per-IP rate limits in memory:
- **30 requests/min** for chat and generate actions
- **5 requests/min** for `generateImage` (image gen is the wallet-risk path)

These reset per cold-start of the serverless function. If you need stronger limits, layer Vercel Firewall or a third-party WAF in front.

> ⚠️ **Why this matters:** `VITE_*` env vars are inlined into the browser bundle. Treat any key prefixed `VITE_` as **publicly exposed**. Don't use them for production AI calls — route through `/api/ai` with server-side keys instead.

## 3. Create the Airtable base

Create a new base with **five tables**. Field names below must match exactly — the app uses field names (not IDs) when reading/writing.

### Agents

| Field           | Type             | Notes / Options                                                                 |
| --------------- | ---------------- | ------------------------------------------------------------------------------- |
| Agent ID        | Single line text | e.g. `cmd`, `d_agy`, `a_cem` — stable identifier you choose                     |
| Name            | Single line text | e.g. `COMMANDER`                                                                |
| Tier            | Single select    | `0`, `1`, `2`, `3`                                                              |
| Venture         | Single select    | Keys from `src/data/constants.js → VENTURES` (plus `cross`)                     |
| Status          | Single select    | `active`, `idle`, `blocked`, `offline`, `reviewing`                              |
| Mandate         | Long text        |                                                                                 |
| Trigger         | Single line text |                                                                                 |
| Steps           | Long text        | One step per line, or JSON array                                                |
| Deliverables    | Multiple select  | Or long text                                                                    |
| Tools           | Multiple select  | Match keys in `TOOL_COLORS` for proper coloring                                  |
| Parent ID       | Single line text | The Agent ID of this agent's manager                                            |
| Current Task    | Single line text | Auto-updated by the app                                                         |
| Task Progress   | Number (0-100)   | Auto-updated by the app                                                         |

### Directives

| Field           | Type             | Options                                                |
| --------------- | ---------------- | ------------------------------------------------------ |
| Title           | Single line text |                                                        |
| Description     | Long text        |                                                        |
| Status          | Single select    | `draft`, `active`, `completed`, `cancelled`            |
| Priority        | Single select    | `critical`, `high`, `medium`, `low`                    |
| Issued By       | Single line text | Defaults to `cmd`                                      |
| Target Agents   | Long text        | Comma-separated Agent IDs                              |
| Venture         | Single select    | Same options as Agents → Venture                       |
| Deadline        | Date             |                                                        |
| Created At      | Created time     |                                                        |
| Completed At    | Date             | Set when status flips to completed                     |

### Tasks

| Field           | Type             | Options                                                |
| --------------- | ---------------- | ------------------------------------------------------ |
| Title           | Single line text |                                                        |
| Description     | Long text        |                                                        |
| Agent ID        | Single line text |                                                        |
| Directive ID    | Single line text |                                                        |
| Status          | Single select    | `queued`, `running`, `paused`, `completed`, `failed`   |
| Progress        | Number (0-100)   |                                                        |
| Venture         | Single select    | Same options as Agents → Venture                       |
| Started At      | Date             |                                                        |
| Completed At    | Date             |                                                        |
| Output          | Long text        |                                                        |

### Outputs

| Field           | Type             | Options                                                                       |
| --------------- | ---------------- | ----------------------------------------------------------------------------- |
| Title           | Single line text |                                                                               |
| Type            | Single select    | `report`, `document`, `asset`, `data`, `code`, `email`, `post`                |
| Agent ID        | Single line text |                                                                               |
| Task ID         | Single line text |                                                                               |
| Venture         | Single select    | Same options as Agents → Venture                                              |
| Status          | Single select    | `pending_review`, `approved`, `rejected`, `revision_needed`                   |
| Content         | Long text        |                                                                               |
| URL             | URL              |                                                                               |
| Created At      | Created time     |                                                                               |
| Reviewed At     | Date             |                                                                               |

### Activity Log

| Field           | Type             | Options                                                                                                              |
| --------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Event           | Single line text |                                                                                                                      |
| Agent ID        | Single line text |                                                                                                                      |
| Event Type      | Single select    | `status_change`, `task_started`, `task_completed`, `task_failed`, `directive_issued`, `output_created`, `output_reviewed`, `error`, `system` |
| Venture         | Single select    | Same options as Agents → Venture                                                                                     |
| Details         | Long text        |                                                                                                                      |
| Timestamp       | Created time     |                                                                                                                      |

## 4. Customise your ventures

Open `src/data/constants.js` and replace the `VENTURES` map with your own. Keys must match the Single-select options you defined for the `Venture` field across all 5 Airtable tables.

```js
export const VENTURES = {
  my_brand:    { name: "My Brand",    short: "MB",  color: "#3B82F6" },
  my_agency:   { name: "My Agency",   short: "AGY", color: "#10B981" },
  // ...
  cross:       { name: "Cross-Venture", short: "X", color: "#EAB308" },
};
```

You can also edit ventures live from the **Ventures** page — changes persist to browser localStorage and override the defaults for that browser only. (Useful for trying out a venture without changing the codebase.)

## 5. Seed agents (optional but recommended)

The app ships with a generic 14-agent demo roster in `src/data/agents.js`. This is shown only as a **fallback** when Airtable isn't reachable. To run on live data, populate the Airtable **Agents** table with your own agent hierarchy. The on-page UI (`/swarm` and `/office`) supports add/edit/delete.

## 6. Run

```bash
npm run dev
```

Open http://localhost:5173. You should see your real ventures + agents within 30 seconds (parallel sync polls all 5 tables on a 30s base interval, backing off to 120s on errors).

## 7. Deploy to Vercel

```bash
vercel link
vercel
```

Add all the `VITE_*` env vars in the Vercel dashboard → Settings → Environment Variables. Each developer / collaborator should connect their **own** Airtable base; you do not share the API key.

---

## Troubleshooting

| Symptom                                   | Fix                                                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Dashboard shows generic demo agents only  | `.env` not set, or Airtable API returning 4xx. Check the **Settings → Database** tab and the dev console for errors. |
| Status bar says "LIVE 0 active"           | Agents table empty in Airtable, or Status field uses unexpected option names                        |
| Directive create fails silently           | Check the `Venture` option matches a key in `VENTURES` exactly                                       |
| Activity Log not populating               | The `Event Type` field is missing a required option — see table above                                |
| 3D office page hangs                      | Disable WebGL or set `VITE_ENABLE_3D_OFFICE=false`                                                  |
| Recharts width/height warning             | Cosmetic, harmless — happens during the first render frame                                          |

## Development conventions

- Atomic Design under `src/components/` — atoms / molecules / organisms / templates / pages
- All animation variants live in `src/motion/`
- Don't commit `.env`, `OPERATIONS-MANUAL.md`, or `SECURITY-AUDIT.md` (already gitignored)
- Add new venture keys in **one place**: `src/data/constants.js`. Pathfinding zones, 3D floor markers, and Airtable validation auto-derive from this map.
