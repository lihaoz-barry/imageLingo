'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Mock user type (simplified from Firebase User)
interface MockUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    getIdToken: () => Promise<string>;
}

interface AuthContextType {
    user: MockUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: false,
    signInWithGoogle: async () => { },
    signOut: async () => { }
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<MockUser | null>(null);
    const [loading] = useState(false);

    const signInWithGoogle = async () => {
        // Mock sign in - creates a demo user
        setUser({
            uid: 'demo-user-123',
            email: 'demo@imagelingo.com',
            displayName: 'Demo User',
            photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
            getIdToken: async () => 'mock-id-token'
        });
    };

    const signOut = async () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

