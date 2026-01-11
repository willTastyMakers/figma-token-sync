# Documentation Archive

This directory contains deprecated or completed documentation files that are preserved for historical reference.

## Archived Documents

### TIER1-DEVELOPMENT-PROMPT-DEPRECATED.md
**Archived:** January 11, 2025
**Reason:** Describes REST API-based approach that was abandoned on December 29, 2024

The original Tier 1 prompt described building token sync using Figma's Variables REST API. However, this API requires a Figma Enterprise plan ($45/seat/month), making it inaccessible for most users.

The project pivoted to a Plugin-based architecture that works on all Figma plan tiers.

**See instead:** `TIER1-PROGRESS.md` for the actual implementation

---

### CLAUDE_CODE_PROMPT-PHASE2-COMPLETE.md
**Archived:** January 11, 2025
**Reason:** Phase 2 transform scripts completed on January 9, 2025

This prompt guided the implementation of Phase 2 (Transform Scripts):
- `dtcg-to-design-language.ts` - DTCG → TypeScript contract
- `design-language-to-dtcg.ts` - TypeScript → DTCG

Both scripts are now complete and integrated into the Discourser-Design-System repository.

**See instead:** `FIGMA_DESIGN_SYSTEM_SYNC_SPEC.md` for current project status (Phase 3 in progress)

---

## Active Documentation

For current project documentation, see:
- `../TIER1-PROGRESS.md` - Tier 1 completion history and architecture decisions
- `../FIGMA_DESIGN_SYSTEM_SYNC_SPEC.md` - Authoritative specification (updated with Phase 2 completion)
