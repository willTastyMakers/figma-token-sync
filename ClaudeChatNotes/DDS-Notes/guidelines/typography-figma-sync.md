# Typography → Figma Sync

## Status
Not yet implemented. This document captures the plan for Claude Code to execute.

## Problem Statement

Typography is currently excluded from the Figma token sync pipeline. The
`design-language-contract` skill previously documented typography as "code only"
because Figma Variables don't support composite token types. This caused a
fidelity gap: consuming apps reading Figma via MCP get raw pixel values with no
semantic context, and cannot reliably resolve back to the DDS token system.

## Root Causes

1. DTCG composite `typography` tokens cannot be imported as Figma Variables
2. `setBoundVariable` on TextStyle is not supported in the Figma Plugin API
3. CSS font stacks (e.g. `'"Fraunces", Georgia, serif'`) are not valid Figma font names
4. The `figma-token-sync` plugin had no text style creation capability
5. The DDS contract's `fontFamily` is stored as an alias (`'display'`) not a font name

## Solution Architecture

Two-step pattern that works within Figma's constraints:

**Step 1 — Typography primitive variables** (new Typography collection in Figma)
Each type scale property becomes a flat Figma Variable with a raw value.
The Figma plugin creates these the same way it creates Spacing variables.

**Step 2 — Text styles with token name descriptions** (new capability in plugin)
The plugin creates a Figma text style for each scale step with raw values set
directly (not bound via variables — that API doesn't exist). The description
field stores `token: typography.scale.{scaleName}` as the semantic bridge.

## Files to Change

### In `figma-token-sync`

**`packages/core/src/transformers/`** — add `typography.transformer.ts`
- Input: `DesignLanguageContract['typography']`
- Output: flat DTCG primitive tokens (numbers and strings, no composite)
- Handles: CSS font stack stripping, alias resolution, px unit stripping
- Must export: `transformTypography(typography: TypographyConfig): DTCGTokens`

**`packages/figma-plugin/src/`** — extend plugin to handle Typography collection
- Add import handler for `Font/*` variable path prefix → creates FLOAT/STRING variables
- Add new "Import Text Styles" action → calls `createTypeRamp` from skill
- Must be idempotent: skip existing styles/variables, update changed values

**`packages/cli/`** — add `transform:contract-to-dtcg` typography support
- Currently transforms colors and spacing only
- Extend to include typography flat primitives in `tokens/tokens.json` output

### In `Discourser-Design-System`

**`scripts/`** — no changes needed (uses figma-token-sync CLI)

**`.claude/skills/dds-use-figma/skill.md`** — already updated (see skill file)

## Transform Logic

### CSS Font Stack → Primary Font Name
```typescript
// Input:  '"Fraunces", Georgia, serif'
// Output: 'Fraunces'
function extractPrimaryFont(cssStack: string): string {
  return cssStack.split(',')[0].trim().replace(/['"]/g, '');
}
```

### Font Weight Number → Figma Style Name
Font style names vary per typeface. Must be discovered at runtime via
`figma.listAvailableFontsAsync()`. Never hardcode. See figma-api skill.

### Alias Resolution
```typescript
function resolveFontFamily(
  alias: 'display' | 'body' | 'mono',
  fonts: TypographyConfig['fonts']
): string {
  return extractPrimaryFont(fonts[alias]);
}
```

### Flat Token Output Structure
```
Font/Size/displayLarge    → number → 57
Font/Size/bodyMedium      → number → 14
Font/LineHeight/...       → number
Font/Weight/...           → number  
Font/LetterSpacing/...    → number
Font/Family/displayLarge  → string → 'Fraunces'
Font/Family/display       → string → 'Fraunces'  (alias tokens)
Font/Family/body          → string → 'Poppins'
Font/Family/mono          → string → 'JetBrains Mono'
```

## Export: Figma → Code (Reading Typography Back)

When the Figma plugin exports tokens back to code, typography export should:
1. Read all local text styles via `figma.getLocalTextStylesAsync()`
2. Parse description field to extract token name
3. Map style properties back to `TypeStyle` shape
4. Write to `tokens/typography-generated.json`

The consuming app agent workflow:
1. Read text node → get textStyleId
2. Get style → read description → extract `typography.scale.{name}`
3. Look up in DDS NPM package or Storybook MCP
4. Apply full token — never reproduce raw values

## Validation Checklist

Before marking complete:
- [ ] `figma-token-sync validate tokens/tokens.json` passes with typography tokens
- [ ] Typography collection appears in Figma Variables panel
- [ ] All 15 text styles appear in Figma text style panel
- [ ] Each text style description contains `token: typography.scale.*`
- [ ] Font families load correctly (Fraunces, Poppins, JetBrains Mono)
- [ ] Consuming agent test: given a Figma frame, agent resolves Display/Large → `typography.scale.displayLarge` → full TypeStyle from DDS
- [ ] Round-trip test: export from Figma → tokens match `material3.language.ts`

## Implementation Order for Claude Code

1. Write and test `typography.transformer.ts` in `packages/core`
2. Add unit tests for: font stack stripping, alias resolution, px stripping
3. Extend `contract-to-dtcg` CLI command to include typography output
4. Add Typography variable import to Figma plugin
5. Add text style creation to Figma plugin (new action button)
6. Test end-to-end: run CLI → open plugin → import → verify in Figma
7. Add typography to plugin export flow
8. Update `dds-use-figma` skill with actual Typography collection ID after first import
```

---

## 5. Handoff prompt for Claude Code

Paste this at the start of your Claude Code session:
```
I need to implement typography syncing between Discourser-Design-System and
Figma via figma-token-sync. The full plan, architectural decisions, and
implementation details are documented in these files — please read them before
starting any work:

1. figma-token-sync/.claude/skills/design-language-contract/SKILL.md
   (updated — now includes typography mapping and the two-step pattern)
2. figma-token-sync/.claude/skills/figma-api/SKILL.md
   (updated — now includes text style creation patterns)
3. Discourser-Design-System/.claude/skills/dds-use-figma/skill.md
   (updated — now includes typography collection and agent reading pattern)
4. Discourser-Design-System/guidelines/typography-figma-sync.md
   (new — full plan with files to change, transform logic, and implementation order)

Start with step 1 from the implementation order in the guidelines doc: write
and test `typography.transformer.ts` in `figma-token-sync/packages/core/src/transformers/`.
Show me the implementation plan as a todo list before writing any code.
