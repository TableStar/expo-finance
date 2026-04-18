# Agent Instructions for expo-finance

This document provides guidelines for AI agents working on this codebase.

## Developer Context

- Beginner in React Native/Expo, completed Expo tutorial app.
- Experienced in React, especially React Router v7 framework mode.
- New to mobile databases - using SQLite for local persistence.

## Working Rules

### Code Execution

- **DO NOT** execute write/edit operations on non-`.md` files (`.ts`, `.tsx`, `.json`, etc.) unless explicitly requested.
- If the user wants code written for them, they must say "please" **three times** to authorize execution.
- Default mode: **Plan mode** - provide guidance, explanations, and examples only.

### Build Mode Transition

- **DO NOT** pressure or goad the user into switching to build mode.
- The user will implement code themselves after plans are finalized.
- Only switch to build mode when explicitly requested by the user.
- Act as a **helper and backup executor** when the user is stuck or unmotivated, not as the primary implementer.

## Project Overview

An expense/income tracker app with local-first data storage.

## Project Structure

- `app/`: Expo Router pages using file-based routing.
- `components/`: Reusable UI components (including `nativewindui/` library).
- `lib/`: Utilities (`cn` for className merging, `db` for SQLite operations, `useColorScheme`).
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

- **Components:** `PascalCase` (e.g., `TransactionList`)
- **Functions/Variables:** `camelCase` (e.g., `addTransaction`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `DEFAULT_CURRENCY`)
- **Hooks:** `use` prefix (e.g., `useTransactions`)

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
- Keep UI state separate from persisted data.

### Data Layer

- **SQLite** for local data persistence (`expo-sqlite`).
- Database schema defined in `lib/db/schema.ts`.
- CRUD operations in `lib/db/` with typed queries.
- Keep TanStack Query for potential future API/cloud sync.

### Styling & UI

- Use NativeWind (Tailwind CSS for React Native) with `className` props.
- Use `cn()` utility (`lib/cn.ts`) for conditional className merging.
- Use `class-variance-authority` (cva) for component variants.
- Platform-specific styles: `Platform.select({ ios: ..., android: ... })`
- Functional over fancy - prioritize clarity and usability.

### Error Handling

- Use `try...catch` for operations that may fail (DB queries, async operations).
- Display user-facing errors with `Alert.alert`.

## Key Tools & Libraries

- **NativeWind:** Tailwind CSS for React Native
- **SQLite (expo-sqlite):** Local data persistence
- **TanStack Query:** Data fetching and caching (keep for future cloud sync)
- **Zustand:** Global state management
- **class-variance-authority:** Component variant styling
- **Expo Router:** File-based navigation
- **React Native:** Core UI components
