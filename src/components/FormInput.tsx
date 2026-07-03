export function FormInput({ label, maxLength, onChange, placeholder, value }: { label: string; maxLength: number; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="grid gap-2 font-bold">
      {label}
      <input className="rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900" value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}
