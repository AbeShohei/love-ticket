# Tasks: Clerk + Convex Integration

## Phase 1: Clerk Authentication Setup

### US-1: User Registration

- [ ] **T1.1** Install Clerk package
  ```bash
  npx expo install @clerk/clerk-expo
  ```
  File: `package.json`

- [ ] **T1.2** Create Clerk account and get API keys
  - Go to https://dashboard.clerk.com
  - Create new application
  - Copy Publishable Key
  - Add to `.env`

- [ ] **T1.3** Configure environment variables
  File: `.env`
  ```env
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
  ```

- [ ] **T1.4** Add ClerkProvider to root layout
  File: `app/_layout.tsx`
  - Import ClerkProvider
  - Wrap app with ClerkProvider
  - Pass publishableKey from env

- [ ] **T1.5** Update AuthProvider to use Clerk
  File: `providers/AuthProvider.tsx`
  - Import Clerk hooks (useUser, useClerk)
  - Replace dummy user with Clerk user
  - Implement real signIn/signUp/signOut

- [ ] **T1.6** Implement register screen with Clerk
  File: `app/register.tsx`
  - Use Clerk's signUp
  - Handle email verification
  - Collect display name

- [ ] **T1.7** Implement login screen with Clerk
  File: `app/login.tsx`
  - Use Clerk's signIn
  - Handle errors properly
  - Navigate on success

- [ ] **T1.8** Add Google OAuth
  File: `app/login.tsx`, `app/register.tsx`
  - Enable Google in Clerk dashboard
  - Add Google sign-in button
  - Handle OAuth callback

- [ ] **T1.9** Add Apple OAuth (iOS)
  File: `app/login.tsx`, `app/register.tsx`
  - Enable Apple in Clerk dashboard
  - Add Apple sign-in button
  - Test on iOS device

- [ ] **T1.10** Implement protected route middleware
  File: `app/_layout.tsx`
  - Check isSignedIn status
  - Redirect to login if not signed in

---

## Phase 2: Convex Database Setup

### US-3: Couple Pairing / US-5: Swipe Recording

- [ ] **T2.1** Install Convex package
  ```bash
  npm install convex
  ```

- [ ] **T2.2** Initialize Convex project
  ```bash
  npx convex dev
  ```
  - Creates `convex/` directory
  - Generates `_generated/` files
  - Creates `convex.json` config

- [ ] **T2.3** Define database schema
  File: `convex/schema.ts` (new)
  ```typescript
  // Define users, couples, proposals, swipes, matches, dailyUsage tables
  ```

- [ ] **T2.4** Create users module
  File: `convex/users.ts` (new)
  - `getByClerkId` query
  - `create` mutation
  - `updateProfile` mutation
  - `getByCoupleId` query

- [ ] **T2.5** Create couples module
  File: `convex/couples.ts` (new)
  - `getByInviteCode` query
  - `getMyCouple` query
  - `create` mutation
  - `join` mutation

- [ ] **T2.6** Create proposals module
  File: `convex/proposals.ts` (new)
  - `getForCouple` query
  - `getPresets` query
  - `create` mutation

- [ ] **T2.7** Create swipes module
  File: `convex/swipes.ts` (new)
  - `getHistory` query
  - `create` mutation
  - `checkMatch` internal mutation

- [ ] **T2.8** Create matches module
  File: `convex/matches.ts` (new)
  - `getForCouple` query
  - `createFromMutualSwipe` mutation
  - `complete` mutation

- [ ] **T2.9** Create dailyUsage module
  File: `convex/dailyUsage.ts` (new)
  - `getToday` query
  - `increment` mutation
  - `checkLimit` query

- [ ] **T2.10** Add ConvexProvider to root layout
  File: `app/_layout.tsx`
  - Import ConvexProvider
  - Wrap app with ConvexProvider
  - Pass URL from env

---

## Phase 3: Clerk-Convex User Sync

### US-4: Profile Management

- [ ] **T3.1** Create useUserSync hook
  File: `hooks/useUserSync.ts` (new)
  - Listen to Clerk user changes
  - Create/update Convex user on sign-in
  - Return combined user data

