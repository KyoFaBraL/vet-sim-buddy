import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, KeyRound, CheckCircle } from "lucide-react";
import { z } from "zod";
import { VetBalanceLogo } from "@/components/VetBalanceLogo";

const emailSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, "Email muito longo"),
});

const passwordSchema = z.object({
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(72, "Senha muito longa")
    .regex(/[A-Z]/, "Senha deve conter letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter letra minúscula")
    .regex(/[0-9]/, "Senha deve conter número")
    .regex(/[@$!%*?&#]/, "Senha deve conter caractere especial"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ViewMode = "request" | "update" | "success";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("request");
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user came from a password reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check URL for recovery token
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      
      if (type === "recovery" && accessToken) {
        setViewMode("update");
      } else if (session?.user && window.location.hash.includes("type=recovery")) {
        setViewMode("update");
      }
    };

    checkSession();

    // Listen for password recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setViewMode("update");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = emailSchema.safeParse({ email: email.trim() });
    
    if (!result.success) {
      toast({
        title: "Erro de validação",
        description: result.error.flatten().fieldErrors.email?.[0] || "Email inválido",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = passwordSchema.safeParse({ password, confirmPassword });
    
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const errorMessage = errors.password?.[0] || errors.confirmPassword?.[0] || "Erro de validação";
      toast({
        title: "Erro de validação",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: result.data.password,
      });

      if (error) throw error;

      setViewMode("success");
      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi redefinida com sucesso.",
      });

      // Sign out and redirect to login after 3 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/auth/aluno");
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="w-full max-w-md px-4">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/auth/aluno')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao login
        </Button>
        
        <Card>
          <CardHeader className="text-center">
            <VetBalanceLogo className="mx-auto mb-4 h-16 w-16 object-contain" />
            <CardTitle>VetBalance</CardTitle>
            <CardDescription>
              Simulador de Cuidados Críticos - {viewMode === "request" && "Recuperação de Senha"}
              {viewMode === "update" && "Nova Senha"}
              {viewMode === "success" && "Senha Atualizada"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewMode === "request" && !emailSent && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="text-center text-sm text-muted-foreground mb-4">
                  <Mail className="h-12 w-12 mx-auto mb-2 text-primary/60" />
                  <p>Digite seu email e enviaremos um link para redefinir sua senha.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="aluno@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
              </form>
            )}

            {viewMode === "request" && emailSent && (
              <div className="text-center space-y-4">
                <Mail className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-medium">Email enviado!</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Verifique sua caixa de entrada (e pasta de spam) para o link de recuperação.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setEmailSent(false)}
                >
                  Enviar novamente
                </Button>
              </div>
            )}

            {viewMode === "update" && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="text-center text-sm text-muted-foreground mb-4">
                  <KeyRound className="h-12 w-12 mx-auto mb-2 text-primary/60" />
                  <p>Digite sua nova senha.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mín. 8 caracteres, maiúscula, minúscula, número e especial"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Atualizando..." : "Atualizar senha"}
                </Button>
              </form>
            )}

            {viewMode === "success" && (
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <h3 className="font-medium">Senha atualizada com sucesso!</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Você será redirecionado para a página de login em instantes...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}