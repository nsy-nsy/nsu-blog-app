import { FormEvent, useMemo, useState } from "react";
import { cleanText, makeId, safeRead, safeWrite } from "./security";
import { starterPosts } from "./posts";
import type { Category, Post, PostDraft } from "./types";

const STORAGE_KEY = "nsu-blog-posts-v1";
const categories: Category[] = ["블로그 운영", "콘텐츠 작성", "수익화", "보안"];

const emptyDraft: PostDraft = {
  title: "",
  category: "블로그 운영",
  excerpt: "",
  body: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>(() => safeRead(STORAGE_KEY, starterPosts));
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const [activeCategory, setActiveCategory] = useState<Category | "전체">("전체");
  const [selectedId, setSelectedId] = useState(posts[0]?.id ?? "");
  const [message, setMessage] = useState("");

  const filteredPosts = useMemo(() => {
    return activeCategory === "전체" ? posts : posts.filter((post) => post.category === activeCategory);
  }, [activeCategory, posts]);

  const selectedPost = posts.find((post) => post.id === selectedId) ?? posts[0];

  function persist(nextPosts: Post[]) {
    setPosts(nextPosts);
    safeWrite(STORAGE_KEY, nextPosts);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextDraft: PostDraft = {
      title: cleanText(draft.title, 80),
      category: draft.category,
      excerpt: cleanText(draft.excerpt, 180),
      body: cleanText(draft.body, 6000),
    };

    if (!nextDraft.title || !nextDraft.excerpt || nextDraft.body.length < 80) {
      setMessage("제목, 요약, 본문 80자 이상을 채워주세요.");
      return;
    }

    const post: Post = {
      ...nextDraft,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };

    persist([post, ...posts].slice(0, 50));
    setDraft(emptyDraft);
    setSelectedId(post.id);
    setMessage("글이 안전하게 저장되었습니다. 이 버전은 브라우저 localStorage에 보관됩니다.");
  }

  function handleDelete(id: string) {
    const nextPosts = posts.filter((post) => post.id !== id);
    persist(nextPosts);
    setSelectedId(nextPosts[0]?.id ?? "");
  }

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-stone-50/90 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="#home" className="flex items-center gap-3 font-black" aria-label="NSU Blog Studio 홈">
            <span className="grid size-11 place-items-center rounded-lg bg-zinc-950 text-sm text-white">NSU</span>
            <span className="text-lg">Blog Studio</span>
          </a>
          <nav className="flex gap-4 overflow-x-auto text-sm font-bold text-zinc-600" aria-label="주요 메뉴">
            <a className="whitespace-nowrap hover:text-zinc-950" href="#posts">글 목록</a>
            <a className="whitespace-nowrap hover:text-zinc-950" href="#writer">글쓰기</a>
            <a className="whitespace-nowrap hover:text-zinc-950" href="#security">보안</a>
          </nav>
        </div>
      </header>

      <section id="home" className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[0.95fr_1.05fr] md:px-8 md:py-16">
        <div className="flex flex-col justify-center">
          <p className="mb-3 text-sm font-black uppercase text-emerald-700">React · Vite · TypeScript · Tailwind CSS 4.3</p>
          <h1 className="text-5xl font-black leading-tight tracking-normal md:text-7xl">
            NSU 이름으로 운영하는 수익형 블로그 작업실
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-650">
            글을 작성하고, 카테고리별로 정리하고, 애드센스 승인에 필요한 기본 페이지와 보안 원칙을 함께 점검하는 프론트엔드 앱입니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a className="rounded-lg bg-zinc-950 px-5 py-3 font-black text-white" href="#writer">글 작성하기</a>
            <a className="rounded-lg border border-zinc-300 bg-white px-5 py-3 font-black" href="#posts">글 살펴보기</a>
          </div>
        </div>
        <img
          className="h-full min-h-72 w-full rounded-lg object-cover shadow-2xl shadow-zinc-200"
          src="/blog-hero.png"
          alt="블로그 콘텐츠 운영 화면과 분석 자료가 놓인 작업 공간"
        />
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-zinc-200 px-5 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8">
          <Stat label="저장된 글" value={`${posts.length}`} />
          <Stat label="카테고리" value={`${categories.length}`} />
          <Stat label="광고 코드" value="승인 후 연결" />
        </div>
      </section>

      <section id="posts" className="mx-auto grid max-w-7xl gap-7 px-5 py-14 md:grid-cols-[360px_1fr] md:px-8">
        <aside className="space-y-5">
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-xl font-black">카테고리</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["전체", ...categories] as const).map((category) => (
                <button
                  key={category}
                  className={`rounded-lg border px-3 py-2 text-sm font-black ${
                    activeCategory === category ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white"
                  }`}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {filteredPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedId(post.id)}
                className={`rounded-lg border p-4 text-left transition ${
                  selectedPost?.id === post.id ? "border-emerald-700 bg-emerald-50" : "border-zinc-200 bg-white hover:border-zinc-400"
                }`}
              >
                <span className="text-xs font-black text-emerald-700">{post.category}</span>
                <strong className="mt-2 block leading-snug">{post.title}</strong>
                <span className="mt-2 block text-sm text-zinc-600">{formatDate(post.createdAt)}</span>
              </button>
            ))}
          </div>
        </aside>

        <article className="rounded-lg border border-zinc-200 bg-white p-6 md:p-8">
          {selectedPost ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-emerald-700">{selectedPost.category}</p>
                  <h2 className="mt-2 text-3xl font-black leading-tight md:text-5xl">{selectedPost.title}</h2>
                  <p className="mt-3 text-sm text-zinc-500">{formatDate(selectedPost.createdAt)}</p>
                </div>
                {!selectedPost.id.startsWith("starter-") && (
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700"
                    onClick={() => handleDelete(selectedPost.id)}
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="mt-8 border-l-4 border-emerald-600 pl-4 text-lg font-bold text-zinc-700">{selectedPost.excerpt}</p>
              <div className="mt-8 whitespace-pre-wrap text-lg leading-9 text-zinc-800">{selectedPost.body}</div>
            </>
          ) : (
            <p className="text-zinc-600">아직 글이 없습니다. 아래 글쓰기에서 첫 글을 작성해보세요.</p>
          )}
        </article>
      </section>

      <section id="writer" className="bg-zinc-950 px-5 py-14 text-white md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-black uppercase text-emerald-300">Writer</p>
            <h2 className="mt-3 text-4xl font-black leading-tight">브라우저에 안전하게 저장되는 글쓰기</h2>
            <p className="mt-5 leading-8 text-zinc-300">
              이 데모는 서버 없이 localStorage에 저장합니다. 입력값은 길이 제한과 제어문자 제거를 거치고, 본문은 HTML이 아니라 텍스트로 렌더링합니다.
            </p>
          </div>

          <form className="grid gap-4 rounded-lg bg-white p-5 text-zinc-950" onSubmit={handleSubmit}>
            <label className="grid gap-2 font-bold">
              제목
              <input
                className="rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
                value={draft.title}
                maxLength={80}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="예: 초보 블로그 첫 글 작성법"
              />
            </label>
            <label className="grid gap-2 font-bold">
              카테고리
              <select
                className="rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 font-bold">
              요약
              <input
                className="rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
                value={draft.excerpt}
                maxLength={180}
                onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })}
                placeholder="검색 결과와 카드에 보일 짧은 설명"
              />
            </label>
            <label className="grid gap-2 font-bold">
              본문
              <textarea
                className="min-h-52 resize-y rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
                value={draft.body}
                maxLength={6000}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                placeholder="본문을 입력하세요. HTML 태그를 넣어도 실행되지 않고 텍스트로 표시됩니다."
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-zinc-600">{message || "본문은 최소 80자 이상 권장합니다."}</p>
              <button className="rounded-lg bg-emerald-700 px-5 py-3 font-black text-white" type="submit">
                글 저장
              </button>
            </div>
          </form>
        </div>
      </section>

      <section id="security" className="mx-auto grid max-w-7xl gap-5 px-5 py-14 md:grid-cols-3 md:px-8">
        <InfoCard title="XSS 방어" body="사용자 입력을 HTML로 삽입하지 않고 React의 기본 escaping과 텍스트 렌더링을 사용합니다." />
        <InfoCard title="CSP 적용" body="기본 Content Security Policy를 넣어 외부 스크립트와 객체 삽입을 차단합니다." />
        <InfoCard title="광고 연결" body="애드센스 승인 후 CSP와 광고 스크립트 허용 도메인을 명시적으로 추가하는 방식으로 연결하세요." />
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-6">
      <strong className="block text-3xl font-black">{value}</strong>
      <span className="text-sm font-bold text-zinc-600">{label}</span>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-3 leading-7 text-zinc-600">{body}</p>
    </article>
  );
}
