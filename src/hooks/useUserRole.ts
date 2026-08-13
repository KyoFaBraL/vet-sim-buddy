import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type UserRole = "professor" | "aluno" | "admin" | null;

const ROLE_PRIORITY: Record<string, number> = { admin: 3, professor: 2, aluno: 1 };

export const useUserRole = (user: User | null) => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Watchdog so a hanging request never freezes the app on "Carregando..."
    const watchdog = setTimeout(() => {
      if (!cancelled) {
        console.warn("Timeout ao buscar papel do usuário");
        setLoading(false);
      }
    }, 6000);

    const fetchRole = async () => {
      try {
        // select all rows (a user may hold more than one role) and pick the highest
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (cancelled) return;

        if (error) {
          console.error("Error fetching role:", error);
          setRole(null);
        } else if (data && data.length > 0) {
          const best = [...data].sort(
            (a, b) => (ROLE_PRIORITY[b.role] ?? 0) - (ROLE_PRIORITY[a.role] ?? 0)
          )[0];
          setRole(best.role as UserRole);
        } else {
          console.warn("No role found for user:", user.id);
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching role:", error);
        if (!cancelled) setRole(null);
      } finally {
        if (!cancelled) {
          clearTimeout(watchdog);
          setLoading(false);
        }
      }
    };

    fetchRole();

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
    };
  }, [user?.id]);

  return { role, loading };
};
