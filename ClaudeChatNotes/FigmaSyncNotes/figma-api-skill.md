## Text Styles

### Critical Limitation
`setBoundVariable` on TextStyle is NOT supported in the Figma Plugin API.
Font properties (fontSize, fontWeight, lineHeight, letterSpacing) cannot be
programmatically bound to variables on a text style. They must be set as raw
values. Variable binding to text styles must be done manually in Figma UI.

### Font Must Be Loaded First
Always call `figma.loadFontAsync` before setting any font property.
Figma will throw synchronously if the font is not loaded.

### Creating a Single Text Style
```typescript
async function createTextStyle(
  name: string,           // e.g. 'Display/Large' — slash creates hierarchy
  fontFamily: string,     // e.g. 'Fraunces' — primary name only, no CSS stack
  fontStyle: string,      // e.g. 'Regular', 'Medium', 'Bold' — must match Figma exactly
  fontSize: number,       // raw number, no units
  lineHeight: number,     // raw number in pixels
  letterSpacing: number,  // raw number in pixels
  description: string     // always: 'token: typography.scale.{scaleName}'
): Promise<TextStyle> {
  await figma.loadFontAsync({ family: fontFamily, style: fontStyle });

  const style = figma.createTextStyle();
  style.name = name;
  style.fontName = { family: fontFamily, style: fontStyle };
  style.fontSize = fontSize;
  style.lineHeight = { value: lineHeight, unit: 'PIXELS' };
  style.letterSpacing = { value: letterSpacing, unit: 'PIXELS' };
  style.description = description;
  return style;
}
```

### Font Weight → Figma Font Style Name Mapping
Figma uses named font styles, not numeric weights. The mapping must be checked
against available fonts using `figma.listAvailableFontsAsync()` — never hardcode.
Common mapping for reference only (actual names vary by typeface):

| Weight Value | Typical Figma Style Name |
|---|---|
| 100 | Thin |
| 300 | Light |
| 400 | Regular |
| 500 | Medium |
| 600 | SemiBold |
| 700 | Bold |
| 800 | ExtraBold |
| 900 | Black |

Always discover available styles rather than assuming:
```typescript
async function getFontStyleForWeight(
  family: string, 
  weight: number
): Promise<string> {
  const allFonts = await figma.listAvailableFontsAsync();
  const familyFonts = allFonts.filter(f => f.fontName.family === family);
  // Map weight to style name by checking available styles
  // Fall back to 'Regular' if preferred weight not available
}
```

### Creating a Full Type Ramp (idempotent)
```typescript
async function createTypeRamp(defs: Array<{
  name: string;
  fontFamily: string;
  fontStyle: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  tokenPath: string; // e.g. 'typography.scale.displayLarge'
}>): Promise<{ created: string[], skipped: string[] }> {
  // Load all unique fonts first
  const uniqueFonts = new Set(defs.map(d => 
    JSON.stringify({ family: d.fontFamily, style: d.fontStyle })
  ));
  await Promise.all(
    [...uniqueFonts].map(f => figma.loadFontAsync(JSON.parse(f)))
  );

  // Get existing styles to support idempotency
  const existing = new Set(
    (await figma.getLocalTextStylesAsync()).map(s => s.name)
  );

  const created: string[] = [];
  const skipped: string[] = [];

  for (const def of defs) {
    if (existing.has(def.name)) {
      skipped.push(def.name);
      continue;
    }
    const style = figma.createTextStyle();
    style.name = def.name;
    style.fontName = { family: def.fontFamily, style: def.fontStyle };
    style.fontSize = def.fontSize;
    style.lineHeight = { value: def.lineHeight, unit: 'PIXELS' };
    style.letterSpacing = { value: def.letterSpacing, unit: 'PIXELS' };
    style.description = `token: ${def.tokenPath}`;
    created.push(def.name);
  }
  return { created, skipped };
}
```

### Listing Text Styles (for export/audit)
```typescript
const styles = await figma.getLocalTextStylesAsync();
const result = styles.map(s => ({
  id: s.id,
  name: s.name,
  description: s.description, // contains 'token: typography.scale.*'
  fontSize: s.fontSize,
  fontName: s.fontName,
  lineHeight: s.lineHeight,
  letterSpacing: s.letterSpacing,
}));
```
