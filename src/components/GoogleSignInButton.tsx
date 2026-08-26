import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
    />
  </svg>
);

interface GoogleSignInButtonProps {
  /** Rota para onde o usuário deve ir após o login (ex: /professor, /app) */
  redirectTo: string;
  /** Rota pública de retorno do OAuth (mesma origem). Default: window.location.origin */
  callbackUrl?: string;
  /** Variante visual do botão */
  variant?: "default" | "outline" | "secondary";
  /** Tamanho do botão */
  size?: "default" | "lg";
  /** Classe extra */
  className?: string;
  /** Rótulo do botão */
  label?: string;
}

/**
 * Botão de login com Google usando Lovable Cloud managed OAuth.
 * Após o retorno do OAuth, verifica o papel do usuário e redireciona.
 */
export const GoogleSignInButton = ({
  redirectTo,
  callbackUrl,
  variant = "outline",
  size = "default",
  className = "",
  label = "Entrar com Google",
}: GoogleSignInButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    // Guarda o destino pretendido para restaurar após o retorno do OAuth
    sessionStorage.setItem("vetbalance_oauth_next", redirectTo);

    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: callbackUrl ?? window.location.origin,
      });

      if (result.error) {
        toast({
          title: "Erro no login com Google",
          description: getAuthErrorMessage(result.error),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (result.redirected) {
        // O navegador vai redirecionar para o Google e voltar.
        return;
      }

      // Tokens recebidos e sessão definida — verificar papel e redirecionar.
      const next = sessionStorage.getItem("vetbalance_oauth_next") || redirectTo;
      sessionStorage.removeItem("vetbalance_oauth_next");
      navigate(next);
    } catch (error: any) {
      toast({
        title: "Erro no login com Google",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`w-full gap-2 ${className}`}
      disabled={loading}
      onClick={handleGoogleSignIn}
    >
      <GoogleIcon />
      {loading ? "Conectando..." : label}
    </Button>
  );
};
