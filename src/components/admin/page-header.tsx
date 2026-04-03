import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-darkRed leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="font-serif italic text-brand-teal text-lg mt-0.5 leading-snug">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
