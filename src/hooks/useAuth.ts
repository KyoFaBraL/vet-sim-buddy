import { useAuthContext } from "@/contexts/AuthContext";

// Shared auth state (single source of truth via AuthProvider).
export const useAuth = () => useAuthContext();
