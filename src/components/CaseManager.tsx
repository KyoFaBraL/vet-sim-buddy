import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles, Loader2, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Wrench } from "lucide-react";

interface CaseManagerProps {
  onCaseCreated: () => void;
}

interface Condition {
  id: number;
  nome: string;
}

interface CustomCase {
  id: number;
  nome: string;
  descricao: string;
  especie: string;
  id_condicao_primaria: number;
}

interface CaseValidation {
  valido: boolean;
  pontuacao: number;
  tipo_disturbio: string;
  problemas: string[];
  sugestoes: string[];
  resumo: string;
}

export const CaseManager = ({ onCaseCreated }: CaseManagerProps) => {
  const [open, setOpen] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [customCases, setCustomCases] = useState<CustomCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingRandom, setGeneratingRandom] = useState(false);
  const [validatingCase, setValidatingCase] = useState<number | null>(null);
  const [validationResults, setValidationResults] = useState<Record<number, CaseValidation>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    especie: "canino",
    id_condicao_primaria: "",
  });

  useEffect(() => {
    loadConditions();
    loadCustomCases();
  }, []);

  const loadConditions = async () => {
    const { data, error } = await supabase
      .from("condicoes")
      .select("id, nome")
      .order("nome");

    if (error) {
      toast({ title: "Erro ao carregar condições", description: error.message, variant: "destructive" });
      return;
    }
    setConditions(data || []);
  };

  const loadCustomCases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("casos_clinicos")
      .select("id, nome, descricao, especie, id_condicao_primaria")
      .eq("user_id", user.id)
      .order("criado_em", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar casos", description: error.message, variant: "destructive" });
      return;
    }
    setCustomCases(data || []);
  };

  const validateCase = async (caseId: number) => {
    setValidatingCase(caseId);
    try {
      const { data, error } = await supabase.functions.invoke('validate-case-acidbase', {
        body: { caseId }
      });

      if (error) throw error;

      if (data?.validation) {
        setValidationResults(prev => ({ ...prev, [caseId]: data.validation }));
        
        if (data.validation.valido) {
          toast({
            title: "✅ Caso válido!",
            description: `Pontuação: ${data.validation.pontuacao}/100 — ${data.validation.tipo_disturbio}`,
          });
        } else {
          toast({
            title: "⚠️ Caso com problemas",
            description: data.validation.resumo,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({ title: "Erro na validação", description: error.message, variant: "destructive" });
    } finally {
      setValidatingCase(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: newCase, error } = await supabase
        .from("casos_clinicos")
        .insert({
          nome: formData.nome,
          descricao: formData.descricao,
          especie: formData.especie.toLowerCase(),
          id_condicao_primaria: parseInt(formData.id_condicao_primaria),
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Caso criado!", description: "Gerando parâmetros com IA e validando..." });

      // Populate data
      const [populateResult] = await Promise.allSettled([
        supabase.functions.invoke('populate-case-data', { body: { caseId: newCase.id } }),
      ]);

      if (populateResult.status === 'fulfilled' && !populateResult.value.error) {
        toast({ title: "Dados gerados!", description: "Parâmetros e tratamentos criados. Validando caso..." });
      } else {
        toast({ title: "Aviso", description: "Caso criado mas houve erro ao gerar dados automáticos.", variant: "destructive" });
      }

      // After populate, validate the case
      setFormData({ nome: "", descricao: "", especie: "canino", id_condicao_primaria: "" });
      setOpen(false);
      await loadCustomCases();
      onCaseCreated();

      // Auto-validate after creation
      await validateCase(newCase.id);

    } catch (error: any) {
      toast({ title: "Erro ao criar caso", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRandom = async () => {
    setGeneratingRandom(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-random-case');

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "🎲 Caso aleatório criado!",
          description: `"${data.nome}" (${data.especie}) — ${data.parametrosPrimarios} parâmetros, ${data.tratamentos} tratamentos`,
        });
        await loadCustomCases();
        onCaseCreated();

        // Auto-validate
        await validateCase(data.caseId);
      }
    } catch (error: any) {
      toast({ title: "Erro ao gerar caso", description: error.message, variant: "destructive" });
    } finally {
      setGeneratingRandom(false);
    }
  };

  const handleDelete = async (caseId: number) => {
    try {
      const { error } = await supabase.from("casos_clinicos").delete().eq("id", caseId);
      if (error) throw error;

      toast({ title: "Caso excluído", description: "O caso foi removido com sucesso." });
      setValidationResults(prev => {
        const next = { ...prev };
        delete next[caseId];
        return next;
      });
      loadCustomCases();
      onCaseCreated();
    } catch (error: any) {
      toast({ title: "Erro ao excluir caso", description: error.message, variant: "destructive" });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-4">
      {/* Generate random case button */}
      <Button
        onClick={handleGenerateRandom}
        disabled={generatingRandom}
        variant="outline"
        className="w-full border-primary/30 hover:bg-primary/5"
      >
        {generatingRandom ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando caso aleatório com IA...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar Caso Aleatório com IA
          </>
        )}
      </Button>

      {/* Manual case creation dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Criar Caso Personalizado
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Caso Clínico</DialogTitle>
            <DialogDescription>
              Crie um caso personalizado. Após a criação, a IA validará automaticamente se o caso atende aos requisitos de desequilíbrio ácido-básico.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Caso</Label>
              <Input
                id="nome"
                placeholder="Ex: Cão com Insuficiência Cardíaca"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="especie">Espécie</Label>
              <Select value={formData.especie} onValueChange={(value) => setFormData({ ...formData, especie: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="canino">Canino (Cão)</SelectItem>
                  <SelectItem value="felino">Felino (Gato)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condicao">Condição Primária</Label>
              <Select
                value={formData.id_condicao_primaria}
                onValueChange={(value) => setFormData({ ...formData, id_condicao_primaria: value })}
                required
              >
                <SelectTrigger><SelectValue placeholder="Selecione a condição" /></SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition.id} value={condition.id.toString()}>
                      {condition.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição do Caso</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva os sintomas, histórico e contexto do caso..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando e validando..." : "Salvar Caso"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {customCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Meus Casos Personalizados</CardTitle>
            <CardDescription>Gerencie seus casos salvos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {customCases.map((caso) => {
              const validation = validationResults[caso.id];
              const isValidating = validatingCase === caso.id;

              return (
                <div key={caso.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{caso.nome}</p>
                      <p className="text-sm text-muted-foreground">{caso.especie}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => validateCase(caso.id)}
                        disabled={isValidating}
                      >
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(caso.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Validation result */}
                  {validation && (
                    <div className="border-t pt-2 mt-2 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {validation.valido ? (
                          <Badge variant="default">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Válido
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" /> Inválido
                          </Badge>
                        )}
                        <span className={`text-sm font-bold ${getScoreColor(validation.pontuacao)}`}>
                          {validation.pontuacao}/100
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {validation.tipo_disturbio}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{validation.resumo}</p>

                      {validation.problemas.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Problemas:
                          </p>
                          <ul className="text-xs text-muted-foreground list-disc pl-4">
                            {validation.problemas.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                      )}

                      {validation.sugestoes.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-primary flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Sugestões:
                          </p>
                          <ul className="text-xs text-muted-foreground list-disc pl-4">
                            {validation.sugestoes.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
