"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface ClubMembership {
  clubId: string;
  clubName: string;
  clubSlug: string;
  role: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  role: string;
  memberships: ClubMembership[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
  isSiteAdmin: () => boolean;
  isClubAdmin: (clubId: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get token from localStorage
  const getStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('gm_token');
  };

  // Fetch user profile from API
  const fetchUserProfile = async (authToken: string): Promise<AuthUser | null> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token invalid, clear it
          localStorage.removeItem('gm_token');
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      const storedToken = getStoredToken();
      if (storedToken) {
        setToken(storedToken);
        const userProfile = await fetchUserProfile(storedToken);
        if (userProfile) {
          setUser(userProfile);
        } else {
          // Clear invalid token
          setToken(null);
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const signIn = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gm_token', newToken);
    }
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gm_token');
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    const userProfile = await fetchUserProfile(token);
    if (userProfile) {
      setUser(userProfile);
    } else {
      signOut();
    }
  };

  const isSiteAdmin = (): boolean => {
    return user?.role === 'SITE_ADMIN';
  };

  const isClubAdmin = (clubId: string): boolean => {
    if (!user) return false;
    if (user.role === 'SITE_ADMIN') return true; // Site admins can admin any club
    return user.memberships.some(m => m.clubId === clubId && m.role === 'CLUB_ADMIN');
  };

  const value = {
    user,
    token,
    loading,
    signIn,
    signOut,
    isSiteAdmin,
    isClubAdmin,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}