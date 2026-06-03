import { Terminal } from "lucide-react";

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="panel-soft flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center">
      <Terminal className="h-6 w-6 text-text-min" strokeWidth={1.6} />
      <div className="display-title text-base font-medium text-text">{title}</div>
      <p className="max-w-lg font-mono text-[11px] leading-6 text-text-low">{body}</p>
    </div>
  );
}
