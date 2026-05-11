# HIVE COMMAND

> AI agent swarm operations dashboard for the solo operator.

A single visual command center to monitor, direct, and review AI agents organized in a 4-tier hierarchy (Commander → Directors → Managers → Worker Agents) across multiple ventures. Honeycomb visual identity, dark tactical theme, Airtable-backed live data, optional Ollama/Claude/OpenAI integration.

## Stack

- **Frontend:** React 19 + Vite 8 + Tailwind 4
- **Animations:** Framer Motion 12 (via `motion`)
- **State:** Zustand 5
- **Routing:** React Router 7
- **Charts:** Recharts 3
- **3D:** Three.js + React Three Fiber 9 + Drei 10
- **Backend:** Airtable (5 tables: Agents, Directives, Tasks, Outputs, Activity Log)
- **AI (optional):** Ollama (local) with Claude/OpenAI fallbacks
- **Hosting:** Vercel

## Pages

| Route          | Page         | What it does                                     |
| -------------- | ------------ | ------------------------------------------------ |
| `/swarm`       | Swarm        | Agent grid + task feed + filters                 |
| `/commander`   | Commander    | Issue directives + run the autonomous loop       |
| `/ventures`    | Ventures     | Venture-scoped roll-ups + KPI editing            |
| `/directives` | Directives   | Active + completed directives                    |
| `/outputs`     | Outputs      | Deliverable library with review/approve/reject   |
| `/office`      | 3D Office    | Three.js floor with venture clusters             |
| `/analytics`   | Analytics    | Status, task volume (7d), tasks/venture (30d)    |
| `/settings`    | Settings     | Integrations, AI, display, database, security    |

## Quick start

```bash
npm install
cp .env.example .env   # fill in your Airtable credentials
npm run dev            # http://localhost:5173
```

**Full setup (including the Airtable schema you need to create) is in [SETUP.md](./SETUP.md).**

## Conventions

- Atomic Design: `atoms → molecules → organisms → templates → pages`
- Animation variants in `src/motion/` — compose, don't inline
- All colors via CSS custom properties (`src/styles/index.css`)
- Spacing scale: 4px increments (`--space-1` … `--space-16`)
- Agent / venture data lives in Airtable; `src/data/agents.js` + `src/data/constants.js` are fallback seeds shipped with the repo
- Airtable mutations are optimistic (Zustand store first, then sync)

## Commands

```bash
npm run dev        # Dev server on :5173
npm run build      # Production build
npm run preview    # Preview build
npm run lint       # ESLint
```

## License

MIT — see [LICENSE](./LICENSE) if present, else add one for your fork.
