# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Sui blockchain dApp built with React, TypeScript, and Vite. It uses `@mysten/dapp-kit` for Sui wallet integration and blockchain interactions.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint
```

## Architecture

### Provider Hierarchy

The application is wrapped in a specific provider hierarchy (src/main.tsx:16-29):
1. `Theme` (Radix UI) - Dark mode by default
2. `QueryClientProvider` (React Query) - For data fetching
3. `SuiClientProvider` - Configures Sui network (devnet, testnet, mainnet)
4. `WalletProvider` - Handles wallet connections with autoConnect
5. `BrowserRouter` - Client-side routing

### Network Configuration

Sui network configuration is centralized in src/networkConfig.ts. It exports:
- `networkConfig` - Network endpoints for devnet, testnet, mainnet
- `useNetworkVariable` - Hook for network-specific values
- `useNetworkVariables` - Hook for multiple network variables

Default network is testnet (src/main.tsx:20).

### Routing Structure

Routes are defined in src/App.tsx using React Router:
- `/` - HomePage with wallet status and owned objects
- `/test` - TestPage (example/template page)

New pages should be created in `src/pages/` and follow the same pattern.

### Key Components

- **WalletStatus** (src/WalletStatus.tsx) - Displays connected wallet address and shows OwnedObjects
- **OwnedObjects** (src/OwnedObjects.tsx) - Queries and displays Sui objects owned by connected wallet using `useSuiClientQuery`

### Sui dApp Kit Hooks

Common patterns for Sui interactions:
- `useCurrentAccount()` - Get connected wallet account
- `useSuiClientQuery()` - Query Sui blockchain data with React Query integration

### Styling

- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- Radix UI components for base UI
- shadcn/ui components in `src/components/ui/` (New York style)
- Path alias `@/*` maps to `src/*`

### TypeScript Configuration

- Strict mode enabled
- Path mapping: `@/*` → `src/*`
- React JSX transform
- Bundler module resolution