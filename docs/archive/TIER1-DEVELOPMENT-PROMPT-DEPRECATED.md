# Figma Token Sync — Tier 1 Development Prompt

> **⚠️ DEPRECATED - December 29, 2024**
>
> **This document is archived and no longer reflects the actual implementation.**
>
> **Why deprecated:** This prompt describes a REST API-based approach that was abandoned because
> Figma's Variables REST API requires an Enterprise plan ($45/seat/month). On December 29, 2024,
> the project pivoted to a Plugin-based architecture that works on all Figma plan tiers (Free, Pro, Org, Enterprise).
>
> **See instead:**
> - `TIER1-PROGRESS.md` - Documents the actual implementation and architecture pivot
> - `FIGMA_DESIGN_SYSTEM_SYNC_SPEC.md` - Current authoritative specification
>
> This file is preserved for historical reference only.

---

## Project Context

You are helping Will build **Tier 1 (CLI Foundation)** of `figma-token-sync`, an open-source Storybook addon that enables bidirectional synchronization of design tokens between code (TypeScript/JSON) and Figma Variables via the REST API.

**Repository Location:** `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/figma-token-sync`

**Related Project:** The `@discourser/design-system` at `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/Discourser-Design-System` uses the `DesignLanguageContract` pattern that this tool will support. Reference it for real-world token structure examples.

---

## Project Vision

**FigmaTokenSync** provides a free alternative to Token Studio's $15-40/month subscription with a developer-centric workflow:

- Edit tokens where you work (Storybook for devs, Figma for designers)
- Bidirectional sync keeps both sources of truth aligned
- Works with any design language (M3, Shadcn, Chakra, custom)
- Zero subscription cost
- MIT License with "Buy Me a Coffee" monetization

---

## Tier 1 Goal

Build the **core transformation engine as CLI scripts**. This becomes the backend that all future tiers (Storybook addon UI) will call.

**Duration Target:** 3-5 days

---

## Technical Stack

