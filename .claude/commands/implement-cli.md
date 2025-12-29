# Implement CLI Commands

Implement the CLI in packages/cli using Commander.js.

## Steps

1. Read `.claude/skills/monorepo-patterns/SKILL.md` for ESM patterns
2. Implement CLI commands in `packages/cli/src/commands/`:
   - `init.ts` — Create config file with prompts
   - `pull.ts` — Fetch Figma → local files
   - `push.ts` — Push local files → Figma
   - `diff.ts` — Show diff without syncing
   - `validate.ts` — Test connection and config
3. Wire up main entry point with Commander.js
4. Add colored console output for diff display
5. Add helpful `--help` output for all commands
6. Test commands work end-to-end

## Validation

- [ ] `figma-token-sync --help` shows all commands
- [ ] `figma-token-sync init` creates config file
- [ ] `figma-token-sync validate` tests connection
- [ ] All commands have descriptive help text
- [ ] Error messages are actionable