- [ ] **T3.2** Update AuthProvider with sync
  File: `providers/AuthProvider.tsx`
  - Use useUserSync hook
  - Provide Convex user in context
  - Handle loading states

- [ ] **T3.3** Create profile update function
  File: `providers/AuthProvider.tsx`
  - Update display name in Convex
  - Update avatar URL in Convex
  - Sync with Clerk metadata

- [ ] **T3.4** Test full auth flow
  - Sign up new user → Convex user created
  - Sign in existing user → Convex user fetched
  - Sign out → State cleared

---

## Phase 4: Feature Migration

### US-3: Couple Pairing

- [ ] **T4.1** Migrate pairing - create couple
  File: `app/pairing.tsx`
  - Replace mock with Convex mutation
  - Use `api.couples.create`
  - Store invite code

- [ ] **T4.2** Migrate pairing - join couple
  File: `app/pairing.tsx`
  - Replace mock with Convex query + mutation
  - Use `api.couples.getByInviteCode`
  - Use `api.couples.join`

- [ ] **T4.3** Add real-time couple status
  File: `app/pairing.tsx`
  - Subscribe to couple changes
  - Update UI when partner joins

### US-5: Swipe Recording

- [ ] **T4.4** Migrate swipe recording
  File: `app/(tabs)/index.tsx`
  - Replace mock with Convex mutation
  - Use `api.swipes.create`
  - Record direction and proposal ID

- [ ] **T4.5** Implement daily usage limits
  File: `app/(tabs)/index.tsx`
  - Query `api.dailyUsage.getToday`
  - Check limits before swipe
  - Increment usage on swipe

- [ ] **T4.6** Implement match detection
  File: `convex/swipes.ts`
  - Check if partner also swiped right
  - Create match if both interested
  - Notify both users

### US-2: Matches Display

- [ ] **T4.7** Migrate matches display
  File: `app/(tabs)/matches.tsx`
  - Replace mock with Convex query
  - Use `api.matches.getForCouple`
  - Real-time updates

### Schedule Feature

- [ ] **T4.8** Migrate schedule data
  File: `app/(tabs)/schedule.tsx`
  - Replace mock with Convex query
  - Show scheduled dates
  - Add date to calendar

---

## Phase 5: RevenueCat Preparation

### Future Subscription Support

- [ ] **T5.1** Add subscription fields to schema
  File: `convex/schema.ts`
  - Add `subscriptionStatus` to users
  - Add `subscriptionTier` to users
  - Add `subscriptionExpiry` to users

- [ ] **T5.2** Create entitlement check
  File: `convex/users.ts`
  - `hasEntitlement` query
  - Check subscription status
  - Return premium features access

- [ ] **T5.3** Create paywall component
  File: `components/Paywall.tsx` (new)
  - Design subscription UI
  - Show premium features
  - Hidden by default (flag)

- [ ] **T5.4** Create RevenueCat utility
  File: `lib/revenuecat.ts` (new)
  - Initialize RevenueCat SDK placeholder
  - Define subscription tiers
  - Document integration steps

- [ ] **T5.5** Update environment variables
  File: `.env`
  - Add RevenueCat API keys (empty)

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 1: Clerk | 10 tasks | 2-3 hours |
| Phase 2: Convex | 10 tasks | 2-3 hours |
| Phase 3: Sync | 4 tasks | 1 hour |
| Phase 4: Migration | 8 tasks | 3-4 hours |
| Phase 5: RevenueCat | 5 tasks | 1 hour |
| **Total** | **37 tasks** | **~10-12 hours** |

## Checkpoints

- ✅ **Checkpoint 1** (After Phase 1): Can sign up/sign in with Clerk
- ✅ **Checkpoint 2** (After Phase 2): Convex schema deployed
- ✅ **Checkpoint 3** (After Phase 3): User sync working
- ✅ **Checkpoint 4** (After Phase 4): All features migrated
- ✅ **Checkpoint 5** (After Phase 5): Ready for RevenueCat

## Parallel Tasks

Tasks marked with `[P]` can be done in parallel:
- T2.4, T2.5, T2.6, T2.7, T2.8, T2.9 (Convex modules)
- T1.8, T1.9 (OAuth providers)
- T4.1, T4.2 (Pairing create/join)
