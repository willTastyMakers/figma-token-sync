# Implement Figma API Client

Implement the Figma Variables REST API client in packages/core.

## Steps

1. Read `.claude/skills/figma-api/SKILL.md` for API details
2. Implement `packages/core/src/api/figma-client.ts`:
   - `fetchFigmaVariables(fileKey, accessToken)` — GET endpoint
   - `pushToFigma(fileKey, accessToken, variables)` — POST endpoint
3. Add error handling for API responses
4. Add retry logic with exponential backoff
5. Write unit tests with mocked responses

## Validation

- [ ] Functions compile without errors
- [ ] Error cases are handled (401, 403, 404, 429)
- [ ] Tests pass with mocked API responses
