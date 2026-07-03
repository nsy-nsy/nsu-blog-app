export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-5 py-10 text-zinc-950 transition-colors dark:border-zinc-800 dark:bg-black dark:text-white md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
        <div className="col-span-12">
          <div className="flex items-center gap-3 font-black">
            <span className="grid size-10 place-items-center rounded-xl bg-zinc-950 text-sm text-white dark:bg-white dark:text-zinc-950">NSU</span>
            <span>세웅이만의 블로그</span>
          </div>
          <p className="mt-4 max-w-xl leading-7 text-zinc-600 dark:text-zinc-300">
            AI와 웹개발을 직접 실험하며 블로그 수익화까지 기록하는 개인 블로그입니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
