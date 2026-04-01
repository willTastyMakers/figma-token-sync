# Typography → Figma Sync: Session Handoff

## Where We Are

We designed a complete architecture for syncing typography tokens from
Discourser-Design-System (DDS) into Figma via figma-token-sync, and planned
how a consuming app reads those tokens back via Figma MCP. The DDS contract
changes are the immediate next step; figma-token-sync comes after.

---

## Three Decisions Made

**Decision 1: Weight mapping lives in material3.language.ts**
The font weight → Figma style name mapping is defined in the language file,
not hardcoded in the transform script.

```typescript
fontWeightMap: {
  Poppins: { '100': 'Thin', '300': 'Light', '400': 'Regular', '500': 'Medium', '600': 'SemiBold', '700': 'Bold' },
  Fraunces: { '100': 'Thin', '300': 'Light', '400': 'Regular', '500': 'Medium', '600': 'SemiBold', '700': 'Bold' }
}
```

**Decision 2: Weights per category**
- Display: Regular, SemiBold
- Headline: Light, Regular, SemiBold
- Title: Regular, Medium, SemiBold, Bold
- Body: Light, Regular, Medium, SemiBold
- Label: Light, Medium, SemiBold, Bold

Mobile responsive weights deferred to later.

**Decision 3: Token structure**
Flat primitive tokens (not DTCG composite typography tokens) for Figma Variables,
plus a separate manifest JSON telling the plugin which text styles to create.
The plugin uses `figma.createTextStyle()` with raw values, and stores the token
path in the `description` field as the semantic bridge.

---

## Current Claude Code Todo List (Step in Progress)

Claude Code has a 4-step plan for the DDS-only session:

1. Update TypeStyle interface in `src/contracts/design-language.contract.ts`
   — Add: WeightName, FontWeightMap, FontConfig, TypeGeometry, WeightVariant, TypeScaleStep
   — Update: `TypographyConfig.fonts` from `{ display: string }` to `{ display: FontConfig }`
   — Update: `TypographyScale` to use `TypeScaleStep` instead of `TypeStyle`

2. Update `material3.language.ts` — replace typography block with new structure:
   fonts as FontConfig objects, each scale step as `{ geometry, defaultWeight, weights }`
   **CONSTRAINT: Preserve `fontVariationSettings` on `displayLarge` and `headlineMedium`**

3. Update `transform.ts` — read `fonts.display.family` (not `fonts.display`),
   read `geometry`/`defaultWeight` from each scale step. Panda textStyle transform
   uses `defaultWeight` to resolve the single fontWeight per step.

4. Run `pnpm typecheck` + `vitest`, fix any breaks.

**Do not touch figma-token-sync in this session.**

---

## Architecture: The Two-Step Figma Pattern

**Step 1 — Typography primitive variables** (new Typography collection in Figma)
Each type scale property becomes a flat Figma Variable with a raw value.

Naming convention: `Font/{Property}/{ScaleStep}`
- `Font/Size/displayLarge` → FLOAT → 57
- `Font/LineHeight/displayLarge` → FLOAT → 64
- `Font/Weight/displayLarge` → FLOAT → 400
- `Font/LetterSpacing/displayLarge` → FLOAT → -0.25
- `Font/Family/displayLarge` → STRING → "Fraunces"
- `Font/Family/display` → STRING → "Fraunces" (alias tokens)
- `Font/Family/body` → STRING → "Poppins"
- `Font/Family/mono` → STRING → "JetBrains Mono"

**Step 2 — Text styles with token name in description**
`setBoundVariable` on TextStyle is NOT supported in the Figma Plugin API.
The plugin creates text styles with raw values; description field = semantic bridge.

Text style naming: `{Category}/{Size}/{Weight}` — e.g. `Body/Large/SemiBold`
Description format: `token: typography.scale.{scaleName}.weights.{weightName}`

---

## Key Technical Constraints

- `setBoundVariable` on TextStyle = **NOT SUPPORTED** in Figma Plugin API
- CSS font stacks must be stripped to primary font name only:
  `'"Fraunces", Georgia, serif'` → `'Fraunces'`
- Font must be loaded via `figma.loadFontAsync` before setting any property
- Figma uses named font styles (e.g. "SemiBold"), not numeric weights
- DTCG composite `$type: "typography"` tokens **cannot** be imported as Figma Variables

---

## Files to Change (Full Scope)

### Phase 1 — DDS (current Claude Code session)
- `src/contracts/design-language.contract.ts` — interface updates
- `src/languages/material3.language.ts` — new typography structure
- `packages/core/src/transformers/transform.ts` — update to read new shape

### Phase 2 — figma-token-sync (next session, after DDS is stable)
- `packages/core/src/transformers/typography.transformer.ts` — new file
- `packages/figma-plugin/src/code.ts` — extend import for Typography collection
- Add "Import Text Styles" plugin action using manifest JSON
- `packages/cli/` — extend `contract-to-dtcg` to include typography output

### Phase 3 — Skill/doc updates (after figma-token-sync works)
- `figma-token-sync/.claude/skills/design-language-contract/SKILL.md`
- `figma-token-sync/.claude/skills/figma-api/SKILL.md`
- `Discourser-Design-System/.claude/skills/dds-use-figma/skill.md`
- `Discourser-Design-System/guidelines/typography-figma-sync.md` (new file)

---

## Consuming App: How to Read Typography from Figma

1. Read text node → get `textStyleId`
2. Get style → read `style.description` → extract `token: typography.scale.{name}.weights.{weight}`
3. Look up in DDS NPM package or Storybook MCP
4. Apply full token — **never reproduce raw pixel values**

---

## Continuation Prompt for Claude Desktop

Paste this to open the next session:

```

Claude Code is currently mid-session executing Phase 1 (DDS contract changes).
Once that is complete and tests pass, I need your help leading me through
Phase 2: extending figma-token-sync to handle the new token structure.

To continue: please confirm you understand the architecture, then ask me
for the current state of the updated DDS files so we can plan Phase 2.
```
