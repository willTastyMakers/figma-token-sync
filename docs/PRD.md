# Figma Token Sync — Product Requirements Document

> **Version:** 2.0.0  
> **Last Updated:** December 29, 2024  
> **Current Phase:** Tier 1 — CLI Foundation + Figma Plugin
> **Architecture:** Plugin-based (pivoted from REST API)

---

## ⚠️ Critical Architecture Discovery

**Date:** December 29, 2024

The Figma Variables REST API (`GET/POST /v1/files/:file_key/variables`) requires an **Enterprise plan**. This was discovered during implementation.

### What We Learned

- Variables REST API is Enterprise-only (not documented clearly)
- Professional/Organization plans get 403 errors
- This affects ALL open-source token sync tools trying to use REST API

### Architecture Pivot

We're pivoting to a **Figma Plugin + File-Based Sync** approach:

```
┌─────────────────┐         tokens.json             ┌─────────────────┐
│  Figma Plugin   │ ◄─────── (file sync) ───────► │ Storybook Addon │
│  (reads/writes  │                                                  │ (reads/writes   │
│   Variables)    │                                                    │  tokens.json)   │
└─────────────────┘                                       └─────────────────┘
        │                                                                               │
        ▼                                                                               ▼
   Figma Variables                                                         Code Tokens
   (native access)                                                       (TypeScript/JSON)
```

**Key Insight:** Figma Plugins have FULL access to Variables API regardless of plan tier!

---

## Executive Summary

**FigmaTokenSync** is an open-source tool ecosystem that enables bidirectional synchronization of design tokens between code (TypeScript/JSON) and Figma Variables.

### Architecture Components

1. **Figma Plugin** — Reads/writes Figma Variables, exports/imports tokens.json
2. **Storybook Addon** — Visual token editor, file watcher, diff preview
3. **Core Library** — Transform logic shared between plugin and addon
4. **CLI** — Validation, diffing, format conversion

### Value Proposition

- **Free alternative** to Token Studio's $15-40/month subscription
- **Works on any Figma plan** — Professional, Organization, or Enterprise
- **Developer-centric** workflow — edit where you work
- **Bidirectional sync** — code ↔ Figma stays aligned via tokens.json
- **Aesthetic-agnostic** — works with M3, Shadcn, Chakra, custom brands
- **MIT License** with "Buy Me a Coffee" monetization

---

## Product Roadmap

### Tier 1: Foundation (Current)
**Duration:** 4-6 days

Core transformation engine + Figma Plugin for Variable access.

**Deliverables:**
- Monorepo structure with pnpm workspaces
- DTCG parser/serializer (`@figma-token-sync/core`)
- DesignLanguageContract ↔ DTCG transforms
- Figma Variables ↔ DTCG transforms
- Diff engine
- **Figma Plugin** with export/import UI
- CLI commands: init, diff, validate, convert

### Tier 2: Basic Storybook Addon
**Duration:** 3-4 days

Minimal Storybook panel with file-based sync.

**Deliverables:**
- Storybook addon package
- Panel showing token tree (read from tokens.json)
- File watcher for live updates
- Diff preview (local vs tokens.json)
- Export button (writes tokens.json for Figma Plugin to import)
- Configuration UI

### Tier 3: Full Token Editor
**Duration:** 5-7 days

Visual token editing within Storybook.

**Deliverables:**
- Token tree browser with search/filter
- Color picker with swatches
- Dimension editor
- Token creation/deletion
- Conflict resolution UI
- Undo/redo support
- Live preview of changes

### Tier 4: Advanced Features
**Duration:** 4-6 days

Power user features.

**Deliverables:**
- GitHub PR creation for token changes
- Changelog generation
- Version history
- Typography token preview
- Shadow/elevation preview
- Motion curve editor

---

## Technical Architecture

### Package Structure

