# Claude Code: Continue figma-token-sync Development

> **✅ COMPLETED - January 9, 2025**
>
> **This document is archived because Phase 2 has been completed.**
>
> **What was completed:**
> - `dtcg-to-design-language.ts` - Transforms DTCG JSON files → TypeScript DesignLanguageContract
> - `design-language-to-dtcg.ts` - Transforms TypeScript contract → DTCG JSON for Figma import
> - Token directory structure fully set up in Discourser-Design-System
>
> **Current status:** Phase 3 (Figma Import Function) is now the current phase.
>
> **See instead:**
> - `FIGMA_DESIGN_SYSTEM_SYNC_SPEC.md` - Updated with Phase 2 completion and Phase 3 as current
>
> This file is preserved for historical reference only.

---

## Context

You are continuing development of the Figma ↔ Design System token sync workflow. 

**Authoritative Specification**: `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/figma-token-sync/FIGMA_DESIGN_SYSTEM_SYNC_SPEC.md`

**IMPORTANT**: Always follow the Implementation Task List in **Appendix C** of the spec. Do not create alternative tasks or skip phases.

---

## Current Status

### ✅ Phase 1: COMPLETE
- Export produces DTCG-compliant files
- Two files: `primitives-colors.json` and `semantic-colors.json`
- Validated exports located at:
  - `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/figma-token-sync/test-output/primitives-colors.json`
  - `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/figma-token-sync/test-output/semantic-colors.json`

### 🔄 Phase 2: CURRENT - Transform Scripts
You are now working on **Phase 2** in the `Discourser-Design-System` repository.

---

## Your Task: Phase 2

### Repository to work in:
```
/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/Discourser-Design-System
```

### Task 2.1: Create `dtcg-to-design-language.ts`

**File**: `scripts/dtcg-to-design-language.ts`

**Purpose**: Transform DTCG JSON files into the TypeScript DesignLanguageContract

**Inputs** (copy from figma-token-sync test-output first):
- `tokens/primitives/colors.json` (from primitives-colors.json)
- `tokens/semantic/colors.light.json` (from semantic-colors.json)
- `tokens/semantic/colors.dark.json` (future - create placeholder)

**Output**: Updates `src/languages/material3.language.ts`

**Reference Implementation**: See **Part 3** of the spec for complete TypeScript code.

**Steps**:
1. First, explore the existing Discourser-Design-System structure
2. Find or create the `DesignLanguageContract` interface
3. Create the `tokens/` directory structure
4. Copy the validated exports from figma-token-sync to the tokens directory
5. Implement `dtcg-to-design-language.ts` following Part 3 of the spec
6. Add npm script: `"transform:dtcg-to-contract": "tsx scripts/dtcg-to-design-language.ts"`
7. Test the transform

### Task 2.2: Create `design-language-to-dtcg.ts`

**File**: `scripts/design-language-to-dtcg.ts`

**Purpose**: Reverse transform - generate DTCG tokens from the design language contract for Figma import

**Input**: `src/languages/material3.language.ts`

**Output**: Single `tokens.json` file (combined primitives + semantics for Figma import)

**Reference Implementation**: See **Part 4** of the spec for complete TypeScript code.

**Architecture Decision** (already made):
- EXPORT (Figma → Code): TWO files (DTCG compliance)
- IMPORT (Code → Figma): ONE file (better UX, like Material 3)

**Steps**:
1. Implement `design-language-to-dtcg.ts` following Part 4 of the spec
2. Output should be a single combined `tokens.json` that the Figma plugin will import
3. Add npm script: `"transform:contract-to-dtcg": "tsx scripts/design-language-to-dtcg.ts"`
4. Test the transform

---

## Key Files to Reference

1. **Spec Document**: 
   `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/figma-token-sync/FIGMA_DESIGN_SYSTEM_SYNC_SPEC.md`

2. **Validated Export Files**:
   - `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/figma-token-sync/test-output/primitives-colors.json`
   - `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/figma-token-sync/test-output/semantic-colors.json`

3. **Design System Repository**:
   `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/Discourser-Design-System`

---

## Success Criteria for Phase 2

- [ ] `tokens/` directory created with proper structure
- [ ] DTCG files copied and organized correctly
- [ ] `dtcg-to-design-language.ts` transforms DTCG → TypeScript contract
- [ ] `design-language-to-dtcg.ts` transforms TypeScript → single DTCG file
- [ ] Both npm scripts work: `pnpm run transform:dtcg-to-contract` and `pnpm run transform:contract-to-dtcg`
- [ ] Round-trip preserves data: DTCG → Contract → DTCG produces equivalent output

---

## Do NOT

- Skip to Phase 3 (Figma Import) until Phase 2 is complete
- Create alternative task structures
- Work in the wrong repository (Phase 2 is in Discourser-Design-System, not figma-token-sync)
- Deviate from the spec without explicit approval

---

## Begin

Start by reading the spec document, then explore the Discourser-Design-System repository structure to understand the existing codebase before implementing Task 2.1.
