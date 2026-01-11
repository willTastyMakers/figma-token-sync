# TASK-FTS-002: figma-token-sync Tier 2 — Storybook Addon

**Date:** January 6, 2026  
**Estimated Time:** 6-8 hours (Day 2-3 of integration)  
**Priority:** P1 - Completes bidirectional workflow  
**Depends On:** TASK-DS-001 (Park UI Integration)

---

## Objective

Build a Storybook addon that displays design tokens from `tokens.json`, provides file watching for live updates, and enables export functionality to complete the Figma ↔ Storybook bidirectional sync loop.

---

## Context

### Current State (Tier 1 Complete)

```
┌─────────────────┐         tokens.json              ┌─────────────────┐
│  Figma Plugin   │ ◄───────────────────────────────▶│  CLI Tools      │
│  ✅ COMPLETE    │                                   │  ✅ COMPLETE    │
│  Export/Import  │                                   │  validate/diff  │
└─────────────────┘                                   └─────────────────┘
```

### Target State (Tier 2)

```
┌─────────────────┐         tokens.json              ┌─────────────────┐
│  Figma Plugin   │ ◄───────────────────────────────▶│ Storybook Addon │
│  Export/Import  │                                   │  Token Browser  │
└─────────────────┘                                   │  File Watcher   │
                                                      │  Export Button  │
                                                      └─────────────────┘
```

### Key Insight

The addon needs to work with Storybook 8.x addon architecture:
- **Manager** — Addon panel UI (React)
- **Preview** — Decorators that wrap stories
- **Preset** — Configuration and bundling

---

## Pre-Implementation Checklist

- [ ] Tier 1 complete and all tests passing
- [ ] Storybook 8.x addon docs reviewed
- [ ] Understand `tokens.json` structure from Figma plugin export

---

## Reference: tokens.json Structure

From figma-token-sync Tier 1, the exported tokens.json follows DTCG format:

```json
{
  "$schema": "https://tr.designtokens.org/format/",
  "color": {
    "primary": {
      "1": {
        "$type": "color",
        "$value": "#fbfefc",
        "$description": "Lightest primary background"
      },
      "9": {
        "$type": "color", 
        "$value": "#30a46c",
        "$description": "Primary action color"
      }
    }
  },
  "spacing": {
    "sm": {
      "$type": "dimension",
      "$value": "8px"
    }
  }
}
```

---

## Phase 1: Addon Scaffolding (1.5 hours)

### 1.1 Update Package Structure

**File:** `packages/addon/package.json`

```json
{
  "name": "@figma-token-sync/addon",
  "version": "0.2.0",
  "type": "module",
  "description": "Storybook addon for Figma token sync",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./manager": {
      "types": "./dist/manager.d.ts",
      "import": "./dist/manager.js",
      "require": "./dist/manager.cjs"
    },
    "./preview": {
      "types": "./dist/preview.d.ts",
      "import": "./dist/preview.js",
      "require": "./dist/preview.cjs"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@figma-token-sync/core": "workspace:*",
    "@storybook/components": "^8.5.0",
    "@storybook/manager-api": "^8.5.0",
    "@storybook/theming": "^8.5.0",
    "@storybook/types": "^8.5.0",
    "chokidar": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "react": "^19.0.0",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "storybook": "^8.0.0"
  },
  "keywords": [
    "storybook",
    "addon",
    "figma",
    "design-tokens",
    "dtcg"
  ]
}
```

### 1.2 Create tsup Config

**File:** `packages/addon/tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/manager.tsx',
    'src/preview.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'storybook',
    '@storybook/components',
    '@storybook/manager-api',
    '@storybook/theming',
    '@storybook/types',
  ],
});
```

### 1.3 Create Addon Constants

**File:** `packages/addon/src/constants.ts`

```typescript
export const ADDON_ID = 'figma-token-sync';
export const PANEL_ID = `${ADDON_ID}/panel`;
export const TOOL_ID = `${ADDON_ID}/tool`;

// Events for communication between manager and preview
export const EVENTS = {
  TOKENS_UPDATED: `${ADDON_ID}/tokens-updated`,
  REQUEST_EXPORT: `${ADDON_ID}/request-export`,
  EXPORT_COMPLETE: `${ADDON_ID}/export-complete`,
} as const;
```

---

## Phase 2: Manager Panel (3 hours)

### 2.1 Create Token Tree Component

**File:** `packages/addon/src/components/TokenTree.tsx`

