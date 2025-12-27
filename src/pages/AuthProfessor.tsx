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
    .max(255, "Email muito longo"),
  password: z.string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(72, "Senha muito longa"),
  fullName: z.string()
    .trim()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome muito longo"),
  accessKey: z.string()
    .trim()
    .min(8, "Chave de acesso inválida")
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

export default function AuthProfessor() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = signUpSchema.safeParse({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      accessKey: accessKey.trim()
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
      // Validar chave de acesso primeiro
      const { data: keyValidation, error: keyError } = await supabase
        .rpc('validate_professor_key', {
          key_to_validate: result.data.accessKey
        });

      if (keyError) throw keyError;

      const validationResult = keyValidation as { valid: boolean; message: string };
      if (!validationResult.valid) {
        throw new Error(validationResult.message);
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: result.data.fullName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Registrar professor usando função segura do banco
        const { data: registerData, error: registerError } = await supabase
          .rpc('register_professor', {
            user_id: data.user.id,
            email: result.data.email,
            nome_completo: result.data.fullName
          });

        if (registerError) throw registerError;
        
        const registerResult = registerData as { success: boolean; message: string };
        if (!registerResult.success) {
          throw new Error(registerResult.message);
        }

        toast({
          title: "Cadastro realizado!",
          description: "Sua conta de professor foi criada com sucesso.",
        });
        
        navigate("/professor");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
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

      // Verificar se o usuário tem papel de professor
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (roleError || roleData?.role !== 'professor') {
        await supabase.auth.signOut();
        toast({
          title: "Acesso negado",
          description: "Esta conta não possui permissão de professor. Por favor, entre no portal de alunos.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao painel do professor.",
      });
      
      navigate("/professor");
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
              Portal do Professor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastro</TabsTrigger>
              </TabsList>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-key">Chave de Acesso Professor</Label>
                    <Input
                      id="signup-key"
                      type="text"
                      placeholder="Solicite a chave com um professor existente"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Prof. João Silva"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="professor@escola.com"
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
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Cadastrando..." : "Criar Conta"}
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
                      placeholder="professor@escola.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
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
                  
                  <div className="text-center mt-4">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-muted-foreground hover:text-primary"
                      onClick={() => navigate("/reset-password")}
                    >
                      Esqueci minha senha
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