```
figma-token-sync/
├── packages/
│   ├── core/              ← Transform logic (shared)
│   │   ├── src/
│   │   │   ├── transforms/
│   │   │   │   ├── dtcg-parser.ts
│   │   │   │   ├── dtcg-serializer.ts
│   │   │   │   ├── language-contract.ts
│   │   │   │   └── figma-transform.ts
│   │   │   ├── diff/
│   │   │   │   └── compare-tokens.ts
│   │   │   ├── types/
│   │   │   │   ├── dtcg.ts
│   │   │   │   ├── figma.ts
│   │   │   │   └── config.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── figma-plugin/      ← Figma Plugin (NEW!)
│   │   ├── src/
│   │   │   ├── ui.html           # Plugin UI
│   │   │   ├── ui.tsx            # React UI code
│   │   │   ├── code.ts           # Plugin sandbox code
│   │   │   ├── variables/
│   │   │   │   ├── reader.ts     # Read Figma Variables
│   │   │   │   └── writer.ts     # Write Figma Variables
│   │   │   └── sync/
│   │   │       ├── export.ts     # Variables → tokens.json
│   │   │       └── import.ts     # tokens.json → Variables
│   │   ├── manifest.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/               ← Command line interface
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── init.ts
│   │   │   │   ├── diff.ts
│   │   │   │   ├── validate.ts
│   │   │   │   └── convert.ts
│   │   │   └── index.ts
│   │   ├── bin/
│   │   │   └── figma-token-sync.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── addon/             ← Storybook addon (Tier 2+)
│       └── README.md
│
├── examples/
│   └── material3/         ← Working example with M3 tokens
│
├── docs/
│   └── PRD.md
│
├── .claude/
│   ├── commands/
│   └── skills/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── tokens.json            ← Shared sync file (gitignored or committed)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── CLAUDE.md
├── LICENSE
└── README.md
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Package Manager | pnpm 9.x |
| Build Orchestration | Turbo 2.x |
| Language | TypeScript 5.7+ (strict) |
| Module System | ES Modules |
| Testing | Vitest 2.x |
| CLI Framework | Commander.js 12.x |
| Token Format | DTCG/W3C Design Tokens |
| Figma Plugin | Figma Plugin API + React |
| Storybook | Storybook 8.x |

---

## Figma Plugin API Reference

The Figma Plugin API provides full access to Variables without plan restrictions.

### Key APIs

```typescript
// Get all local variable collections
const collections = await figma.variables.getLocalVariableCollectionsAsync();

// Get all local variables
const variables = await figma.variables.getLocalVariablesAsync();

// Get a specific variable by ID
const variable = await figma.variables.getVariableByIdAsync(id);

// Create a new variable collection
const collection = figma.variables.createVariableCollection(name);

// Create a new variable
const variable = figma.variables.createVariable(name, collectionId, resolvedType);

// Update variable value for a mode
variable.setValueForMode(modeId, value);

// Delete a variable
variable.remove();
```

### Variable Types

```typescript
type VariableResolvedDataType = 
  | 'BOOLEAN' 
  | 'COLOR' 
  | 'FLOAT' 
  | 'STRING';

type VariableValue = 
  | boolean 
  | RGB 
  | RGBA 
  | number 
  | string 
  | VariableAlias;

interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}
```

### Plugin Manifest

```json
{
  "name": "Figma Token Sync",
  "id": "figma-token-sync",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"],
  "capabilities": ["variablesRead", "variablesWrite"],
  "permissions": ["currentuser"]
}
```

---

## Tier 1 Detailed Specification

### 1.1 Core Package (`@figma-token-sync/core`)

#### Transform Functions

```typescript
// DTCG Parser/Serializer
export function parseDTCG(json: string): DTCGTokens;
export function serializeDTCG(tokens: DTCGTokens): string;

// DesignLanguageContract ↔ DTCG
export function languageToTokens(language: DesignLanguageContract): DTCGTokens;
export function tokensToLanguage(tokens: DTCGTokens): Partial<DesignLanguageContract>;

// Figma Variables ↔ DTCG (for Plugin use)
export function figmaVariablesToTokens(
  variables: Variable[], 
  collections: VariableCollection[]
): DTCGTokens;
export function tokensToFigmaVariables(tokens: DTCGTokens): FigmaVariableUpdate[];
```

#### Diff Engine

```typescript
export function compareTokens(
  local: DTCGTokens,
  remote: DTCGTokens
): TokenDiff;

