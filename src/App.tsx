import { FormEvent, useMemo, useState } from "react";
import { starterPosts, weekPlans } from "./posts";
import { cleanText, makeId, safeRead, safeWrite } from "./security";
import type { Category, Post, PostDraft } from "./types";

const STORAGE_KEY = "nsu-blog-posts-v2";
const categories: Category[] = ["로드맵", "웹개발", "데이터분석", "AI서비스", "인프라", "마케팅", "보안"];

const emptyDraft: PostDraft = {
  title: "",
  category: "로드맵",
  excerpt: "",
  body: "",
  tags: [],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function estimateReadMinutes(body: string) {
  return Math.max(1, Math.ceil(body.replace(/\s+/g, "").length / 650));
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => cleanText(tag, 20))
    .filter(Boolean)
    .slice(0, 6);
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>(() => safeRead(STORAGE_KEY, starterPosts));
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const [tagInput, setTagInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "전체">("전체");
  const [selectedId, setSelectedId] = useState(posts[0]?.id ?? "");
  const [message, setMessage] = useState("");

  const filteredPosts = useMemo(() => {
    return activeCategory === "전체" ? posts : posts.filter((post) => post.category === activeCategory);
  }, [activeCategory, posts]);

  const selectedPost = posts.find((post) => post.id === selectedId) ?? posts[0];
  const totalMinutes = posts.reduce((sum, post) => sum + post.readMinutes, 0);

  function persist(nextPosts: Post[]) {
    setPosts(nextPosts);
    safeWrite(STORAGE_KEY, nextPosts);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = cleanText(draft.body, 9000);
    const nextDraft: PostDraft = {
      title: cleanText(draft.title, 90),
      category: draft.category,
      excerpt: cleanText(draft.excerpt, 220),
      body,
      tags: parseTags(tagInput),
    };

    if (!nextDraft.title || !nextDraft.excerpt || nextDraft.body.length < 120) {
      setMessage("제목, 요약, 본문 120자 이상을 채워주세요.");
      return;
    }

    const post: Post = {
      ...nextDraft,
      id: makeId(),
      createdAt: new Date().toISOString(),
      readMinutes: estimateReadMinutes(body),
    };

    persist([post, ...posts].slice(0, 80));
    setDraft(emptyDraft);
    setTagInput("");
    setSelectedId(post.id);
    setMessage("글이 저장되었습니다. 현재 버전은 브라우저 localStorage에 안전하게 보관됩니다.");
  }

  function handleDelete(id: string) {
    const nextPosts = posts.filter((post) => post.id !== id);
    persist(nextPosts);
    setSelectedId(nextPosts[0]?.id ?? "");
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[#f7faf7]/90 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="#home" className="flex items-center gap-3 font-black" aria-label="NSU AI 창업 블로그 홈">
            <span className="grid size-11 place-items-center rounded-lg bg-zinc-950 text-sm text-white">NSU</span>
            <span className="text-lg">AI Founder Log</span>
          </a>
          <nav className="flex gap-4 overflow-x-auto text-sm font-bold text-zinc-600" aria-label="주요 메뉴">
            <a className="whitespace-nowrap hover:text-zinc-950" href="#roadmap">로드맵</a>
            <a className="whitespace-nowrap hover:text-zinc-950" href="#posts">글</a>
            <a className="whitespace-nowrap hover:text-zinc-950" href="#writer">글쓰기</a>
            <a className="whitespace-nowrap hover:text-zinc-950" href="#monetize">수익화</a>
          </nav>
        </div>
      </header>

      <section id="home" className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[0.95fr_1.05fr] md:px-8 md:py-16">
        <div className="flex flex-col justify-center">
          <p className="mb-3 text-sm font-black uppercase text-emerald-700">AI Coding · Blog · Product · Revenue</p>
          <h1 className="text-5xl font-black leading-tight tracking-normal md:text-7xl">
            AI 도구로 만들고, 데이터로 키우는 1인 창업 블로그
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
            조코딩 부트캠프 요약을 바탕으로 웹 개발, 애드센스, 분석, OpenAI API, Supabase, 앱 출시까지 한 흐름으로 정리하는 NSU의 실전 기록장입니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a className="rounded-lg bg-zinc-950 px-5 py-3 font-black text-white" href="#roadmap">5주 로드맵 보기</a>
            <a className="rounded-lg border border-zinc-300 bg-white px-5 py-3 font-black" href="#writer">새 글 쓰기</a>
          </div>
        </div>
        <img
          className="h-full min-h-72 w-full rounded-lg object-cover shadow-2xl shadow-zinc-200"
          src="/blog-hero.png"
          alt="블로그 콘텐츠 운영 화면과 분석 자료가 놓인 작업 공간"
        />
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-zinc-200 px-5 md:grid-cols-4 md:divide-x md:divide-y-0 md:px-8">
          <Stat label="발행 글" value={`${posts.length}`} />
          <Stat label="로드맵 단계" value={`${weekPlans.length}`} />
          <Stat label="총 읽기 시간" value={`${totalMinutes}분`} />
          <Stat label="광고 상태" value="승인 준비" />
        </div>
      </section>

      <section id="roadmap" className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="mb-7 max-w-3xl">
          <p className="text-sm font-black uppercase text-emerald-700">Bootcamp Summary</p>
          <h2 className="mt-2 text-4xl font-black leading-tight">5주 실전 로드맵</h2>
          <p className="mt-4 leading-8 text-zinc-700">
            영상의 핵심 흐름을 블로그 운영 계획으로 바꿨습니다. 각 단계는 글 주제이면서 동시에 실제 기능 개발 순서입니다.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {weekPlans.map((plan) => (
            <article key={plan.week} className="rounded-lg border border-zinc-200 bg-white p-5">
              <p className="text-sm font-black text-emerald-700">{plan.week}</p>
              <h3 className="mt-2 text-xl font-black leading-snug">{plan.title}</h3>
              <p className="mt-2 text-sm font-bold text-zinc-500">{plan.timecode}</p>
              <p className="mt-4 text-sm leading-6 text-zinc-700">{plan.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {plan.stack.map((item) => (
                  <span key={item} className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
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
                <span className="mt-2 block text-sm text-zinc-600">
                  {formatDate(post.createdAt)} · {post.readMinutes}분
                </span>
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
                  <p className="mt-3 text-sm text-zinc-500">
                    {formatDate(selectedPost.createdAt)} · 예상 {selectedPost.readMinutes}분
                  </p>
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
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedPost.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-700">
                    #{tag}
                  </span>
                ))}
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
            <h2 className="mt-3 text-4xl font-black leading-tight">로드맵에 맞춰 새 글 작성하기</h2>
            <p className="mt-5 leading-8 text-zinc-300">
              지금은 브라우저 저장 방식입니다. 입력값은 길이 제한과 제어문자 제거를 거치고, 본문은 HTML 실행 없이 텍스트로만 렌더링합니다.
            </p>
          </div>

          <form className="grid gap-4 rounded-lg bg-white p-5 text-zinc-950" onSubmit={handleSubmit}>
            <label className="grid gap-2 font-bold">
              제목
              <input
                className="rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
                value={draft.title}
                maxLength={90}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="예: OpenAI API를 블로그 글쓰기 도우미로 연결하기"
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
                maxLength={220}
                onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })}
                placeholder="검색 결과와 카드에 보일 짧은 설명"
              />
            </label>
            <label className="grid gap-2 font-bold">
              태그
              <input
                className="rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
                value={tagInput}
                maxLength={120}
                onChange={(event) => setTagInput(event.target.value)}
                placeholder="예: React, OpenAI, 수익화"
              />
            </label>
            <label className="grid gap-2 font-bold">
              본문
              <textarea
                className="min-h-56 resize-y rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-700"
                value={draft.body}
                maxLength={9000}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                placeholder="본문을 입력하세요. HTML 태그를 넣어도 실행되지 않고 텍스트로 표시됩니다."
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-zinc-600">{message || "본문은 최소 120자 이상 권장합니다."}</p>
              <button className="rounded-lg bg-emerald-700 px-5 py-3 font-black text-white" type="submit">
                글 저장
              </button>
            </div>
          </form>
        </div>
      </section>

      <section id="monetize" className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <InfoCard
            title="애드센스 승인 준비"
            body="고유 콘텐츠, 명확한 메뉴, 개인정보처리방침, 문의 페이지, 모바일 가독성을 먼저 갖춘 뒤 광고 코드를 연결합니다."
          />
          <InfoCard
            title="분석 도구 연결"
            body="GA4와 Clarity는 방문자의 유입, 스크롤, 클릭, 이탈 지점을 확인하기 위한 다음 단계입니다."
          />
          <InfoCard
            title="보안 기본값"
            body="API 키는 프론트엔드에 넣지 않고, 사용자 입력은 HTML로 실행하지 않으며, 실제 서버 전환 시 인증과 권한을 분리합니다."
          />
        </div>
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
