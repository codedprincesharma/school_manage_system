import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  session: { access_token: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      // Handle different response structures
      const token = response.access_token || response.token || response.accessToken;
      const user = response.user || response.user_data || { email, id: response.user_id };
      
      if (!token) {
        throw new Error("No access token received from server");
      }
      
      setToken(token);
      setUser(user);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      return { error: null };
    } catch (error: any) {
      console.error("Login error details:", {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, role: string) => {
    try {
      const response = await authApi.register({ email, password, role });
      
      // Handle different response structures
      const token = response.access_token || response.token || response.accessToken;
      const user = response.user || response.user_data || { email, role, id: response.user_id };
      
      if (!token) {
        throw new Error("No access token received from server");
      }
      
      setToken(token);
      setUser(user);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      return { error: null };
    } catch (error: any) {
      console.error("Registration error details:", {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const session = token ? { access_token: token } : null;

  return (
    <AuthContext.Provider value={{ user, token, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
