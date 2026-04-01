## DDS Variable Collections (updated)

| Collection | ID | Modes | Purpose |
|---|---|---|---|
| Primitives | VariableCollectionId:752:5202 | Value | Tonal palette (primary/0–90) |
| Semantic | VariableCollectionId:752:5281 | Light / Dark | M3 semantic tokens |
| Spacing & Shape | VariableCollectionId:752:5316 | Value | Spacing, radii, border |
| Typography | (set after first import) | Value | Font size, weight, line height, letter spacing, family |

## Typography in Figma

### Variable naming (Typography collection)
- `Font/Size/{scaleName}` — FLOAT, raw pixels
- `Font/LineHeight/{scaleName}` — FLOAT, raw pixels
- `Font/Weight/{scaleName}` — FLOAT, numeric weight
- `Font/LetterSpacing/{scaleName}` — FLOAT, raw pixels
- `Font/Family/{scaleName}` — STRING, primary font name only
- `Font/Family/display` — STRING → "Fraunces"
- `Font/Family/body` — STRING → "Poppins"
- `Font/Family/mono` — STRING → "JetBrains Mono"

### Text style naming
Slash hierarchy: `{Category}/{Size}` — e.g. `Display/Large`, `Body/Medium`

Full list:
- Display/Large, Display/Medium, Display/Small
- Headline/Large, Headline/Medium, Headline/Small
- Title/Large, Title/Medium, Title/Small
- Body/Large, Body/Medium, Body/Small
- Label/Large, Label/Medium, Label/Small

### Text style descriptions (semantic bridge)
Every text style description follows this format exactly:
`token: typography.scale.{scaleName}`

e.g. `Display/Large` → description: `token: typography.scale.displayLarge`

### How to read typography from Figma (for consuming agents)

When reading a text node via Figma MCP:
1. Read the node's `textStyleId`
2. Get the text style by ID
3. Read `style.description` — it contains `token: typography.scale.{name}`
4. Extract the token name (e.g. `typography.scale.displayLarge`)
5. Look up that path in the DDS contract or NPM package
6. Use the full TypeStyle object from the DDS — do NOT reproduce raw pixel values

This is the correct fidelity pattern. Never hardcode `57px` or `Fraunces Bold`
in a consuming app — always resolve through the token name to the DDS.

### Typography quick reference (contract → Figma)

| Contract key | Text Style name | Font | Size | Weight |
|---|---|---|---|---|
| displayLarge | Display/Large | Fraunces Regular | 57 | 400 |
| displayMedium | Display/Medium | Fraunces Regular | 45 | 400 |
| displaySmall | Display/Small | Fraunces Regular | 36 | 400 |
| headlineLarge | Headline/Large | Fraunces Regular | 32 | 400 |
| headlineMedium | Headline/Medium | Fraunces Regular | 28 | 400 |
| headlineSmall | Headline/Small | Fraunces Regular | 24 | 400 |
| titleLarge | Title/Large | Poppins Medium | 22 | 500 |
| titleMedium | Title/Medium | Poppins Medium | 16 | 500 |
| titleSmall | Title/Small | Poppins Medium | 14 | 500 |
| bodyLarge | Body/Large | Poppins Regular | 18 | 400 |
| bodyMedium | Body/Medium | Poppins Regular | 14 | 400 |
| bodySmall | Body/Small | Poppins Regular | 12 | 400 |
| labelLarge | Label/Large | Poppins Medium | 14 | 500 |
| labelMedium | Label/Medium | Poppins Medium | 12 | 500 |
| labelSmall | Label/Small | Poppins Medium | 11 | 500 |
