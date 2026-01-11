# Figma Token Sync Plugin

Figma Plugin for exporting and importing design tokens via Variables API.

## Overview

This plugin provides the bridge between Figma Variables and your codebase by:
- **Exporting** Variables from Figma to DTCG-formatted `tokens.json`
- **Importing** `tokens.json` back to Figma Variables

## Why a Plugin?

The Figma Variables REST API requires an **Enterprise plan**. Plugins have full access to the Variables API regardless of plan tier, making this tool accessible to all users.

## Architecture

```
Figma Variables  ←→  Plugin (this package)  ←→  tokens.json  ←→  Your Code
```

## Development

### Build

```bash
pnpm build
```

This compiles TypeScript and copies the manifest to `dist/`.

### Watch Mode

```bash
pnpm dev
```

### Install in Figma

1. Build the plugin: `pnpm build`
2. In Figma: **Menu → Plugins → Development → Import plugin from manifest**
3. Select `dist/manifest.json`

## File Structure

```
figma-plugin/
├── src/
│   ├── code.ts           ← Plugin sandbox code (has Variables API access)
│   ├── ui.html           ← Plugin UI (iframe)
│   ├── export.ts         ← Variables → DTCG export logic
│   └── import.ts         ← DTCG → Variables import logic
├── manifest.json         ← Figma plugin manifest
├── package.json
└── tsconfig.json
```

## Plugin API Access

The plugin uses Figma's Plugin API:

```typescript
// Read all variables
const variables = await figma.variables.getLocalVariablesAsync();

// Create a variable
const variable = figma.variables.createVariable(name, collectionId, type);

// Update a variable
variable.setValueForMode(modeId, value);
```

See `.claude/skills/figma-api/SKILL.md` for complete API reference.

## User Workflow

### Export (Figma → Code)

1. User opens Figma file with Variables
2. Runs plugin: **Plugins → Figma Token Sync**
3. Clicks **Export** button
4. Plugin reads Variables via API
5. Transforms to DTCG format
6. User downloads `tokens.json`
7. File is committed to code repository

### Import (Code → Figma)

1. Developer edits `tokens.json` locally
2. User opens Figma and runs plugin
3. Clicks **Import** button, selects file
4. Plugin parses DTCG format
5. Creates/updates Figma Variables
6. Changes are live in Figma

## No Authentication Required

Unlike REST API approaches, the plugin runs in the user's Figma session. No personal access tokens needed!

## Learn More

- [Figma Plugin API - Variables](https://www.figma.com/plugin-docs/api/figma-variables/)
- [DTCG Specification](https://tr.designtokens.org/format/)
- [Plugin Development Guide](https://www.figma.com/plugin-docs/)
