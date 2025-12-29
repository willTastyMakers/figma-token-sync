# Figma Token Sync — Product Requirements Document

> **Version:** 1.0.0  
> **Last Updated:** December 28, 2024  
> **Current Phase:** Tier 1 — CLI Foundation

---

## Executive Summary

**FigmaTokenSync** is an open-source Storybook addon that enables bidirectional synchronization of design tokens between code (TypeScript/JSON) and Figma Variables via the REST API.

### Value Proposition

- **Free alternative** to Token Studio's $15-40/month subscription
- **Developer-centric** workflow — edit where you work
- **Bidirectional sync** — code ↔ Figma stays aligned
- **Aesthetic-agnostic** — works with M3, Shadcn, Chakra, custom brands
- **MIT License** with "Buy Me a Coffee" monetization

---

## Product Roadmap

### Tier 1: CLI Foundation (Current)
**Duration:** 3-5 days

Core transformation engine as CLI scripts. This becomes the backend that all future tiers call.

**Deliverables:**
- Monorepo structure with pnpm workspaces
- Figma Variables REST API client
- DTCG parser/serializer
- DesignLanguageContract ↔ DTCG transforms
- Figma ↔ DTCG transforms
- Diff engine
- CLI commands: init, pull, push, diff, validate

### Tier 2: Basic Storybook Addon
**Duration:** 3-4 days

Minimal Storybook panel integration.

**Deliverables:**
- Storybook addon package
- Panel showing sync status
- Buttons for pull/push operations
- Diff preview before push
- Configuration UI

### Tier 3: Full Token Editor
**Duration:** 5-7 days

Visual token editing within Storybook.

**Deliverables:**
- Token tree browser
- Color picker with swatches
- Dimension editor
- Token creation/deletion
- Conflict resolution UI
- Undo/redo support

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
│   ├── core/           ← Transform logic, Figma API client
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   └── figma-client.ts
│   │   │   ├── transforms/
│   │   │   │   ├── dtcg-parser.ts
│   │   │   │   ├── dtcg-serializer.ts
│   │   │   │   ├── language-contract.ts
│   │   │   │   └── figma-transform.ts
│   │   │   ├── diff/
│   │   │   │   └── compare-tokens.ts
│   │   │   ├── config/
│   │   │   │   └── loader.ts
│   │   │   ├── types/
│   │   │   │   ├── dtcg.ts
│   │   │   │   ├── figma.ts
│   │   │   │   └── config.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── cli/            ← Command line interface
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── init.ts
│   │   │   │   ├── pull.ts
│   │   │   │   ├── push.ts
│   │   │   │   ├── diff.ts
│   │   │   │   └── validate.ts
│   │   │   └── index.ts
│   │   ├── bin/
│   │   │   └── figma-token-sync.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── addon/          ← Storybook addon (Tier 2+)
│       └── README.md
├── examples/
│   └── material3/      ← Working example with M3 tokens
├── docs/
│   └── PRD.md
├── .claude/
│   ├── commands/
│   └── skills/
├── .github/
│   └── workflows/
│       └── ci.yml
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
| API | Figma Variables REST API |

---

## Tier 1 Detailed Specification

### 1.1 Core Package (`@figma-token-sync/core`)

#### Figma API Client

```typescript
// packages/core/src/api/figma-client.ts

/**
 * Fetch all local variables from a Figma file
 */
export async function fetchFigmaVariables(
  fileKey: string,
  accessToken: string
): Promise<FigmaVariablesResponse>;

/**
 * Create, update, or delete variables in a Figma file
 */
export async function pushToFigma(
  fileKey: string,
  accessToken: string,
  updates: FigmaVariableUpdate[]
): Promise<SyncResult>;
```

**API Endpoints:**
- `GET /v1/files/:file_key/variables/local` — Fetch variables
- `POST /v1/files/:file_key/variables` — Update variables

**Authentication:**
```
Header: X-Figma-Token: <personal_access_token>
```

**Error Handling:**
- 401 — Invalid or missing token
- 403 — No access to file
- 404 — File not found
- 429 — Rate limited (implement exponential backoff)