```tsx
import React, { useState, useMemo } from 'react';
import { styled } from '@storybook/theming';
import type { DTCGTokens, DTCGToken } from '@figma-token-sync/core';

interface TokenTreeProps {
  tokens: DTCGTokens;
  searchQuery: string;
  onTokenSelect?: (path: string, token: DTCGToken) => void;
}

const TreeContainer = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  line-height: 1.5;
`;

const TreeNode = styled.div<{ depth: number }>`
  padding-left: ${({ depth }) => depth * 16}px;
`;

const TokenKey = styled.span<{ isGroup: boolean }>`
  color: ${({ theme, isGroup }) => 
    isGroup ? theme.color.secondary : theme.color.defaultText};
  font-weight: ${({ isGroup }) => isGroup ? 600 : 400};
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const TokenValue = styled.span`
  color: ${({ theme }) => theme.color.positive};
  margin-left: 8px;
`;

const TokenType = styled.span`
  color: ${({ theme }) => theme.color.mediumdark};
  margin-left: 8px;
  font-size: 10px;
`;

const ColorSwatch = styled.span<{ color: string }>`
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 2px;
  background-color: ${({ color }) => color};
  border: 1px solid rgba(0, 0, 0, 0.1);
  margin-right: 6px;
  vertical-align: middle;
