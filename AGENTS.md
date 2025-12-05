# Agent Instructions for expo-weather

This document provides guidelines for AI agents working on this codebase.

## Developer Context
- Beginner in React Native/Expo, completed Expo tutorial app.
- Experienced in React, especially React Router v7 framework mode.

## Project Structure
- `app/`: Expo Router pages using file-based routing.
- `components/`: Reusable UI components (including `nativewindui/` library).
- `lib/`: Utilities (`cn` for className merging, `queryFn` for API calls, `useColorScheme`).
- `store/`: Zustand state management stores.
- `theme/`: NativeWind theme configuration and colors.
- `types/`: TypeScript type definitions.

## Package Manager & Commands
- **Package Manager:** `pnpm`
- **Lint:** `pnpm lint` (ESLint with `eslint-config-expo` + Prettier check)
- **Format:** `pnpm format` (ESLint fix + Prettier write)
- **Build:** `pnpm build:dev`, `pnpm build:preview`, `pnpm build:prod`
- **Start:** `pnpm start` (Expo dev client)
- **Test:** No dedicated test command or test suite exists.

## Code Style Guidelines

### Formatting & Linting
- **Print Width:** 100 chars, **Tab Width:** 2 spaces, **Quotes:** Single quotes
- **Trailing Comma:** `es5`, **Bracket Spacing:** `bracketSameLine: true`
- Use `pnpm format` to apply formatting, `pnpm lint` to check errors.
- ESLint config: `eslint-config-expo` with custom rules in `eslint.config.js`.

### Naming Conventions
- **Components:** `PascalCase` (e.g., `SearchInput`)
- **Functions/Variables:** `camelCase` (e.g., `fetchCitySuggestions`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `API_KEY`)
- **Hooks:** `use` prefix (e.g., `useDebounce`)

### Imports & Path Aliases
- Group imports: external libraries first, then internal.
- Use `@/` path alias (maps to root) for internal imports: `import { cn } from '@/lib/cn';`
- Import React as: `import * as React from 'react';`

### TypeScript
- Strict mode enabled (`tsconfig.json`).
- Use `type` aliases over `interface` where possible.
- All component props must be typed explicitly.

### State Management
- Use Zustand stores defined in `store/` directory.
- Define store interfaces in corresponding type files.

### Styling & UI
- Use NativeWind (Tailwind CSS for React Native) with `className` props.
- Use `cn()` utility (`lib/cn.ts`) for conditional className merging.
- Use `class-variance-authority` (cva) for component variants.
- Platform-specific styles: `Platform.select({ ios: ..., android: ... })`

### Error Handling
- Use `try...catch` for operations that may fail (API calls, async operations).
- Display user-facing errors with `Alert.alert`.

## Key Tools & Libraries
- **NativeWind:** Tailwind CSS for React Native
- **TanStack Query:** Data fetching and caching (`useQuery`, `queryFn`)
- **Zustand:** Global state management
- **class-variance-authority:** Component variant styling
- **Expo Router:** File-based navigation
- **React Native:** Core UI components
