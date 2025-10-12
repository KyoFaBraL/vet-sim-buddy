import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoleSelectorProps {
  userId: string;
  onRoleSet: () => void;
}

export const RoleSelector = ({ userId, onRoleSet }: RoleSelectorProps) => {
  const [selectedRole, setSelectedRole] = useState<"professor" | "aluno">("aluno");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSetRole = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: selectedRole,
        });

      if (error) throw error;

      toast({
        title: "Role definido!",
        description: `Você agora é ${selectedRole === "professor" ? "professor" : "aluno"}`,
      });

      onRoleSet();
    } catch (error: any) {
      toast({
        title: "Erro ao definir role",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Defina seu perfil</h2>
            <p className="text-muted-foreground">
              Escolha seu tipo de usuário para continuar
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de usuário</label>
              <Select
                value={selectedRole}
                onValueChange={(value: "professor" | "aluno") => setSelectedRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aluno">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Aluno</Badge>
                      <span className="text-sm text-muted-foreground">
                        Acesso a casos e simulações
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="professor">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Professor</Badge>
                      <span className="text-sm text-muted-foreground">
                        Criar e gerenciar casos
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSetRole}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Configurando..." : "Continuar"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
