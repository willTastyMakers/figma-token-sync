# Scaffold Tier 1 Foundation

Initialize the figma-token-sync monorepo with complete project structure including the Figma Plugin.

## Context

This scaffold creates the foundation for a **Plugin-based architecture** (not REST API). The Figma Variables REST API requires Enterprise, but Plugins work on all plan tiers.

## Steps

1. Read the PRD at `docs/PRD.md` for full requirements
2. Read skills in `.claude/skills/` for technical patterns
3. Create the monorepo structure:
   - Root configuration (pnpm-workspace.yaml, turbo.json, tsconfig.base.json)
   - packages/core with type definitions and transform stubs
   - packages/figma-plugin with manifest and code/ui stubs
   - packages/cli with Commander.js setup
   - packages/addon as placeholder
   - examples/material3 with sample tokens
4. Ensure all TypeScript compiles
5. Verify `pnpm install` and `pnpm build` succeed

## Package Structure

```
figma-token-sync/
├── packages/
│   ├── core/              ← Transform logic (shared)
│   │   └── src/
│   │       ├── transforms/
│   │       ├── diff/
│   │       └── types/
│   │
│   ├── figma-plugin/      ← Figma Plugin (NEW!)
│   │   ├── manifest.json
│   │   └── src/
│   │       ├── code.ts        # Sandbox (Plugin API access)
│   │       ├── ui.tsx         # React UI
│   │       ├── variables/     # Variable read/write
│   │       └── sync/          # Export/import logic
│   │
│   ├── cli/               ← Command line interface
│   │   └── src/
│   │       └── commands/
│   │           ├── init.ts
│   │           ├── validate.ts
│   │           ├── diff.ts
│   │           └── convert.ts
│   │
│   └── addon/             ← Storybook addon (Tier 2)
│       └── README.md
│
├── examples/
│   └── material3/
│
├── tokens.json            ← Sync file (bridge)
└── docs/
└── PRD.md
```

## Key Files to Create

### packages/figma-plugin/manifest.json
```json
{
  "name": "Figma Token Sync",
  "id": "figma-token-sync-plugin",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "capabilities": ["variablesRead", "variablesWrite"],
  "permissions": ["currentuser"]
}
```

### packages/figma-plugin/package.json
```json
{
  "name": "@figma-token-sync/figma-plugin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "vite build",
    "watch": "vite build --watch"
  }
}
```

## Removed from Scaffold

The following are **no longer needed** (REST API approach):
- ~~packages/core/src/api/figma-client.ts~~ — No REST API client
- ~~CLI pull/push commands~~ — Sync via Plugin instead

## Validation

- [ ] `pnpm install` completes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` generates dist folders
- [ ] Project structure matches PRD specification
- [ ] packages/figma-plugin has valid manifest.json
- [ ] Core package has no REST API dependencies
```
