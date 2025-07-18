import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface WebAuthUser {
  id: string;
  email: string;
  role: 'doctor' | 'patient';
  full_name: string;
}

interface WebAuthContextType {
  user: WebAuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const WebAuthContext = createContext<WebAuthContextType | undefined>(undefined);

export function WebAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WebAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      checkSession();
    } else {
      setLoading(false);
    }
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/web-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/web-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setUser(data.user);
  };

  const signOut = async () => {
    await fetch('/web-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });

    setUser(null);
  };

  return (
    <WebAuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </WebAuthContext.Provider>
  );
}

export function useWebAuth() {
  const context = useContext(WebAuthContext);
  if (context === undefined) {
    throw new Error('useWebAuth must be used within a WebAuthProvider');
  }
  return context;
}