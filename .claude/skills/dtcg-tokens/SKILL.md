# DTCG/W3C Design Tokens Skill

## Overview

This skill provides knowledge for working with the Design Tokens Community Group (DTCG) format, also known as W3C Design Tokens.

## Specification

The DTCG format is the emerging standard for design token interchange.

**Specification:** https://tr.designtokens.org/format/

## Token Structure

### Basic Token
```json
{
  "color-primary": {
    "$type": "color",
    "$value": "#6750A4",
    "$description": "Primary brand color"
  }
}
```

### Required Properties
- `$value` — The token's value (type depends on `$type`)

### Optional Properties
- `$type` — Token type (inherited from parent group if not specified)
- `$description` — Human-readable description
- `$extensions` — Vendor-specific metadata

## Token Types

### color
```json
{
  "$type": "color",
  "$value": "#FF5733"
}
```

Formats: hex (`#RRGGBB`, `#RRGGBBAA`), named colors

### dimension
```json
{
  "$type": "dimension",
  "$value": "16px"
}
```

Includes unit: `px`, `rem`, `em`, `%`, etc.

### fontFamily
```json
{
  "$type": "fontFamily",
  "$value": ["Inter", "Helvetica", "sans-serif"]
}
```

Array of font names (fallback order).

### fontWeight
```json
{
  "$type": "fontWeight",
  "$value": 500
}
```

Numeric weight (100-900) or keyword.

### duration
```json
{
  "$type": "duration",
  "$value": "200ms"
}
```

Time value with unit (`ms`, `s`).

### cubicBezier
```json
{
  "$type": "cubicBezier",
  "$value": [0.4, 0, 0.2, 1]
}
```

Array of 4 numbers representing bezier control points.

### number
```json
{
  "$type": "number",
  "$value": 1.5
}
```

Unitless numeric value.

### string
```json
{
  "$type": "string",
  "$value": "bold"
}
```

Arbitrary string value.

## Token Groups (Nesting)

```json
{
  "colors": {
    "primary": {
      "$type": "color",
      "50": { "$value": "#F3E5F5" },
      "100": { "$value": "#E1BEE7" },
      "500": { "$value": "#9C27B0" }
    }
  }
}
```

Groups inherit `$type` from parent.

## Token Aliases (References)

```json
{
  "color-background": {
    "$type": "color",
    "$value": "{colors.primary.50}"
  }
}
```

References use curly braces with dot-notation path.

## Extensions

Vendor-specific data in `$extensions`:
```json
{
  "color-brand": {
    "$type": "color",
    "$value": "#6750A4",
    "$extensions": {
      "com.figma": {
        "variableId": "VariableID:123:456",
        "scopes": ["ALL_SCOPES"]
      }
    }
  }
}
```

## Parsing Patterns

### Parse DTCG JSON
```typescript
interface DTCGToken {
  $type?: string;
  $value: unknown;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

interface DTCGTokens {
  [key: string]: DTCGToken | DTCGTokens;
}

function isToken(obj: unknown): obj is DTCGToken {
  return typeof obj === 'object' && obj !== null && '$value' in obj;
}

function walkTokens(
  tokens: DTCGTokens,
  callback: (path: string[], token: DTCGToken) => void,
  path: string[] = []
) {
  for (const [key, value] of Object.entries(tokens)) {
    const currentPath = [...path, key];
    if (isToken(value)) {
      callback(currentPath, value);
    } else if (typeof value === 'object' && value !== null) {
      walkTokens(value as DTCGTokens, callback, currentPath);
    }
  }
}
```

### Resolve References
```typescript
function resolveReference(ref: string, tokens: DTCGTokens): unknown {
  // Parse "{colors.primary.500}" to ["colors", "primary", "500"]
  const path = ref.slice(1, -1).split('.');
  
  let current: unknown = tokens;
  for (const segment of path) {
    if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      throw new Error(`Invalid reference: ${ref}`);
    }
  }
  
  if (isToken(current)) {
    return current.$value;
  }
  
  throw new Error(`Reference does not point to token: ${ref}`);
}
```

## Mapping to Figma Variables

| DTCG Type | Figma Type |
|-----------|------------|
| color | COLOR |
| dimension | FLOAT |
| number | FLOAT |
| string | STRING |
| fontFamily | STRING (joined) |
| fontWeight | FLOAT or STRING |
| duration | STRING |
| cubicBezier | STRING (CSS format) |

## Best Practices

1. **Use type inheritance** — Set `$type` on groups to reduce repetition
2. **Prefer aliases** — Reference other tokens instead of duplicating values
3. **Include descriptions** — Document token purpose for team clarity
4. **Preserve extensions** — Don't lose vendor metadata during transforms
5. **Validate structure** — Ensure all tokens have required `$value`

## References

- [DTCG Specification](https://tr.designtokens.org/format/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