#### Transform Functions

```typescript
// DTCG Parser/Serializer
export function parseDTCG(json: string): DTCGTokens;
export function serializeDTCG(tokens: DTCGTokens): string;

// DesignLanguageContract ↔ DTCG
export function languageToTokens(language: DesignLanguageContract): DTCGTokens;
export function tokensToLanguage(tokens: DTCGTokens): Partial<DesignLanguageContract>;

// Figma Variables ↔ DTCG
export function figmaToTokens(response: FigmaVariablesResponse): DTCGTokens;
export function tokensToFigma(tokens: DTCGTokens): FigmaVariableUpdate[];
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

#### Configuration

```typescript
interface FigmaTokenSyncConfig {
  figmaFileKey: string;
  figmaAccessToken?: string;  // Use env FIGMA_ACCESS_TOKEN
  localPath: string;
  format: 'dtcg' | 'language-contract' | 'json';
  collections?: string[];     // Filter to specific collections
  modes?: Record<string, string>;  // Map Figma modes to output keys
}
```

**Config File:** `.figmatokensyncrc.json`

```json
{
  "figmaFileKey": "abc123xyz",
  "localPath": "./src/tokens/tokens.json",
  "format": "dtcg",
  "collections": ["Primitives", "Semantic"],
  "modes": {
    "Light": "light",
    "Dark": "dark"
  }
}
```

### 1.2 CLI Package (`figma-token-sync`)

#### Commands

```bash
# Initialize config file
figma-token-sync init

# Pull tokens from Figma → local files
figma-token-sync pull [--file-key <key>] [--output <path>] [--format <dtcg|language-contract>]

# Push local files → Figma
figma-token-sync push [--file-key <key>] [--input <path>]

# Show diff without syncing
figma-token-sync diff [--file-key <key>] [--input <path>]

# Validate config and connection
figma-token-sync validate
```

#### Output Examples

**Pull:**
```
✓ Connected to Figma file: My Design System
✓ Found 3 collections: Primitives, Semantic, Component
✓ Fetched 247 variables
✓ Written to ./src/tokens/tokens.json

Summary:
  Colors: 156
  Spacing: 12
  Radii: 7
  Other: 72
```

**Diff:**
```
Comparing local ↔ Figma...

+ Added (3):
  + colors.brand.accent
  + spacing.xxxl
  + semantic.success

- Removed (1):
  - colors.deprecated.old

~ Modified (2):
  ~ colors.primary.500
    Local:  #6750A4
    Remote: #7C5CBF
  ~ spacing.lg
    Local:  24px
    Remote: 28px

Unchanged: 241
```

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

### Figma API Types

```typescript
// packages/core/src/types/figma.ts

export interface FigmaVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
}

export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';
  valuesByMode: Record<string, FigmaVariableValue>;
  remote: boolean;
  description: string;
  hiddenFromPublishing: boolean;
  scopes: string[];
  codeSyntax: Record<string, string>;
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  remote: boolean;
  hiddenFromPublishing: boolean;
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
  variableCollectionId?: string;
  resolvedType?: FigmaVariable['resolvedType'];
  valuesByMode?: Record<string, FigmaVariableValue>;
  description?: string;
  scopes?: string[];
}

export interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}
```

### Configuration Types

```typescript
// packages/core/src/types/config.ts

