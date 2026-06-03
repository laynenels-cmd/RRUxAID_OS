import { clsx } from "clsx";

type Tone = "green" | "cyan" | "amber" | "red" | "neutral";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em]",
        tone === "green" && "border-[rgba(0,255,102,0.34)] bg-[rgba(0,255,102,0.08)] text-accent",
        tone === "cyan" && "border-[rgba(0,229,255,0.32)] bg-[rgba(0,229,255,0.08)] text-cyan",
        tone === "amber" && "border-[rgba(255,176,32,0.34)] bg-[rgba(255,176,32,0.08)] text-amber",
        tone === "red" && "border-[rgba(255,59,59,0.34)] bg-[rgba(255,59,59,0.08)] text-redline",
        tone === "neutral" && "border-line bg-onyx text-text-low",
      )}
    >
      <span className="h-1.5 w-1.5 bg-current" />
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  if (["approved", "complete", "deployed", "active"].includes(status)) return "green";
  if (["review", "running", "doing"].includes(status)) return "cyan";
  if (["draft", "todo", "not_started"].includes(status)) return "neutral";
  if (["blocked", "critical", "high"].includes(status)) return "red";
  return "amber";
}
