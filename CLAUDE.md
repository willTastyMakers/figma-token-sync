
# Figma Token Sync

## Project Overview

`figma-token-sync` is an open-source tool for bidirectional synchronization of design tokens between code (TypeScript/JSON) and Figma Variables.

**Architecture:** Figma Plugin + File-Based Sync (tokens.json as communication bridge)

> ⚠️ **Note:** The Figma Variables REST API requires an Enterprise plan. This project uses a **Figma Plugin** approach instead, which works on ALL plan tiers (Free, Professional, Organization, Enterprise).

**Vision:** Free alternative to Token Studio ($15-40/month) with a developer-centric workflow.

## Architecture

```
┌─────────────────┐         tokens.json             ┌─────────────────┐
│  Figma Plugin   │ ◄─────── (file sync) ───────► │ Storybook Addon │
│  (reads/writes  │                                 │  (reads/writes  │
│   Variables)    │                                 │   tokens.json)  │
└─────────────────┘                                 └─────────────────┘
│                                                   │
▼                                                   ▼
Figma Variables                                     Code Tokens
(native access)                                   (TypeScript/JSON)
```

**Key Insight:** Figma Plugins have FULL access to the Variables API regardless of plan tier.

## Repository Structure

```
figma-token-sync/
├── .claude/
│   ├── commands/          ← Claude Code slash commands
│   └── skills/            ← Technical knowledge base
├── packages/
│   ├── core/              ← Transform logic (shared)
│   ├── figma-plugin/      ← Figma Plugin (Variables access)
│   ├── cli/               ← Command line interface
│   └── addon/             ← Storybook addon (Tier 2+)
├── examples/
│   └── material3/         ← Working example
├── tokens.json            ← Sync file (bridge between Plugin & Addon)
└── docs/
└── PRD.md             ← Full requirements
```

## Tech Stack

- **TypeScript** — Strict mode, ES Modules
- **pnpm** — Package manager with workspaces
- **Turbo** — Monorepo build orchestration
- **Vitest** — Testing
- **Commander.js** — CLI framework
- **Figma Plugin API** — Variables access (NOT REST API)

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
- **DTCG/W3C** — Interchange format (tokens.json)
- **DesignLanguageContract** — Aesthetic-agnostic pattern from @discourser/design-system
- **Figma Variables** — Native Figma format (accessed via Plugin API)

### Sync Flow

**Export from Figma:**
1. User runs Figma Plugin → Export
2. Plugin reads Variables via `figma.variables.*` API
3. Plugin transforms to DTCG format
4. User downloads/copies tokens.json
5. tokens.json committed to repo or loaded in Storybook

**Import to Figma:**
1. Storybook Addon edits tokens.json
2. User copies/uploads tokens.json
3. User runs Figma Plugin → Import
4. Plugin transforms from DTCG
5. Plugin writes to Variables via `figma.variables.*` API

## Skills Reference

Read these before implementing:
- `.claude/skills/figma-api/SKILL.md` — **Figma Plugin API** patterns (NOT REST)
- `.claude/skills/dtcg-tokens/SKILL.md` — W3C Design Tokens format
- `.claude/skills/design-language-contract/SKILL.md` — Contract architecture
- `.claude/skills/monorepo-patterns/SKILL.md` — pnpm + Turbo patterns

## Commands Reference

- `/scaffold-foundation` — Initialize monorepo structure (includes figma-plugin)
- `/implement-figma-plugin` — Build Figma Plugin for Variable access
- `/implement-transforms` — Build token transformers
- `/implement-cli` — Build CLI commands (validate, diff, convert)

## Current Phase

**Tier 1: CLI Foundation + Figma Plugin** — Building core transformation engine and Figma Plugin for Variable access.

See `docs/PRD.md` for full requirements and validation criteria.

## Related Projects

- `@discourser/design-system` — Reference for DesignLanguageContract pattern
  Location: `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/Discourser-Design-System`

## Critical Specification Document

**MUST READ:** `FIGMA_DESIGN_SYSTEM_SYNC_SPEC.md` in this repo root.

This document defines:
- Complete Figma variable structure (collections, naming conventions)
- DTCG output format that is spec-compliant
- Transform scripts for bidirectional sync
- Mapping between Figma → DTCG → DesignLanguageContract → PandaCSS

### Key Requirements from Spec:

1. **Primitives vs Semantics Separation**
   - `Primitives/Colors` collection → tonal palettes (0-100)
   - `Semantic/Colors` collection → aliases to primitives (with modes)

2. **DTCG Compliance**
   - NO `$value` at same level as child tokens
   - Use `$type` at group level (inherited)
   - Aliases format: `{palette.tone}` not Figma's `{Collection.path/name}`

3. **M3 Tonal Palette Structure**
   - 6 palettes: primary, secondary, tertiary, neutral, neutralVariant, error
   - 13 tones each: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100
   - Total: 78 primitive color variables

4. **Semantic Colors**
   - 31 semantic tokens (primary, onPrimary, surface, etc.)
   - Each has light AND dark mode values
   - Values are aliases to primitives

### Transform Chain:
```
Figma Variables
    ↓ figma-token-sync export
DTCG JSON (tokens/*.json)
    ↓ dtcg-to-design-language.ts
DesignLanguageContract (material3.language.ts)
    ↓ PandaCSS semantic tokens
m3-primary.ts → Radix 1-12 scale
    ↓ PandaCSS build
styled-system/ (CSS variables)
```
```
