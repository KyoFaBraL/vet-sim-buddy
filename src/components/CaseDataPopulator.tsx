import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CaseDataPopulatorProps {
  caseId: number;
  onDataGenerated?: () => void;
}

export const CaseDataPopulator = ({ caseId, onDataGenerated }: CaseDataPopulatorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('populate-case-data', {
        body: { caseId }
      });

      if (error) {
        console.error('Erro ao gerar dados:', error);
        toast({
          title: "Erro",
          description: "Não foi possível gerar os dados do caso",
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `Gerados ${data.parametrosSecundarios} parâmetros secundários e ${data.tratamentosAdequados} tratamentos adequados`,
        });
        onDataGenerated?.();
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar dados",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Gerar Dados com IA
        </CardTitle>
        <CardDescription>
          Use IA para gerar parâmetros secundários e tratamentos adequados para este caso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando dados...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Dados do Caso
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};