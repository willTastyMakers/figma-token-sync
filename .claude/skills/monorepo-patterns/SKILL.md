# Monorepo Patterns Skill

## Overview

This skill provides knowledge for building TypeScript monorepos with pnpm workspaces and Turbo.

## Stack

- **pnpm** — Package manager with workspaces
- **Turbo** — Build orchestration and caching
- **TypeScript** — With project references
- **ESM** — ES Modules as default

## Workspace Structure

```
monorepo/
├── packages/
│   ├── core/         ← Shared library
│   ├── cli/          ← CLI application
│   └── addon/        ← Framework integration
├── examples/
│   └── demo/         ← Example usage
├── docs/
├── package.json      ← Root package (private)
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── .gitignore
```

## Root Configuration

### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
  - 'examples/*'
```

### package.json (root)
```json
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "turbo": "^2.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

### tsconfig.base.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  }
}
```

## Package Configuration

### packages/core/package.json
```json
{
  "name": "@my-org/core",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -b",
    "dev": "tsc -b --watch",
    "test": "vitest",
    "clean": "rm -rf dist .turbo"
  }
}
```

### packages/core/tsconfig.json
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

### packages/cli/package.json (with dependency)
```json
{
  "name": "my-cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "my-cli": "./bin/cli.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "dev": "tsc -b --watch"
  },
  "dependencies": {
    "@my-org/core": "workspace:*",
    "commander": "^12.0.0"
  }
}
```

### packages/cli/tsconfig.json (with reference)
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../core" }
  ]
}
```

## ESM Import Patterns

### Use .js extensions in imports
```typescript
// Correct (even for .ts files)
import { foo } from './utils.js';
import { bar } from '../config/loader.js';

// Incorrect
import { foo } from './utils';
import { bar } from '../config/loader.ts';
```

### Import from workspace packages
```typescript
// Using package name
import { transform } from '@my-org/core';

// Importing specific subpath (if configured)
import { parseTokens } from '@my-org/core/transforms';
```

## CLI Binary Setup

### bin/cli.js
```javascript
#!/usr/bin/env node
import '../dist/index.js';
```

Make executable:
```bash
chmod +x packages/cli/bin/cli.js
```

### Testing locally
```bash
# From monorepo root
pnpm build
node packages/cli/bin/cli.js --help

# Or link globally
cd packages/cli
pnpm link --global
my-cli --help
```

## Common Commands

```bash
# Install all dependencies
pnpm install

# Build all packages (respects dependencies)
pnpm build

# Build specific package
pnpm --filter @my-org/core build

# Run in watch mode
pnpm dev

# Add dependency to specific package
pnpm --filter @my-org/cli add commander

# Add workspace dependency
pnpm --filter @my-org/cli add @my-org/core --workspace

# Run tests
pnpm test

# Clean all build artifacts
pnpm clean
```

## Vitest Configuration

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

## Publishing

### Changesets (recommended)
```bash
pnpm add -D @changesets/cli
pnpm changeset init
```

### Manual publishing
```bash
# Build first
pnpm build

# Publish public packages
pnpm --filter "./packages/*" publish --access public
```

## Best Practices

1. **Use workspace protocol** — `"workspace:*"` for internal dependencies
2. **Always build before test** — Turbo handles this with `dependsOn`
3. **Use .js extensions** — Required for ESM imports
4. **Composite projects** — Enable TypeScript project references
5. **Clean before publish** — Ensure dist is fresh
6. **Lock packageManager** — Specify exact pnpm version

## Troubleshooting

### "Cannot find module" errors
- Ensure `pnpm build` ran successfully
- Check .js extensions in imports
- Verify workspace dependency is installed

### TypeScript project reference errors
- Run `tsc -b --clean` then `tsc -b`
- Check `references` in tsconfig.json

### Turbo cache issues
- Run `turbo run build --force`
- Delete `.turbo` folders
