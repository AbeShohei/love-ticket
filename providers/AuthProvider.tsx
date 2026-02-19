import { useClerk, useAuth as useClerkAuth, useSignIn, useSignUp, useUser } from '@clerk/clerk-expo';
import React, { createContext, useContext, useMemo } from 'react';
import { Id } from '../convex/_generated/dataModel';
import { useConvexUser } from '../hooks/useConvexUser';

// Profile type from Convex
type Profile = {
    _id: Id<"users">;
    id: string;
    coupleId: Id<"couples"> | null;
    displayName: string | null;
    avatarUrl: string | null;
    anniversaryDate?: number;
    subscriptionStatus?: "free" | "trial" | "active" | "expired";
};

// Partner info type
type Partner = {
    _id: Id<"users">;
    displayName: string | null;
    avatarUrl: string | null;
};

// Couple info type
type Couple = {
    _id: Id<"couples">;
    inviteCode: string;
    status: "pending" | "active";
    partner: Partner | null;
};

type AuthContextType = {
    // Clerk auth state
    isSignedIn: boolean;
    isLoaded: boolean;
    isLoading: boolean;

    // User data
    userId: string | null;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;

    // Profile (from Convex)
    profile: Profile | null;
    convexId: Id<"users"> | null;

    // Couple info
    couple: Couple | null;

    // Auth actions
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    verifyEmail: (code: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    isSignedIn: false,
    isLoaded: false,
    isLoading: true,
    userId: null,
    email: null,
    displayName: null,
    avatarUrl: null,
    profile: null,
    convexId: null,
    couple: null,
    signIn: async () => { },
    signUp: async () => { },
    verifyEmail: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { isLoaded, isSignedIn } = useClerkAuth();
    const { user } = useUser();
    const { signOut: clerkSignOut, setActive: clerkSetActive } = useClerk();
    const { signIn: clerkSignIn } = useSignIn();
    const { signUp: clerkSignUp } = useSignUp();

    // Sync user to Convex and get Convex user data
    const { convexUser, isLoading: isConvexLoading } = useConvexUser();

    // Extract user data from Clerk
    const userData = useMemo(() => {
        if (!user) return null;

        return {
            userId: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? null,
            displayName: user.fullName ?? user.username ?? null,
            avatarUrl: user.imageUrl ?? null,
        };
    }, [user]);

    // Profile from Convex - only return if Convex user is available
    const profile: Profile | null = useMemo(() => {
        // Wait for Convex user to be available
        if (!convexUser) return null;

        return {
            _id: convexUser._id,
            id: convexUser.clerkId, // Use clerkId for API calls
            coupleId: convexUser.coupleId || null,
            displayName: convexUser.displayName || null,
            avatarUrl: convexUser.avatarUrl || null,
            anniversaryDate: convexUser.anniversaryDate,
            subscriptionStatus: convexUser.subscriptionStatus,
        };
    }, [convexUser]);

    // Couple info - for now, return null (can be fetched separately with useQuery)
    const couple: Couple | null = useMemo(() => {
        if (!profile?.coupleId) return null;
        // Return basic couple info, partner can be fetched separately
        return {
            _id: profile.coupleId,
            inviteCode: '',
            status: 'pending',
            partner: null,
        };
    }, [profile?.coupleId]);

    // Sign in with email/password
    const signIn = async (email: string, password: string) => {
        if (!clerkSignIn) {
            throw new Error('SignIn not ready');
        }

        try {
            const result = await clerkSignIn.create({
                identifier: email,
                password,
            });

            if (result.status === 'complete' && result.createdSessionId) {
                // Activate the session so isSignedIn becomes true
                await clerkSetActive({ session: result.createdSessionId });
                return;
            }

            if (result.status === 'complete') {
                // Edge case: complete but no session ID — shouldn't happen normally
                console.warn('[Auth] signIn complete but no createdSessionId');
                return;
            }

            throw new Error(`Sign in requires additional steps: ${result.status}`);
        } catch (error: any) {
            const errorMessage = error.errors?.[0]?.message || error.message || '';

            // Handle "session already exists" by signing out first and retrying
            if (errorMessage.toLowerCase().includes('session already exists') ||
                errorMessage.toLowerCase().includes('single session mode')) {
                try {
                    await clerkSignOut();
                    // Retry sign in after clearing session
                    const result = await clerkSignIn.create({
                        identifier: email,
                        password,
                    });
                    if (result.status === 'complete' && result.createdSessionId) {
                        await clerkSetActive({ session: result.createdSessionId });
                        return;
                    }
                } catch (retryError: any) {
                    throw new Error(retryError.errors?.[0]?.message || retryError.message || 'Sign in failed');
                }
            }

            throw new Error(errorMessage || 'Sign in failed');
        }
    };

    // Sign up with email/password
    const signUp = async (email: string, password: string, displayName: string) => {
        if (!clerkSignUp) {
            throw new Error('SignUp not ready');
        }

        try {
            const result = await clerkSignUp.create({
                emailAddress: email,
                password,
                firstName: displayName.split(' ')[0] || displayName,
                lastName: displayName.split(' ')[1] || '',
            });

            if (result.status === 'complete') {
                if (result.createdSessionId) {
                    await clerkSetActive({ session: result.createdSessionId });
                }
                return;
            }

            if (result.status === 'missing_requirements') {
                await clerkSignUp.prepareEmailAddressVerification({
                    strategy: 'email_code',
                });
                // Signal to the caller that verification is needed
                throw new Error('__NEEDS_VERIFICATION__');
            }

            throw new Error(`Sign up requires additional steps: ${result.status}`);
        } catch (error: any) {
            // Preserve __NEEDS_VERIFICATION__ signal without re-wrapping
            if (error.message === '__NEEDS_VERIFICATION__') {
                throw error;
            }

            const errorMessage = error.errors?.[0]?.message || error.message || '';

            // Handle "session already exists" by signing out first and retrying
            if (errorMessage.toLowerCase().includes('session already exists') ||
                errorMessage.toLowerCase().includes('single session mode')) {
                try {
                    await clerkSignOut();
                    // Retry signUp after clearing session
                    const retryResult = await clerkSignUp.create({
                        emailAddress: email,
                        password,
                        firstName: displayName.split(' ')[0] || displayName,
                        lastName: displayName.split(' ')[1] || '',
                    });
                    if (retryResult.status === 'complete' && retryResult.createdSessionId) {
                        await clerkSetActive({ session: retryResult.createdSessionId });
                        return;
                    }
                    if (retryResult.status === 'missing_requirements') {
                        await clerkSignUp.prepareEmailAddressVerification({
                            strategy: 'email_code',
                        });
                        throw new Error('__NEEDS_VERIFICATION__');
                    }
                } catch (retryError: any) {
                    if (retryError.message === '__NEEDS_VERIFICATION__') throw retryError;
                    throw new Error(retryError.errors?.[0]?.message || retryError.message || 'Sign up failed');
                }
            }

            throw new Error(errorMessage || 'Sign up failed');
        }
    };

    // Verify email with OTP code
    const verifyEmail = async (code: string) => {
        if (!clerkSignUp) {
            throw new Error('SignUp not ready');
        }

        try {
            const result = await clerkSignUp.attemptEmailAddressVerification({ code });

            if (result.status === 'complete') {
                // Verification successful - activate the session
                if (result.createdSessionId) {
                    await clerkSetActive({ session: result.createdSessionId });
                }
                return;
            }

            throw new Error(`Verification failed: ${result.status}`);
        } catch (error: any) {
            throw new Error(error.errors?.[0]?.message || error.message || '認証コードが正しくありません');
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            await clerkSignOut();
        } catch (error: any) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    const value: AuthContextType = {
        isSignedIn: isSignedIn ?? false,
        isLoaded,
        isLoading: !isLoaded || isConvexLoading,
        userId: userData?.userId ?? null,
        email: userData?.email ?? null,
        displayName: userData?.displayName ?? null,
        avatarUrl: userData?.avatarUrl ?? null,
        profile,
        convexId: convexUser?._id ?? null,
        couple,
        signIn,
        signUp,
        verifyEmail,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
