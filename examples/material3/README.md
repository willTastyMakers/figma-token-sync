# Material Design 3 Example

This example demonstrates a complete Material Design 3 color system using the DTCG (W3C Design Tokens) format.

## What's Included

### Tonal Palettes
Six complete tonal palettes with 16 shades each (0-100):
- **Primary** - Main brand color palette (purple)
- **Secondary** - Supporting color palette (violet-gray)
- **Tertiary** - Accent color palette (pink)
- **Error** - Error state palette (red)
- **Neutral** - Grayscale palette
- **Neutral Variant** - Tinted grayscale palette

### Semantic Colors
Two complete theme mappings using token references:
- **Light Theme** - 24 semantic color roles
- **Dark Theme** - 24 semantic color roles

All semantic colors reference the tonal palettes using DTCG alias syntax: `{color.primary.40}`

### Design Tokens
- **Spacing Scale** - 6 spacing values (xs to xxl)
- **Font Families** - Material Design type scale fonts

## Token Structure

```
tokens.json
├── color/
│   ├── primary/        # Tonal palette 0-100
│   ├── secondary/      # Tonal palette 0-100
│   ├── tertiary/       # Tonal palette 0-100
│   ├── error/          # Tonal palette 0-100
│   ├── neutral/        # Tonal palette 0-100
│   └── neutral-variant/# Tonal palette 0-100
├── semantic/
│   ├── light/          # Light theme roles
│   └── dark/           # Dark theme roles
├── dimension/
│   └── spacing/        # Spacing scale
└── fontFamily/         # Font families
```

## Usage Workflow

### 1. Validate the Tokens

```bash
cd examples/material3
figma-token-sync validate tokens.json
```

Expected output:
```
✓ Valid DTCG JSON structure
✓ All tokens have required $value properties
✓ All $type values are valid
✓ No circular references detected

Summary:
  Total tokens: 144
  Token types: color, dimension, fontFamily
  Collections: 3

✓ tokens.json is valid!
```

### 2. Import to Figma

1. Open your Figma file
2. Run the **Figma Token Sync** plugin
3. Click **Import Tokens**
4. Select `tokens.json`
5. Review the preview showing what will be created:
   - 6 Collections (primary, secondary, tertiary, error, neutral, neutral-variant)
   - 144 Variables total
   - 2 Modes (light, dark) for semantic colors
6. Click **Import**

Result:
```
✓ Created 6 collections
✓ Created 144 variables
✓ Configured 2 modes
```

### 3. Make Changes in Figma

1. Adjust colors in Figma Variables panel
2. Rename variables or collections
3. Add new tonal shades
4. Modify semantic mappings

### 4. Export from Figma

1. Run the **Figma Token Sync** plugin
2. Click **Export Tokens**
3. Save as `tokens-updated.json`

### 5. Compare Changes

```bash
figma-token-sync diff tokens.json tokens-updated.json
```

Example output:
```
Token Diff Summary
==================

Modified: 2 tokens
Added: 3 tokens
Removed: 0 tokens
Unchanged: 139 tokens

Modified Tokens:
─────────────────────────────────────────
  color.primary.40
    - #6750a4
    + #6850a5

  semantic.light.primary
    {color.primary.40} (updated via reference)

Added Tokens:
─────────────────────────────────────────
+ color.primary.45: #745fb0
+ color.primary.55: #8b73c7
+ semantic.light.primary-variant: {color.primary.45}
```

### 6. Convert to Design Language Contract

```bash
figma-token-sync convert tokens.json \
  --from dtcg \
  --to design-language-contract \
  --output material3-contract.json
```

This converts the DTCG format to the aesthetic-agnostic `DesignLanguageContract` pattern used by `@discourser/design-system`.

## Key Features Demonstrated

### ✅ Token References (Aliases)
Semantic colors use references to tonal palettes:
```json
{
  "semantic": {
    "light": {
      "primary": { "$value": "{color.primary.40}" },
      "on-primary": { "$value": "{color.primary.100}" }
    }
  }
}
```

### ✅ Type Inheritance
Group-level `$type` applies to all children:
```json
{
  "color": {
    "$type": "color",
    "primary": {
      "40": { "$value": "#6750a4" }  // Inherits "color" type
    }
  }
}
```

### ✅ Metadata Preservation
Descriptions are preserved through import/export:
```json
{
  "$description": "Primary tonal palette",
  "primary": {
    "40": {
      "$value": "#6750a4",
      "$description": "Primary color for light theme"
    }
  }
}
```

### ✅ Nested Token Groups
Deep nesting organizes tokens logically:
```json
{
  "semantic": {
    "light": {
      "primary-container": { "$value": "..." }
    }
  }
}
```

## Material Design 3 Resources

- [Material Design 3 Specification](https://m3.material.io/)
- [Color System](https://m3.material.io/styles/color/system/overview)
- [Dynamic Color](https://m3.material.io/styles/color/dynamic/overview)
- [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/)

## DTCG Specification

This example follows the [W3C Design Tokens Community Group](https://design-tokens.github.io/community-group/format/) specification:
- Token values use `$value` property
- Token types use `$type` property
- References use `{path.to.token}` syntax
- Groups can have inherited `$type`
- Metadata uses `$description` and `$extensions`

## Next Steps

1. **Customize Colors** - Replace the purple primary palette with your brand colors
2. **Add More Tokens** - Extend with typography scale, elevation, motion tokens
3. **Create Variants** - Add seasonal themes, accessibility themes, or regional variants
4. **Integrate with Code** - Use the exported tokens in your design system implementation
5. **Automate Sync** - Set up CI/CD to validate token changes on every commit
