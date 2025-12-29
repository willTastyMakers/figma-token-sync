# Scaffold Tier 1 Foundation

Initialize the figma-token-sync monorepo with complete project structure.

## Steps

1. Read the PRD at `docs/PRD.md` for full requirements
2. Read skills in `.claude/skills/` for technical patterns
3. Create the monorepo structure:
   - Root configuration (pnpm-workspace.yaml, turbo.json, tsconfig.base.json)
   - packages/core with type definitions and stub implementations
   - packages/cli with Commander.js setup
   - packages/addon as placeholder
   - examples/material3 with sample tokens
4. Ensure all TypeScript compiles
5. Verify `pnpm install` and `pnpm build` succeed

## Validation

- [ ] `pnpm install` completes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` generates dist folders
- [ ] Project structure matches PRD specification
