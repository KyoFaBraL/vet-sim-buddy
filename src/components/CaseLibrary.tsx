import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Cat, Dog, BookOpen, TrendingUp, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Case {
  id: number;
  nome: string;
  especie: string;
  user_id: string | null;
  condicoes?: {
    nome: string;
  };
}

interface CaseLibraryProps {
  selectedCaseId: number;
  onCaseSelect: (caseId: number) => void;
}

export const CaseLibrary = ({ selectedCaseId, onCaseSelect }: CaseLibraryProps) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [especieFilter, setEspecieFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cases, especieFilter, searchTerm]);

  const loadCases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("casos_clinicos")
      .select(`
        id,
        nome,
        especie,
        user_id,
        condicoes (nome)
      `)
      .order("criado_em", { ascending: false });

    if (!error && data) {
      setCases(data);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...cases];

    // Filtro por espécie
    if (especieFilter !== "todos") {
      filtered = filtered.filter(c => c.especie?.toLowerCase() === especieFilter);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.condicoes?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCases(filtered);
  };

  const getDifficulty = (caseItem: Case) => {
    // Lógica simplificada de dificuldade baseada no nome da condição
    const condicao = caseItem.condicoes?.nome?.toLowerCase() || "";
    if (condicao.includes("grave") || condicao.includes("severa") || condicao.includes("crítica")) {
      return { label: "Difícil", color: "destructive" };
    }
    if (condicao.includes("moderada") || condicao.includes("aguda")) {
      return { label: "Médio", color: "warning" };
    }
    return { label: "Fácil", color: "success" };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Carregando casos...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Biblioteca de Casos Clínicos
        </CardTitle>
        <CardDescription>
          Explore e selecione casos para praticar
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar</label>
            <Input
              placeholder="Nome do caso ou condição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Espécie</label>
            <Select value={especieFilter} onValueChange={setEspecieFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="canino">
                  <div className="flex items-center gap-2">
                    <Dog className="h-4 w-4" />
                    Canino
                  </div>
                </SelectItem>
                <SelectItem value="felino">
                  <div className="flex items-center gap-2">
                    <Cat className="h-4 w-4" />
                    Felino
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Casos */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum caso encontrado com esses filtros</p>
            </div>
          ) : (
            filteredCases.map((caso) => {
              const difficulty = getDifficulty(caso);
              const isSelected = caso.id === selectedCaseId;
              
              return (
                <Card
                  key={caso.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected 
                      ? 'border-primary border-2 bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => onCaseSelect(caso.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {caso.especie?.toLowerCase() === 'felino' ? (
                            <Cat className="h-5 w-5 text-primary" />
                          ) : (
                            <Dog className="h-5 w-5 text-primary" />
                          )}
                          <h4 className="font-semibold">{caso.nome}</h4>
                          {caso.user_id && (
                            <Badge variant="secondary" className="text-xs">
                              Personalizado
                            </Badge>
                          )}
                        </div>
                        
                        {caso.condicoes?.nome && (
                          <p className="text-sm text-muted-foreground">
                            {caso.condicoes.nome}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={difficulty.color as any}
                            className="flex items-center gap-1"
                          >
                            <TrendingUp className="h-3 w-3" />
                            {difficulty.label}
                          </Badge>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <Button size="sm" variant="default">
                            Selecionado
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
