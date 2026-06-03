export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="border border-[rgba(255,59,59,0.34)] bg-[rgba(255,59,59,0.08)] p-3 font-mono text-[11px] leading-5 text-redline">
      {message}
    </div>
  );
}
