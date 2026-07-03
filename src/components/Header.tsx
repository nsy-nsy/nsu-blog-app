import { Home, List, LogIn, LogOut, Menu, Moon, PenLine, Sun, X } from "lucide-react";
import type { AuthUser } from "../auth";
import type { Page, Theme } from "../types";

type HeaderProps = {
  authUser: AuthUser | null;
  isLoggedIn: boolean;
  menuOpen: boolean;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
  onToggleMenu: () => void;
  onToggleTheme: () => void;
  page: Page;
  theme: Theme;
};

export function Header({ authUser, isLoggedIn, menuOpen, onLogout, onNavigate, onToggleMenu, onToggleTheme, page, theme }: HeaderProps) {
  const navItems: Array<{ page: Page; label: string; icon: typeof Home }> = [
    { page: "home", label: "메인페이지", icon: Home },
    { page: "posts", label: "글목록", icon: List },
    { page: isLoggedIn ? "write" : "login", label: "글쓰기", icon: PenLine },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#f7f7f5]/92 px-5 py-4 backdrop-blur-xl transition-colors dark:border-zinc-800 dark:bg-[#050505]/88 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <button className="flex min-w-0 items-center text-left" type="button" onClick={() => onNavigate("home")}>
          <span className="min-w-0">
            <span className="block truncate text-[22px] font-black leading-none text-zinc-950 dark:text-white md:text-2xl">
              NSU BLOG<span className="text-emerald-500">.</span>
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <div className="hidden items-center gap-5 rounded-2xl border border-zinc-200/80 bg-white/70 px-4 py-2 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-950/70 dark:shadow-black/20 md:flex">
            <ThemeButton size="desktop" theme={theme} onToggleTheme={onToggleTheme} />
            <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            <nav className="flex items-center gap-5" aria-label="주요 메뉴">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = page === item.page || (page === "detail" && item.page === "posts") || (page === "login" && item.page === "login");
                return (
                  <button
                    key={item.page}
                    className={`inline-flex items-center gap-1.5 text-[13px] font-extrabold transition ${
                      active
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                    }`}
                    type="button"
                    onClick={() => onNavigate(item.page)}
                  >
                    <Icon size={15} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="max-w-24 truncate text-[12px] font-extrabold text-zinc-500 dark:text-zinc-400">{authUser?.username ?? "관리자"}</span>
                <button className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white" type="button" onClick={onLogout}>
                  <LogOut size={15} />
                  로그아웃
                </button>
              </div>
            ) : (
              <button className={`inline-flex items-center gap-1.5 text-[13px] font-extrabold transition ${page === "login" ? "text-emerald-600 dark:text-emerald-300" : "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"}`} type="button" onClick={() => onNavigate("login")}>
                <LogIn size={15} />
                로그인
              </button>
            )}
          </div>

          <ThemeButton size="mobile" theme={theme} onToggleTheme={onToggleTheme} />
          <button
            aria-expanded={menuOpen}
            aria-label="모바일 메뉴 열기"
            className="relative grid size-10 place-items-center rounded-xl border border-zinc-300 bg-white transition hover:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-400 md:hidden"
            type="button"
            onClick={onToggleMenu}
          >
            <Menu className={`absolute transition duration-300 ${menuOpen ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} size={22} />
            <X className={`absolute transition duration-300 ${menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} size={22} />
          </button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-out md:hidden ${menuOpen ? "max-h-96 translate-y-0 opacity-100" : "max-h-0 -translate-y-2 opacity-0"}`}>
        <nav className="mx-auto mt-4 grid max-w-7xl gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.page || (page === "detail" && item.page === "posts");
            return (
              <button
                key={item.page}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left font-black ${
                  active ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-700 dark:text-zinc-300"
                }`}
                type="button"
                onClick={() => onNavigate(item.page)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
          {isLoggedIn ? (
            <div className="grid gap-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
              <span className="px-4 py-1 text-xs font-extrabold text-zinc-500 dark:text-zinc-400">{authUser?.username ?? "관리자"} 로그인 중</span>
              <button className="flex items-center gap-3 rounded-xl px-4 py-3 text-left font-black text-zinc-700 dark:text-zinc-300" type="button" onClick={onLogout}>
                <LogOut size={18} />
                로그아웃
              </button>
            </div>
          ) : (
            <button className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left font-black ${page === "login" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-700 dark:text-zinc-300"}`} type="button" onClick={() => onNavigate("login")}>
              <LogIn size={18} />
              로그인
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

function ThemeButton({ onToggleTheme, size, theme }: { onToggleTheme: () => void; size: "desktop" | "mobile"; theme: Theme }) {
  const buttonSize = size === "desktop" ? "size-8" : "size-10 md:hidden";
  const iconSize = size === "desktop" ? 17 : 20;
  return (
    <button
      aria-label={theme === "dark" ? "라이트모드로 변경" : "다크모드로 변경"}
      className={`relative grid ${buttonSize} place-items-center rounded-xl border border-zinc-300 bg-white text-zinc-950 transition hover:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-zinc-400`}
      type="button"
      onClick={onToggleTheme}
    >
      <Sun className={`absolute transition duration-300 ${theme === "dark" ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} size={iconSize} />
      <Moon className={`absolute transition duration-300 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} size={iconSize} />
    </button>
  );
}
