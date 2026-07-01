import { Badge } from "@/components/ui/badge";
import { getStatusDisplay } from "@/lib/status-display";
import { cn } from "@/lib/utils";

export type StatusBadgeProps = {
  status: string;
  /** Override the default label for this status code. */
  label?: string;
  className?: string;
  showIcon?: boolean;
};

export function StatusBadge({
  status,
  label,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const display = getStatusDisplay(status);
  const Icon = display.icon;
  const text = label ?? display.label;

  return (
    <Badge variant={display.variant} className={cn("text-xs", className)}>
      {showIcon ? <Icon aria-hidden /> : null}
      {text}
    </Badge>
  );
}
