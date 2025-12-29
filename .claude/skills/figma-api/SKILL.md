# Figma Variables REST API Skill

## Overview

This skill provides knowledge for working with Figma's Variables REST API to read and write design tokens.

## API Endpoints

### Base URL
```
https://api.figma.com
```

### Authentication
```
Header: X-Figma-Token: <personal_access_token>
```

Environment variable: `FIGMA_ACCESS_TOKEN`

### GET Variables
```
GET /v1/files/:file_key/variables/local
```

Returns all local variables and collections in a Figma file.

**Response Structure:**
```typescript
{
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
}
```

### POST Variables
```
POST /v1/files/:file_key/variables
```

Create, update, or delete variables.

**Request Body:**
```typescript
{
  variableCollections?: VariableCollectionCreate[];
  variableModes?: VariableModeCreate[];
  variables?: VariableCreate[];
  variableModeValues?: VariableModeValueCreate[];
}
```

## Variable Types

Figma supports these variable types:
- `BOOLEAN` — true/false values
- `FLOAT` — numeric values (maps to dimensions, numbers)
- `STRING` — text values
- `COLOR` — RGBA color objects `{ r, g, b, a }` (0-1 range)

## Variable References (Aliases)

Variables can reference other variables:
```typescript
{ type: 'VARIABLE_ALIAS', id: 'VariableID:123:456' }
```

## Collections and Modes

- **Collections** — Groups of related variables (e.g., "Primitives", "Semantic")
- **Modes** — Variants within a collection (e.g., "Light", "Dark")

Each variable has values for each mode:
```typescript
valuesByMode: {
  "modeId1": "#FF0000",  // Light mode
  "modeId2": "#CC0000"   // Dark mode
}
```

## Rate Limits

- Be mindful of Figma's rate limits
- Implement exponential backoff for retries
- Batch operations when possible

## Error Handling

Common error responses:
- `401` — Invalid or missing access token
- `403` — No access to the file
- `404` — File not found
- `429` — Rate limited

## Best Practices

1. **Cache the access token** — Don't hardcode, use environment variables
2. **Validate responses** — Check `status` and `error` fields
3. **Handle aliases** — Resolve variable references when needed
4. **Preserve metadata** — Keep `description`, `scopes`, `codeSyntax`
5. **Batch updates** — Use single POST with multiple operations

## Code Patterns

### Fetch Variables
```typescript
async function fetchFigmaVariables(fileKey: string, accessToken: string) {
  const response = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/variables/local`,
    {
      headers: {
        'X-Figma-Token': accessToken,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status}`);
  }
  
  return response.json();
}
```

### Color Conversion
```typescript
// Figma uses 0-1 range, hex uses 0-255
function figmaColorToHex(color: { r: number; g: number; b: number; a: number }): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function hexToFigmaColor(hex: string): { r: number; g: number; b: number; a: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b, a: 1 };
}
```

## References

- [Figma Variables API Documentation](https://www.figma.com/developers/api#variables)
- [Figma API Changelog](https://www.figma.com/developers/api#changelog)
