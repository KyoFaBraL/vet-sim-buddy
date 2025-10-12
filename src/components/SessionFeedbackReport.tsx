import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, ThumbsUp, AlertTriangle, BookOpen, TrendingUp } from "lucide-react";

interface FeedbackData {
  analiseGeral: string;
  pontoFortes: string[];
  areasMelhoria: string[];
  sugestoesEstudo: string[];
  recomendacao: string;
}

interface SessionFeedbackReportProps {
  sessionId: string | null;
  onClose?: () => void;
}

export const SessionFeedbackReport = ({ sessionId, onClose }: SessionFeedbackReportProps) => {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateFeedback = async () => {
    if (!sessionId) {
      toast({
        title: "Erro",
        description: "ID de sessão não fornecido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-session-feedback', {
        body: { sessionId }
      });

      if (error) throw error;

      setFeedback(data.feedback);
      setSessionData(data.sessionData);
      
      toast({
        title: "Relatório Gerado!",
        description: "Seu feedback personalizado está pronto",
      });
    } catch (error: any) {
      console.error('Erro ao gerar feedback:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Complete uma sessão para ver o relatório de feedback</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Gerando relatório personalizado com IA...</p>
        </CardContent>
      </Card>
    );
  }

  if (!feedback) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório Pós-Sessão com IA
          </CardTitle>
          <CardDescription>
            Receba feedback personalizado sobre seu desempenho
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateFeedback} className="w-full">
            Gerar Relatório de Feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusBadge = sessionData?.status === 'won' || sessionData?.status === 'vitoria' ? (
    <Badge className="bg-green-500">Paciente Estabilizado</Badge>
  ) : (
    <Badge variant="destructive">Paciente Faleceu</Badge>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Relatório de Feedback - {sessionData?.caseName}
            </CardTitle>
            <CardDescription className="mt-2 flex items-center gap-2">
              {statusBadge}
              <span>•</span>
              <span>Duração: {Math.floor(sessionData?.duration / 60)}min {sessionData?.duration % 60}s</span>
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Análise Geral */}
        <div>
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Análise Geral
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {feedback.analiseGeral}
          </p>
        </div>

        <div className="border-t my-4" />

        {/* Pontos Fortes */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
            <ThumbsUp className="h-5 w-5" />
            Pontos Fortes
          </h3>
          <ul className="space-y-2">
            {feedback.pontoFortes.map((ponto, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                <span className="text-muted-foreground">{ponto}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t my-4" />

        {/* Áreas de Melhoria */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Áreas de Melhoria
          </h3>
          <ul className="space-y-2">
            {feedback.areasMelhoria.map((area, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 mt-1">▲</span>
                <span className="text-muted-foreground">{area}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t my-4" />

        {/* Sugestões de Estudo */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <BookOpen className="h-5 w-5" />
            Sugestões de Estudo
          </h3>
          <ul className="space-y-2">
            {feedback.sugestoesEstudo.map((sugestao, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">📚</span>
                <span className="text-muted-foreground">{sugestao}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t my-4" />

        {/* Recomendação */}
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <h3 className="font-semibold mb-2">Próximos Passos</h3>
          <p className="text-muted-foreground">
            {feedback.recomendacao}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={generateFeedback} variant="outline" className="flex-1">
            Gerar Novo Relatório
          </Button>
          {onClose && (
            <Button onClick={onClose} className="flex-1">
              Fechar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
