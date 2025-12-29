# Figma Token Sync

## Project Overview

`figma-token-sync` is an open-source tool for bidirectional synchronization of design tokens between code (TypeScript/JSON) and Figma Variables via the REST API.

**Vision:** Free alternative to Token Studio ($15-40/month) with a developer-centric workflow.

## Repository Structure

```
figma-token-sync/
├── .claude/
│   ├── commands/          ← Claude Code slash commands
│   └── skills/            ← Technical knowledge base
├── packages/
│   ├── core/              ← Transform logic, Figma API client
│   ├── cli/               ← Command line interface
│   └── addon/             ← Storybook addon (Tier 2+)
├── examples/
│   └── material3/         ← Working example
└── docs/
    └── PRD.md             ← Full requirements
```

## Tech Stack

- **TypeScript** — Strict mode, ES Modules
- **pnpm** — Package manager with workspaces
- **Turbo** — Monorepo build orchestration
- **Vitest** — Testing
- **Commander.js** — CLI framework

## Key Patterns

### ESM Imports
Always use `.js` extensions in TypeScript imports:
```typescript
import { foo } from './utils.js';
```

### Workspace Dependencies
```json
"dependencies": {
  "@figma-token-sync/core": "workspace:*"
}
```

### Token Formats
- **DTCG/W3C** — Interchange format
- **DesignLanguageContract** — Aesthetic-agnostic pattern from @discourser/design-system
- **Figma Variables** — Native Figma format

## Skills Reference

Read these before implementing:
- `.claude/skills/figma-api/SKILL.md` — Figma REST API patterns
- `.claude/skills/dtcg-tokens/SKILL.md` — W3C Design Tokens format
- `.claude/skills/design-language-contract/SKILL.md` — Contract architecture
- `.claude/skills/monorepo-patterns/SKILL.md` — pnpm + Turbo patterns

## Commands Reference

- `/scaffold-foundation` — Initialize monorepo structure
- `/implement-figma-client` — Build Figma API client
- `/implement-transforms` — Build token transformers
- `/implement-cli` — Build CLI commands

## Current Phase

**Tier 1: CLI Foundation** — Building core transformation engine as CLI scripts.

See `docs/PRD.md` for full requirements and validation criteria.

## Related Projects

- `@discourser/design-system` — Reference for DesignLanguageContract pattern
  Location: `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/Discourser-Design-System`
