# Implement Figma Plugin

Implement the Figma Plugin for Variables access in packages/figma-plugin.

## Context

The Figma Variables REST API requires an Enterprise plan. We use a **Figma Plugin** instead, which has full Variables access on ALL plan tiers.

## Steps

1. Read `.claude/skills/figma-api/SKILL.md` for Plugin API details
2. Create `packages/figma-plugin/manifest.json`:
    - Set `capabilities: ["variablesRead", "variablesWrite"]`
    - Configure UI entry point
3. Implement `packages/figma-plugin/src/code.ts` (sandbox):
    - Handle `EXPORT` message — read all Variables, post to UI
    - Handle `IMPORT` message — write Variables from token data
4. Implement `packages/figma-plugin/src/ui.tsx` (React UI):
    - Export button — triggers EXPORT, allows download of tokens.json
    - Import button — file upload, sends to sandbox
    - Status display and error handling
5. Implement variable transforms in `packages/figma-plugin/src/`:
    - `variables/reader.ts` — Read Variables via Plugin API
    - `variables/writer.ts` — Write Variables via Plugin API
    - `sync/export.ts` — Variables → DTCG format
    - `sync/import.ts` — DTCG → Variables
6. Test in Figma:
    - Load plugin from manifest
    - Export Variables to JSON
    - Import JSON to Variables
    - Round-trip verification

## Key Plugin API Methods
```typescript
// Read
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variables = await figma.variables.getLocalVariablesAsync();

// Write
const collection = figma.variables.createVariableCollection(name);
const variable = figma.variables.createVariable(name, collectionId, type);
variable.setValueForMode(modeId, value);
```

## Validation

- [ ] Plugin manifest is valid
- [ ] Plugin loads in Figma without errors
- [ ] Export produces valid DTCG JSON
- [ ] Import creates/updates Variables correctly
- [ ] Round-trip preserves all token data
- [ ] Aliases/references are handled properly
- [ ] Multiple modes (Light/Dark) work correctly
