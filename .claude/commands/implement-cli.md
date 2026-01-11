# Implement CLI Commands

Implement the CLI in packages/cli using Commander.js.

## Context

With the Plugin-based architecture, the CLI does NOT directly communicate with Figma. Instead, it provides local utilities for token manipulation:

- **init** — Create configuration file
- **validate** — Validate tokens.json format
- **diff** — Compare two token files
- **convert** — Transform between formats (DTCG ↔ DesignLanguageContract)

The actual Figma sync happens via the **Figma Plugin**, not the CLI.

## Steps

1. Read `.claude/skills/monorepo-patterns/SKILL.md` for ESM patterns
2. Implement CLI commands in `packages/cli/src/commands/`:
   - `init.ts` — Create figma-token-sync.config.json with prompts
   - `validate.ts` — Validate tokens.json against DTCG schema
   - `diff.ts` — Show diff between two token files
   - `convert.ts` — Convert between token formats
3. Wire up main entry point with Commander.js
4. Add colored console output for diff display
5. Add helpful `--help` output for all commands

## Command Details

### init
```bash
figma-token-sync init
```
Creates a `figma-token-sync.config.json` with prompts for:
- Token file path (default: ./tokens.json)
- Format (dtcg, language-contract)
- Collections to track

### validate
```bash
figma-token-sync validate [file]
```
Validates token file against DTCG schema:
- Required fields ($type, $value)
- Valid token types
- Valid references (aliases)

### diff
```bash
figma-token-sync diff <file1> <file2>
```
Compares two token files and shows:
- Added tokens (green)
- Removed tokens (red)
- Changed values (yellow)
- Unchanged count

### convert
```bash
figma-token-sync convert <input> <output> --from <format> --to <format>
```
Converts between formats:
- `dtcg` — W3C Design Tokens format
- `language-contract` — DesignLanguageContract format

## Removed Commands

The following commands from the REST API approach are **no longer applicable**:
- ~~`pull`~~ — Figma → local (use Figma Plugin Export instead)
- ~~`push`~~ — local → Figma (use Figma Plugin Import instead)

## Validation

- [ ] `figma-token-sync --help` shows available commands
- [ ] `figma-token-sync init` creates config file
- [ ] `figma-token-sync validate` catches invalid tokens
- [ ] `figma-token-sync diff` shows meaningful comparison
- [ ] `figma-token-sync convert` transforms correctly
- [ ] All commands have descriptive help text
- [ ] Error messages are actionable
