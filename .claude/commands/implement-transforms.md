# Implement Transform Functions

Implement token transformation functions in packages/core.

## Steps

1. Read `.claude/skills/dtcg-tokens/SKILL.md` for DTCG format
2. Read `.claude/skills/design-language-contract/SKILL.md` for contract pattern
3. Implement in `packages/core/src/transforms/`:
   - `dtcg-parser.ts` — Parse DTCG JSON to internal representation
   - `dtcg-serializer.ts` — Serialize internal to DTCG JSON
   - `language-contract.ts` — DesignLanguageContract ↔ DTCG transforms
   - `figma-transform.ts` — Figma Variables ↔ DTCG transforms
4. Handle color format conversions (hex ↔ RGBA)
5. Handle variable aliases/references
6. Write comprehensive tests

## Validation

- [ ] DTCG parser handles all token types
- [ ] DTCG serializer produces valid output
- [ ] LanguageContract ↔ DTCG transforms are reversible
- [ ] Figma ↔ DTCG transforms handle all variable types
- [ ] All tests pass
