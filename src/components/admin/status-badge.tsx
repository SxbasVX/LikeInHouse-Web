import { cn } from "@/lib/utils";
import { getStatusStyle, type StatusDomain } from "@/lib/status";

interface StatusBadgeProps {
  domain: StatusDomain;
  status: string | null | undefined;
  className?: string;
}

export function StatusBadge({ domain, status, className }: StatusBadgeProps) {
  const style = getStatusStyle(domain, status);
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
