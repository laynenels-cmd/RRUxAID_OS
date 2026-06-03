import { type HTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("panel", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  label,
  action,
}: {
  title: string;
  label?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
      <div>
        {label ? <div className="mono-label mb-1">{label}</div> : null}
        <h2 className="display-title text-base font-medium text-text">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={clsx("p-4", className)}>{children}</div>;
}
