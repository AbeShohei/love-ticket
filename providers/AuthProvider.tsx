import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useState } from 'react';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: any | null;
    isLoading: boolean;
    isAdmin: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
};

// Dummy data for development
// Using valid UUIDs to avoid database type errors
const DUMMY_USER: User = {
    id: '00000000-0000-0000-0000-000000000001',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
};

const DUMMY_SESSION: Session = {
    access_token: 'dummy-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'dummy-refresh-token',
    user: DUMMY_USER,
};

const DUMMY_PROFILE = {
    id: '00000000-0000-0000-0000-000000000001',
    couple_id: '00000000-0000-0000-0000-000000000002',
    first_name: 'Test',
    last_name: 'User',
};

const AuthContext = createContext<AuthContextType>({
    session: DUMMY_SESSION,
    user: DUMMY_USER,
    profile: DUMMY_PROFILE,
    isLoading: false,
    isAdmin: false,
    refreshProfile: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // We keep state simplified since we are mocking auth
    const [session] = useState<Session | null>(DUMMY_SESSION);
    const [profile] = useState<any | null>(DUMMY_PROFILE);
    const [isLoading] = useState(false);

    const refreshProfile = async () => {
        console.log('Dummy refresh profile');
    };

    const signOut = async () => {
        console.log('Dummy sign out');
    };

    const value = {
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        isAdmin: false,
        refreshProfile,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
