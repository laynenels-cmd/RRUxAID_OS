import { clsx } from "clsx";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mono-label mb-2 block">{children}</label>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "focus-ring h-10 w-full border border-line bg-bg px-3 font-mono text-[12px] text-text placeholder:text-text-min",
        props.className,
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "focus-ring min-h-24 w-full resize-y border border-line bg-bg px-3 py-2 font-mono text-[12px] text-text placeholder:text-text-min",
        props.className,
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "focus-ring h-10 w-full border border-line bg-bg px-3 font-mono text-[12px] text-text",
        props.className,
      )}
    />
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-2 font-mono text-[11px] text-redline">{children}</p>;
}
