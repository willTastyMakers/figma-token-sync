# Material Design 3 Example

This example demonstrates how to use `figma-token-sync` with Material Design 3 tokens.

## Setup

1. Create a Figma file with Material 3 variables
2. Get your Figma personal access token from https://www.figma.com/developers/api#access-tokens
3. Update `figma-token-sync.config.json` with your file key
4. Set environment variable: `export FIGMA_ACCESS_TOKEN=<your-token>`

## Usage

### Pull tokens from Figma

```bash
pnpm sync:pull
```

This will fetch variables from Figma and update `tokens/material3.tokens.json`.

### Push tokens to Figma

```bash
pnpm sync:push
```

This will push local token changes to Figma variables.

### View differences

```bash
pnpm sync:diff
```

This will show differences between local and remote tokens without making changes.

## Token Structure

The example includes:

- **Colors**: Material 3 color system (primary, secondary, surface, etc.)
- **Typography**: Text styles (display, headline, body)
- **Spacing**: Spacing scale (xs, sm, md, lg, xl)

## Format

Tokens are stored in DTCG (W3C Design Tokens) format with:

- `$type`: Token type (color, dimension, fontFamily, etc.)
- `$value`: Token value
- `$description`: Human-readable description

## Learn More

- [Material Design 3](https://m3.material.io/)
- [DTCG Specification](https://tr.designtokens.org/format/)
- [Figma Variables API](https://www.figma.com/developers/api#variables)