export function AuthStatusCard({ message }: { message: string }) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-12 px-5 py-10 md:px-8 md:py-16">
      <div className="col-span-12 rounded-xl border border-zinc-200 bg-white p-6 text-sm font-extrabold text-zinc-700 shadow-sm shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:shadow-black/30">
        {message}
      </div>
    </section>
  );
}
