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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Search, Pencil, Check, X } from "lucide-react";

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
  const [pendingChange, setPendingChange] = useState<{ userId: string; newRole: "professor" | "aluno"; userName: string } | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState("");
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

  const saveUserName = async (userId: string) => {
    if (!editNameValue.trim()) {
      toast({ title: "Erro", description: "Nome não pode ser vazio", variant: "destructive" });
      return;
    }
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.rpc("admin_update_user_name", {
        target_user_id: userId,
        new_name: editNameValue,
      });
      if (error) throw error;
      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        setEditingName(null);
        fetchUsers();
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao atualizar nome:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o nome", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const saveUserEmail = async (userId: string) => {
    if (!editEmailValue.trim()) {
      toast({ title: "Erro", description: "Email não pode ser vazio", variant: "destructive" });
      return;
    }
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.rpc("admin_update_user_email", {
        target_user_id: userId,
        new_email: editEmailValue,
      });
      if (error) throw error;
      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        setEditingEmail(null);
        fetchUsers();
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao atualizar email:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o email", variant: "destructive" });
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
                  {isAdmin && editingName === userData.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        className="h-8 w-[200px]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveUserName(userData.id);
                          if (e.key === "Escape") setEditingName(null);
                        }}
                        disabled={actionLoading === userData.id}
                      />
                      <Button variant="ghost" size="sm" onClick={() => saveUserName(userData.id)} disabled={actionLoading === userData.id}>
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingName(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {userData.nome_completo || "Sem nome"}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setEditingName(userData.id);
                            setEditNameValue(userData.nome_completo || "");
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {isAdmin && editingEmail === userData.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editEmailValue}
                        onChange={(e) => setEditEmailValue(e.target.value)}
                        className="h-8 w-[220px]"
                        type="email"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveUserEmail(userData.id);
                          if (e.key === "Escape") setEditingEmail(null);
                        }}
                        disabled={actionLoading === userData.id}
                      />
                      <Button variant="ghost" size="sm" onClick={() => saveUserEmail(userData.id)} disabled={actionLoading === userData.id}>
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingEmail(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {userData.email}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setEditingEmail(userData.id);
                            setEditEmailValue(userData.email || "");
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
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
                  {isAdmin && userData.id !== user?.id && userData.role !== "admin" && (
                    <Select
                      value={userData.role || "none"}
                      onValueChange={(value) => {
                        if (value === "professor" || value === "aluno") {
                          setPendingChange({ userId: userData.id, newRole: value, userName: userData.nome_completo || "Sem nome" });
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
                  )}
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <AlertDialog open={!!pendingChange} onOpenChange={(open) => !open && setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de nível</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o nível de <strong>{pendingChange?.userName}</strong> para <strong>{pendingChange?.newRole === "professor" ? "Professor" : "Aluno"}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingChange) {
                changeUserRole(pendingChange.userId, pendingChange.newRole);
                setPendingChange(null);
              }
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
