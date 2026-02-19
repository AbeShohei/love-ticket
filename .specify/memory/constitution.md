# Love Ticket - Project Constitution

## Overview
Love Ticket is a dating/couple app built with React Native/Expo, designed to help couples plan dates and discover shared interests.

## Technology Stack

### Core
- **Framework**: Expo SDK 54+ with React Native
- **Language**: TypeScript
- **Routing**: Expo Router (file-based routing)
- **State Management**: Zustand

### Backend Services
- **Authentication**: Clerk (replacing Supabase Auth)
- **Database**: Convex (real-time, serverless)
- **Monetization**: RevenueCat (subscription management)

### UI/UX
- **Icons**: Lucide React Native
- **Styling**: React Native StyleSheet
- **Haptics**: Expo Haptics for feedback

## Architectural Principles

### 1. Clean Separation of Concerns
- `providers/` - React Context providers (Auth, Theme, etc.)
- `stores/` - Zustand state stores
- `lib/` - External service clients and utilities
- `components/` - Reusable UI components
- `app/` - Route screens (Expo Router)
- `types/` - TypeScript definitions

### 2. Authentication Flow (Clerk)
- Use `@clerk/clerk-expo` for React Native
- Support email/password, social logins (Google, Apple)
- Secure token storage with expo-secure-store
- Protected routes via Clerk's signed-in middleware

### 3. Data Layer (Convex)
- Schema defined in `convex/schema.ts`
- Queries for reads, Mutations for writes
- Real-time subscriptions for live updates
- Authentication integrated via Clerk JWT

### 4. Couple-Centric Features
- Pairing via invite codes
- Shared proposals (date ideas)
- Swipe-based matching system
- Joint scheduling/calendar

### 5. Subscription Model (RevenueCat)
- Free tier with daily limits
- Premium tier with unlimited access
- Entitlements managed via RevenueCat dashboard
- Paywall shown after onboarding completion

## Code Style Guidelines

### TypeScript
- Strict mode enabled
- Prefer interfaces for object shapes
- Use type unions for variants (e.g., `type Status = 'pending' | 'active' | 'completed'`)

### React Native
- Functional components with hooks
- Avoid inline styles; use `StyleSheet.create()`
- Platform-specific code via `Platform.OS` or `.ios.tsx`/`.android.tsx` extensions

### Naming Conventions
- Components: PascalCase (`UserProfile.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Stores: `use[Domain]Store` (`useSwipeStore`)
- Providers: `[Domain]Provider` (`AuthProvider`)

## Development Workflow
1. Start with specification (spec.md)
2. Create technical plan (plan.md)
3. Generate tasks (tasks.md)
4. Implement incrementally with testing

## Quality Standards
- No `any` types without justification
- Handle loading and error states
- Test on both iOS and Android before release
- Japanese as primary language for UI text
