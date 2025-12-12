import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import vetbalanceLogo from "@/assets/vetbalance-logo.png";

export const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={vetbalanceLogo} alt="VetBalance Logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-xl font-bold">VetBalance</h1>
              <p className="text-sm text-muted-foreground">Simulador Gamificado de UTI em Distúrbios Ácido-Base</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Bem-vindo!</h2>
            <p className="text-muted-foreground">Selecione seu tipo de acesso</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Portal do Professor */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Professor</CardTitle>
                <CardDescription>
                  Gerencie casos clínicos, acompanhe alunos e crie conteúdo educacional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Criar e gerenciar casos clínicos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Acompanhar desempenho dos alunos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Gerar relatórios e análises
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Organizar turmas e compartilhar casos
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate('/auth/professor')}
                >
                  Entrar como Professor
                </Button>
              </CardContent>
            </Card>

            {/* Portal do Aluno */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-secondary-foreground" />
                </div>
                <CardTitle className="text-2xl">Aluno</CardTitle>
                <CardDescription>
                  Pratique com simulações clínicas, desenvolva habilidades e conquiste badges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary-foreground" />
                    Simular casos clínicos reais
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary-foreground" />
                    Aplicar tratamentos e monitorar resultados
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary-foreground" />
                    Conquistar badges e pontos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary-foreground" />
                    Acessar histórico e feedback
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate('/auth/aluno')}
                >
                  Entrar como Aluno
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>VetBalance - Simulador gamificado de UTI veterinária para distúrbios ácido-base</p>
      </footer>
    </div>
  );
};
