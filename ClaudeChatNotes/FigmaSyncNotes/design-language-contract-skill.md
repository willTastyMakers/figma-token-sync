## Mapping to Figma Variables

| Contract Section | Figma Collection | Figma Type | Notes |
|-----------------|------------------|------------|-------|
| `colors.*` | Primitives | COLOR | Tonal palette hex values |
| `semantic.*` | Semantic | COLOR | Aliases to Primitives |
| `spacing.*` | Spacing & Shape | FLOAT | Strip 'px', store raw number |
| `shape.radii.*` | Spacing & Shape | FLOAT | Strip 'px', store raw number |
| `typography.fonts.*` | Typography | STRING | Primary font name only — strip CSS fallback stack |
| `typography.scale.*.fontSize` | Typography | FLOAT | Strip 'px', store raw number |
| `typography.scale.*.lineHeight` | Typography | FLOAT | Strip 'px', store raw number |
| `typography.scale.*.fontWeight` | Typography | FLOAT | Store as number (400, 500, 700) |
| `typography.scale.*.letterSpacing` | Typography | FLOAT | Strip 'px', store raw number |
| `typography.scale.*.fontFamily` | Typography | STRING | Resolve alias ('display'→fonts.display primary name) |
| `elevation.*` | — (not in Figma) | — | Code only |
| `motion.*` | — (not in Figma) | — | Code only |

## Typography → Figma: The Two-Step Pattern

Figma cannot receive a DTCG composite typography token as a Variable. The correct
pattern is two separate steps that Claude Code must always apply together:

### Step 1: Primitive Variables (Typography collection)

Each property of each type scale step becomes its own flat variable.
Naming convention: `Font/{Property}/{ScaleStep}`

Example output for `displayLarge`:
- `Font/Size/displayLarge` → FLOAT → 57
- `Font/LineHeight/displayLarge` → FLOAT → 64
- `Font/Weight/displayLarge` → FLOAT → 400
- `Font/LetterSpacing/displayLarge` → FLOAT → -0.25
- `Font/Family/displayLarge` → STRING → "Fraunces"

Font family alias resolution:
- `'display'` → extract primary name from `fonts.display` CSS stack
- `'body'` → extract primary name from `fonts.body` CSS stack
- `'mono'` → extract primary name from `fonts.mono` CSS stack

CSS font stack stripping — always take the first font name only:
```typescript
function extractPrimaryFont(cssStack: string): string {
  // '"Fraunces", Georgia, serif' → 'Fraunces'
  const first = cssStack.split(',')[0].trim();
  return first.replace(/['"]/g, '');
}
```

Unit stripping — always store raw numbers in Figma variables:
```typescript
function stripPx(value: string): number {
  return parseFloat(value.replace('px', ''));
}
```

### Step 2: Text Styles with token name in description

`setBoundVariable` on TextStyle is NOT supported in the Figma Plugin API.
Variables cannot be programmatically bound to text style properties.

The bridge is the text style **description field** — store the contract token
path there so any agent reading Figma can resolve back to the design system.

Text style naming convention: `{Category}/{Scale}` using slash hierarchy
e.g. `Display/Large`, `Body/Medium`, `Label/Small`

Description format (always use this exact format):
`token: typography.scale.{scaleName}`

Example: A text style named `Display/Large` gets description:
`token: typography.scale.displayLarge`

This description is the semantic bridge between Figma and your consuming app.
When a Figma MCP agent reads a text node, it reads the style description to
get the contract token name, then looks up the full type style in the DDS.

### What this means for the transform pipeline

`contract-to-dtcg` for typography must output **flat primitive tokens**, not
composite DTCG typography tokens. The composite format is spec-compliant but
Figma cannot receive it as variables.

Output structure for token file:
```json
{
  "Font": {
    "Size": {
      "displayLarge": { "$type": "number", "$value": 57 },
      "bodyMedium": { "$type": "number", "$value": 14 }
    },
    "LineHeight": {
      "displayLarge": { "$type": "number", "$value": 64 }
    },
    "Weight": {
      "displayLarge": { "$type": "number", "$value": 400 }
    },
    "LetterSpacing": {
      "displayLarge": { "$type": "number", "$value": -0.25 }
    },
    "Family": {
      "displayLarge": { "$type": "string", "$value": "Fraunces" },
      "display": { "$type": "string", "$value": "Fraunces" },
      "body": { "$type": "string", "$value": "Poppins" },
      "mono": { "$type": "string", "$value": "JetBrains Mono" }
    }
  }
}
```
