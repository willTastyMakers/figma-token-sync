# Implement Transform Functions

Implement token transformation functions in packages/core.

## Context

These transforms are used by BOTH the Figma Plugin and the Storybook Addon. They convert between:
- **DTCG format** — W3C Design Tokens (tokens.json)
- **Figma Variables** — Serialized from Plugin API
- **DesignLanguageContract** — Aesthetic-agnostic code format

## Steps

1. Read `.claude/skills/dtcg-tokens/SKILL.md` for DTCG format
2. Read `.claude/skills/design-language-contract/SKILL.md` for contract pattern
3. Read `.claude/skills/figma-api/SKILL.md` for Plugin API types
4. Implement in `packages/core/src/transforms/`:
   - `dtcg-parser.ts` — Parse DTCG JSON to internal representation
   - `dtcg-serializer.ts` — Serialize internal to DTCG JSON
   - `language-contract.ts` — DesignLanguageContract ↔ DTCG transforms
   - `figma-transform.ts` — Figma Variables (serialized) ↔ DTCG transforms
5. Handle color format conversions (hex ↔ RGBA 0-1 range)
6. Handle variable aliases/references
7. Write comprehensive tests

## Transform Flow

```
Figma Plugin Export
│
▼
SerializedFigmaVariable[]  ──► figma-transform.ts ──► DTCGTokens
│
▼
tokens.json
│
▼
DTCGTokens ──► language-contract.ts ──► DesignLanguageContract
```

## Key Types

```typescript
// From packages/core/src/types/figma.ts
interface SerializedFigmaVariable {
  id: string;
  name: string;                    // e.g., "colors/primary/500"
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, FigmaVariableValue>;
  description?: string;
  collectionId: string;
}

// From packages/core/src/types/dtcg.ts
interface DTCGToken {
  $type: string;
  $value: unknown;
  $description?: string;
}
```

## Validation

- [ ] DTCG parser handles all token types (color, dimension, string, number, boolean)
- [ ] DTCG serializer produces valid W3C Design Tokens output
- [ ] LanguageContract ↔ DTCG transforms are reversible (round-trip)
- [ ] Figma ↔ DTCG transforms handle all variable types
- [ ] Aliases/references are resolved correctly
- [ ] Color formats convert correctly (hex ↔ Figma RGBA)
- [ ] All tests pass
```