interface TokenDiff {
  added: string[];      // Token paths added locally
  removed: string[];    // Token paths removed locally
  modified: Array<{
    path: string;
    local: DTCGToken;
    remote: DTCGToken;
  }>;
  unchanged: string[];
}
```

### 1.2 Figma Plugin (`packages/figma-plugin`)

#### Export Flow (Figma → tokens.json)

```typescript
// code.ts (Plugin sandbox)
async function exportVariables() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();
  
  // Transform to DTCG format (using @figma-token-sync/core)
  const tokens = figmaVariablesToTokens(variables, collections);
  
  // Send to UI for download
  figma.ui.postMessage({ type: 'EXPORT_COMPLETE', tokens });
}
```

```typescript
// ui.tsx (Plugin UI)
function handleExport(tokens: DTCGTokens) {
  const json = JSON.stringify(tokens, null, 2);
  // Trigger download of tokens.json
  downloadFile('tokens.json', json);
}
```

#### Import Flow (tokens.json → Figma)

```typescript
// code.ts (Plugin sandbox)
async function importVariables(tokens: DTCGTokens) {
  const updates = tokensToFigmaVariables(tokens);
  
  for (const update of updates) {
    if (update.action === 'CREATE') {
      // Create new collection if needed
      // Create new variable
    } else if (update.action === 'UPDATE') {
      const variable = await figma.variables.getVariableByIdAsync(update.id);
      variable.setValueForMode(update.modeId, update.value);
    } else if (update.action === 'DELETE') {
      const variable = await figma.variables.getVariableByIdAsync(update.id);
      variable.remove();
    }
  }
  
  figma.ui.postMessage({ type: 'IMPORT_COMPLETE', stats: { created, updated, deleted } });
}
```

#### Plugin UI Features

- **Export Tab:**
  - Collection selector (multi-select)
  - Mode selector (which modes to export)
  - Preview of tokens to export
  - Download button

- **Import Tab:**
  - File upload zone
  - Diff preview (what will change)
  - Conflict warnings
  - Import button with confirmation

- **Settings Tab:**
  - Token format preference (DTCG vs Language Contract)
  - Collection naming convention
  - Mode mapping rules

### 1.3 CLI Package (`figma-token-sync`)

#### Commands (Updated for Plugin Architecture)

```bash
# Initialize config file
figma-token-sync init

# Show diff between local code tokens and tokens.json
figma-token-sync diff [--local <path>] [--remote <path>]

# Validate tokens.json format
figma-token-sync validate [--input <path>]

# Convert between formats
figma-token-sync convert --from dtcg --to language-contract --input tokens.json --output tokens.ts
```

**Note:** `pull` and `push` commands removed since they required REST API. Sync now happens via Figma Plugin.

#### Output Examples

**Diff:**
```
Comparing ./src/tokens/index.ts ↔ ./tokens.json...

+ Added in Figma (3):
  + colors.brand.accent
  + spacing.xxxl
  + semantic.success

- Removed from Figma (1):
  - colors.deprecated.old

~ Modified in Figma (2):
  ~ colors.primary.500
    Code:   #6750A4
    Figma:  #7C5CBF
  ~ spacing.lg
    Code:   24px
    Figma:  28px

Unchanged: 241

Run Figma Plugin to sync changes.
```

---

## Sync Workflow

### Developer Workflow (Code → Figma)

1. Developer edits tokens in TypeScript/JSON
2. Run `figma-token-sync convert` to update tokens.json
3. Open Figma Plugin → Import tab
4. Upload tokens.json
5. Review diff → Confirm import
6. Variables updated in Figma

### Designer Workflow (Figma → Code)

1. Designer edits Variables in Figma
2. Open Figma Plugin → Export tab
3. Select collections/modes
4. Download tokens.json
5. Developer runs `figma-token-sync diff` to see changes
6. Apply changes to code tokens

### CI/CD Workflow

1. tokens.json committed to repo (source of truth for sync state)
2. CI runs `figma-token-sync validate` to ensure valid format
3. CI runs `figma-token-sync diff` to detect drift
4. PR comments show token changes

---

## Type Definitions

### DTCG Token Format

```typescript
// packages/core/src/types/dtcg.ts

