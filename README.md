# Figma Token Sync

Bidirectional synchronization of design tokens between code and Figma Variables via the REST API.

## Vision

A free, open-source alternative to Token Studio ($15-40/month) with a developer-centric CLI workflow.

## Status

**Tier 1: CLI Foundation** (In Development)

The core transformation engine and CLI commands are currently being implemented.

## Features

- **Bidirectional Sync**: Pull from Figma, push to Figma, or diff to compare
- **Multiple Formats**: DTCG (W3C), DesignLanguageContract, and plain JSON
- **Type-Safe**: Built with TypeScript in strict mode
- **Monorepo Architecture**: pnpm workspaces with Turbo for fast builds
- **Developer-First**: Git-friendly workflow with config files

## Quick Start

### Installation

```bash
# Coming soon - package will be published after Tier 1 completion
npm install -g figma-token-sync
```

### Initialize

```bash
figma-token-sync init
```

This creates a `figma-token-sync.config.json` file:

```json
{
  "figmaFileKey": "your-file-key",
  "localPath": "./tokens",
  "format": "dtcg"
}
```

### Pull from Figma

```bash
export FIGMA_ACCESS_TOKEN=your-token
figma-token-sync pull
```

### Push to Figma

```bash
figma-token-sync push
```

### View Differences

```bash
figma-token-sync diff
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         figma-token-sync CLI                │
│         (packages/cli)                      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│      Transform Engine & Figma Client        │
│      (@figma-token-sync/core)               │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  DTCG    │  │ Language │  │  Figma   │ │
│  │  Parser  │◄─┤ Contract │──┤  Client  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└──────────────┬──────────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ Figma REST   │
        │     API      │
        └──────────────┘
```

## Repository Structure

```
figma-token-sync/
├── packages/
│   ├── core/              ← Transform logic, Figma API client
│   ├── cli/               ← Command line interface
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

### Tier 1: CLI Foundation (Current)

- [x] Monorepo scaffolding
- [ ] Figma API client
- [ ] DTCG transformers
- [ ] CLI commands (pull, push, diff, init)
- [ ] Material 3 example

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

## Examples

See [examples/material3](./examples/material3) for a working Material Design 3 example.

## Documentation

- [Full Documentation](./docs/README.md)
- [API Reference](./packages/core/README.md)
- [CLI Reference](./packages/cli/README.md)

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