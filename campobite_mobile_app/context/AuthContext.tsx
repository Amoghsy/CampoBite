import React, { createContext, useContext, useEffect, useState } from "react";
import * as auth from "../services/auth";
import { getToken, getUser } from "../services/api";
import { registerForPushNotifications } from "../services/notifications";

interface User {
    email: string;
    name: string;
    role: string;
    picture?: string;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    pendingGoogleIdToken: string | null;
    loginUser: (email: string, password: string) => Promise<void>;
    signupUser: (
        name: string,
        email: string,
        password: string,
        usn?: string
    ) => Promise<void>;
    googleLoginUser: (idToken: string) => Promise<void>;
    googleSignupUser: (idToken: string) => Promise<void>;
    setGoogleSignupRole: (idToken: string, role: string) => Promise<void>;
    logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoggedIn: false,
    isLoading: true,
    pendingGoogleIdToken: null,
    loginUser: async () => { },
    signupUser: async () => { },
    googleLoginUser: async () => { },
    googleSignupUser: async () => { },
    setGoogleSignupRole: async () => { },
    logoutUser: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState<string | null>(null);

    // Check for existing token on mount
    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                if (token) {
                    const storedUser = await getUser();
                    if (storedUser) {
                        setUser(storedUser);
                        // make sure the server knows about the current device token
                        registerForPushNotifications().catch(console.error);
                    }
                }
            } catch (e) {
                console.error("Auth check failed:", e);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const loginUser = async (email: string, password: string) => {
        const data = await auth.login(email, password);
        setUser({ email: data.email, name: data.name, role: data.role, picture: (data as any).picture || "" });
        // Register FCM token for push notifications
        registerForPushNotifications().catch(console.error);
    };

    const signupUser = async (
        name: string,
        email: string,
        password: string,
        usn?: string
    ) => {
        await auth.signup(name, email, password, usn);
    };

    const googleLoginUser = async (idToken: string) => {
        const data = await auth.googleLogin(idToken);
        setUser({ email: data.email, name: data.name, role: data.role, picture: (data as any).picture || "" });
        // Register FCM token for push notifications
        registerForPushNotifications().catch(console.error);
    };

    const googleSignupUser = async (idToken: string) => {
        await auth.googleSignup(idToken);
        // Store the ID token to use when selecting role
        setPendingGoogleIdToken(idToken);
    };

    const setGoogleSignupRole = async (idToken: string, role: string) => {
        const data = await auth.updateGoogleSignupRole(idToken, role);
        setUser({ email: data.email, name: data.name, role: data.role });
        setPendingGoogleIdToken(null);
        // Register FCM token for push notifications
        registerForPushNotifications().catch(console.error);
    };

    const logoutUser = async () => {
        await auth.logout();
        setUser(null);
        setPendingGoogleIdToken(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoggedIn: !!user,
                isLoading,
                pendingGoogleIdToken,
                loginUser,
                signupUser,
                googleLoginUser,
                googleSignupUser,
                setGoogleSignupRole,
                logoutUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
