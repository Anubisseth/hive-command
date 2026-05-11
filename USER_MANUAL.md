# HIVE COMMAND — User Manual

End-to-end guide to operating the dashboard.

> **Looking for setup?** This is the operator's manual. For installation + Airtable schema + env vars, see [SETUP.md](./SETUP.md).

---

## Table of Contents

1. [The Hive Metaphor](#the-hive-metaphor)
2. [Navigation](#navigation)
3. [Page-by-page walkthrough](#page-by-page-walkthrough)
   - [Swarm](#swarm-)
   - [Commander](#commander-)
   - [Ventures](#ventures-)
   - [Directives](#directives-)
   - [Outputs](#outputs-)
   - [3D Office](#3d-office-)
   - [Analytics](#analytics-)
   - [Settings](#settings-)
4. [Workflows](#workflows)
5. [Keyboard shortcuts](#keyboard-shortcuts)
6. [Troubleshooting](#troubleshooting)

---

## The Hive Metaphor

HIVE COMMAND treats your AI agent fleet as a bee hive. You (the operator) are the **Beekeeper**. Your agents are organised in a strict 4-tier hierarchy:

| Tier | Role | Job |
| --- | --- | --- |
| **0** | COMMANDER (Queen Bee) | Issues directives, reviews outputs, approves deliverables. Only one. |
| **1** | DIRECTORS | One per venture. Owns growth + delivery for that venture. |
| **2** | MANAGERS | Cross-cutting functions — outreach, content, research, finance, systems. |
| **3** | AGENTS (Worker Bees) | Execute specific operational tasks. |

Every agent has: a venture, a status, a mandate, a trigger, tools, deliverables, and optionally an AI model assignment + current task.

---

## Navigation

The dashboard has 8 pages. On desktop they're in the left sidebar; on mobile they're a bottom tab bar.

| Route | Page | What it does |
| --- | --- | --- |
| `/swarm` | Swarm | Agent grid OR node-graph view + task feed |
| `/commander` | Commander | Issue directives + run the autonomous Commander Loop |
| `/ventures` | Ventures | Venture-scoped roll-ups + KPI editing |
| `/directives` | Directives | Active + completed directive list with Complete/Cancel |
| `/outputs` | Outputs | Deliverable library with review + **AI Image Studio** |
| `/office` | 3D Office | Three.js embodied agents that walk, work, talk |
| `/analytics` | Analytics | Status pie + task volume + AI spend + per-model breakdown |
| `/settings` | Settings | Integrations, AI providers, display, database, security |

Press **⌘K** (or **Ctrl+K** on Windows/Linux) anywhere to open the command palette.

---

## Page-by-page walkthrough

### Swarm — `/swarm`

The default view. Two layouts:

**Grid view** (default)
- Filter chips at the top: Tier, Venture, Status
- Each agent card shows: status dot, name, tier, venture, mandate, current task progress, tools
- Click any card → slide-in detail panel with full metadata + child agents
- Top-right: **TEMPLATES** button (loads a pre-wired 5-agent team in one click)

**Canvas view** (toggle top-right)
- React Flow node graph showing the full 4-tier hierarchy
- Edges colored by parent tier, animated when the source agent is `active`
- Nodes show: tier, status, mandate, current task progress, tools, **model badge**
- Click any node to select; drag to rearrange; zoom + minimap controls

**Right-side TaskFeed** (grid view only, hidden on mobile)
- Live feed of every agent's `current_task` with progress bars

### Commander — `/commander`

Where you issue directives and watch them execute.

**Issue Directive form**
- Title, optional Details, Venture target, Priority (critical/high/medium/low)
- Hit DEPLOY → directive lands in the Commander Loop queue

**Commander Loop**
- Autonomous orchestration: **Decompose → Distribute → Execute → Collect → Review** (5 phases per iteration, up to 10 iterations by default)
- Live log of every LLM call, agent execution, output, and review verdict
- Pause / Resume / Stop controls
- Max iterations + delay between calls are tunable per run
- Each phase routes through your assigned per-agent model (set via the agent edit modal — see [Workflows](#workflows))

### Ventures — `/ventures`

Roll-ups for each of your configured ventures (defined in `src/data/constants.js → VENTURES`, editable in-app).

- Card per venture showing: short code, name, color, agent count, active count
- Click **edit (pencil)** to update KPIs (MRR, target, customer count, etc.)
- Click **+ ADD VENTURE** to create new ones
- Edits persist to **localStorage only** — no Airtable sync. Useful for trying out KPIs without committing.

### Directives — `/directives`

Tabbed list: **Active** | **Completed**.

Each directive card shows priority, status, target agent(s), deadline, description, and venture badge.

Active directives have **COMPLETE** and **CANCEL** buttons that update Airtable and the local store.

**+ NEW DIRECTIVE** top-right opens the same form as the Commander page.

### Outputs — `/outputs`

Deliverable review queue.

**AI Image Studio** (top strip)
- Type a description, hit GENERATE
- Routes to Gemini Nano Banana if `GEMINI_API_KEY` is configured server-side, else falls back to OpenAI DALL-E 3
- Generated image appears as a new output card with the image rendered inline

**Output cards**
- Title, type badge (report/document/image/asset/data/code), author agent, provider (if AI-generated), venture, status
- For text outputs: 2-line preview clipped
- For image outputs: rendered inline up to 300px tall
- Action buttons: **APPROVE** (✓ green), **REVISION** (↻ cyan), **REJECT** (✗ red)
- Export: PDF, DOCX, or Email

Filter chips: All / Pending / Approved / Revision / Rejected.

### 3D Office — `/office`

A retro tactical office where your agents are embodied as low-poly characters that actually move.

**What you'll see**
- **Floor with venture zone markers** — circular rings around each venture's cluster
- **Desks** — one per agent, with monitor that glows when the agent is `active`
- **Whiteboards** — one per venture, glow + new marker squiggles appear when an agent is nearby
- **Coffee machines** — one per venture, steam particles appear when an agent is nearby
- **Central meeting table** with a holographic projector ring
- **Water cooler** at the south wall
- **Server racks** along east + west walls (decoration)
- **Ambient particles** floating in the air

**Character variety per tier**
- **Commander** — capsule body with gold crown + red gem + flowing dark cape
- **Director** — briefcase in hand + venture-color shoulder pads
- **Manager** — black headset with mic boom + status-colored mic light
- **Agent (tier 3)** — status-colored tablet/clipboard appears when working

**Behavior state machine**
- Active agents periodically leave their desk for the whiteboard or meeting table, then return
- Reviewing agents head to the meeting table or another agent's desk
- Idle agents wander to the coffee machine or water cooler
- Blocked agents stay slumped at their desk

**Talking interactions**
- When 2 agents come within 1.5 units and both are stationary, a green dialogue bubble appears with a contextual phrase ("Pipeline's green, pushing through.", "Coffee's burnt again.", etc.)
- They face each other, head-swivel for 4-8 seconds, then disperse

**Speech bubbles**
- Persistent cyan bubble above each agent showing their current task
- Bubble Y staggered by tier so clustered agents don't overlap
- On hover: full info card with name, tier, status, model, task

**Procedural animations** (no rigged models — pure math)
- Walking: gait bob + forward lean + footstep dust particles every ~0.35s
- Working: head tilted down + body bob (typing motion)
- Talking: head swivel + body sway

**Soft obstacle repulsion** (NavMesh-light)
- Agents skirt around desks/whiteboards/coffee machines instead of clipping through

**Controls**
- Drag to rotate camera
- Scroll to zoom
- Shift+Drag to pan
- Click an agent to follow
- Top-right camera preset dropdown: Overview / Top-down / Side

### Analytics — `/analytics`

KPI strip + four charts.

**KPI cards (6)**
1. **TOTAL AGENTS** — count of all agents
2. **ACTIVE NOW** — count where `status === 'active'`
3. **TASKS TODAY** — count of tasks with today's `startedAt` from the Tasks table
4. **AI SPEND** — sum of `aiUsage.totalCost` across every recorded AI call
5. **AI TOKENS** — sum of `aiUsage.totalInputTokens + totalOutputTokens`
6. **{N}-DAY TARGET** — your cashflow goal (configurable; click "Set goal")

**Cashflow Target card** — set current $, target $, days elapsed, days total. Stored in localStorage. Shows ON TRACK / BEHIND PACE based on day-vs-progress ratio.

**Agent Status Distribution** — donut chart breaking down by Active / Idle / Blocked / Reviewing / Offline.

**Task Volume — Last 7 Days** — bar chart of tasks STARTED + COMPLETED, derived from the Tasks table.

**Tasks Per Venture — Last 30 Days** — bar chart of task counts per venture, colored by venture color.

**AI Spend Per Model** — horizontal bar chart, $-per-model, click RESET to clear counters (does not refund your provider bill).

**Recent AI Calls** — last 12 calls with agent / model / cost.

### Settings — `/settings`

Sidebar with 6 sections: Integrations, AI Assistant, Notifications, Display, Database, Security.

**Integrations** — tool catalog (Airtable, GoHighLevel, Gmail, LinkedIn, Shopify, n8n, Notion, Claude, Ollama, OpenAI, etc.). Status badge: CONNECTED / DISCONNECTED / PENDING. Disconnected integrations show a "VIA .ENV" hint — credentials must be set in your `.env` file.

**AI Assistant** — choose default LLM provider + model. Test connection button.

**Notifications** — toggle which events show notifications.

**Display** — theme, animation intensity, font scale.

**Database** — Airtable connection status, last sync time, manual sync button.

**Security** — API key status, OIDC token info, security audit summary.

---

## Workflows

### Load a team template

1. Go to **Swarm**
2. Click **TEMPLATES** (top-right)
3. Pick one of 6 presets: Marketing Agency / E-Commerce Brand / SaaS Startup / Consulting Firm / Content Studio / Research Lab
4. Confirm — your local agent list is replaced
5. The active template gets a green border in the modal
6. Click **CLEAR TEMPLATE** to restore your seed agents
7. The choice persists across page reloads via localStorage (`hive-active-template`)

### Assign a custom AI model to an agent

1. Go to **Swarm**
2. Click any agent card → detail panel opens
3. Click the agent name → edit modal
4. Scroll to **AI MODEL** dropdown — grouped by provider with live `$input/$output per M` pricing
5. Pick e.g. `Claude Haiku 4.5` for a Tier-3 agent (cheap), `Claude Opus 4.7` for the Commander (reasoning)
6. Save → the next time the Commander Loop calls this agent, it uses your assigned model and routes to that provider first
7. The model badge appears on the Canvas view node

### Run the Commander Loop

1. Go to **Commander**
2. Fill in the Directive form (title + details + priority)
3. Set Max Iterations (default 10) and Delay Between Calls (default 2s)
4. Click **DEPLOY**
5. Watch the log: each iteration shows DECOMPOSE → DISTRIBUTE → EXECUTE → COLLECT → REVIEW
6. Each output appears in **Outputs** with `pending_review` status
7. Approve / reject / request revision from there
8. Iterations stop when the Commander decides the directive is complete OR Max Iterations is hit

### Generate an image

1. Go to **Outputs**
2. Type a description in the **AI Image Studio** input
3. Click **GENERATE**
4. With `GEMINI_API_KEY` set on the server, Gemini Nano Banana renders it; otherwise DALL-E 3 fallback
5. A new output card appears at the top with the image rendered inline
6. Approve / export / share like any other output

⚠️ **Heads-up:** if Airtable is also configured, the generated image is local-only and will be overwritten by the next 30s sync unless you also push it to your Airtable Outputs table.

### Configure a cashflow goal

1. Go to **Analytics**
2. Click **Set goal** in the CASHFLOW TARGET card
3. Enter current $, target $, days elapsed, days total
4. Save — progress bar + ON TRACK / BEHIND PACE indicator appear
5. Stored in `localStorage.hive-cashflow-goal`

---

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| **⌘K** / **Ctrl+K** | Open command palette |
| **/** | Focus search (within command palette) |
| **Esc** | Close any modal / panel |
| **Tab** | Cycle command palette results |
| **Enter** | Execute selected command |

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Swarm shows demo agents only | Either Airtable isn't configured, or its API returned errors. Check Settings → Database for the last sync timestamp and dev console for errors. |
| Status bar says "LIVE 0 active" | Agents table empty in Airtable OR Status field uses option names that don't match `active`/`idle`/`blocked`/`offline`/`reviewing`. |
| Directive create fails silently | The `Venture` option in your Airtable doesn't match a key in `src/data/constants.js → VENTURES`. Update one or the other to match. |
| Activity Log empty | The `Event Type` select field in Airtable is missing one of the required options. See [SETUP.md](./SETUP.md#activity-log) for the full list. |
| 3D office hangs | Browser may lack WebGL. Set `VITE_ENABLE_3D_OFFICE=false` in your `.env`. |
| Image gen fails with "No image provider configured" | Set either `GEMINI_API_KEY` or `OPENAI_API_KEY` on the **server** (no `VITE_` prefix) — these stay server-side via the `/api/ai` proxy. |
| Image gen works locally but not on Vercel | You set `VITE_OPENAI_API_KEY` (client-side, doesn't reach the proxy). Set `OPENAI_API_KEY` (no VITE_) in Vercel env vars instead. |
| Templates keep getting overwritten | If Airtable is configured AND a template is loaded, only **agents** are protected. Directives/Tasks/Outputs still sync. Either disable Airtable or seed your Airtable to match the template. |
| Cost tracking shows $0.00 | Either no AI calls have been made yet, OR your model isn't in the catalog (`src/lib/aiPricing.js`). Add it to enable cost calc. |
| Recharts width warnings in console | Cosmetic, harmless — first-render frame race. |

---

## Where to file bugs

Open an issue on [github.com/Anubisseth/hive-command](https://github.com/Anubisseth/hive-command/issues) with:
1. What page you were on
2. What you clicked / typed
3. What happened (with screenshot if visible)
4. What you expected to happen
5. Browser + OS

---

## Roadmap

| Phase | Status |
| --- | --- |
| **Phase 1** — Visual prototype | ✅ Done |
| **Phase 2** — Airtable data layer | ✅ Done |
| **Phase A** — Per-agent model + AI cost + 3D speech | ✅ Done |
| **Phase B** — Embodied 3D + POI + animations + dialogue | ✅ Done |
| **Phase C** — Templates + multimodal | ✅ Done |
| **Phase D** — Rigged GLB characters + NavMesh + multi-tenant auth | 🟡 Planned |
| **Phase E** — Mobile app + push notifications + collaboration | 🟢 Future |
