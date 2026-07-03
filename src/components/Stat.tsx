export function Stat({ className, label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={`${className ?? ""} p-6`}>
      <strong className="block text-2xl font-black">{value}</strong>
      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{label}</span>
    </div>
  );
}
