# Figma Token Sync

Bidirectional synchronization of design tokens between code and Figma Variables via a Figma Plugin.

> ⚠️ **Architecture Note:** We use a Figma Plugin (not REST API) because the Variables REST API requires Enterprise. Our plugin works on **all Figma plans**.

## Vision

A free, open-source alternative to Token Studio ($15-40/month) with a developer-centric workflow that works on any Figma plan.

## Status

**Tier 1: ✅ COMPLETE** (December 29, 2024)

The core transformation engine, Figma Plugin, and CLI commands are fully implemented and tested. Ready for use with all Figma plan tiers (Free, Pro, Org, Enterprise).

## Features

- **Bidirectional Sync**: Pull from Figma, push to Figma, or diff to compare
- **Multiple Formats**: DTCG (W3C), DesignLanguageContract, and plain JSON
- **Type-Safe**: Built with TypeScript in strict mode
- **Monorepo Architecture**: pnpm workspaces with Turbo for fast builds
- **Developer-First**: Git-friendly workflow with config files

## Quick Start

### Step-by-Step: Export Tokens from Figma

Export your Figma Variables to DTCG-compliant JSON files for use in your codebase.

#### Step 1: Prepare Your Figma File

1. **Open your Figma file** containing Variables
2. **Verify you have Variables set up:**
   - Open the **Variables** panel (right sidebar)
   - You should see Collections like "Primitives/Colors" or "Semantic/Colors"
   - Each Collection contains Variables (e.g., `primary/40`, `surface`, etc.)

> **Note:** If you don't have Variables yet, create them first. See [Figma Variables Guide](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)

#### Step 2: Install the Plugin

**For Development (Testing):**
1. Download this repository
2. Build the plugin: `cd packages/figma-plugin && pnpm build`
3. In Figma Desktop: **Plugins → Development → Import plugin from manifest**
4. Select `packages/figma-plugin/dist/manifest.json`

**For Production:**
- Search for "Figma Token Sync" in the Figma Community (coming soon)
- Click **Install** to add to your plugins

#### Step 3: Run the Export

1. **Open the plugin:**
   - Menu: **Plugins → Figma Token Sync**
   - Keyboard: `Ctrl/Cmd + /` and type "Figma Token Sync"

2. **You'll see the plugin UI with two export buttons:**
   - **Export Primitives** - for tonal palettes and base tokens
   - **Export Semantics** - for semantic color mappings

3. **Export Primitives:**
   - Click **"Export Primitives"**
   - This exports collections like "Primitives/Colors"
   - Downloads as `primitives-colors.json`
   - Contains raw hex values: `"40": { "$value": "#6750A4" }`

4. **Export Semantics:**
   - Click **"Export Semantics"**
   - This exports collections like "Semantic/Colors"
   - Downloads as `semantic-colors.json`
   - Contains references: `"primary": { "$value": "{primary.40}" }`

#### Step 4: Save to Your Project

