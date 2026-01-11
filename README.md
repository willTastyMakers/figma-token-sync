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

### Export from Figma

1. Open your Figma file with Variables
2. Run **Figma Token Sync** plugin (search in Community)
3. Click **Export** → download `tokens.json`
4. Save to your project: `./tokens/tokens.json`

### Import to Figma

1. Edit `tokens.json` locally
2. Open Figma and run plugin
3. Click **Import** and select your file
4. Variables update in Figma

### Local Commands (No Figma Connection Needed)

```bash
# Install CLI tools
npm install -g figma-token-sync

# Validate token file
figma-token-sync validate tokens.json

# Compare two token files
figma-token-sync diff tokens.json backup.json

# Convert between formats
figma-token-sync convert tokens.json output.json --to language-contract
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

## Plugin Usage

### Export from Figma

1. **Open Figma file** with Variables
2. **Run plugin**: Plugins → Figma Token Sync
3. **Click "Export Tokens"**
4. **Download** `tokens.json` file
5. **Save** to your project directory

The plugin exports:
- All local Variable Collections
- All Variables with their modes
- Color, number, string, and boolean types
- References/aliases between variables
- Variable descriptions and metadata

### Import to Figma

1. **Prepare tokens file** in DTCG format
2. **Run plugin**: Plugins → Figma Token Sync
3. **Click "Import Tokens"**
4. **Select file** to import
5. **Review changes** in preview
6. **Click "Import"** to apply

The plugin will:
- Create new Collections as needed
- Update existing Variables by name
- Preserve Variable IDs when possible
- Create modes for semantic token groups
- Set up variable references/aliases

**Important:** Typography tokens are NOT supported (Figma Variables limitation).

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