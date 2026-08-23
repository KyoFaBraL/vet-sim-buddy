import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, X } from "lucide-react";

interface ParameterEffect {
  nome: string;
  valorAntes: number;
  valorDepois: number;
  unidade: string;
}

interface TreatmentFeedbackProps {
  treatmentName: string;
  effects: ParameterEffect[];
  show: boolean;
  onHide: () => void;
}

export const TreatmentFeedback = ({
  treatmentName,
  effects,
  show,
  onHide
}: TreatmentFeedbackProps) => {
  const [visible, setVisible] = useState(false);

  const dismiss = () => {
    setVisible(false);
    setTimeout(onHide, 300);
  };

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(dismiss, 3500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show && !visible) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } left-2 right-2 bottom-2 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md`}
      onClick={dismiss}
    >
      <Card className="p-4 bg-card/95 backdrop-blur-sm border-2 border-primary shadow-lg cursor-pointer">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-base sm:text-lg">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              <span>Tratamento Aplicado</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 rounded"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="text-sm font-medium bg-primary/10 px-3 py-2 rounded">
            {treatmentName}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">
              EFEITOS IMEDIATOS:
            </div>
            {effects.map((effect, index) => {
              const mudanca = effect.valorDepois - effect.valorAntes;
              const isPositivo = mudanca > 0;

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded transition-all duration-300 ${
                    isPositivo
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-2">
                    {isPositivo ? (
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className="font-medium text-sm">{effect.nome}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {effect.valorAntes.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className={`font-bold ${
                      isPositivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {effect.valorDepois.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {effect.unidade}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            Toque para fechar
          </p>
        </div>
      </Card>
    </div>
  );
};