1. **Create tokens directory** in your project (if it doesn't exist):
   ```bash
   mkdir -p tokens/primitives tokens/semantic
   ```

2. **Move the exported files:**
   ```bash
   mv ~/Downloads/primitives-colors.json tokens/primitives/colors.json
   mv ~/Downloads/semantic-colors.json tokens/semantic/colors.light.json
   ```

3. **Verify the export:**
   ```bash
   cat tokens/primitives/colors.json
   ```

   You should see DTCG-compliant JSON:
   ```json
   {
     "$schema": "https://design-tokens.org/schema.json",
     "primary": {
       "$type": "color",
       "0": { "$value": "#000000" },
       "10": { "$value": "#102000" },
       "40": { "$value": "#6750A4" },
       ...
     }
   }
   ```

#### Step 5: Validate (Optional but Recommended)

```bash
# Install CLI tools if not already installed
npm install -g figma-token-sync

# Validate the exported files
figma-token-sync validate tokens/primitives/colors.json
figma-token-sync validate tokens/semantic/colors.light.json
```

Expected output:
```
✓ Valid DTCG tokens file
✓ All tokens have required $value properties
✓ No circular references detected
Tokens: 78
```

---

### Step-by-Step: Import Tokens to Figma

Import DTCG JSON files from your codebase to create or update Figma Variables.

#### Step 1: Prepare Your Token File

1. **Create or edit your tokens file:**

   For Discourser-Design-System workflow:
   ```bash
   # Generate tokens.json from your design language
   cd Discourser-Design-System
   pnpm run transform:contract-to-dtcg
   ```

   This creates `tokens/tokens.json` - a single combined file ready for Figma import.

2. **Or manually create a DTCG file:**
   ```json
   {
     "$schema": "https://design-tokens.org/schema.json",
     "primary": {
       "$type": "color",
       "0": { "$value": "#000000" },
       "10": { "$value": "#21005D" },
       "40": { "$value": "#6750A4" },
       "80": { "$value": "#D0BCFF" },
       "100": { "$value": "#FFFFFF" }
     },
     "semantic": {
       "primary": {
         "$type": "color",
         "$value": "{primary.40}"
       },
       "onPrimary": {
         "$type": "color",
         "$value": "{primary.100}"
       }
     }
   }
   ```

#### Step 2: Validate Before Import

**Always validate before importing to catch errors early:**

```bash
figma-token-sync validate tokens/tokens.json
```

Common validation errors and fixes:
- **"Missing $value property"** → Add `"$value": "..."` to each token
- **"Invalid $type"** → Use valid types: `color`, `dimension`, `fontFamily`, `number`, `string`
- **"Circular reference"** → Check for loops like `{a.b}` → `{c.d}` → `{a.b}`

#### Step 3: Open Figma and Run Plugin

1. **Open your Figma file** where you want to import Variables
2. **Run the plugin:**
   - Menu: **Plugins → Figma Token Sync**
   - Keyboard: `Ctrl/Cmd + /` and type "Figma Token Sync"

#### Step 4: Import Your Tokens

1. **Click "Import Tokens" button** in the plugin UI

2. **Select your token file:**
   - File picker opens
   - Navigate to `tokens/tokens.json`
   - Click **Open**

3. **Plugin processes the file:**
   - Parses DTCG structure
   - Identifies Collections and Variables to create/update
   - Shows preview of changes

4. **Review the preview:**
   ```
   Collections to create:
     ✓ Primitives/Colors (78 variables)
     ✓ Semantic/Colors (31 variables, 2 modes)

   Variables to update:
     • primary/40: #6750A4 → #7050B5
     • surface: {neutral.99} (no change)

   Total changes:
     Create: 109 variables
     Update: 1 variable
   ```

5. **Click "Import" to apply changes**

#### Step 5: Verify in Figma

1. **Open Variables panel** (right sidebar)

2. **Check Collections were created:**
   - You should see "Primitives/Colors"
   - You should see "Semantic/Colors"

3. **Verify Variables:**
   - Expand "Primitives/Colors" collection
   - Check `primary/40` exists with correct hex value
   - Expand "Semantic/Colors" collection
   - Check `primary` exists and references `{Primitives/Colors.primary/40}`

4. **Check Modes (for semantic tokens):**
   - Select "Semantic/Colors" collection
   - Look at mode selector at top - should show "light" and "dark"
   - Switch between modes to verify different values

#### Step 6: Test the Variables

1. **Create a test frame**
2. **Apply a semantic color:**
   - Select the frame
   - In fill properties, click the Variables icon
   - Choose `Semantic/Colors.primary`
3. **Toggle between light/dark modes** to verify it works

---

### Local Commands (No Figma Connection Needed)

Work with token files offline using CLI commands:

```bash
# Install CLI tools
npm install -g figma-token-sync

# Validate token file structure
figma-token-sync validate tokens.json

# Compare two token files (show differences)
figma-token-sync diff tokens.json backup.json

# Compare with colored output
figma-token-sync diff tokens.json updated.json

# Compare and output JSON for automation
figma-token-sync diff tokens.json updated.json --json > changes.json

# Convert between formats
figma-token-sync convert tokens.json output.json --to language-contract
```

---

### Common Workflows

#### Workflow 1: Figma → Code (Designer-Led Changes)

```bash
# 1. Designer updates colors in Figma Variables
# 2. Export from Figma plugin → primitives-colors.json, semantic-colors.json
# 3. Move to project
mv ~/Downloads/primitives-colors.json tokens/primitives/colors.json
mv ~/Downloads/semantic-colors.json tokens/semantic/colors.light.json

# 4. Transform to TypeScript (Discourser-Design-System)
cd Discourser-Design-System
pnpm run transform:dtcg-to-contract

# 5. Verify changes
git diff src/languages/material3.language.ts

# 6. Rebuild design system
pnpm build:panda

# 7. Commit changes
git add tokens/ src/languages/
git commit -m "Update colors from Figma"
```

#### Workflow 2: Code → Figma (Developer-Led Changes)

```bash
# 1. Developer edits TypeScript design language
code src/languages/material3.language.ts

# 2. Transform to DTCG
pnpm run transform:contract-to-dtcg
# Creates tokens/tokens.json

# 3. Validate before import
figma-token-sync validate tokens/tokens.json

# 4. Import to Figma
# - Open Figma
# - Run plugin → Import → select tokens/tokens.json

# 5. Designer reviews changes in Figma
```

#### Workflow 3: Compare Before Syncing

```bash
# Export current state from Figma
# Downloads as primitives-colors.json

# Compare with your local changes
figma-token-sync diff \
  tokens/primitives/colors.json \
  ~/Downloads/primitives-colors.json

# Review the differences before deciding to import
```

## Architecture

```
┌─────────────────┐         tokens.json             ┌─────────────────┐
│  Figma Plugin   │ ◄─────── (file sync) ───────► │ Storybook Addon │
│  (in Figma)     │                                 │  + CLI Tools    │
│                 │                                 │                 │
│  - Export vars  │                                 │  - File watcher │
│  - Import vars  │                                 │  - Visual edit  │
│  - Full access  │                                 │  - Diff preview │
└─────────────────┘                                 └─────────────────┘
        │                                                     │
        ▼                                                     ▼
   Figma Variables                                     Code Tokens
   (native access)                                   (TypeScript/JSON)

              ┌───────────────────────────────┐
              │  @figma-token-sync/core       │
              │  (shared transform logic)     │
              │  - DTCG parser/serializer     │
              │  - Format conversions         │
              │  - Diff engine                │
              └───────────────────────────────┘
```

**Key Insight:** Figma Plugins have full Variables API access regardless of plan tier!

## Repository Structure

```
figma-token-sync/
├── packages/
│   ├── core/              ← Transform logic (shared)
│   ├── figma-plugin/      ← Figma Plugin (Variables access)
│   ├── cli/               ← Command line tools
│   └── addon/             ← Storybook addon (Tier 2+)
├── examples/
│   └── material3/         ← Working Material 3 example
├── docs/
│   └── README.md          ← Detailed documentation
└── .claude/
    ├── commands/          ← Claude Code slash commands
    └── skills/            ← Technical knowledge base
```

## Development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
# Install dependencies
pnpm install

# Type check all packages
pnpm typecheck

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Monorepo Commands

```bash
# Run dev mode (watch for changes)
pnpm dev

# Lint all packages
pnpm lint

# Build specific package
cd packages/core && pnpm build
```

## Token Formats

### DTCG (W3C Design Tokens)

```json
{
  "color": {
    "primary": {
      "$type": "color",
      "$value": "#6750A4",
      "$description": "Primary brand color"
    }
  }
}
```

### DesignLanguageContract

Aesthetic-agnostic format from `@discourser/design-system`:

```typescript
{
  semanticTokens: {
    color: {
      interactive: {
        primary: { value: '#6750A4' }
      }
    }
  }
}
```

## Roadmap

### Tier 1: Foundation + Plugin ✅ COMPLETE

- [x] Monorepo scaffolding (pnpm + Turbo)
- [x] Figma Plugin (export/import Variables)
- [x] DTCG transformers (parser, serializer, validators)
- [x] CLI commands (validate, diff, convert, init)
- [x] Material 3 example with 152 tokens
- [x] 87 unit tests (100% passing)
- [x] Full documentation

### Tier 2: Storybook Addon

- [ ] Basic addon structure
- [ ] Token browser UI
- [ ] Live preview integration
- [ ] Theme switcher

### Tier 3: Advanced Features

- [ ] Figma plugin companion
- [ ] CI/CD integrations
- [ ] Advanced diffing and conflict resolution
- [ ] Multiple file format support

## CLI Reference

### `figma-token-sync validate`

Validate a DTCG token file for correctness.

```bash
figma-token-sync validate tokens.json

# Output:
# ✓ Valid DTCG tokens file
# Tokens: 152
# Types: color, dimension, fontFamily
#
# Validation checks passed:
#   ✓ Valid JSON syntax
#   ✓ Required fields present ($value on all tokens)
#   ✓ Token types are valid
#   ✓ No circular references detected
```

**Checks performed:**
- JSON syntax validity
- Required `$value` on all tokens
- Valid `$type` values (color, dimension, fontFamily, fontWeight, duration, cubicBezier, number, string)
- No circular references in token aliases
- Proper token group structure

### `figma-token-sync diff`

Compare two token files and show differences.

```bash
figma-token-sync diff tokens.json updated-tokens.json

# With color output disabled:
figma-token-sync diff tokens.json updated-tokens.json --no-color

# JSON output for automation:
figma-token-sync diff tokens.json updated-tokens.json --json > diff.json
```

**Output format:**
- Added tokens (green)
- Removed tokens (red)
- Modified tokens (yellow with before/after values)
- Summary statistics

### `figma-token-sync convert`

Convert between token formats.

```bash
# DTCG → DesignLanguageContract
figma-token-sync convert tokens.json \
  --from dtcg \
  --to design-language-contract \
  --output contract.json

# DesignLanguageContract → DTCG
figma-token-sync convert contract.json \
  --from design-language-contract \
  --to dtcg \
  --output tokens.json
```

**Supported formats:**
- `dtcg` - W3C Design Tokens format
- `design-language-contract` - Aesthetic-agnostic pattern from @discourser/design-system

### `figma-token-sync init`

Initialize a new project configuration.

```bash
figma-token-sync init

# Creates:
# - figma-token-sync.config.json (configuration)
# - tokens/ directory (token storage)
# - tokens/tokens.json (sample token file)
```

## Examples

See [examples/material3](./examples/material3) for a working Material Design 3 example with:
- 6 tonal palettes (96 color tokens)
- 48 semantic color roles (light + dark themes)
- 6 spacing tokens
- 2 font family tokens
- Complete documentation and usage guide

## Documentation

- [Full Documentation](./docs/README.md)
- [API Reference](./packages/core/README.md)
- [CLI Reference](./packages/cli/README.md)
- [Material 3 Example](./examples/material3/README.md)

## Troubleshooting

### Plugin Not Showing in Figma

1. **Development Mode**: Import the plugin in Figma Desktop
   - Plugins → Development → Import plugin from manifest
   - Select `packages/figma-plugin/dist/manifest.json`

2. **Production**: The plugin will be available after publishing to Figma Community

### Validation Errors

**"Token is missing required $value property"**
- Every token must have a `$value` field
- Groups don't need `$value`, only individual tokens

**"Invalid $type"**
- Supported types: `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`, `string`
- Check for typos in type names

**"Circular reference detected"**
- Token references form a loop (A→B→A)
- Review your `{token.path}` references

### Import Not Creating Variables

1. **Check token structure**: Run `figma-token-sync validate tokens.json`
2. **Check Figma plan**: All plans support Variables (as of 2023)
3. **Check file permissions**: You need "can edit" access
4. **Review console**: Open DevTools in plugin for errors

### Color Values Not Converting

- Use hex format: `#RRGGBB` or `#RRGGBBAA`
- Figma uses 0-1 range for RGB, we auto-convert
- Alpha channel is optional (defaults to 1.0 / fully opaque)

### Token References Not Working

- Use DTCG syntax: `{path.to.token}` (curly braces required)
- Path uses dot notation: `{color.primary.500}`
- Target token must exist in the same file
- No circular references allowed

## Related Projects

- [@discourser/design-system](https://github.com/discourser/design-system) - Reference for DesignLanguageContract pattern
- [Token Studio](https://tokens.studio/) - Commercial alternative
- [Style Dictionary](https://amzn.github.io/style-dictionary/) - Amazon's token transformer
- [Theo](https://github.com/salesforce-ux/theo) - Salesforce's token tool

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- [GitHub Issues](https://github.com/your-org/figma-token-sync/issues)
- [Discussions](https://github.com/your-org/figma-token-sync/discussions)

---

**Free and open-source alternative to Token Studio**

Built with TypeScript, pnpm, and Turbo