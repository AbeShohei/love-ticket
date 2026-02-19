# Spec: Clerk + Convex Integration

## Overview
Migrate from Supabase to Clerk (authentication) and Convex (database) for the Love Ticket dating app. Prepare infrastructure for future RevenueCat subscription integration.

## User Stories

### US-1: User Registration
**As a** new user
**I want to** create an account with email/password or social login
**So that** I can access the app features

**Acceptance Criteria:**
- Email/password registration with email verification
- Google sign-in option
- Apple sign-in option (iOS only)
- Display name collection during registration
- Avatar auto-generated from display name
- Redirect to pairing screen after successful registration

### US-2: User Login
**As a** returning user
**I want to** sign in to my account
**So that** I can continue using the app

**Acceptance Criteria:**
- Email/password login
- Social login (Google, Apple)
- "Forgot password" flow
- Persistent session across app restarts
- Redirect to main app if already paired, or pairing screen if not

### US-3: Couple Pairing
**As a** user
**I want to** pair with my partner
**So that** we can share date proposals and matches

**Acceptance Criteria:**
- Generate unique 6-character invite code
- Share code via system share sheet
- Join existing couple by entering code
- Real-time status update when partner joins
- Both users see same couple data

### US-4: Profile Management
**As a** user
**I want to** manage my profile
**So that** my partner can see my information

**Acceptance Criteria:**
- View and edit display name
- Upload/change avatar image
- View couple status (pending/active)
- View partner's profile when couple is active

### US-5: Proposal Swipe Recording
**As a** user
**I want to** have my swipes recorded
**So that** I can track my interests and find matches

**Acceptance Criteria:**
- Left swipe (nope) recorded to database
- Right swipe (like) recorded with daily limit check
- Up swipe (super like) recorded with daily limit check
- Swipe history persisted across sessions
- Real-time sync with partner when both swipe right

## Technical Architecture

### Authentication Flow (Clerk)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Sign Up   │────▶│   Verify    │────▶│   Pairing   │
│   Screen    │     │   Email     │     │   Screen    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                        │
       │           ┌─────────────┐              │
       └──────────▶│   Main App  │◀─────────────┘
                   │   (Tabs)    │
                   └─────────────┘
```

### Database Schema (Convex)

#### Tables

**users**
```typescript
{
  _id: Id<"users">
  clerkId: string          // Clerk user ID
  email: string
  displayName: string | null
  avatarUrl: string | null
  coupleId: Id<"couples"> | null
  createdAt: number
  updatedAt: number
}
```

**couples**
```typescript
{
  _id: Id<"couples">
  inviteCode: string       // 6-char unique code
  status: "pending" | "active"
  createdAt: number
  activatedAt: number | null
}
```

**proposals**
```typescript
{
  _id: Id<"proposals">
  title: string
  description: string | null
  category: string
  imageUrl: string | null
  price: string | null
  location: string | null
  url: string | null
  createdBy: Id<"users"> | null  // null for presets
  coupleId: Id<"couples"> | null // null for global presets
  isPreset: boolean
  isActive: boolean
  createdAt: number
}
```

**swipes**
```typescript
{
  _id: Id<"swipes">
  userId: Id<"users">
  proposalId: Id<"proposals">
  direction: "left" | "right" | "super_like"
  createdAt: number
}
```

**matches**
```typescript
{
  _id: Id<"matches">
  coupleId: Id<"couples">
  proposalId: Id<"proposals">
  matchedAt: number
  completedAt: number | null
  status: "matched" | "completed"
}
```

**dailyUsage**
```typescript
{
  _id: Id<"dailyUsage">
  userId: Id<"users">
  date: string              // YYYY-MM-DD format
  likeCount: number
  superLikeCount: number
  proposalCreateCount: number
}
```

### API Functions (Convex)

#### Queries
- `users.getByClerkId` - Get user by Clerk ID
- `users.getProfile` - Get current user profile
- `couples.getByInviteCode` - Find couple by invite code
- `couples.getMyCouple` - Get current user's couple
- `proposals.getForCouple` - Get proposals visible to couple
- `swipes.getHistory` - Get user's swipe history
- `matches.getForCouple` - Get couple's matches
- `dailyUsage.getToday` - Get today's usage for current user

#### Mutations
- `users.create` - Create user after Clerk signup
- `users.updateProfile` - Update display name/avatar
- `couples.create` - Create new couple with invite code
- `couples.join` - Join existing couple
- `swipes.create` - Record a swipe
- `matches.createFromMutualSwipe` - Create match when both swipe right
- `dailyUsage.increment` - Increment usage counters

## Implementation Phases

### Phase 1: Clerk Integration
1. Install `@clerk/clerk-expo`
2. Configure Clerk provider in `_layout.tsx`
3. Update AuthProvider to wrap Clerk
4. Implement login screen with Clerk
5. Implement register screen with Clerk
6. Add social login buttons
7. Implement sign-out functionality

### Phase 2: Convex Setup
1. Install `convex` package
2. Run `npx convex dev` to create project
3. Define schema in `convex/schema.ts`
4. Create initial migration functions
5. Set up Convex provider alongside Clerk

### Phase 3: User Sync
1. Create webhook or mutation to sync Clerk user to Convex
2. Handle user creation on first sign-in
3. Update AuthProvider to use Convex user data

### Phase 4: Feature Migration
1. Migrate pairing logic to Convex
2. Migrate swipe recording to Convex
3. Add real-time subscriptions for matches
4. Implement daily usage tracking

### Phase 5: RevenueCat Preparation
1. Add subscription fields to user schema
2. Create entitlement check functions
3. Add paywall component (initially hidden)
4. Document RevenueCat integration for later

## Environment Variables

```env
# Clerk
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# Convex (auto-managed by CLI)
CONVEX_DEPLOYMENT=xxx

# RevenueCat (future)
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=
```

## Dependencies to Add

```json
{
  "@clerk/clerk-expo": "^2.x",
  "convex": "^1.x",
  "expo-secure-store": "~15.x"
}
```

## Dependencies to Remove
- ~~@supabase/supabase-js~~ ✅ Removed
- ~~react-native-url-polyfill~~ ✅ Removed

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Clerk + Convex auth sync | Use Clerk JWT template to include Convex token |
| Offline support | Convex has built-in optimistic updates |
| Migration complexity | Keep mock data fallback during transition |
| Social login on Android | Test Google login thoroughly on Android |

## Success Criteria
- [ ] Users can register with email/password
- [ ] Users can login with Google
- [ ] Users can login with Apple (iOS)
- [ ] Couple pairing works end-to-end
- [ ] Swipes are recorded to Convex
- [ ] Real-time matches appear for both partners
- [ ] App works without Supabase
