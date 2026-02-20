import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

type ConvexUser = {
  _id: Id<"users">;
  clerkId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  coupleId?: Id<"couples">;
  anniversaryDate?: number;
  subscriptionStatus?: "free" | "trial" | "active" | "expired";
  subscriptionTier?: "monthly" | "yearly";
  subscriptionExpiry?: number;
  createdAt: number;
  updatedAt: number;
};

export function useConvexUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const hasSynced = useRef(false);

  // Get existing user from Convex (only if signed in)
  const convexUser = useQuery(
    api.users.getByClerkId,
    isSignedIn && user ? { clerkId: user.id } : "skip"
  );

  // Create user mutation
  const createUser = useMutation(api.users.create);
  const updateUser = useMutation(api.users.updateProfile);

  // Sync user to Convex on first sign-in
  useEffect(() => {
    async function syncUser() {
      if (!isLoaded || !isSignedIn || !user || isSyncing) return;

      // Skip if we've already synced and user exists
      if (convexUser !== undefined) {
        hasSynced.current = true;

        // Update profile if needed (only if user has new data from Clerk)
        const clerkDisplayName = user.fullName || user.username || user.firstName || undefined;
        // Don't sync avatar from Clerk - we want users to set it manually
        // const clerkAvatarUrl = user.imageUrl || undefined;

        if (convexUser && (
          (clerkDisplayName && convexUser.displayName !== clerkDisplayName)
        )) {
          try {
            await updateUser({
              clerkId: user.id,
              displayName: clerkDisplayName,
              // avatarUrl: clerkAvatarUrl,
            });
            console.log('[ConvexUser] Updated profile for:', user.id);
          } catch (error) {
            console.error('[ConvexUser] Failed to update Convex user:', error);
          }
        }
        return;
      }

      // Prevent multiple sync attempts
      if (hasSynced.current) return;

      // User doesn't exist in Convex, create them
      setIsSyncing(true);
      hasSynced.current = true;

      try {
        // Handle Apple Sign In which may not provide email/name
        const email = user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress ||
          `user_${user.id.slice(0, 8)}@placeholder.local`;

        const displayName = user.fullName || user.username || user.firstName ||
          `User${user.id.slice(0, 4)}`;

        // Don't specific avatarUrl on create - let user set it in profile setup
        // const avatarUrl = user.imageUrl || undefined;

        console.log('[ConvexUser] Creating user with:', {
          clerkId: user.id,
          email: email,
          displayName: displayName
        });

        await createUser({
          clerkId: user.id,
          email: email,
          displayName: displayName,
          // avatarUrl: avatarUrl,
        });
        console.log('[ConvexUser] Created Convex user for:', user.id);
      } catch (error) {
        console.error('[ConvexUser] Failed to create Convex user:', error);
        hasSynced.current = false; // Allow retry on error
      } finally {
        setIsSyncing(false);
      }
    }

    syncUser();
  }, [isLoaded, isSignedIn, user, convexUser, createUser, updateUser, isSyncing]);

  // Reset hasSynced when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      hasSynced.current = false;
    }
  }, [isSignedIn]);

  // Only report loading if:
  // 1. Clerk is still loading, OR
  // 2. User is signed in AND Convex query is still loading
  const isLoading = !isLoaded || (isSignedIn && convexUser === undefined);

  return {
    convexUser: convexUser as ConvexUser | null | undefined,
    isLoading,
    isSyncing,
  };
}
