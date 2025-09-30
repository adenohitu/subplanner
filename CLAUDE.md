# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Subplanner is a subscription management application built with React, TypeScript, and Vite. It uses localStorage for persistence and TanStack Query for state management.

## Commands

- **Development**: `bun run dev` - Start Vite dev server
- **Build**: `bun run build` - Type check with `tsc -b` then build with Vite
- **Test**: `bun test` - Run tests with Bun's test runner
- **Lint**: `bun run lint` - Run ESLint
- **Preview**: `bun run preview` - Preview production build

Note: This project uses **Bun** as the package manager and runtime, not npm or yarn.

## Architecture

### Data Flow
- **State Management**: TanStack Query (`@tanstack/react-query`) manages all subscription data
- **Persistence**: Data is stored in browser localStorage (key: `subscriptions`)
- **Custom Hook**: `useSubscriptions` hook (`src/hooks/useSubscriptions.ts`) provides CRUD operations using TanStack Query mutations
- **Type Safety**: Core `Subscription` type defined in `src/types/subscription.ts`

### Key Components
- **App.tsx**: Root component that sets up QueryClientProvider and composes main UI
- **SubscriptionForm**: Dialog-based form for adding new subscriptions
- **SubscriptionList**: Displays all subscriptions using SubscriptionCard components
- **Summary**: Shows aggregate statistics (total monthly/yearly costs)

### Styling & UI
- **Tailwind CSS v4**: Configured with PostCSS
- **shadcn/ui**: Component library using Radix UI primitives in `src/components/ui/`
- **Path Alias**: `@/` maps to `src/` directory (configured in vite.config.ts)
- **Utilities**: `cn()` function in `src/lib/utils.ts` for conditional classnames

### Data Model
```typescript
interface Subscription {
  id: string
  name: string
  price: number
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  category?: string
  color?: string
}
```

## Development Notes

- The application is client-side only with no backend API
- All mutations in `useSubscriptions` invalidate the `['subscriptions']` query key to trigger re-fetches
- IDs are generated using `crypto.randomUUID()`