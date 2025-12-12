import { useEffect, useState } from "react";
import { LogOut, Users, BookOpen, BarChart3, Settings, Key } from "lucide-react";
import { VetBalanceLogo } from "@/components/VetBalanceLogo";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassManager } from "@/components/ClassManager";
import { StudentManagement } from "@/components/StudentManagement";
import { StudentReports } from "@/components/StudentReports";
import { CaseManager } from "@/components/CaseManager";
import { CaseShareManager } from "@/components/CaseShareManager";
import { ProfessorAccessKeys } from "@/components/ProfessorAccessKeys";
import { UserManagement } from "@/components/UserManagement";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ProfessorDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <VetBalanceLogo className="h-14 w-14 object-contain" />
                <div>
                  <CardTitle className="text-2xl">VetBalance</CardTitle>
                  <CardDescription>Portal do Professor</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="classes">
              <BookOpen className="h-4 w-4 mr-2" />
              Turmas
            </TabsTrigger>
            <TabsTrigger value="cases">
              <Settings className="h-4 w-4 mr-2" />
              Casos Clínicos
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="keys">
              <Key className="h-4 w-4 mr-2" />
              Chaves
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Alunos</CardTitle>
                <CardDescription>
                  Adicione e gerencie alunos em suas turmas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Turmas</CardTitle>
                <CardDescription>
                  Crie e organize turmas de alunos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClassManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cases" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Biblioteca de Casos</CardTitle>
                  <CardDescription>
                    Crie e edite casos clínicos para simulações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CaseManager onCaseCreated={() => {}} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compartilhar Casos</CardTitle>
                  <CardDescription>
                    Compartilhe casos clínicos com alunos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CaseShareManager availableCases={[]} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Desempenho</CardTitle>
                <CardDescription>
                  Acompanhe o progresso dos alunos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentReports />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys" className="space-y-4">
            <ProfessorAccessKeys />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
