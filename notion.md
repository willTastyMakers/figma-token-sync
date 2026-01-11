## About This Guide

This is the **living documentation** for building and maintaining the TastyMakers Design System workflow. It serves as both a step-by-step implementation guide and an ongoing record of decisions, learnings, and refinements.

**How to use this document:**

- Follow the steps sequentially for initial setup
- Check off completed items as you progress
- Add notes and learnings in the designated sections
- Reference back when onboarding new projects or clients

**Last Updated:** December 21, 2024

**Current Phase:** Pre-Implementation Planning

---

## Quick Navigation

1. [Pre-Flight Checklist](#pre-flight-checklist)
2. [Step 1: Repository Setup](#step-1-repository-setup)
3. [Step 2: Panda CSS Foundation](#step-2-panda-css-foundation)
4. [Step 3: Design Language Contract](#step-3-design-language-contract)
5. [Step 4: M3 Token Implementation](#step-4-m3-token-implementation)
6. [Step 5: Core Component Recipes](#step-5-core-component-recipes)
7. [Step 6: Ark UI Integration](#step-6-ark-ui-integration)
8. [Step 7: Storybook Setup](#step-7-storybook-setup)
9. [Step 8: NPM Package Build](#step-8-npm-package-build)
10. [Step 9: Figma Native Variables Setup](#step-9-figma-native-variables-setup) *(Free workflow)*
11. [Step 10: Token Sync Pipeline](#step-10-token-sync-pipeline)
12. [Step 11: Figma Code Connect](#step-11-figma-code-connect)
13. [Step 12: Figma Make Validation](#step-12-figma-make-validation)
14. [Step 13: Production Deployment](#step-13-production-deployment)
15. [Ongoing Maintenance](#ongoing-maintenance)

---

## Pre-Flight Checklist

**Before starting, ensure you have:**

- [ ]  Node.js 20+ installed
- [ ]  pnpm installed (`npm install -g pnpm`)
- [ ]  Git configured with GitHub access
- [ ]  Figma account with Dev Mode access (free tier works)
- [ ]  npm account for publishing (optional for private use)
- [ ]  VS Code with recommended extensions:
    - [ ]  Panda CSS extension
    - [ ]  ESLint
    - [ ]  Prettier
    - [ ]  Figma for VS Code

**Figma Plugins to Install (All Free):**

- [ ]  "Variables Import Export" or "Export/Import Variables" — for JSON export
- [ ]  "Batch Styler" — for bulk text style creation (optional)

**Decisions to make before starting:**

- [ ]  Package scope name (e.g., `@tastymakers/design-system`)
- [ ]  Repository location (GitHub org or personal)
- [ ]  Initial aesthetic (M3 recommended for first implementation)
- [ ]  Target output platforms (Figma Make, Next.js, Remix, etc.)

---

## Critical Discovery: Figma Variables API Restriction

> **🚨 IMPORTANT (December 29, 2024):** During implementation, we discovered that Figma's Variables REST API **requires an Enterprise plan**. The necessary API scopes (`file_variables:read` and `file_variables:write`) are not available on Free, Professional, or Organization plans.
>
> **Impact:** Cannot use REST API for automated token sync unless on Enterprise ($45/seat/month minimum).
>
> **Solution:** We built a **Plugin-based approach** that works on all Figma plan tiers by using the Figma Plugin API instead of the REST API. See [figma-token-sync](https://github.com/TastyMakers/figma-token-sync) for the open-source implementation.

### How We Discovered This

1. Implemented REST API client with proper authentication
2. Created Figma personal access token with all available scopes
3. Attempted to fetch Variables from file → Got 403 Forbidden
4. Used curl to get actual error message: "This endpoint requires the file_variables:read scope"
5. Researched Figma documentation → Confirmed Enterprise-only restriction
6. Pivoted to Plugin API which has full Variables access on all plans

This discovery fundamentally changed our architecture but resulted in a **better solution** that works for everyone, not just Enterprise customers.

---

## Why We're Not Using Tokens Studio

**Cost:** Tokens Studio is $15-40/month. For a solo practitioner or small team, this adds up.

**What Figma Already Provides (Free):**

- Native Variables with modes (light/dark)
- Variable aliasing (semantic references)
- Variable collections (grouping)
- Number, color, string, and boolean variables

**Our Free Alternative Stack:**

| Need | Free Solution |
| --- | --- |
| Token management | Figma Native Variables |
| JSON export | Free Figma plugin |
| Typography tokens | Defined in code (source of truth) |
| GitHub sync | Manual export + script |
| Token transformation | Custom transform script |

**Trade-off:** Manual export instead of auto-sync. This is acceptable for most workflows and saves $180-480/year

---

## Step 1: Repository Setup

### 1.1 Create the Repository

**Action:** Create a new GitHub repository

```bash
# Create directory
mkdir design-system && cd design-system

# Initialize git
git init

# Initialize pnpm
pnpm init
```

**Expected outcome:** Empty repository with package.json

---

### 1.2 Install Core Dependencies

**Action:** Install all required packages

```bash
# Core dependencies
pnpm add @ark-ui/react clsx

# Dev dependencies
pnpm add -D @pandacss/dev typescript tsup vite
pnpm add -D @storybook/react-vite @storybook/addon-essentials @storybook/addon-a11y
pnpm add -D @figma/code-connect
pnpm add -D @material/material-color-utilities
pnpm add -D @types/react @types/react-dom
pnpm add -D vitest
```

**Expected outcome:** All dependencies in package.json

**Checkpoint:** Run `pnpm list` to verify installations

---

### 1.3 Create Folder Structure

**Action:** Set up the project directory structure

```bash
mkdir -p src/{contracts,languages,tokens,recipes,components,utils}
mkdir -p src/components/{Button,Card,Input,Dialog}
mkdir -p scripts
mkdir -p tokens
mkdir -p .storybook
mkdir -p .github/workflows
```

**Full structure:**

```
design-system/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── publish.yml
├── .storybook/
│   ├── main.ts
│   ├── preview.ts
│   └── theme.ts
├── scripts/
│   ├── sync-tokens.ts
│   └── generate-palette.ts
├── src/
│   ├── contracts/
│   │   └── design-language.contract.ts
│   ├── languages/
│   │   ├── material3.language.ts
│   │   ├── transform.ts
│   │   └── index.ts
│   ├── tokens/
│   │   ├── reference.ts
│   │   ├── system.ts
│   │   └── components.ts
│   ├── recipes/
│   │   ├── button.recipe.ts
│   │   ├── card.recipe.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   └── .../
│   ├── utils/
│   │   └── cn.ts
│   └── index.ts
├── tokens/
│   └── tokens.json          # Tokens Studio sync target
├── styled-system/            # Generated (gitignore)
├── dist/                     # Build output (gitignore)
├── panda.config.ts
├── tsconfig.json
├── tsup.config.ts
└── package.json
```

**Expected outcome:** Complete folder structure

---

### 1.4 Configure TypeScript

**Action:** Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "styled-system/*": ["./styled-system/*"]
    },
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*", "scripts/**/*", "panda.config.ts"],
  "exclude": ["node_modules", "dist", "styled-system"]
}
```

**Expected outcome:** TypeScript configured with path aliases

---

### 1.5 Configure tsup (Build Tool)

**Action:** Create tsup.config.ts

```tsx
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
  },
});
```

**Expected outcome:** Build configuration ready

---

### 1.6 Create .gitignore

**Action:** Create .gitignore file

```
# Dependencies
node_modules/

# Build outputs
dist/
styled-system/

# IDE
.vscode/
.idea/

# OS
.DS_Store

# Logs
*.log

# Environment
.env
.env.local

# Storybook
storybook-static/
```

**Expected outcome:** Git ignores appropriate files

---

### 1.7 Initial Commit

**Action:** Commit the scaffolding

```bash
git add .
git commit -m "chore: initial project scaffolding"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

**Checkpoint:** Repository visible on GitHub

---

### Step 1 Completion

- [ ]  Repository created on GitHub
- [ ]  All dependencies installed
- [ ]  Folder structure in place
- [ ]  TypeScript configured
- [ ]  tsup configured
- [ ]  .gitignore created
- [ ]  Initial commit pushed

**Notes & Learnings:**

> *Add any issues encountered or decisions made during this step*
>

---

## Step 2: Panda CSS Foundation

### 2.1 Initialize Panda CSS

**Action:** Run Panda init

```bash
pnpm panda init
```

This creates a basic `panda.config.ts` file.

**Expected outcome:** panda.config.ts created

---

### 2.2 Configure Panda CSS

**Action:** Replace panda.config.ts with our configuration

```tsx
// panda.config.ts
import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  // Enable CSS reset
  preflight: true,
  
  // File globs to scan for styles
  include: [
    './src/**/*.{js,jsx,ts,tsx}',
    './stories/**/*.{js,jsx,ts,tsx}'
  ],
  
  // Files to exclude
  exclude: [],
  
  // Output directory for generated files
  outdir: 'styled-system',
  
  // Enable JSX patterns
  jsxFramework: 'react',
  
  // CSS Layers for cascade control
  layers: {
    reset: 'reset',
    base: 'base',
    tokens: 'tokens',
    recipes: 'recipes',
    utilities: 'utilities'
  },
  
  // Theme configuration (will be populated in Step 4)
  theme: {
    extend: {}
  },
  
  // Conditions for variants (dark mode, etc.)
  conditions: {
    light: '[data-theme=light] &, .light &',
    dark: '[data-theme=dark] &, .dark &'
  },
  
  // Global CSS
  globalCss: {
    html: {
      colorScheme: 'light dark'
    },
    body: {
      fontFamily: 'body',
      bg: 'surface',
      color: 'onSurface'
    }
  }
});
```

**Expected outcome:** Panda configured for our use case

---

### 2.3 Run Panda Codegen

**Action:** Generate the styled-system folder

```bash
pnpm panda codegen
```

**Expected outcome:** `styled-system/` folder created with:

- css.ts
- patterns.ts
- recipes.ts
- tokens.ts
- jsx.ts
- etc.

---

### 2.4 Add Package Scripts

**Action:** Update package.json scripts

```json
{
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "pnpm build:panda && pnpm build:lib",
    "build:panda": "panda codegen",
    "build:lib": "tsup",
    "build:storybook": "storybook build",
    "prepare": "panda codegen",
    "lint": "eslint src",
    "test": "vitest",
    "tokens:sync": "tsx scripts/sync-tokens.ts"
  }
}
```

**Expected outcome:** All necessary scripts available

---

### 2.5 Create Utility Function

**Action:** Create src/utils/cn.ts

```tsx
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
```

This utility merges class names cleanly.

**Expected outcome:** cn() utility available

---

### 2.6 Verify Panda Works

**Action:** Create a test file to verify

```tsx
// src/test-panda.ts
import { css } from '../styled-system/css';

const testStyle = css({
  display: 'flex',
  padding: '4',
  bg: 'red.500'
});

console.log('Panda is working:', testStyle);
```

Run with: `pnpm tsx src/test-panda.ts`

**Expected outcome:** Outputs a generated class name string

---

### Step 2 Completion

- [ ]  Panda CSS initialized
- [ ]  panda.config.ts configured
- [ ]  styled-system/ generated
- [ ]  Package scripts added
- [ ]  cn() utility created
- [ ]  Verified Panda works

**Notes & Learnings:**

> *Add any issues encountered or decisions made during this step*
>

---

## Step 3: Design Language Contract

### 3.1 Create the Contract Interface

**Action:** Create src/contracts/design-language.contract.ts

This TypeScript interface defines what ANY design aesthetic must provide. M3, Carbon, Fluent, or custom brands all implement this same contract.

```tsx
// src/contracts/design-language.contract.ts

/**
 * Design Language Contract
 * 
 * Any aesthetic (M3, Carbon, Fluent, custom) must implement this interface.
 * This enables swapping aesthetics by changing one import.
 */

export interface DesignLanguageContract {
  /** Unique identifier for this language */
  name: string;
  
  /** Version for tracking changes */
  version: string;
  
  /** Color palettes */
  colors: ColorPalettes;
  
  /** Semantic color mappings */
  semantic: SemanticColors;
  
  /** Typography configuration */
  typography: TypographyConfig;
  
  /** Spacing scale */
  spacing: SpacingScale;
  
  /** Shape configuration */
  shape: ShapeConfig;
  
  /** Elevation/shadow configuration */
  elevation: ElevationConfig;
  
  /** Motion/animation configuration */
  motion: MotionConfig;
}

// ============================================
// Color Types
// ============================================

export interface ColorPalettes {
  primary: TonalPalette;
  secondary: TonalPalette;
  tertiary: TonalPalette;
  neutral: TonalPalette;
  neutralVariant: TonalPalette;
  error: TonalPalette;
  warning?: TonalPalette;
  success?: TonalPalette;
  info?: TonalPalette;
}

export interface TonalPalette {
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

export interface SemanticColors {
  // Primary
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  
  // Secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  
  // Tertiary
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  
  // Error
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  
  // Surface
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  
  // Outline
  outline: string;
  outlineVariant: string;
  
  // Inverse
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  
  // Background
  background: string;
  onBackground: string;
  
  // Misc
  scrim: string;
  shadow: string;
}

// ============================================
// Typography Types
// ============================================

export interface TypographyConfig {
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
  scale: TypographyScale;
}

export interface TypographyScale {
  displayLarge: TypeStyle;
  displayMedium: TypeStyle;
  displaySmall: TypeStyle;
  headlineLarge: TypeStyle;
  headlineMedium: TypeStyle;
  headlineSmall: TypeStyle;
  titleLarge: TypeStyle;
  titleMedium: TypeStyle;
  titleSmall: TypeStyle;
  bodyLarge: TypeStyle;
  bodyMedium: TypeStyle;
  bodySmall: TypeStyle;
  labelLarge: TypeStyle;
  labelMedium: TypeStyle;
  labelSmall: TypeStyle;
}

export interface TypeStyle {
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  letterSpacing: string;
  fontFamily?: 'display' | 'body' | 'mono';
}

// ============================================
// Spacing Types
// ============================================

export interface SpacingScale {
  none: string;
  xxs: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  xxxl: string;
}

// ============================================
// Shape Types
// ============================================

export interface ShapeConfig {
  radii: RadiiScale;
  style: 'sharp' | 'rounded' | 'soft' | 'organic';
}

export interface RadiiScale {
  none: string;
  extraSmall: string;
  small: string;
  medium: string;
  large: string;
  extraLarge: string;
  full: string;
}

// ============================================
// Elevation Types
// ============================================

export interface ElevationConfig {
  levels: ElevationScale;
  style: 'shadow' | 'border' | 'blur' | 'flat';
}

export interface ElevationScale {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
}

// ============================================
// Motion Types
// ============================================

export interface MotionConfig {
  durations: DurationScale;
  easings: EasingScale;
  style: 'expressive' | 'productive' | 'minimal';
}

export interface DurationScale {
  instant: string;
  fast: string;
  normal: string;
  slow: string;
  slower: string;
}

export interface EasingScale {
  standard: string;
  standardDecelerate: string;
  standardAccelerate: string;
  emphasized: string;
  emphasizedDecelerate: string;
  emphasizedAccelerate: string;
}
```

**Expected outcome:** Complete contract interface defined

---

### 3.2 Create the Language Transformer

**Action:** Create src/languages/transform.ts

This transforms any DesignLanguageContract into Panda CSS configuration format.

```tsx
// src/languages/transform.ts

import type { DesignLanguageContract, TonalPalette } from '../contracts/design-language.contract';

/**
 * Transforms a DesignLanguageContract into Panda CSS theme configuration
 */
export function transformToPandaTheme(language: DesignLanguageContract) {
  return {
    tokens: transformTokens(language),
    semanticTokens: transformSemanticTokens(language),
    textStyles: transformTextStyles(language)
  };
}

/**
 * Transform primitive tokens
 */
function transformTokens(language: DesignLanguageContract) {
  return {
    colors: transformColorPalettes(language.colors),
    fonts: {
      display: { value: language.typography.fonts.display },
      body: { value: language.typography.fonts.body },
      mono: { value: language.typography.fonts.mono }
    },
    fontSizes: extractFontSizes(language.typography.scale),
    lineHeights: extractLineHeights(language.typography.scale),
    fontWeights: extractFontWeights(language.typography.scale),
    letterSpacings: extractLetterSpacings(language.typography.scale),
    spacing: objectToTokens(language.spacing),
    radii: objectToTokens(language.shape.radii),
    shadows: objectToTokens(language.elevation.levels),
    durations: objectToTokens(language.motion.durations),
    easings: objectToTokens(language.motion.easings)
  };
}

/**
 * Transform semantic tokens (with references)
 */
function transformSemanticTokens(language: DesignLanguageContract) {
  const semantic = language.semantic;
  
  return {
    colors: Object.fromEntries(
      Object.entries(semantic).map(([key, value]) => [
        key,
        { value: resolveReference(value) }
      ])
    )
  };
}

/**
 * Transform text styles
 */
function transformTextStyles(language: DesignLanguageContract) {
  const scale = language.typography.scale;
  
  return Object.fromEntries(
    Object.entries(scale).map(([name, style]) => [
      name,
      {
        value: {
          fontFamily: style.fontFamily || 'body',
          fontSize: name,
          lineHeight: name,
          fontWeight: style.fontWeight,
          letterSpacing: style.letterSpacing
        }
      }
    ])
  );
}

// ============================================
// Helper Functions
// ============================================

function transformColorPalettes(palettes: Record<string, TonalPalette>) {
  return Object.fromEntries(
    Object.entries(palettes).map(([name, palette]) => [
      name,
      Object.fromEntries(
        Object.entries(palette).map(([tone, value]) => [
          tone,
          { value }
        ])
      )
    ])
  );
}

function objectToTokens<T extends Record<string, string>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, { value }])
  );
}

function resolveReference(value: string): string {
  // If it's a reference like "{colors.primary.40}", keep it
  if (value.startsWith('{') && value.endsWith('}')) {
    return value;
  }
  // Otherwise, return as-is
  return value;
}

function extractFontSizes(scale: Record<string, { fontSize: string }>) {
  return Object.fromEntries(
    Object.entries(scale).map(([name, style]) => [
      name,
      { value: style.fontSize }
    ])
  );
}

function extractLineHeights(scale: Record<string, { lineHeight: string }>) {
  return Object.fromEntries(
    Object.entries(scale).map(([name, style]) => [
      name,
      { value: style.lineHeight }
    ])
  );
}

function extractFontWeights(scale: Record<string, { fontWeight: string }>) {
  const weights = new Map<string, string>();
  Object.values(scale).forEach(style => {
    weights.set(style.fontWeight, style.fontWeight);
  });
  return Object.fromEntries(
    Array.from(weights.entries()).map(([key, value]) => [
      key,
      { value }
    ])
  );
}

function extractLetterSpacings(scale: Record<string, { letterSpacing: string }>) {
  return Object.fromEntries(
    Object.entries(scale).map(([name, style]) => [
      name,
      { value: style.letterSpacing }
    ])
  );
}
```

**Expected outcome:** Transformer converts any language to Panda format

---

### 3.3 Create Language Index

**Action:** Create src/languages/index.ts

```tsx
// src/languages/index.ts

// Export the active language
// Change this import to switch aesthetics
export { material3Language as activeLanguage } from './material3.language';

// Re-export transformer
export { transformToPandaTheme } from './transform';

// Re-export types
export type { DesignLanguageContract } from '../contracts/design-language.contract';
```

**Expected outcome:** Single point to swap aesthetics

---

### Step 3 Completion

- [ ]  Contract interface created
- [ ]  Transformer function created
- [ ]  Language index created
- [ ]  Types exported properly

**Notes & Learnings:**

> *Add any issues encountered or decisions made during this step*
>

---

## Step 4: M3 Token Implementation

### 4.1 Create M3 Language File

**Action:** Create src/languages/material3.language.ts

This is the complete Material Design 3 implementation of the contract.

*Due to length, see the M3 Implementation Plan document for the full file content.*

**Key sections to implement:**

- [ ]  Color palettes (primary, secondary, tertiary, neutral, neutralVariant, error)
- [ ]  Semantic color mappings (light mode defaults)
- [ ]  Typography scale (all 15 M3 type styles)
- [ ]  Spacing scale (4px grid)
- [ ]  Shape/radii scale
- [ ]  Elevation levels (shadow definitions)
- [ ]  Motion durations and easings

**Expected outcome:** Complete M3 language file

---

### 4.2 Generate Color Palettes

**Action:** Create scripts/generate-palette.ts

Use Google's material-color-utilities to generate tonal palettes from source colors.

```tsx
// scripts/generate-palette.ts

import {
  argbFromHex,
  hexFromArgb,
  TonalPalette,
  Hct
} from '@material/material-color-utilities';

function generateTonalPalette(sourceHex: string) {
  const hct = Hct.fromInt(argbFromHex(sourceHex));
  const palette = TonalPalette.fromHct(hct);
  
  const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
  
  return Object.fromEntries(
    [tones.map](http://tones.map)(tone => [tone, hexFromArgb(palette.tone(tone))])
  );
}

// Generate from your source color
const sourceColor = '#6750A4'; // M3 default purple

console.log('Primary palette:');
console.log(JSON.stringify(generateTonalPalette(sourceColor), null, 2));
```

Run: `pnpm tsx scripts/generate-palette.ts`

**Expected outcome:** Generated tonal palettes for your source color

---

### 4.3 Update Panda Config with Tokens

**Action:** Update panda.config.ts to use the language

```tsx
// panda.config.ts
import { defineConfig } from '@pandacss/dev';
import { activeLanguage, transformToPandaTheme } from './src/languages';

const theme = transformToPandaTheme(activeLanguage);

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',
  
  theme: {
    tokens: theme.tokens,
    semanticTokens: theme.semanticTokens,
    textStyles: theme.textStyles,
    extend: {
      recipes: {
        // Recipes will be added in Step 5
      }
    }
  },
  
  conditions: {
    light: '[data-theme=light] &, .light &',
    dark: '[data-theme=dark] &, .dark &'
  },
  
  globalCss: {
    html: { colorScheme: 'light dark' },
    body: {
      fontFamily: 'body',
      bg: 'surface',
      color: 'onSurface',
      textStyle: 'bodyMedium'
    }
  }
});
```

**Expected outcome:** Panda config uses M3 tokens

---

### 4.4 Regenerate Styled System

**Action:** Run codegen with new tokens

```bash
pnpm panda codegen
```

**Checkpoint:** Verify `styled-system/tokens/index.js` contains your M3 tokens

---

### 4.5 Create Token Verification Test

**Action:** Create a test to verify tokens work

```tsx
// src/test-tokens.ts
import { css } from '../styled-system/css';
import { token } from '../styled-system/tokens';

// Test primitive token
console.log('Primary 40:', token('colors.primary.40'));

// Test semantic token
console.log('Surface:', token('colors.surface'));

// Test in css function
const testStyle = css({
  bg: 'primary',
  color: 'onPrimary',
  p: 'md',
  borderRadius: 'medium'
});

console.log('Generated class:', testStyle);
```

Run: `pnpm tsx src/test-tokens.ts`

**Expected outcome:** Tokens resolve correctly

---

### Step 4 Completion

- [ ]  M3 language file created
- [ ]  Palette generation script works
- [ ]  Panda config uses language tokens
- [ ]  styled-system regenerated
- [ ]  Token verification passes

**Notes & Learnings:**

> *Add any issues encountered or decisions made during this step*
>

---

## Step 5: Core Component Recipes

### 5.1 Create Button Recipe

**Action:** Create src/recipes/button.recipe.ts

*Full implementation in M3 Implementation Plan document*

**Key variants to implement:**

- [ ]  filled
- [ ]  outlined
- [ ]  text
- [ ]  elevated
- [ ]  tonal

**Key sizes:**

- [ ]  sm
- [ ]  md
- [ ]  lg

---

### 5.2 Create Card Recipe

**Action:** Create src/recipes/card.recipe.ts

**Key variants:**

- [ ]  elevated
- [ ]  filled
- [ ]  outlined

---

### 5.3 Create Additional Recipes

**Create recipes for:**

- [ ]  IconButton
- [ ]  Badge
- [ ]  Chip
- [ ]  Divider
- [ ]  Surface
- [ ]  FAB

---

### 5.4 Create Slot Recipes for Complex Components

**Create slot recipes for:**

- [ ]  Dialog (backdrop, positioner, content, title, description)
- [ ]  TextField (root, input, label, helper)
- [ ]  Menu (root, trigger, content, item)

---

### 5.5 Export All Recipes

**Action:** Create src/recipes/index.ts

```tsx
// src/recipes/index.ts
export { buttonRecipe } from './button.recipe';
export { cardRecipe } from './card.recipe';
export { iconButtonRecipe } from './icon-button.recipe';
// ... more exports
```

---

### 5.6 Add Recipes to Panda Config

**Action:** Update panda.config.ts

```tsx
import { buttonRecipe, cardRecipe /* ... */ } from './src/recipes';

// In theme.extend:
recipes: {
  button: buttonRecipe,
  card: cardRecipe,
  // ... more recipes
}
```

---

### Step 5 Completion

- [ ]  Button recipe with all variants
- [ ]  Card recipe with all variants
- [ ]  Additional recipes created
- [ ]  Slot recipes for complex components
- [ ]  All recipes exported
- [ ]  Recipes added to Panda config
- [ ]  Codegen successful with recipes

**Notes & Learnings:**

> *Add any issues encountered or decisions made during this step*
>

---

## Step 6: Ark UI Integration

*Continue with Ark UI component implementations...*

---

## Step 7: Storybook Setup

*Continue with Storybook configuration...*

---

## Step 8: NPM Package Build

*Continue with package configuration...*

---

## Step 9: Figma Native Variables Setup

> **💰 Cost: $0** — This workflow uses only free Figma features and our custom plugin.
>
> **⚠️ Important Discovery:** Figma's Variables REST API requires an Enterprise plan. The `file_variables:read/write` scopes are not available on Free, Professional, or Organization plans. This is why we built a **Plugin-based approach** that works on all plan tiers.

### Understanding the Split Source Approach

Our token architecture has two sources of truth:

| Token Type | Source of Truth | Why |
| --- | --- | --- |
| Colors, Spacing, Radii | Figma Variables | Visual, designer-friendly |
| Typography | Code | Complex values, easier to manage programmatically |
| Shadows, Motion | Code | CSS-specific syntax |

This is actually **better** than having everything in Figma because:

- Typography is tedious to edit in Figma
- Shadow syntax differs between design tools and CSS
- Motion values have no visual representation in Figma anyway

### Why Plugin-Based Sync vs REST API

**REST API Approach (Enterprise Only):**
- ❌ Requires Figma Enterprise plan ($45/seat/month)
- ❌ Needs `file_variables:read/write` API scopes
- ❌ Requires personal access token management
- ✅ Can be automated in CI/CD

**Plugin Approach (Works on All Plans):**
- ✅ Works on Free, Professional, Organization, and Enterprise
- ✅ No API tokens or authentication needed
- ✅ Bidirectional sync (export AND import)
- ✅ User runs plugin in Figma session
- ⚠️ Manual export/import (acceptable trade-off for $540/year savings)

---

### 9.1 Create Variable Collections in Figma

**Action:** Set up your Figma file with proper variable structure

**Open Variables panel:** Click the Variables icon in the right sidebar (or use the shortcut).

**Create Collections:**

1. **Primitives** (raw values)
    - `colors/primary/0` through `colors/primary/100`
    - `colors/secondary/0` through `colors/secondary/100`
    - `colors/tertiary/0` through `colors/tertiary/100`
    - `colors/neutral/0` through `colors/neutral/100`
    - `colors/neutralVariant/0` through `colors/neutralVariant/100`
    - `colors/error/0` through `colors/error/100`
    - `spacing/none`, `spacing/xxs`, `spacing/xs`, `spacing/sm`, `spacing/md`, `spacing/lg`, `spacing/xl`, `spacing/xxl`
    - `radii/none`, `radii/extraSmall`, `radii/small`, `radii/medium`, `radii/large`, `radii/extraLarge`, `radii/full`
2. **Semantic** (aliased values with modes)
    - Create **Light** and **Dark** modes
    - `surface` → references `colors/neutral/99` (light) / `colors/neutral/10` (dark)
    - `onSurface` → references `colors/neutral/10` (light) / `colors/neutral/90` (dark)
    - `primary` → references `colors/primary/40` (light) / `colors/primary/80` (dark)
    - `onPrimary` → references `colors/primary/100` (light) / `colors/primary/20` (dark)
    - *(Continue for all semantic colors from the contract)*

**Naming Convention:**

- Use `/` for hierarchy: `colors/primary/40`
- This maps cleanly to code: `colors.primary.40`

**Expected outcome:** Complete variable structure in Figma

---

### 9.2 Install Figma Token Sync Plugin

**Action:** Install the Figma Token Sync plugin

**Two Options:**

**Option 1: Use Our Custom Plugin (Recommended)**
- Located in `figma-token-sync/packages/figma-plugin/`
- Bidirectional sync (export AND import)
- DTCG format output
- Works with our CLI tools

**To install our plugin:**
1. Build the plugin: `cd packages/figma-plugin && pnpm build`
2. In Figma: **Menu → Plugins → Development → Import plugin from manifest**
3. Select `packages/figma-plugin/dist/manifest.json`

**Option 2: Third-Party Plugins (Alternative)**
If you prefer a pre-built plugin:
1. **"Variables Import Export"** by Nata Vake - Simple JSON export/import
2. **"Export/Import Variables"** by Sam Holden - Good mode support
3. **"Design Tokens"** by Lukas Oppermann - DTCG format, free tier

**To install third-party:** Go to Resources → Plugins → Search → Install

**Expected outcome:** Plugin ready for bidirectional sync

---

### 9.3 Export Variables to JSON

**Action:** Export your variables using the plugin

**Using Our Custom Plugin:**
1. Open Figma file with Variables
2. Run: **Plugins → Figma Token Sync**
3. Click **"Export to DTCG"** button
4. Plugin automatically downloads `tokens.json`
5. Save to your repo at `tokens/tokens.json`

**Using Third-Party Plugin:**
1. Open the plugin from Plugins menu
2. Select collections to export (Primitives + Semantic)
3. Choose JSON/DTCG format
4. Export to file
5. Save as `tokens/tokens.json` in your repo

**Example exported structure (DTCG format):**

```json
{
  "version": "1.0.0",
  "exportedAt": "2024-12-29T...",
  "collections": [
    {
      "id": "...",
      "name": "Primitives",
      "modes": [{"modeId": "...", "name": "Mode 1"}],
      "variableIds": ["..."]
    }
  ],
  "variables": [
    {
      "id": "...",
      "name": "colors/primary/40",
      "resolvedType": "COLOR",
      "valuesByMode": {
        "mode1": {"r": 0.4, "g": 0.31, "b": 0.64, "a": 1}
      },
      "collectionId": "..."
    }
  ]
}
```

**Expected outcome:** tokens.json file in your repo ready for transforms

---

### 9.4 Create Text Styles in Figma (One-Time)

**Action:** Create Text Styles to match your code typography

Since typography lives in code, you need to manually create matching Text Styles in Figma:

1. Create a text layer for each style
2. Apply the correct font, size, weight, line height, letter spacing
3. Save as Text Style with matching name:
    - `displayLarge`
    - `displayMedium`
    - `displaySmall`
    - `headlineLarge`
    - `headlineMedium`
    - `headlineSmall`
    - `titleLarge`
    - `titleMedium`
    - `titleSmall`
    - `bodyLarge`
    - `bodyMedium`
    - `bodySmall`
    - `labelLarge`
    - `labelMedium`
    - `labelSmall`

**Pro Tip:** Create a "Typography" page in your Figma file with all 15 styles laid out for easy editing.

**Expected outcome:** All M3 text styles available in Figma

---

### 9.5 Document the Figma File Structure

**Action:** Organize your Figma file for easy maintenance

**Recommended page structure:**

```
📘 Cover
   └─ Instructions for using this file

🎨 Tokens
   ├─ Color swatches (visual reference)
   ├─ Spacing scale (visual reference)
   └─ Typography samples

🧱 Components
   ├─ Buttons
   ├─ Cards
   ├─ Inputs
   └─ ... (all components)

📝 Templates
   ├─ Common layouts
   └─ Page patterns

🧪 Playground
   └─ Test/experiment area
```

**Expected outcome:** Well-organized Figma file

---

### Step 9 Completion

- [ ]  Primitives collection created with all color tones
- [ ]  Semantic collection created with light/dark modes
- [ ]  Spacing and radii variables created
- [ ]  Export plugin installed
- [ ]  Successfully exported to JSON
- [ ]  Text Styles created for all 15 typography scales
- [ ]  Figma file organized with proper page structure

**Notes & Learnings:**

> *Add any issues encountered or decisions made during this step*
>

---

## Step 10: Token Sync Pipeline

> **No paid tools required** — Uses our open-source figma-token-sync tool.
>
> **GitHub:** [figma-token-sync](https://github.com/TastyMakers/figma-token-sync) (Free, works on all Figma plans)

### Understanding the Pipeline

```
Figma Variables
      ↓
Figma Token Sync Plugin → Export → tokens.json (DTCG format)
      ↓
figma-token-sync CLI tools (validate, convert, transform)
      ↓
Merge with Code Tokens (typography, shadows, motion)
      ↓
Generate Panda-compatible output
      ↓
pnpm panda codegen
      ↓
Components use updated tokens
```

**Why figma-token-sync?**
- ✅ Works on all Figma plans (Free through Enterprise)
- ✅ Plugin-based architecture (no API tokens needed)
- ✅ Bidirectional sync (Figma ↔ Code)
- ✅ CLI tools for validation and transformation
- ✅ DTCG standard compliance
- ✅ File-based sync (git-friendly workflow)

---

### 10.1 Install figma-token-sync CLI

**Action:** Add figma-token-sync to your project

```bash
# Add to dev dependencies
pnpm add -D figma-token-sync

# Or install globally
pnpm add -g figma-token-sync
```

**Available Commands:**

```bash
# Initialize configuration
figma-token-sync init

# Validate tokens.json structure
figma-token-sync validate tokens/tokens.json

# Convert between formats (DTCG ↔ DesignLanguageContract)
figma-token-sync convert tokens/tokens.json tokens/output.json --to language-contract

# Compare two token files
figma-token-sync diff tokens/tokens.json tokens/tokens.backup.json
```

**Expected outcome:** figma-token-sync CLI ready to use

---

### 10.2 Create the Transform Script (Alternative to CLI)

**Action:** If you need custom transformation logic, create scripts/sync-tokens.ts

```tsx
// scripts/sync-tokens.ts

import fs from 'fs';
import path from 'path';

// Types for Figma export format
interface FigmaToken {
  $value: string;
  $type: string;
}

interface FigmaExport {
  [collection: string]: {
    [group: string]: FigmaToken | { [key: string]: FigmaToken };
  };
}

// Read the Figma export
const figmaExportPath = path.join(process.cwd(), 'tokens/figma-export.json');
const figmaExport: FigmaExport = JSON.parse(
  fs.readFileSync(figmaExportPath, 'utf-8')
);

/**
 * Transform Figma Variables export to Panda token format
 */
function transformFigmaTokens(figmaData: FigmaExport) {
  const tokens: Record<string, any> = {
    colors: {},
    spacing: {},
    radii: {}
  };

  // Process colors
  if (figmaData.colors) {
    for (const [palette, tones] of Object.entries(figmaData.colors)) {
      tokens.colors[palette] = {};
      for (const [tone, token] of Object.entries(tones)) {
        if (typeof token === 'object' && '$value' in token) {
          tokens.colors[palette][tone] = { value: token.$value };
        }
      }
    }
  }

  // Process spacing
  if (figmaData.spacing) {
    for (const [name, token] of Object.entries(figmaData.spacing)) {
      if (typeof token === 'object' && '$value' in token) {
        tokens.spacing[name] = { value: token.$value };
      }
    }
  }

  // Process radii
  if (figmaData.radii) {
    for (const [name, token] of Object.entries(figmaData.radii)) {
      if (typeof token === 'object' && '$value' in token) {
        tokens.radii[name] = { value: token.$value };
      }
    }
  }

  return tokens;
}

/**
 * Transform semantic tokens (handling references)
 */
function transformSemanticTokens(figmaData: FigmaExport) {
  const semantic: Record<string, any> = {
    colors: {}
  };

  // Process semantic colors if they exist in export
  if (figmaData.semantic) {
    for (const [name, token] of Object.entries(figmaData.semantic)) {
      if (typeof token === 'object' && '$value' in token) {
        // Check if it's a reference
        const value = token.$value;
        if (value.startsWith('{') && value.endsWith('}')) {
          // It's a reference, convert to Panda format
          semantic.colors[name] = { value };
        } else {
          // Direct value
          semantic.colors[name] = { value };
        }
      }
    }
  }

  return semantic;
}

// Run the transformation
const primitiveTokens = transformFigmaTokens(figmaExport);
const semanticTokens = transformSemanticTokens(figmaExport);

// Generate output file
const output = `
// AUTO-GENERATED FROM FIGMA EXPORT
// Do not edit directly - run 'pnpm tokens:sync' to regenerate
// Last synced: ${new Date().toISOString()}

export const figmaTokens = ${JSON.stringify(primitiveTokens, null, 2)};

export const figmaSemanticTokens = ${JSON.stringify(semanticTokens, null, 2)};
`;

const outputPath = path.join(process.cwd(), 'src/tokens/figma-generated.ts');
fs.writeFileSync(outputPath, output);

console.log('✅ Tokens synced successfully!');
console.log(`   Output: ${outputPath}`);
console.log(`   Primitives: ${Object.keys(primitiveTokens.colors).length} color palettes`);
console.log(`   Semantic: ${Object.keys(semanticTokens.colors).length} semantic colors`);
```

**Expected outcome:** Sync script ready

---

### 10.2 Create Merge Script

**Action:** Create scripts/merge-tokens.ts

This merges Figma tokens with code-defined tokens (typography, shadows, motion).

```tsx
// scripts/merge-tokens.ts

import { figmaTokens, figmaSemanticTokens } from '../src/tokens/figma-generated';
import { typographyTokens } from '../src/tokens/typography';
import { shadowTokens } from '../src/tokens/shadows';
import { motionTokens } from '../src/tokens/motion';

/**
 * Merge all token sources into final Panda theme
 */
export function getMergedTokens() {
  return {
    tokens: {
      ...figmaTokens,
      ...typographyTokens,
      ...shadowTokens,
      ...motionTokens
    },
    semanticTokens: {
      ...figmaSemanticTokens
    }
  };
}
```

---

### 10.3 Create Code-Defined Token Files

**Action:** Create the token files that live in code

**src/tokens/typography.ts:**

```tsx
export const typographyTokens = {
  fonts: {
    display: { value: 'Georgia, serif' },
    body: { value: 'Inter, sans-serif' },
    mono: { value: 'JetBrains Mono, monospace' }
  },
  fontSizes: {
    displayLarge: { value: '57px' },
    displayMedium: { value: '45px' },
    displaySmall: { value: '36px' },
    headlineLarge: { value: '32px' },
    headlineMedium: { value: '28px' },
    headlineSmall: { value: '24px' },
    titleLarge: { value: '22px' },
    titleMedium: { value: '16px' },
    titleSmall: { value: '14px' },
    bodyLarge: { value: '16px' },
    bodyMedium: { value: '14px' },
    bodySmall: { value: '12px' },
    labelLarge: { value: '14px' },
    labelMedium: { value: '12px' },
    labelSmall: { value: '11px' }
  },
  lineHeights: {
    displayLarge: { value: '64px' },
    displayMedium: { value: '52px' },
    displaySmall: { value: '44px' },
    headlineLarge: { value: '40px' },
    headlineMedium: { value: '36px' },
    headlineSmall: { value: '32px' },
    titleLarge: { value: '28px' },
    titleMedium: { value: '24px' },
    titleSmall: { value: '20px' },
    bodyLarge: { value: '24px' },
    bodyMedium: { value: '20px' },
    bodySmall: { value: '16px' },
    labelLarge: { value: '20px' },
    labelMedium: { value: '16px' },
    labelSmall: { value: '16px' }
  },
  fontWeights: {
    regular: { value: '400' },
    medium: { value: '500' },
    semibold: { value: '600' },
    bold: { value: '700' }
  },
  letterSpacings: {
    tighter: { value: '-0.25px' },
    tight: { value: '0px' },
    normal: { value: '0.15px' },
    wide: { value: '0.25px' },
    wider: { value: '0.5px' }
  }
};
```

**src/tokens/shadows.ts:**

```tsx
export const shadowTokens = {
  shadows: {
    level0: { value: 'none' },
    level1: { value: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)' },
    level2: { value: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)' },
    level3: { value: '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px rgba(0, 0, 0, 0.3)' },
    level4: { value: '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px rgba(0, 0, 0, 0.3)' },
    level5: { value: '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px rgba(0, 0, 0, 0.3)' }
  }
};
```

**src/tokens/motion.ts:**

```tsx
export const motionTokens = {
  durations: {
    instant: { value: '0ms' },
    fast: { value: '100ms' },
    normal: { value: '200ms' },
    slow: { value: '300ms' },
    slower: { value: '500ms' }
  },
  easings: {
    standard: { value: 'cubic-bezier(0.2, 0, 0, 1)' },
    standardDecelerate: { value: 'cubic-bezier(0, 0, 0, 1)' },
    standardAccelerate: { value: 'cubic-bezier(0.3, 0, 1, 1)' },
    emphasized: { value: 'cubic-bezier(0.2, 0, 0, 1)' },
    emphasizedDecelerate: { value: 'cubic-bezier(0.05, 0.7, 0.1, 1)' },
    emphasizedAccelerate: { value: 'cubic-bezier(0.3, 0, 0.8, 0.15)' }
  }
};
```

---

### 10.4 Update Package Scripts

**Action:** Add sync scripts to package.json

```json
{
  "scripts": {
    "tokens:sync": "tsx scripts/sync-tokens.ts",
    "tokens:merge": "tsx scripts/merge-tokens.ts",
    "tokens:full": "pnpm tokens:sync && pnpm build:panda"
  }
}
```

---

### 10.5 Workflow: Syncing Token Changes

**When you update tokens in Figma (Export → Code):**

1. Make changes in Figma Variables
2. Run **Figma Token Sync** plugin
3. Click **"Export to DTCG"** button
4. Save downloaded `tokens.json` to your repo at `tokens/tokens.json`
5. Validate the export: `figma-token-sync validate tokens/tokens.json`
6. Run your transform/merge scripts (or use CLI)
7. Run `pnpm build:panda` (regenerates styled-system)
8. Verify in Storybook
9. Commit changes

**When you update tokens in Code (Import → Figma):**

1. Edit `tokens/tokens.json` locally
2. Run validation: `figma-token-sync validate tokens/tokens.json`
3. Open Figma and run **Figma Token Sync** plugin
4. Click **"Import from DTCG"** button
5. Select your updated `tokens.json` file
6. Plugin creates/updates Variables in Figma
7. Verify changes in Figma

**Quick commands:**

```bash
# Validate before committing
figma-token-sync validate tokens/tokens.json

# Compare with previous version
figma-token-sync diff tokens/tokens.json tokens/tokens.backup.json

# After exporting from Figma:
pnpm tokens:full
```

---

### Step 10 Completion

- [ ]  sync-tokens.ts script created
- [ ]  merge-tokens.ts script created
- [ ]  typography.ts tokens defined
- [ ]  shadows.ts tokens defined
- [ ]  motion.ts tokens defined
- [ ]  Package scripts added
- [ ]  Full sync workflow tested

**Notes & Learnings:**

> *Add any issues encountered or decisions made during this step*
>

---

## Step 11: Figma Code Connect

*Continue with Code Connect setup...*

---

## Step 12: Figma Make Validation

*Continue with Make testing...*

---

## Step 13: Production Deployment

*Continue with deployment...*

---

## Ongoing Maintenance

### Adding a New Component

1. Create recipe in `src/recipes/`
2. Create component in `src/components/`
3. Create stories in component folder
4. Create Code Connect file
5. Export from index.ts
6. Regenerate and publish

### Adding a New Aesthetic

1. Create new language file implementing DesignLanguageContract
2. Update `src/languages/index.ts` to export new language
3. Regenerate styled-system
4. Verify all components render correctly

### Updating Tokens from Figma

**Bidirectional Sync Workflow (Free):**

**Figma → Code (Export):**
1. Make changes to Variables in Figma
2. Run **Figma Token Sync** plugin → **Export to DTCG**
3. Save `tokens.json` to your repo
4. Validate: `figma-token-sync validate tokens/tokens.json`
5. Run `pnpm tokens:full`
6. Verify changes in Storybook
7. Commit and publish new version

**Code → Figma (Import):**
1. Edit `tokens/tokens.json` locally
2. Validate: `figma-token-sync validate tokens/tokens.json`
3. Open Figma → Run **Figma Token Sync** plugin
4. Click **Import from DTCG** → Select `tokens.json`
5. Verify changes in Figma
6. Commit the source file

**Tip:** Use `figma-token-sync diff` to compare before/after when making bulk changes

---

## Changelog

| Date | Change | Author |
| --- | --- | --- |
| 2024-12-21 | Initial guide created | Will |
| 2024-12-21 | Replaced Tokens Studio with free Figma Variables workflow | Will |
| 2024-12-29 | **Critical Discovery:** Figma Variables REST API requires Enterprise plan | Will |
| 2024-12-29 | Implemented Plugin-based approach (works on all Figma plans) | Will |
| 2024-12-29 | Created figma-token-sync open-source tool with CLI commands | Will |
| 2024-12-29 | Added bidirectional sync (Figma ↔ Code) via Plugin | Will |

---

## Resources

**Documentation:**

- [Panda CSS Docs](https://panda-css.com/docs)
- [Ark UI Docs](https://ark-ui.com/docs)
- [Material Design 3](https://m3.material.io/)
- [Figma Variables Guide](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
- [Figma Code Connect](https://www.figma.com/developers/api#code-connect)

**Our Tools:**

- [figma-token-sync](https://github.com/TastyMakers/figma-token-sync) - Open-source tool for Figma Variables sync (Plugin + CLI)
  - Works on all Figma plan tiers
  - Bidirectional sync (Figma ↔ Code)
  - DTCG standard compliance
  - CLI tools for validation and transformation

**Alternative Free Figma Plugins:**

- [Variables Import Export](https://www.figma.com/community/plugin/1256972111705530093) by Nata Vake
- [Export/Import Variables](https://www.figma.com/community/plugin/1261423994498720248) by Sam Holden
- [Design Tokens](https://www.figma.com/community/plugin/888356646278934516) by Lukas Oppermann (free tier)

**Related Documents:**

- [State of the Art Design System Flow](https://www.notion.so/State-of-the-Art-Design-System-Flow-2d14d6019b4280658938ce27a78f7d2f?pvs=21) (Parent)
- [M3 Design System Implementation Plan](https://www.notion.so/M3-Design-System-Implementation-Plan-2d14d6019b42812580d9d6bcb84d197a?pvs=21)

---

## Cost Comparison

| Approach | Monthly Cost | Annual Cost | Plan Required |
| --- | --- | --- | --- |
| **figma-token-sync (our tool)** | $0 | $0 | Free/Pro/Org/Enterprise |
| Figma REST API | $0 | $0 | **Enterprise only** ($45/seat/mo) |
| Tokens Studio Pro | $15 | $180 | Any Figma plan |
| Tokens Studio Team | $40 | $480 | Any Figma plan |

**Why Our Plugin Approach Wins:**

✅ **No plan restrictions** - Works on all Figma tiers (Free through Enterprise)
✅ **No subscription** - Completely free and open-source
✅ **Bidirectional sync** - Both export AND import (better than Figma API)
✅ **No API tokens** - Runs in user's Figma session
✅ **Git-friendly** - File-based workflow, perfect for version control
✅ **DTCG standard** - Future-proof token format

**Trade-offs vs REST API:**
- ⚠️ Manual export/import (not automated in CI/CD)
- ⚠️ User must run plugin in Figma

**Trade-offs vs Tokens Studio:**
- ⚠️ Manual sync instead of auto GitHub sync
- ⚠️ Typography defined in code (not Figma UI)

**Annual savings:** $180-$480 vs Tokens Studio, or $540+ vs Figma Enterprise requirement

[Using Figma Make](https://www.notion.so/Using-Figma-Make-2d74d6019b4280b2a140e5cdf67f8105?pvs=21)

[Storybooking our  Design System](https://www.notion.so/Storybooking-our-Design-System-2d74d6019b4280b0972bfdd170af2429?pvs=21)
