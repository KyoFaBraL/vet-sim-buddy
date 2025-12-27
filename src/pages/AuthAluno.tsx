import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { VetBalanceLogo } from "@/components/VetBalanceLogo";

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

export default function AuthAluno() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      const redirectUrl = `${window.location.origin}/`;
      
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

      // Check if user was created successfully
      if (data.user) {
        // Check if this is a new signup or an existing user
        // The handle_new_user trigger automatically creates profile and assigns 'aluno' role
        if (data.session) {
          // User was signed up and logged in (auto-confirm is enabled)
          toast({
            title: "Conta criada!",
            description: "Você foi autenticado como aluno com sucesso.",
          });
          navigate("/app");
        } else {
          // User needs to confirm email
          toast({
            title: "Verifique seu email",
            description: "Enviamos um link de confirmação para o seu email.",
          });
        }
      } else if (data.user === null && !error) {
        // This can happen if user already exists
        toast({
          title: "Email já cadastrado",
          description: "Este email já está registrado. Por favor, faça login.",
        });
      }
    } catch (error: any) {
      // Handle specific error cases
      let errorMessage = error.message;
      
      if (error.message?.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado. Por favor, faça login.";
      }
      
      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
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

      // Verificar se o usuário tem papel de aluno
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (roleError || roleData?.role !== 'aluno') {
        await supabase.auth.signOut();
        toast({
          title: "Acesso negado",
          description: "Esta conta não possui permissão de aluno. Por favor, entre no portal de professores.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });
      
      navigate("/app");
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
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
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <Card>
          <CardHeader className="text-center">
            <VetBalanceLogo className="mx-auto mb-4 h-16 w-16 object-contain" />
            <CardTitle>VetBalance</CardTitle>
            <CardDescription>
              Simulador de Cuidados Críticos em Distúrbios Ácidos Básicos - Portal do Aluno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastro</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="aluno@email.com"
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

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
                      placeholder="aluno@email.com"
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
