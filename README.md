# Flow-Claw

A configurable workflow and wiki viewer for markdown-based agentic workflows.

Point it at a directory of `.md` files, and it gives you:
- **Workflow view** — a live kanban board built from frontmatter metadata
- **Wiki view** — a browsable, rendered markdown explorer
- **Live reload** — automatically updates when agents write or modify files

---

## Quick Start

```bash
# Install dependencies
npm install

# Run in dev mode (server + UI hot-reload)
npm run dev

# Or use the CLI directly pointing at a directory
node packages/server/src/cli.js ./example-workflow
```

Then open http://localhost:5173 (dev) or http://localhost:3001 (production).

---

## Frontmatter Schema

Markdown files can include YAML frontmatter to participate in the workflow view:

```yaml
---
id: unique-step-id          # optional, defaults to filename-based ID
title: "Human readable name"
step: 1                     # numeric position (used for sorting)
status: in_progress         # pending | in_progress | complete | blocked
depends_on: [other-step-id] # dependency edges (future: DAG view)
tags: [research, planning]  # arbitrary tags shown on cards
---

Your markdown content here...
```

Files **without** these fields are still visible in the wiki view as plain pages.

---

## Project Structure

```
Flow-Claw/
├── packages/
│   ├── server/             # Express API + SSE + file watching
│   │   └── src/
│   │       ├── cli.js      # CLI entry point
│   │       ├── index.js    # Server bootstrap
│   │       ├── parser.js   # gray-matter + marked
│   │       ├── watcher.js  # chokidar file watching
│   │       └── routes/
│   │           ├── files.js  # /api/workflow, /api/file
│   │           └── sse.js    # /api/events (Server-Sent Events)
│   └── ui/                 # Vite + React + Tailwind frontend
│       └── src/
│           ├── App.jsx
│           ├── hooks/useWorkflow.js
│           ├── views/
│           │   ├── WorkflowView.jsx  # Kanban board
│           │   └── WikiView.jsx      # File browser + renderer
│           └── components/
│               ├── FileTree.jsx
│               └── MarkdownRenderer.jsx
├── example-workflow/       # Demo markdown files
├── Dockerfile
└── package.json            # npm workspaces root
```

---

## Docker

```bash
# Build
docker build -t flow-claw .

# Run, mounting your workflow directory
docker run -p 3001:3001 -v /path/to/your/workflow:/workflow flow-claw
```

Then open http://localhost:3001.

---

## API

| Endpoint | Description |
|---|---|
| `GET /api/workflow` | All parsed pages + workflow nodes |
| `GET /api/file?path=<rel>` | Single file with frontmatter + HTML |
| `GET /api/events` | SSE stream for file change events |
| `GET /api/config` | Server configuration (watched directory) |

---

## Roadmap

- [ ] DAG/graph view for dependency visualization
- [ ] Full-text search across all pages
- [ ] Inline markdown editing
- [ ] Multiple workflow directory support
- [ ] Agent activity log view
