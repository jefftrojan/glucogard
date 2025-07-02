import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, type AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (e) {
        console.error("Error fetching current user:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (session?.user) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Check if user has seen onboarding
    const checkOnboardingStatus = () => {
      const onboardingSeen = localStorage?.getItem('hasSeenOnboarding') === 'true';
      setHasSeenOnboarding(onboardingSeen);
    };

    if (typeof window !== 'undefined') {
      checkOnboardingStatus();
    }
  }, []);

  useEffect(() => {
    if (loading) return; // Don't navigate until loading is complete

    const inAuthGroup = segments[0] === 'auth';
    const inAppGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';

    if (user && !inAppGroup) {
      // User is authenticated, but not in the app group, redirect to tabs
      router.replace('/(tabs)');
    } else if (!user) {
      // User is not authenticated
      if (!hasSeenOnboarding && !inOnboarding && !inAuthGroup) {
        // Haven't seen onboarding, show it first
        router.replace('/onboarding');
      } else if (hasSeenOnboarding && !inAuthGroup && !inOnboarding) {
        // Has seen onboarding, go to auth
        router.replace('/auth');
      }
      // If already in onboarding or auth, don't redirect
    }
  }, [user, loading, segments, router, hasSeenOnboarding]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}