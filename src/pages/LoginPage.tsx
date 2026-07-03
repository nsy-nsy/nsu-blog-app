import type { FormEvent } from "react";
import { LogIn, ShieldCheck } from "lucide-react";

type LoginPageProps = {
  loginId: string;
  loginMessage: string;
  loginPasscode: string;
  loginPending: boolean;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  setLoginId: (value: string) => void;
  setLoginPasscode: (value: string) => void;
};

export function LoginPage({ loginId, loginMessage, loginPasscode, loginPending, onLogin, setLoginId, setLoginPasscode }: LoginPageProps) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-10 md:px-8 md:py-16">
      <div className="col-span-12 flex flex-col justify-center md:col-span-5">
        <p className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300">Owner Access</p>
        <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">로그인 후 글을 작성하세요</h1>
        <p className="mt-5 max-w-md text-[15px] leading-7 text-zinc-650 dark:text-slate-300">
          글쓰기는 백엔드와 MySQL 인증을 통과한 관리자만 사용할 수 있습니다. 처음 로그인할 때 입력한 비밀번호가 서버에 해시로 저장됩니다.
        </p>
        <div className="mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <ShieldCheck size={15} />
          게시글 작성 보호
        </div>
      </div>

      <form className="col-span-12 grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/30 md:col-span-7 md:p-6" onSubmit={onLogin}>
        <label className="grid gap-2 text-sm font-extrabold">
          아이디
          <input
            autoComplete="username"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900"
            disabled={loginPending}
            maxLength={24}
            onChange={(event) => setLoginId(event.target.value)}
            placeholder="관리자 아이디"
            value={loginId}
          />
        </label>
        <label className="grid gap-2 text-sm font-extrabold">
          비밀번호
          <input
            autoComplete="current-password"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900"
            disabled={loginPending}
            maxLength={40}
            onChange={(event) => setLoginPasscode(event.target.value)}
            placeholder="비밀번호 입력"
            type="password"
            value={loginPasscode}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {loginMessage || "관리자 아이디와 사용할 비밀번호 8자 이상을 입력하세요."}
          </p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200" disabled={loginPending} type="submit">
            <LogIn size={17} />
            {loginPending ? "확인 중" : "로그인"}
          </button>
        </div>
      </form>
    </section>
  );
}