`;

const ExpandIcon = styled.span<{ expanded: boolean }>`
  display: inline-block;
  width: 16px;
  transform: ${({ expanded }) => expanded ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 0.15s ease;
`;

function isToken(value: unknown): value is DTCGToken {
  return typeof value === 'object' && value !== null && '$type' in value && '$value' in value;
}

function TokenNode({ 
  name, 
  value, 
  path, 
  depth,
  searchQuery,
  onTokenSelect 
}: { 
  name: string;
  value: DTCGToken | DTCGTokens;
  path: string;
  depth: number;
  searchQuery: string;
  onTokenSelect?: (path: string, token: DTCGToken) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  
  const currentPath = path ? `${path}.${name}` : name;
  
  // Filter by search
  const matchesSearch = searchQuery === '' || 
    currentPath.toLowerCase().includes(searchQuery.toLowerCase());

  if (isToken(value)) {
    if (!matchesSearch) return null;
    
    const displayValue = typeof value.$value === 'string' 
      ? value.$value 
      : JSON.stringify(value.$value);
    
    const isColor = value.$type === 'color';
    
    return (
      <TreeNode depth={depth}>
        <TokenKey 
          isGroup={false}
          onClick={() => onTokenSelect?.(currentPath, value)}
        >
          {name}
        </TokenKey>
        <TokenType>[{value.$type}]</TokenType>
        <TokenValue>
          {isColor && <ColorSwatch color={displayValue} />}
          {displayValue}
        </TokenValue>
      </TreeNode>
    );
  }
  
  // It's a group
  const entries = Object.entries(value).filter(([key]) => !key.startsWith('$'));
  
  // Check if any children match search
  const hasMatchingChildren = searchQuery === '' || entries.some(([key, val]) => {
    const childPath = `${currentPath}.${key}`;
    if (isToken(val)) {
      return childPath.toLowerCase().includes(searchQuery.toLowerCase());
    }
    // Recursively check nested groups
    return JSON.stringify(val).toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  if (!hasMatchingChildren && !matchesSearch) return null;
  
  return (
    <TreeNode depth={depth}>
      <TokenKey isGroup onClick={() => setExpanded(!expanded)}>
        <ExpandIcon expanded={expanded}>▶</ExpandIcon>
        {name}
      </TokenKey>
      {expanded && entries.map(([key, val]) => (
        <TokenNode
          key={key}
          name={key}
          value={val as DTCGToken | DTCGTokens}
          path={currentPath}
          depth={depth + 1}
          searchQuery={searchQuery}
          onTokenSelect={onTokenSelect}
        />
      ))}
    </TreeNode>
  );
}

export function TokenTree({ tokens, searchQuery, onTokenSelect }: TokenTreeProps) {
  const entries = useMemo(() => 
    Object.entries(tokens).filter(([key]) => !key.startsWith('$')),
    [tokens]
  );
  
  return (
    <TreeContainer>
      {entries.map(([key, value]) => (
        <TokenNode
          key={key}
          name={key}
          value={value as DTCGToken | DTCGTokens}
          path=""
          depth={0}
          searchQuery={searchQuery}
          onTokenSelect={onTokenSelect}
        />
      ))}
    </TreeContainer>
  );
}
```

### 2.2 Create Token Detail Panel

**File:** `packages/addon/src/components/TokenDetail.tsx`

```tsx
import React from 'react';
import { styled } from '@storybook/theming';
import type { DTCGToken } from '@figma-token-sync/core';

interface TokenDetailProps {
  path: string;
  token: DTCGToken;
  onClose: () => void;
}

const DetailContainer = styled.div`
  padding: 16px;
  border-top: 1px solid ${({ theme }) => theme.appBorderColor};
  background: ${({ theme }) => theme.background.content};
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const DetailTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: ${({ theme }) => theme.color.defaultText};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: ${({ theme }) => theme.color.mediumdark};
  
  &:hover {
    color: ${({ theme }) => theme.color.defaultText};
  }
`;

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 8px;
`;

const DetailLabel = styled.span`
  width: 100px;
  color: ${({ theme }) => theme.color.mediumdark};
  font-size: 12px;
`;

const DetailValue = styled.span`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const ColorPreview = styled.div<{ color: string }>`
  width: 100%;
  height: 60px;
  border-radius: 4px;
  background-color: ${({ color }) => color};
  border: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
`;

const CopyButton = styled.button`
  padding: 4px 8px;
  font-size: 11px;
  background: ${({ theme }) => theme.color.secondary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

export function TokenDetail({ path, token, onClose }: TokenDetailProps) {
  const displayValue = typeof token.$value === 'string' 
    ? token.$value 
    : JSON.stringify(token.$value, null, 2);
  
  const isColor = token.$type === 'color';
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  return (
    <DetailContainer>
      <DetailHeader>
        <DetailTitle>{path}</DetailTitle>
        <CloseButton onClick={onClose}>×</CloseButton>
      </DetailHeader>
      
      {isColor && typeof token.$value === 'string' && (
        <ColorPreview color={token.$value} />
      )}
      
      <DetailRow>
        <DetailLabel>Type</DetailLabel>
        <DetailValue>{token.$type}</DetailValue>
      </DetailRow>
      
      <DetailRow>
        <DetailLabel>Value</DetailLabel>
        <DetailValue>
          {displayValue}
          <CopyButton 
            onClick={() => handleCopy(displayValue)}
            style={{ marginLeft: 8 }}
          >
            Copy
          </CopyButton>
        </DetailValue>
      </DetailRow>
      
      {token.$description && (
        <DetailRow>
          <DetailLabel>Description</DetailLabel>
          <DetailValue>{token.$description}</DetailValue>
        </DetailRow>
      )}
      
      <DetailRow>
        <DetailLabel>CSS Variable</DetailLabel>
        <DetailValue>
          --{path.replace(/\./g, '-')}
          <CopyButton 
            onClick={() => handleCopy(`var(--${path.replace(/\./g, '-')})`)}
            style={{ marginLeft: 8 }}
          >
            Copy
          </CopyButton>
        </DetailValue>
      </DetailRow>
    </DetailContainer>
  );
}
```

### 2.3 Create Main Panel Component

**File:** `packages/addon/src/components/TokenPanel.tsx`

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useChannel, useStorybookState } from '@storybook/manager-api';
import { styled } from '@storybook/theming';
import { IconButton, Icons, Form } from '@storybook/components';
import type { DTCGTokens, DTCGToken } from '@figma-token-sync/core';
import { EVENTS } from '../constants';
import { TokenTree } from './TokenTree';
import { TokenDetail } from './TokenDetail';

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.appBorderColor};
  background: ${({ theme }) => theme.barBg};
`;

const SearchInput = styled(Form.Input)`
  flex: 1;
  max-width: 300px;
`;

const TokenCount = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.color.mediumdark};
`;

const TreeContainer = styled.div`
  flex: 1;
  overflow: auto;
  padding: 12px;
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid ${({ theme }) => theme.appBorderColor};
  background: ${({ theme }) => theme.barBg};
  font-size: 11px;
  color: ${({ theme }) => theme.color.mediumdark};
`;

const StatusIndicator = styled.span<{ connected: boolean }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ connected, theme }) => 
    connected ? theme.color.positive : theme.color.negative};
  margin-right: 6px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => theme.color.mediumdark};
  text-align: center;
  padding: 24px;
`;

interface SelectedToken {
  path: string;
  token: DTCGToken;
}

export function TokenPanel() {
  const [tokens, setTokens] = useState<DTCGTokens | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<SelectedToken | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  
  const emit = useChannel({
    [EVENTS.TOKENS_UPDATED]: (data: { tokens: DTCGTokens; timestamp: string }) => {
      setTokens(data.tokens);
      setLastUpdated(new Date(data.timestamp));
      setIsWatching(true);
    },
  });
  
  const handleExport = useCallback(() => {
    if (tokens) {
      emit(EVENTS.REQUEST_EXPORT, { tokens });
    }
  }, [tokens, emit]);
  
  const handleTokenSelect = useCallback((path: string, token: DTCGToken) => {
    setSelectedToken({ path, token });
  }, []);
  
  const countTokens = useCallback((obj: DTCGTokens): number => {
    let count = 0;
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        if ('$type' in value && '$value' in value) {
          count++;
        } else {
          count += countTokens(value as DTCGTokens);
        }
      }
    }
    return count;
  }, []);
  
  const tokenCount = tokens ? countTokens(tokens) : 0;
  
  if (!tokens) {
    return (
      <PanelContainer>
        <EmptyState>
          <Icons icon="document" style={{ width: 48, height: 48, marginBottom: 16 }} />
          <h3>No tokens loaded</h3>
          <p>
            Place a <code>tokens.json</code> file in your project root,<br />
            or export from Figma using the figma-token-sync plugin.
          </p>
        </EmptyState>
      </PanelContainer>
    );
  }
  
  return (
    <PanelContainer>
      <Toolbar>
        <SearchInput
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        />
        <TokenCount>{tokenCount} tokens</TokenCount>
        <IconButton
          title="Export tokens.json"
          onClick={handleExport}
        >
          <Icons icon="upload" />
        </IconButton>
        <IconButton
          title="Refresh tokens"
          onClick={() => emit(EVENTS.TOKENS_UPDATED, { force: true })}
        >
          <Icons icon="sync" />
        </IconButton>
      </Toolbar>
      
      <TreeContainer>
        <TokenTree
          tokens={tokens}
          searchQuery={searchQuery}
          onTokenSelect={handleTokenSelect}
        />
      </TreeContainer>
      
      {selectedToken && (
        <TokenDetail
          path={selectedToken.path}
          token={selectedToken.token}
          onClose={() => setSelectedToken(null)}
        />
      )}
      
      <StatusBar>
        <span>
          <StatusIndicator connected={isWatching} />
          {isWatching ? 'Watching for changes' : 'Not watching'}
        </span>
        {lastUpdated && (
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        )}
      </StatusBar>
    </PanelContainer>
  );
}
```

### 2.4 Create Manager Entry

**File:** `packages/addon/src/manager.tsx`

```tsx
import React from 'react';
import { addons, types } from '@storybook/manager-api';
import { ADDON_ID, PANEL_ID } from './constants';
import { TokenPanel } from './components/TokenPanel';

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Design Tokens',
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
    render: ({ active }) => (
      active ? <TokenPanel /> : null
    ),
  });
});
```

---

## Phase 3: Preview (File Watcher) (2 hours)

### 3.1 Create Token Loader

**File:** `packages/addon/src/token-loader.ts`

```typescript
import fs from 'fs';
import path from 'path';
import { parseDTCG, type DTCGTokens } from '@figma-token-sync/core';