export interface DTCGToken {
  $type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 
         'duration' | 'cubicBezier' | 'number' | 'string';
  $value: string | number | object;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

export interface DTCGTokens {
  [key: string]: DTCGToken | DTCGTokens;
}
```

### Figma Plugin Types

```typescript
// packages/core/src/types/figma.ts

// These mirror Figma Plugin API types for use in transforms

export interface FigmaVariableData {
  id: string;
  name: string;
  resolvedType: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';
  valuesByMode: Record<string, FigmaVariableValue>;
  description: string;
  scopes: string[];
}

export interface FigmaCollectionData {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  variableIds: string[];
}

export type FigmaVariableValue =
  | boolean
  | number
  | string
  | { r: number; g: number; b: number; a: number }
  | { type: 'VARIABLE_ALIAS'; id: string };

export interface FigmaVariableUpdate {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  id?: string;
  name?: string;
  collectionId?: string;
  collectionName?: string;
  resolvedType?: FigmaVariableData['resolvedType'];
  modeId?: string;
  value?: FigmaVariableValue;
  description?: string;
  scopes?: string[];
}
```

### Configuration Types

```typescript
// packages/core/src/types/config.ts

export interface FigmaTokenSyncConfig {
  localPath: string;           // Path to code tokens (e.g., ./src/tokens/index.ts)
  syncFilePath: string;        // Path to tokens.json (e.g., ./tokens.json)
  format: 'dtcg' | 'language-contract' | 'json';
  collections?: string[];      // Filter to specific collections
  modes?: Record<string, string>;  // Map mode names
}
```

**Config File:** `.figmatokensyncrc.json`

```json
{
  "localPath": "./src/tokens/tokens.ts",
  "syncFilePath": "./tokens.json",
  "format": "dtcg",
  "collections": ["Primitives", "Semantic"],
  "modes": {
    "Light": "light",
    "Dark": "dark"
  }
}
```

---

## Validation Criteria

### Unit Tests

- [ ] DTCG parser handles all token types (color, dimension, number, string)
- [ ] DTCG serializer produces valid JSON output
- [ ] LanguageContract → DTCG transform is complete
- [ ] DTCG → LanguageContract transform is reversible
- [ ] Figma Variables → DTCG handles all variable types
- [ ] DTCG → Figma Variables produces valid update payloads
- [ ] Diff engine correctly identifies added/removed/modified tokens
- [ ] Config loader validates required fields
- [ ] Config loader provides helpful error messages

### Integration Tests

- [ ] Figma Plugin exports valid tokens.json
- [ ] Figma Plugin imports tokens.json correctly
- [ ] Round-trip: export → import → export shows no changes
- [ ] Works with @discourser/design-system `material3.language.ts`

### CLI Tests

- [ ] `init` creates valid config file with prompts
- [ ] `diff` displays readable, colored output
- [ ] `validate` reports format errors clearly
- [ ] `convert` handles all supported formats
- [ ] All commands have helpful `--help` output
- [ ] Error messages are actionable

### Figma Plugin Tests

- [ ] Export captures all variable types correctly
- [ ] Export handles variable aliases
- [ ] Import creates new collections when needed
- [ ] Import updates existing variables correctly
- [ ] Import deletes removed variables (with confirmation)
- [ ] UI shows accurate diff preview
- [ ] Error handling is user-friendly

### Performance

- [ ] Export < 3 seconds for 500 variables
- [ ] Import < 5 seconds for 500 variables
- [ ] Zero data loss in round-trip

---

## Development Timeline

### Day 1: Project Scaffolding
- [ ] Set up monorepo with pnpm workspaces
- [ ] Configure TypeScript (strict mode)
- [ ] Configure ESLint, Prettier
- [ ] Create package structure (core, cli, figma-plugin)
- [ ] Add MIT LICENSE
- [ ] Set up GitHub Actions CI
- [ ] Create initial README

### Day 2: Core Transforms
- [ ] Implement DTCG parser/serializer
- [ ] Implement LanguageContract ↔ DTCG transforms
- [ ] Implement Figma Variables ↔ DTCG transforms
- [ ] Handle color format conversions (hex ↔ RGBA)
- [ ] Handle variable aliases/references
- [ ] Write unit tests for transforms

### Day 3: Figma Plugin Setup
- [ ] Create plugin manifest.json
- [ ] Set up plugin build (esbuild/vite)
- [ ] Create basic UI shell (React)
- [ ] Implement variable reader (code.ts)
- [ ] Test with real Figma file

### Day 4: Plugin Export/Import
- [ ] Implement export flow (Variables → tokens.json)
- [ ] Implement import flow (tokens.json → Variables)
- [ ] Add collection/mode selection UI
- [ ] Add diff preview UI
- [ ] Add confirmation dialogs

### Day 5: CLI + Diff Engine
- [ ] Implement diff engine
- [ ] Build CLI with Commander.js
- [ ] Wire up commands (init, diff, validate, convert)
- [ ] Add config file support
- [ ] Add colored console output

### Day 6: Testing + Polish
- [ ] Write integration tests
- [ ] Test with @discourser/design-system
- [ ] Fix bugs
- [ ] Write comprehensive README
- [ ] Create examples/material3 project
- [ ] Create demo video/GIF

---

## Design Decisions

### 1. Plugin vs REST API
**Decision:** Use Figma Plugin API instead of REST API.

**Rationale:** REST API requires Enterprise plan. Plugin API works on all plans and has full Variables access.

### 2. File-Based Sync
**Decision:** Use tokens.json as the sync bridge.

**Rationale:** Simple, version-controllable, works offline, no real-time sync complexity.

### 3. Conflict Resolution
**Decision:** "Last write wins" with clear diff preview.

**Rationale:** Keep Tier 1 simple. User reviews diff before applying changes.

### 4. Token Type Mapping

| Figma Type | DTCG Type |
|------------|-----------|
| COLOR | color |
| FLOAT | number or dimension |
| STRING | string |
| BOOLEAN | boolean (extension) |

### 5. Typography Limitation
**Decision:** Typography tokens remain code-only.

**Rationale:** Figma Variables don't support typography. Document this clearly.

### 6. Collection Mapping
**Decision:** Figma Collections become top-level keys in DTCG output.

### 7. Mode Mapping
**Decision:** Figma Modes map to configurable output structure.

---

## Migration from REST API Approach

If you started with the REST API implementation:

### Files to Update

1. **Remove:** `packages/core/src/api/figma-client.ts`
2. **Update:** CLI commands (remove pull/push, keep diff/validate)
3. **Add:** `packages/figma-plugin/` directory

### Transforms Stay the Same

The transform functions in `@figma-token-sync/core` work identically — they just receive data from the Plugin instead of REST API.

---

## Related Projects

### @discourser/design-system
- **Location:** `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/Discourser-Design-System`
- **Purpose:** Reference implementation of DesignLanguageContract pattern
- **Use:** Test transforms with real-world token structure

---

## Resources

- [Figma Plugin API - Variables](https://www.figma.com/plugin-docs/api/figma-variables/)
- [Figma Plugin API - Variable](https://www.figma.com/plugin-docs/api/Variable/)
- [Figma Plugin API - VariableCollection](https://www.figma.com/plugin-docs/api/VariableCollection/)
- [DTCG Specification](https://tr.designtokens.org/format/)
- [Figma Plugin Development Guide](https://www.figma.com/plugin-docs/)

---

## Success Criteria — Tier 1 Complete When:

- [ ] Figma Plugin exports variables to tokens.json
- [ ] Figma Plugin imports tokens.json to variables
- [ ] Round-trip works (export → import → no diff)
- [ ] CLI `diff` shows changes between code and tokens.json
- [ ] CLI `validate` verifies tokens.json format
- [ ] Works with `material3.language.ts` format
- [ ] < 5 second sync time for 500 tokens
- [ ] Zero data loss in round-trip
- [ ] CLI has helpful `--help` for all commands
- [ ] README documents installation and usage
- [ ] Example project demonstrates workflow
