import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { QrCode, Smartphone, Stethoscope, Trophy } from "lucide-react";
import { z } from "zod";
import { VetBalanceLogo } from "@/components/VetBalanceLogo";
import { Seo } from "@/components/Seo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  assignParticipantCode,
  INSTITUICAO_VISITANTE,
} from "@/hooks/useParticipantCode";

const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, "Email muito longo")
    .refine(
      (email) => !email.includes('\r') && !email.includes('\n'),
      "Email contém caracteres inválidos"
    ),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(72, "Senha muito longa")
    .regex(/[A-Z]/, "Senha deve conter letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter letra minúscula")
    .regex(/[0-9]/, "Senha deve conter número")
    .regex(/[@$!%*?&#]/, "Senha deve conter caractere especial"),
  nomeCompleto: z.string()
    .trim()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[\p{L}\s'-]+$/u, "Nome contém caracteres inválidos")
});

const signInSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, "Email muito longo"),
  password: z.string()
    .min(6, "Senha muito curta")
    .max(72, "Senha muito longa")
});

export default function AuthVisitante() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Garante que o visitante receba seu código DS26-VIS-xxx antes de entrar no simulador
  const ensureVisitorCode = async () => {
    const code = await assignParticipantCode(INSTITUICAO_VISITANTE);
    return code;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = signUpSchema.safeParse({
      email: email.trim(),
      password,
      nomeCompleto: nomeCompleto.trim()
    });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const errorMessages = Object.values(errors).flat().join(", ");
      toast({
        title: "Erro de validação",
        description: errorMessages,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/demo`;

      const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: result.data.nomeCompleto,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        if (data.session) {
          const code = await ensureVisitorCode();
          toast({
            title: "Cadastro realizado!",
            description: code
              ? `Seu código de visitante é ${code.codigo}. Bem-vindo(a) ao VetBalance!`
              : "Bem-vindo(a) ao VetBalance!",
            duration: 10000,
          });
          navigate("/app");
        } else {
          toast({
            title: "Verifique seu email",
            description: "Enviamos um link de confirmação para o seu email. Após confirmar, volte por esta página.",
          });
        }
      } else if (data.user === null && !error) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já está registrado. Use a aba Entrar.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = signInSchema.safeParse({
      email: email.trim(),
      password
    });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const errorMessages = Object.values(errors).flat().join(", ");
      toast({
        title: "Erro de validação",
        description: errorMessages,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) throw error;

      // Visitantes entram como "aluno" (mesmas permissões de simulação)
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (roleError || !roleData || roleData.role === 'professor' || roleData.role === 'admin') {
        await supabase.auth.signOut();
        toast({
          title: "Acesso de visitante",
          description: "Contas de professor/administrador devem entrar pelos portais principais do site.",
          variant: "destructive",
        });
        return;
      }

      await ensureVisitorCode();

      toast({
        title: "Login realizado!",
        description: "Bem-vindo(a) de volta ao VetBalance.",
      });

      navigate("/app");
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo
        title="Acesso de Visitantes — Delta Saúde 2026 | VetBalance"
        description="Acesso exclusivo para visitantes do congresso Delta Saúde 2026 testarem o VetBalance ao vivo pelo smartphone."
        path="/auth/visitante"
        noindex
      />
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <VetBalanceLogo className="h-10 w-10 object-contain" />
              <div>
                <p className="font-bold leading-tight">VetBalance</p>
                <p className="text-xs text-muted-foreground leading-tight">Simulador Gamificado de Cuidados Críticos</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4">
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Congresso Delta Saúde 2026</p>
                  <Badge variant="default">Demonstração ao vivo</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo(a)! Você escaneou o QR code da apresentação do VetBalance.
                  Cadastre-se gratuitamente e teste o simulador agora mesmo, direto do seu smartphone.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <Smartphone className="h-3.5 w-3.5 text-primary" />
                    Funciona no navegador do seu celular, sem instalar nada
                  </li>
                  <li className="flex items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5 text-primary" />
                    Simule casos clínicos de distúrbios ácido-básicos em cães e gatos
                  </li>
                  <li className="flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                    Ganhe pontos e apareça no ranking do evento
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground border-t pt-2">
                  Acesso de demonstração pública: visitantes não participam da pesquisa científica.
                  Os dados de uso podem ser utilizados de forma anônima e agregada para melhoria do software.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center pb-2">
                <h1 className="text-xl font-semibold leading-none tracking-tight">Acesso de Visitante</h1>
                <CardDescription>Entre ou crie sua conta para testar ao vivo</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signup">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signup">Cadastro</TabsTrigger>
                    <TabsTrigger value="login">Entrar</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Nome Completo</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Seu nome"
                          value={nomeCompleto}
                          onChange={(e) => setNomeCompleto(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Senha</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Mín. 8 caracteres, maiúscula, minúscula, número e especial"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? "Criando conta..." : "Cadastrar e testar agora"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="login">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">Senha</Label>
                          <Button
                            type="button"
                            variant="link"
                            className="px-0 h-auto text-xs text-muted-foreground hover:text-primary"
                            onClick={() => navigate('/reset-password')}
                          >
                            Esqueci minha senha
                          </Button>
                        </div>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? "Entrando..." : "Entrar"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="border-t py-4 text-center text-xs text-muted-foreground px-4">
          <p>VetBalance — Simulador gamificado de cuidados críticos em distúrbios ácido-básicos para cães e gatos</p>
          <p className="mt-1">Apresentado no Congresso Delta Saúde 2026 · 22/08/2026</p>
        </footer>
      </div>
    </>
  );
}
