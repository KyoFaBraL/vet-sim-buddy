import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Key } from "lucide-react";

interface AccessCodeInputProps {
  onCaseAccessed: (caseId: number) => void;
}

export const AccessCodeInput = ({ onCaseAccessed }: AccessCodeInputProps) => {
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAccessCase = async () => {
    if (!accessCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Digite um código de acesso",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar caso compartilhado usando função segura (SECURITY DEFINER)
      // Esta função previne enumeração de códigos de acesso
      const { data: sharedCases, error: searchError } = await supabase
        .rpc("get_shared_case_by_code", { code: accessCode.trim() });

      if (searchError) throw searchError;

      const sharedCase = sharedCases && sharedCases.length > 0 ? sharedCases[0] : null;

      if (!sharedCase) {
        toast({
          title: "Código inválido",
          description: "Código de acesso não encontrado ou inativo",
          variant: "destructive",
        });
        return;
      }

      // Verificar se já expirou
      if (sharedCase.expira_em && new Date(sharedCase.expira_em) < new Date()) {
        toast({
          title: "Código expirado",
          description: "Este código de acesso já expirou",
          variant: "destructive",
        });
        return;
      }

      // Registrar acesso
      const { error: accessError } = await supabase
        .from("shared_case_access")
        .insert({
          shared_case_id: sharedCase.id,
          user_id: user.id,
        });

      // Ignorar erro se já acessou antes (UNIQUE constraint)
      if (accessError && !accessError.message.includes("duplicate")) {
        throw accessError;
      }

      toast({
        title: "Acesso concedido!",
        description: `Caso "${sharedCase.titulo}" carregado com sucesso`,
      });

      onCaseAccessed(sharedCase.case_id);
      setAccessCode("");
    } catch (error: any) {
      toast({
        title: "Erro ao acessar caso",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          <Label>Código de Acesso</Label>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Digite o código de acesso"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            maxLength={16}
            className="font-mono"
          />
          <Button
            onClick={handleAccessCase}
            disabled={isLoading || !accessCode.trim()}
          >
            {isLoading ? "Verificando..." : "Acessar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Digite o código fornecido pelo seu professor para acessar casos compartilhados
        </p>
      </div>
    </Card>
  );
};