- **TypeScript** — Strict mode
- **pnpm** — Package manager with workspaces
- **Turbo** — Monorepo build orchestration (optional but recommended)
- **Figma Variables REST API** — For reading/writing design tokens
- **DTCG/W3C Token Format** — Interchange format ([spec](https://tr.designtokens.org/format/))
- **Vitest** — Testing
- **Commander.js** — CLI framework

---

## Deliverables

### 1.1 Project Scaffolding

Create a monorepo structure:

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
│   │   │   │   └── language-contract.ts
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
│   │   │   │   ├── pull.ts
│   │   │   │   ├── push.ts
│   │   │   │   ├── diff.ts
│   │   │   │   └── init.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── addon/          ← Storybook addon (Tier 2+, placeholder only)
│       └── README.md
├── examples/
│   └── material3/      ← Working example with M3 tokens
├── docs/
├── .github/
│   └── workflows/
│       └── ci.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── LICENSE             ← MIT
└── README.md
```

### 1.2 Core Package (`@figma-token-sync/core`)

**Key Functions to Implement:**

```typescript
// === Figma API Client ===

// Read variables from Figma file
fetchFigmaVariables(fileKey: string, accessToken: string): Promise<FigmaVariablesResponse>

// Write variables to Figma file  
pushToFigma(fileKey: string, accessToken: string, variables: FigmaVariableUpdate[]): Promise<SyncResult>

// === Transform Functions ===

// Parse DTCG JSON to internal representation
parseDTCG(json: string): DTCGTokens

// Serialize internal representation to DTCG JSON
serializeDTCG(tokens: DTCGTokens): string

// Convert DesignLanguageContract to DTCG tokens
languageToTokens(language: DesignLanguageContract): DTCGTokens

// Convert DTCG tokens to DesignLanguageContract
tokensToLanguage(tokens: DTCGTokens): DesignLanguageContract

// Convert Figma Variables response to DTCG
figmaToTokens(figmaResponse: FigmaVariablesResponse): DTCGTokens

// Convert DTCG to Figma Variables update payload
tokensToFigma(tokens: DTCGTokens): FigmaVariableUpdate[]

// === Diff Engine ===

// Compare local and remote tokens
compareTokens(local: DTCGTokens, remote: DTCGTokens): TokenDiff

// === Configuration ===

// Load and validate config file
loadConfig(configPath?: string): FigmaTokenSyncConfig
```

**Type Definitions:**

```typescript
// DTCG Token Format (W3C Design Tokens)
interface DTCGToken {
  $type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'duration' | 'cubicBezier' | 'number' | 'string';
  $value: string | number | object;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

interface DTCGTokens {
  [key: string]: DTCGToken | DTCGTokens; // Nested groups
}

// Figma API Types
interface FigmaVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
}

interface FigmaVariable {
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

interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  remote: boolean;
  hiddenFromPublishing: boolean;
  variableIds: string[];
}

type FigmaVariableValue = 
  | boolean 
  | number 
  | string 
  | { r: number; g: number; b: number; a: number }  // COLOR
  | { type: 'VARIABLE_ALIAS'; id: string };          // Reference

// Config
interface FigmaTokenSyncConfig {
  figmaFileKey: string;
  figmaAccessToken?: string; // Can use env var FIGMA_ACCESS_TOKEN
  localPath: string;
  format: 'dtcg' | 'language-contract' | 'json';
  collections?: string[]; // Filter to specific collections
  modes?: Record<string, string>; // Map Figma mode names to output keys
}

// Diff Result
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

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}
```

### 1.3 CLI Package (`@figma-token-sync/cli`)

**Commands:**

```bash
# Initialize config file in current project
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

**Config File (`.figmatokensyncrc.json`):**

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

**Environment Variable Support:**
- `FIGMA_ACCESS_TOKEN` — Personal access token (never store in config file)

### 1.4 Figma Variables REST API Reference

**Endpoints Used:**

```
GET /v1/files/:file_key/variables/local
  → Returns all local variables and collections

POST /v1/files/:file_key/variables
  → Create/update/delete variables
  → Body: { variableCollections, variableModes, variables, variableModeValues }
```

**Authentication:**
```
Header: X-Figma-Token: <personal_access_token>
```

**Base URL:** `https://api.figma.com`

**API Documentation:** https://www.figma.com/developers/api#variables

**Rate Limits:** Be mindful of Figma's rate limits. Implement exponential backoff for retries.

### 1.5 Example: Material 3 Integration

Create a working example in `examples/material3/` that:
1. Has a sample `material3.language.ts` file (simplified from @discourser/design-system)
2. Has matching Figma file with Variables (document the file key)
3. Demonstrates full round-trip: pull → edit locally → push → verify in Figma

---

## Validation Criteria

### Unit Tests
- [ ] DTCG parser handles all token types (color, dimension, number, string)
- [ ] DTCG serializer produces valid output
- [ ] LanguageContract ↔ DTCG transforms are reversible
- [ ] Figma ↔ DTCG transforms handle all variable types
- [ ] Diff engine correctly identifies added/removed/modified tokens
- [ ] Config loader validates required fields and provides helpful errors

### Integration Tests
- [ ] `pull` fetches real variables from test Figma file
- [ ] `push` creates/updates variables in test Figma file
- [ ] Round-trip test: push → pull → diff shows no changes
- [ ] Works with @discourser/design-system `material3.language.ts`

### CLI Tests
- [ ] `init` creates valid config file with prompts
- [ ] `pull` writes correct output format
- [ ] `push` reads correct input format
- [ ] `diff` displays readable, colored output
- [ ] `validate` tests connection and reports status
- [ ] All commands have helpful `--help` output
- [ ] Error messages are actionable

---

## Success Criteria (Tier 1 Complete When...)

- [ ] `figma-token-sync pull` fetches variables from Figma file
- [ ] `figma-token-sync push` creates/updates variables in Figma
- [ ] Round-trip works (push → pull → no diff)
- [ ] Works with `material3.language.ts` format from @discourser/design-system
- [ ] < 5 second sync time for 500 tokens
- [ ] Zero data loss in round-trip
- [ ] CLI has helpful `--help` output for all commands
- [ ] README documents installation and basic usage
- [ ] Example project demonstrates the workflow

---

## Development Approach

### Day 1: Project Scaffolding
- Set up monorepo with pnpm workspaces
- Configure TypeScript (strict mode), ESLint, Prettier
- Create package structure for core, cli, addon (placeholder)
- Add MIT LICENSE
- Set up basic CI workflow (lint, typecheck, test)
- Create initial README

### Day 2: Figma API Client
- Implement `fetchFigmaVariables()` — GET endpoint
- Implement `pushToFigma()` — POST endpoint
- Add error handling for API responses (auth errors, rate limits, not found)
- Add retry logic with exponential backoff
- Test with real Figma file containing Variables

### Day 3: Transform Functions
- Implement DTCG parser/serializer
- Implement Figma Variables ↔ DTCG transforms
- Implement DesignLanguageContract ↔ DTCG transforms
- Handle color format conversions (hex ↔ RGBA)
- Handle variable aliases/references
- Add comprehensive type definitions

### Day 4: Diff Engine + CLI
- Implement `compareTokens()` diff logic
- Build CLI with Commander.js
- Wire up all commands (init, pull, push, diff, validate)
- Add config file support with validation
- Add colored console output for diff

### Day 5: Testing + Polish
- Write unit tests for all transform functions
- Run integration tests with real Figma file
- Fix bugs discovered during testing
- Write comprehensive README
- Create examples/material3 project
- Final cleanup and commit

---

## Reference: DesignLanguageContract Structure

From `@discourser/design-system`, this is the TypeScript structure to support:

```typescript
interface DesignLanguageContract {
  name: string;
  version: string;
  colors: {
    primary: TonalPalette;
    secondary: TonalPalette;
    tertiary: TonalPalette;
    neutral: TonalPalette;
    neutralVariant: TonalPalette;
    error: TonalPalette;
  };
  semantic: SemanticColors;      // Light theme values
  semanticDark?: SemanticColors; // Dark theme values
  typography: TypographyConfig;
  spacing: SpacingScale;
  shape: ShapeConfig;
  elevation: ElevationConfig;
  motion: MotionConfig;
}

interface TonalPalette {
  0: string;
  10: string;
  20: string;
  30: string;
  40: string;
  50: string;
  60: string;
  70: string;
  80: string;
  90: string;
  95: string;
  99: string;
  100: string;
}

interface SemanticColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  background: string;
  onBackground: string;
  scrim: string;
  shadow: string;
}
```

---

## Design Decisions Made

1. **Figma OAuth vs Personal Token:** Start with personal token for v1. Simpler and sufficient for individual/small team use. OAuth can be added in future tier.

2. **Conflict Resolution:** For Tier 1, use "last write wins" with clear warnings. More sophisticated merge UI will come in Tier 3.

3. **Token Types Supported:** Figma Variables support BOOLEAN, FLOAT, STRING, COLOR. Map these to DTCG equivalents:
   - COLOR → `color`
   - FLOAT → `number` or `dimension` (based on context)
   - STRING → `string`
   - BOOLEAN → `boolean` (DTCG extension)

4. **Typography Limitation:** Figma Variables don't support typography tokens. Typography must remain in code only. Document this limitation clearly in README.

5. **Collection Mapping:** Figma Collections become top-level keys in DTCG output. Variables within collections are nested.

6. **Mode Mapping:** Figma Modes (Light/Dark) map to separate token files or a modes object in DTCG.

---

## Package Names

- `@figma-token-sync/core` — Core transformation and API logic
- `@figma-token-sync/cli` — Command line interface
- `figma-token-sync` — CLI package (what users install globally)

---

## Links & Resources

- **Figma Variables REST API:** https://www.figma.com/developers/api#variables
- **DTCG Spec (W3C Design Tokens):** https://tr.designtokens.org/format/
- **Figma API Changelog:** https://www.figma.com/developers/api#changelog
- **Style Dictionary:** https://amzn.github.io/style-dictionary/ (reference for token transforms)
- **@discourser/design-system:** `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/Discourser-Design-System`
- **Notion Roadmap:** https://www.notion.so/Figma-Token-Sync-Storybook-Add-On-RoadMap-2d74d6019b4280b0bae8f770beb37081

---

## Getting Started (For Claude in New Chat)

1. Read this prompt completely
2. Check the current state of the repository
3. Reference `@discourser/design-system` for the DesignLanguageContract implementation
4. Begin with Day 1 scaffolding tasks
5. Ask clarifying questions before making major architectural decisions

---

*This prompt provides complete context for implementing Tier 1. Update this document as decisions are made during development.*
