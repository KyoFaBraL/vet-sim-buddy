import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Key, Copy, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AccessKey {
  id: string;
  access_key: string;
  criado_em: string;
  usado: boolean;
  usado_por: string | null;
  usado_em: string | null;
  expira_em: string | null;
  ativo: boolean;
  descricao: string | null;
}

export function ProfessorAccessKeys() {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const loadKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("professor_access_keys")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar chaves",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const generateKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let key = "";
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) key += "-";
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleCreateKey = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const newKey = generateKey();

      const { error } = await supabase
        .from("professor_access_keys")
        .insert({
          access_key: newKey,
          criado_por: user.id,
          descricao: description || null,
        });

      if (error) throw error;

      toast({
        title: "Chave criada!",
        description: "Nova chave de acesso gerada com sucesso.",
      });

      setDescription("");
      loadKeys();
    } catch (error: any) {
      toast({
        title: "Erro ao criar chave",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Chave copiada!",
      description: "A chave foi copiada para a área de transferência.",
    });
  };

  const handleDeactivateKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from("professor_access_keys")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Chave desativada",
        description: "A chave foi desativada com sucesso.",
      });

      loadKeys();
    } catch (error: any) {
      toast({
        title: "Erro ao desativar chave",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Chaves de Acesso Professor</CardTitle>
            <CardDescription>
              Gere chaves para permitir que novos professores se cadastrem
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              placeholder="Ex: Chave para Prof. João"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreateKey} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Gerar Nova Chave
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chave</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma chave criada ainda
                  </TableCell>
                </TableRow>
              ) : (
                keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-mono text-sm">
                      {key.access_key}
                    </TableCell>
                    <TableCell>{key.descricao || "-"}</TableCell>
                    <TableCell>
                      {!key.ativo ? (
                        <Badge variant="secondary">Desativada</Badge>
                      ) : key.usado ? (
                        <Badge variant="outline">Usada</Badge>
                      ) : (
                        <Badge>Disponível</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(key.criado_em), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyKey(key.access_key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {key.ativo && !key.usado && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeactivateKey(key.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
