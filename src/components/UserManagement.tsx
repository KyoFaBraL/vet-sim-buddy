import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Search } from "lucide-react";

interface User {
  id: string;
  email?: string | null;
  nome_completo: string | null;
  created_at: string;
  role: "professor" | "aluno" | "admin" | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { user } = useAuth();
  const { role: currentUserRole } = useUserRole(user ?? null);
  const { toast } = useToast();
  const isAdmin = currentUserRole === "admin";

  const changeUserRole = async (userId: string, newRole: "professor" | "aluno") => {
    setActionLoading(userId);
    try {
      const rpcName = newRole === "professor" ? "promote_to_professor" : "demote_to_student";
      const { data, error } = await supabase.rpc(rpcName, { target_user_id: userId });
      if (error) throw error;
      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        fetchUsers();
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao alterar role:", error);
      toast({ title: "Erro", description: "Não foi possível alterar o nível do usuário", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .rpc("get_all_profiles_for_admin");

      if (profilesError) throw profilesError;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: (profile as any).role || null
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

  const filteredUsers = useMemo(() => {
    return users.filter((userData) => {
      const matchesSearch = 
        userData.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userData.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = 
        roleFilter === "all" || 
        (roleFilter === "none" && !userData.role) ||
        userData.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);


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
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter || "all"} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="professor">Professor</SelectItem>
              <SelectItem value="aluno">Aluno</SelectItem>
              <SelectItem value="none">Sem Role</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((userData) => (
              <TableRow key={userData.id}>
                <TableCell className="font-medium">
                  {userData.nome_completo || "Sem nome"}
                </TableCell>
                <TableCell>{userData.email}</TableCell>
                <TableCell>
                  {userData.role === "admin" ? (
                    <Badge variant="default" className="bg-destructive">Admin</Badge>
                  ) : userData.role === "professor" ? (
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
                  {userData.id !== user?.id && userData.role !== "admin" && (
                    isAdmin ? (
                      <Select
                        value={userData.role || "none"}
                        onValueChange={(value) => {
                          if (value === "professor" || value === "aluno") {
                            changeUserRole(userData.id, value);
                          }
                        }}
                        disabled={actionLoading === userData.id}
                      >
                        <SelectTrigger className="w-[140px] ml-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="aluno">Aluno</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <>
                        {userData.role === "aluno" && (
                          <Button
                            onClick={() => changeUserRole(userData.id, "professor")}
                            disabled={actionLoading === userData.id}
                            size="sm"
                            variant="outline"
                          >
                            Promover
                          </Button>
                        )}
                        {userData.role === "professor" && (
                          <Button
                            onClick={() => changeUserRole(userData.id, "aluno")}
                            disabled={actionLoading === userData.id}
                            size="sm"
                            variant="outline"
                          >
                            Rebaixar
                          </Button>
                        )}
                      </>
                    )
                  )}
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
