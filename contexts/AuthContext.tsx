
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import { authClient, storeWebBearerToken } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string) {
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    `/auth-popup?provider=${provider}`,
    `${provider}_oauth`,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
  );

  return new Promise<void>((resolve, reject) => {
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("OAuth popup was closed"));
      }
    }, 500);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success") {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        popup?.close();
        resolve();
      } else if (event.data?.type === "oauth-error") {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        popup?.close();
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);
  });
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const session = await authClient.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("[Auth] Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Check for developer account
      if (email === 'developerposeiduxfu39a33es@gmail.com' && password === 'Developerposeiduxfu39a33eS00=') {
        // Create a special developer session
        setUser({
          id: 'developer-account',
          email: 'developerposeiduxfu39a33es@gmail.com',
          name: 'Developer',
        });
        return;
      }

      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (Platform.OS === "web" && result.data?.token) {
        await storeWebBearerToken(result.data.token);
      }

      await fetchUser();
    } catch (error: any) {
      console.error("[Auth] Sign in error:", error);
      throw new Error(error.message || "Failed to sign in");
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: email.split("@")[0],
      });

      if (Platform.OS === "web" && result.data?.token) {
        await storeWebBearerToken(result.data.token);
      }

      await fetchUser();
    } catch (error: any) {
      console.error("[Auth] Sign up error:", error);
      throw new Error(error.message || "Failed to sign up");
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === "web") {
        await openOAuthPopup("google");
        await fetchUser();
      } else {
        await authClient.signIn.social({
          provider: "google",
        });
        await fetchUser();
      }
    } catch (error: any) {
      console.error("[Auth] Google sign in error:", error);
      throw new Error(error.message || "Failed to sign in with Google");
    }
  };

  const signInWithApple = async () => {
    try {
      if (Platform.OS === "web") {
        await openOAuthPopup("apple");
        await fetchUser();
      } else {
        await authClient.signIn.social({
          provider: "apple",
        });
        await fetchUser();
      }
    } catch (error: any) {
      console.error("[Auth] Apple sign in error:", error);
      throw new Error(error.message || "Failed to sign in with Apple");
    }
  };

  const signInWithGitHub = async () => {
    try {
      if (Platform.OS === "web") {
        await openOAuthPopup("github");
        await fetchUser();
      } else {
        await authClient.signIn.social({
          provider: "github",
        });
        await fetchUser();
      }
    } catch (error: any) {
      console.error("[Auth] GitHub sign in error:", error);
      throw new Error(error.message || "Failed to sign in with GitHub");
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
      setUser(null);
    } catch (error) {
      console.error("[Auth] Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
