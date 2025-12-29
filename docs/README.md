# Figma Token Sync Documentation

## Overview

`figma-token-sync` enables bidirectional synchronization of design tokens between code (TypeScript/JSON) and Figma Variables via the REST API.

## Architecture

```
┌─────────────────┐
│  Local Tokens   │
│  (DTCG/JSON)    │
└────────┬────────┘
         │
         ├─── pull ───┐
         │            │
         │            ▼
    ┌────┴────────────────┐
    │  Transform Engine   │
    │  (@figma-token-     │
    │   sync/core)        │
    └────┬────────────────┘
         │            ▲
         │            │
         └─── push ───┘
         │
         │
┌────────▼────────┐
│ Figma Variables │
│   (REST API)    │
└─────────────────┘
```

## Token Formats

### DTCG (W3C Design Tokens)

Standard interchange format for design tokens:

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

### Figma Variables

Native Figma format via REST API:

```json
{
  "id": "VariableID:1:1",
  "name": "color/primary",
  "resolvedType": "COLOR",
  "valuesByMode": {
    "1:0": { "r": 0.4, "g": 0.31, "b": 0.64, "a": 1 }
  }
}
```

## Transformation Pipeline

1. **Parse**: Load tokens from local files
2. **Transform**: Convert between formats
3. **Diff**: Compare local and remote
4. **Sync**: Push/pull changes

## CLI Commands

### Initialize

```bash
figma-token-sync init
```

Creates `figma-token-sync.config.json` with prompts.

### Pull

```bash
figma-token-sync pull
```

Fetch variables from Figma and update local files.

### Push

```bash
figma-token-sync push
```

Push local token changes to Figma.

### Diff

```bash
figma-token-sync diff
```

Show differences without making changes.

## Configuration

`figma-token-sync.config.json`:

```json
{
  "figmaFileKey": "abc123",
  "localPath": "./tokens",
  "format": "dtcg",
  "collections": ["colors", "typography"],
  "modes": {
    "Light": "light",
    "Dark": "dark"
  }
}
```

## Development

### Monorepo Structure

```
figma-token-sync/
├── packages/
│   ├── core/          ← Transform logic, Figma API
│   ├── cli/           ← Command line interface
│   └── addon/         ← Storybook addon (Tier 2+)
└── examples/
    └── material3/     ← Working example
```

### Building

```bash
pnpm install
pnpm build
```

### Testing

```bash
pnpm test
```

### Type Checking

```bash
pnpm typecheck
```

## API Reference

See package-specific documentation:

- [@figma-token-sync/core](../packages/core/README.md)
- [figma-token-sync CLI](../packages/cli/README.md)
- [@figma-token-sync/addon](../packages/addon/README.md)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## License

MIT