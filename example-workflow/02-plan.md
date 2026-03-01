---
id: plan
title: "Design & Planning"
step: 2
status: complete
depends_on: [research]
tags: [planning, architecture]
---

# Design & Planning

## Architecture

- **CLI** entry point using `commander`
- **Express** server with SSE for live updates
- **Vite + React** frontend
- **gray-matter** for frontmatter parsing
- **chokidar** for file watching

## Frontmatter Schema

```yaml
---
id: unique-step-id         # optional, defaults to filename
title: "Human readable"
step: 1                    # numeric order (optional)
status: pending            # pending | in_progress | complete | blocked
depends_on: [step-id]      # dependency edges
tags: [research, planning]
---
```

## Milestones

- [x] Architecture decided
- [x] Schema finalized
- [ ] Implementation started
