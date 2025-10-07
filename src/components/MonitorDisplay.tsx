import { cn } from "@/lib/utils";

interface MonitorDisplayProps {
  label: string;
  value: number | string;
  unit?: string;
  isNormal: boolean;
  isCritical: boolean;
  className?: string;
}

const MonitorDisplay = ({ label, value, unit, isNormal, isCritical, className }: MonitorDisplayProps) => {
  const getStatusColor = () => {
    if (isCritical) return "text-monitor-critical";
    if (!isNormal) return "text-monitor-warning";
    return "text-monitor-normal";
  };

  return (
    <div className={cn("relative p-4 rounded-lg bg-monitor-bg border-2 border-monitor-grid", className)}>
      <div className="text-xs text-monitor-text/60 font-medium mb-1 tracking-wider uppercase">
        {label}
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