export interface TokenLoaderOptions {
  tokenPath?: string;
  watch?: boolean;
  onUpdate?: (tokens: DTCGTokens) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_TOKEN_PATHS = [
  'tokens.json',
  'design-tokens.json',
  'src/tokens.json',
  '.tokens/tokens.json',
];

export function findTokenFile(basePath: string): string | null {
  for (const tokenPath of DEFAULT_TOKEN_PATHS) {
    const fullPath = path.join(basePath, tokenPath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

export function loadTokens(tokenPath: string): DTCGTokens {
  const content = fs.readFileSync(tokenPath, 'utf-8');
  return parseDTCG(content);
}

export function createTokenWatcher(
  tokenPath: string,
  onUpdate: (tokens: DTCGTokens) => void,
  onError?: (error: Error) => void
): () => void {
  // Dynamic import for chokidar (ESM compatibility)
  let watcher: any = null;
  
  import('chokidar').then(({ default: chokidar }) => {
    watcher = chokidar.watch(tokenPath, {
      persistent: true,
      ignoreInitial: false,
    });
    
    watcher.on('change', () => {
      try {
        const tokens = loadTokens(tokenPath);
        onUpdate(tokens);
      } catch (error) {
        onError?.(error as Error);
      }
    });
    
    watcher.on('add', () => {
      try {
        const tokens = loadTokens(tokenPath);
        onUpdate(tokens);
      } catch (error) {
        onError?.(error as Error);
      }
    });
    
    watcher.on('error', (error: Error) => {
      onError?.(error);
    });
  });
  
  // Return cleanup function
  return () => {
    watcher?.close();
  };
}
```

### 3.2 Create Preview Decorator

**File:** `packages/addon/src/preview.ts`

```typescript
import { addons } from '@storybook/preview-api';
import type { DTCGTokens } from '@figma-token-sync/core';
import { EVENTS, ADDON_ID } from './constants';

// This runs in the preview iframe
// It receives messages from the manager and can emit events

let currentTokens: DTCGTokens | null = null;

// Channel for communication with manager
const channel = addons.getChannel();

// Listen for token updates from server/watcher
if (typeof window !== 'undefined') {
  // Browser environment - tokens come via channel events
  channel.on(EVENTS.TOKENS_UPDATED, (data: { tokens: DTCGTokens }) => {
    currentTokens = data.tokens;
    applyTokensToDocument(data.tokens);
  });
}

function applyTokensToDocument(tokens: DTCGTokens, prefix = '') {
  const root = document.documentElement;
  
  function processTokens(obj: DTCGTokens, path: string) {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue;
      
      const currentPath = path ? `${path}-${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        if ('$type' in value && '$value' in value) {
          // It's a token
          const cssVar = `--${currentPath}`;
          const cssValue = typeof value.$value === 'string' 
            ? value.$value 
            : String(value.$value);
          root.style.setProperty(cssVar, cssValue);
        } else {
          // It's a group
          processTokens(value as DTCGTokens, currentPath);
        }
      }
    }
  }
  
  processTokens(tokens, prefix);
}

// Export for Storybook preset
export const decorators = [];

export const parameters = {
  [ADDON_ID]: {
    // Default parameters
  },
};
```

### 3.3 Create Preset (for auto-configuration)

**File:** `packages/addon/src/preset.ts`

```typescript
import type { StorybookConfig } from '@storybook/types';
import path from 'path';
import { findTokenFile, loadTokens, createTokenWatcher } from './token-loader';
import { EVENTS } from './constants';

interface PresetOptions {
  tokenPath?: string;
  watch?: boolean;
}

export function managerEntries(entry: string[] = []) {
  return [...entry, require.resolve('./manager')];
}

export function previewAnnotations(entry: string[] = []) {
  return [...entry, require.resolve('./preview')];
}

// Webpack/Vite plugin to inject tokens
export async function viteFinal(config: any, options: PresetOptions) {
  const tokenPath = options.tokenPath || findTokenFile(process.cwd());
  
  if (tokenPath) {
    // Add virtual module with tokens
    config.plugins = config.plugins || [];
    config.plugins.push({
      name: 'figma-token-sync',
      configureServer(server: any) {
        // Watch for token changes and send via WebSocket
        const cleanup = createTokenWatcher(
          tokenPath,
          (tokens) => {
            server.ws.send({
              type: 'custom',
              event: EVENTS.TOKENS_UPDATED,
              data: { tokens, timestamp: new Date().toISOString() },
            });
          },
          (error) => {
            console.error('[figma-token-sync] Error loading tokens:', error);
          }
        );
        
        // Initial load
        try {
          const tokens = loadTokens(tokenPath);
          server.ws.send({
            type: 'custom',
            event: EVENTS.TOKENS_UPDATED,
            data: { tokens, timestamp: new Date().toISOString() },
          });
        } catch (error) {
          console.error('[figma-token-sync] Initial token load failed:', error);
        }
        
        server.httpServer?.on('close', cleanup);
      },
    });
  }
  
  return config;
}
```

### 3.4 Create Main Entry

**File:** `packages/addon/src/index.ts`

```typescript
// Re-export everything
export * from './constants';
export * from './token-loader';
export * from './components/TokenTree';
export * from './components/TokenDetail';
export * from './components/TokenPanel';

// Re-export types
export type { DTCGTokens, DTCGToken } from '@figma-token-sync/core';
```

---

## Phase 4: Export Functionality (1 hour)

### 4.1 Add Export Handler to Manager

**File:** `packages/addon/src/components/ExportHandler.tsx`

```tsx
import { useEffect } from 'react';
import { useChannel } from '@storybook/manager-api';
import { serializeDTCG, type DTCGTokens } from '@figma-token-sync/core';
import { EVENTS } from '../constants';

export function ExportHandler() {
  const emit = useChannel({
    [EVENTS.REQUEST_EXPORT]: ({ tokens }: { tokens: DTCGTokens }) => {
      handleExport(tokens);
    },
  });
  
  function handleExport(tokens: DTCGTokens) {
    try {
      const json = serializeDTCG(tokens);
      
      // Create download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tokens.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      emit(EVENTS.EXPORT_COMPLETE, { success: true });
    } catch (error) {
      emit(EVENTS.EXPORT_COMPLETE, { success: false, error: String(error) });
    }
  }
  
  return null;
}
```

### 4.2 Update Manager to Include Export Handler

Update `packages/addon/src/manager.tsx`:

```tsx
import React from 'react';
import { addons, types } from '@storybook/manager-api';
import { ADDON_ID, PANEL_ID } from './constants';
import { TokenPanel } from './components/TokenPanel';
import { ExportHandler } from './components/ExportHandler';

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Design Tokens',
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
    render: ({ active }) => (
      <>
        <ExportHandler />
        {active ? <TokenPanel /> : null}
      </>
    ),
  });
});
```

---

## Phase 5: Integration Testing (1 hour)

### 5.1 Test in Discourser-Design-System

1. Add addon to Storybook config:

**File:** `Discourser-Design-System/.storybook/main.ts`

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@figma-token-sync/addon',  // Add this
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

2. Create a test `tokens.json` in the root:

```json
{
  "$schema": "https://tr.designtokens.org/format/",
  "color": {
    "primary": {
      "9": {
        "$type": "color",
        "$value": "#3F6900",
        "$description": "Primary action color"
      }
    }
  }
}
```

3. Start Storybook and verify:
   - Panel appears in addon bar
   - Tokens display in tree
   - Search works
   - Export downloads file

### 5.2 Test File Watcher

1. Start Storybook
2. Edit `tokens.json` manually
3. Verify panel updates automatically
4. Check console for any errors

---

## Phase 6: Documentation (30 min)

### 6.1 Update Package README

**File:** `packages/addon/README.md`

```markdown
# @figma-token-sync/addon

Storybook addon for visualizing and syncing design tokens with Figma.

## Installation

\`\`\`bash
pnpm add -D @figma-token-sync/addon
\`\`\`

## Setup

Add to your Storybook configuration:

\`\`\`typescript
// .storybook/main.ts
export default {
  addons: ['@figma-token-sync/addon'],
};
\`\`\`

## Features

- **Token Browser**: View all tokens in a searchable tree
- **Live Updates**: File watcher detects changes to tokens.json
- **Export**: Download tokens.json for Figma plugin import
- **Color Preview**: Visual swatches for color tokens
- **Copy Values**: One-click copy for values and CSS variables

## Usage with Figma

1. Export tokens from Figma using figma-token-sync plugin
2. Place `tokens.json` in your project root
3. View tokens in Storybook panel
4. Edit tokens in Storybook → Export → Import to Figma

## Configuration

\`\`\`typescript
// .storybook/main.ts
export default {
  addons: [
    {
      name: '@figma-token-sync/addon',
      options: {
        tokenPath: './design-tokens/tokens.json',
        watch: true,
      },
    },
  ],
};
\`\`\`

## License

MIT
\`\`\`

---

## Success Criteria

| Criterion | Target |
|-----------|--------|
| Build passes | ✅ Zero errors |
| Panel renders | ✅ Shows in Storybook addon bar |
| Token tree displays | ✅ All tokens from tokens.json |
| Search works | ✅ Filters tokens by path |
| File watcher works | ✅ Updates on tokens.json change |
| Export works | ✅ Downloads valid tokens.json |
| Works in Discourser-Design-System | ✅ Integration verified |

---

## Files Created/Modified Summary

### New Files in `packages/addon/`
- `src/constants.ts`
- `src/token-loader.ts`
- `src/components/TokenTree.tsx`
- `src/components/TokenDetail.tsx`
- `src/components/TokenPanel.tsx`
- `src/components/ExportHandler.tsx`
- `src/manager.tsx`
- `src/preview.ts`
- `src/preset.ts`
- `src/index.ts`
- `tsup.config.ts`
- `README.md`

### Modified Files
- `package.json` (dependencies, scripts)

---

## Notes for Claude Code

1. **Storybook 8 addon architecture** is different from v7 - use `@storybook/manager-api`
2. **chokidar** is used for file watching - it's ESM compatible
3. **Channel events** are how manager and preview communicate
4. **Virtual modules** in Vite preset inject tokens at build time
5. Test with real `tokens.json` from figma-token-sync Tier 1 export

---

*End of Task Document*
