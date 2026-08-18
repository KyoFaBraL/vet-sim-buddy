import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const settled = useRef(false);

  useEffect(() => {
    const finish = () => {
      settled.current = true;
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      finish();

      // Log de participação: registra o login (com data, hora e instituição)
      if (event === "SIGNED_IN" && s?.user) {
        setTimeout(() => {
          supabase
            .rpc("log_participation_event", {
              p_tipo: "login",
              p_user_agent: navigator.userAgent,
            })
            .then(({ error }) => {
              if (error) console.error("Erro ao registrar login:", error);
            });
        }, 0);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        finish();
      })
      .catch((err) => {
        console.error("Falha ao recuperar sessão:", err);
        setSession(null);
        setUser(null);
        finish();
      });

    // Watchdog: never leave the app stuck on "Carregando..." if the auth
    // request hangs (offline, stale refresh token, slow network).
    const watchdog = setTimeout(() => {
      if (!settled.current) {
        console.warn("Auth timeout — liberando tela de carregamento");
        finish();
      }
    }, 6000);

    return () => {
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
