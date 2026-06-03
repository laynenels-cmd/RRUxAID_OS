import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: ReactNode;
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex items-center justify-center gap-2 border font-mono uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "h-8 px-3 text-[10px]" : "h-10 px-4 text-[11px]",
        variant === "primary" &&
          "border-[rgba(0,255,102,0.36)] bg-[rgba(0,255,102,0.1)] text-accent hover:bg-[rgba(0,255,102,0.16)]",
        variant === "secondary" &&
          "border-line bg-bg-2 text-text-dim hover:border-line-hi hover:text-text",
        variant === "ghost" &&
          "border-transparent bg-transparent text-text-low hover:border-line hover:text-text",
        variant === "danger" &&
          "border-[rgba(255,59,59,0.36)] bg-[rgba(255,59,59,0.08)] text-redline hover:bg-[rgba(255,59,59,0.14)]",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
