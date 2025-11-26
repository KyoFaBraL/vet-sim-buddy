import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, ArrowDown, RefreshCw } from "lucide-react";

interface User {
  id: string;
  email: string;
  nome_completo: string;
  created_at: string;
  role: "professor" | "aluno" | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar perfis
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combinar dados
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: rolesMap.get(profile.id) || null
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const promoteToProf = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.rpc("promote_to_professor", {
        target_user_id: userId
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };

      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        });
        fetchUsers();
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao promover usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível promover o usuário",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const demoteToStudent = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.rpc("demote_to_student", {
        target_user_id: userId
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };

      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        });
        fetchUsers();
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao rebaixar usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível rebaixar o usuário",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestão de Usuários</CardTitle>
            <CardDescription>
              Visualize e gerencie os níveis de acesso dos usuários
            </CardDescription>
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Data de Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((userData) => (
              <TableRow key={userData.id}>
                <TableCell className="font-medium">
                  {userData.nome_completo || "Sem nome"}
                </TableCell>
                <TableCell>{userData.email}</TableCell>
                <TableCell>
                  {userData.role === "professor" ? (
                    <Badge variant="default">Professor</Badge>
                  ) : userData.role === "aluno" ? (
                    <Badge variant="secondary">Aluno</Badge>
                  ) : (
                    <Badge variant="outline">Sem Role</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(userData.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  {userData.id !== user?.id && (
                    <>
                      {userData.role === "aluno" && (
                        <Button
                          onClick={() => promoteToProf(userData.id)}
                          disabled={actionLoading === userData.id}
                          size="sm"
                          variant="outline"
                        >
                          <ArrowUp className="h-4 w-4 mr-1" />
                          Promover
                        </Button>
                      )}
                      {userData.role === "professor" && (
                        <Button
                          onClick={() => demoteToStudent(userData.id)}
                          disabled={actionLoading === userData.id}
                          size="sm"
                          variant="outline"
                        >
                          <ArrowDown className="h-4 w-4 mr-1" />
                          Rebaixar
                        </Button>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
