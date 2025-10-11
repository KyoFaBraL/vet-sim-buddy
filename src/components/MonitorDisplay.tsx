import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface MonitorDisplayProps {
  label: string;
  value: number | string;
  unit?: string;
  isNormal: boolean;
  isCritical: boolean;
  className?: string;
  tooltip?: {
    description: string;
    normal: string;
    clinical: string;
  };
}

const MonitorDisplay = ({ label, value, unit, isNormal, isCritical, className, tooltip }: MonitorDisplayProps) => {
  const getStatusColor = () => {
    if (isCritical) return "text-monitor-critical";
    if (!isNormal) return "text-monitor-warning";
    return "text-monitor-normal";
  };

  return (
    <div className={cn("relative p-4 rounded-lg bg-monitor-bg border-2 border-monitor-grid", className)}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-monitor-text/60 font-medium tracking-wider uppercase">
          {label}
        </div>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-monitor-text/40 hover:text-monitor-text/80 cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-4" side="left">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">{tooltip.description}</p>
                  <p className="text-xs text-muted-foreground">{tooltip.normal}</p>
                  <p className="text-xs">{tooltip.clinical}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className={cn("text-4xl font-bold font-mono tabular-nums tracking-tight", getStatusColor())}>
        {typeof value === 'number' ? value.toFixed(2) : value}
        {unit && <span className="text-2xl ml-2 text-monitor-text/70">{unit}</span>}
      </div>
      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-monitor-text/20 to-transparent animate-pulse" 
             style={{ top: '50%' }} />
      </div>
    </div>
  );
};

export default MonitorDisplay;