export interface FigmaTokenSyncConfig {
  figmaFileKey: string;
  figmaAccessToken?: string;
  localPath: string;
  format: 'dtcg' | 'language-contract' | 'json';
  collections?: string[];
  modes?: Record<string, string>;
}
```

---

## Validation Criteria

### Unit Tests

- [ ] DTCG parser handles all token types (color, dimension, number, string)
- [ ] DTCG serializer produces valid JSON output
- [ ] LanguageContract → DTCG transform is complete
- [ ] DTCG → LanguageContract transform is reversible
- [ ] Figma → DTCG handles all variable types
- [ ] DTCG → Figma produces valid update payload
- [ ] Diff engine correctly identifies added/removed/modified tokens
- [ ] Config loader validates required fields
- [ ] Config loader provides helpful error messages

### Integration Tests

- [ ] `pull` fetches real variables from test Figma file
- [ ] `push` creates/updates variables in test Figma file
- [ ] Round-trip: push → pull → diff shows no changes
- [ ] Works with @discourser/design-system `material3.language.ts`

### CLI Tests

- [ ] `init` creates valid config file with prompts
- [ ] `pull` writes correct output format
- [ ] `push` reads correct input format
- [ ] `diff` displays readable, colored output
- [ ] `validate` tests connection and reports status
- [ ] All commands have helpful `--help` output
- [ ] Error messages are actionable

### Performance

- [ ] < 5 second sync time for 500 tokens
- [ ] Zero data loss in round-trip

---

## Development Timeline

### Day 1: Project Scaffolding
- [ ] Set up monorepo with pnpm workspaces
- [ ] Configure TypeScript (strict mode)
- [ ] Configure ESLint, Prettier
- [ ] Create package structure (core, cli, addon placeholder)
- [ ] Add MIT LICENSE
- [ ] Set up GitHub Actions CI
- [ ] Create initial README

### Day 2: Figma API Client
- [ ] Implement `fetchFigmaVariables()` — GET endpoint
- [ ] Implement `pushToFigma()` — POST endpoint
- [ ] Add error handling (auth, rate limits, not found)
- [ ] Add retry logic with exponential backoff
- [ ] Test with real Figma file

### Day 3: Transform Functions
- [ ] Implement DTCG parser/serializer
- [ ] Implement Figma ↔ DTCG transforms
- [ ] Implement DesignLanguageContract ↔ DTCG transforms
- [ ] Handle color format conversions (hex ↔ RGBA)
- [ ] Handle variable aliases/references

### Day 4: Diff Engine + CLI
- [ ] Implement `compareTokens()` diff logic
- [ ] Build CLI with Commander.js
- [ ] Wire up all commands
- [ ] Add config file support
- [ ] Add colored console output

### Day 5: Testing + Polish
- [ ] Write unit tests for transforms
- [ ] Run integration tests with Figma
- [ ] Fix bugs
- [ ] Write comprehensive README
- [ ] Create examples/material3 project

---

## Design Decisions

### 1. Personal Token vs OAuth
**Decision:** Start with personal access token.

**Rationale:** Simpler implementation for v1. OAuth can be added in future tier for team use cases.

### 2. Conflict Resolution
**Decision:** "Last write wins" with clear warnings.

**Rationale:** Keep Tier 1 simple. Sophisticated merge UI will come in Tier 3.

### 3. Token Type Mapping

| Figma Type | DTCG Type |
|------------|-----------|
| COLOR | color |
| FLOAT | number or dimension |
| STRING | string |
| BOOLEAN | boolean (extension) |

### 4. Typography Limitation
**Decision:** Typography tokens remain code-only.

**Rationale:** Figma Variables don't support typography. Document this clearly.

### 5. Collection Mapping
**Decision:** Figma Collections become top-level keys in DTCG output.

### 6. Mode Mapping
**Decision:** Figma Modes map to configurable output structure.

---

## Related Projects

### @discourser/design-system
- **Location:** `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/Discourser-Design-System`
- **Purpose:** Reference implementation of DesignLanguageContract pattern
- **Use:** Test transforms with real-world token structure

---

## Resources

- [Figma Variables REST API](https://www.figma.com/developers/api#variables)
- [DTCG Specification](https://tr.designtokens.org/format/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Figma API Changelog](https://www.figma.com/developers/api#changelog)

---

## Success Criteria — Tier 1 Complete When:

- [ ] `figma-token-sync pull` fetches variables from Figma
- [ ] `figma-token-sync push` updates variables in Figma
- [ ] Round-trip works (push → pull → no diff)
- [ ] Works with `material3.language.ts` format
- [ ] < 5 second sync time for 500 tokens
- [ ] Zero data loss in round-trip
- [ ] CLI has helpful `--help` for all commands
- [ ] README documents installation and usage
- [ ] Example project demonstrates workflow
