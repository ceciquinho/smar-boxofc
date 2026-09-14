import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  apiRequest,
  clearAuthToken,
  setAuthToken,
  type ApiUser,
  type AuthResponse,
} from "@/services/apiClient";

export type UserInterfaceRole = "cliente" | "entregador" | "admin";

type SignUpPayload = {
  email: string;
  password: string;
  display_name?: string;
  role: Exclude<UserInterfaceRole, "admin">;
};

type AuthCtx = {
  user: ApiUser | null;
  session: { token: string } | null;
  role: UserInterfaceRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    apiRequest<{ user: ApiUser }>("/auth/me")
      .then(({ user }) => {
        if (active) setUser(user);
      })
      .catch(() => {
        clearAuthToken();
        if (active) {
          setUser(null);
          setSession(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const applyAuth = ({ user, token }: AuthResponse) => {
    setAuthToken(token);
    setUser(user);
    setSession({ token });
  };

  const signIn = async (email: string, password: string) => {
    const auth = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    applyAuth(auth);
  };

  const signUp = async (payload: SignUpPayload) => {
    const auth = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    applyAuth(auth);
  };

  const signOut = async () => {
    await apiRequest<{ ok: boolean }>("/auth/logout", { method: "POST" }).catch(() => ({ ok: true }));
    clearAuthToken();
    setUser(null);
    setSession(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        role: user?.role ?? null,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
