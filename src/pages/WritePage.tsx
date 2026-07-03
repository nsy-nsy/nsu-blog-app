import type { FormEvent } from "react";
import { FormInput } from "../components/FormInput";
import type { Category, PostDraft } from "../types";

type WritePageProps = {
  categories: Category[];
  draft: PostDraft;
  message: string;
  onDraftChange: (draft: PostDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setTagInput: (tags: string) => void;
  tagInput: string;
};

export function WritePage({ categories, draft, message, onDraftChange, onSubmit, setTagInput, tagInput }: WritePageProps) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-10 md:px-8 md:py-14">
      <div className="col-span-12 md:col-span-4">
        <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">Write</p>
        <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">글쓰기</h1>
        <p className="mt-5 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
          일상 기록, 생활 정보, 컴퓨터 팁처럼 내가 직접 경험한 내용을 작성해보세요. 입력값은 길이 제한과 기본 정리를 거쳐 저장됩니다.
        </p>
      </div>

      <form className="col-span-12 grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 md:col-span-8" onSubmit={onSubmit}>
        <FormInput label="제목" maxLength={90} onChange={(value) => onDraftChange({ ...draft, title: value })} placeholder="예: 컴퓨터가 느려졌을 때 먼저 확인할 것" value={draft.title} />
        <label className="grid gap-2 font-bold">
          카테고리
          <select className="rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900" value={draft.category} onChange={(event) => onDraftChange({ ...draft, category: event.target.value as Category })}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <FormInput label="요약" maxLength={220} onChange={(value) => onDraftChange({ ...draft, excerpt: value })} placeholder="글목록에 보일 짧은 설명" value={draft.excerpt} />
        <FormInput label="태그" maxLength={120} onChange={setTagInput} placeholder="예: 컴퓨터, 윈도우, 일상" value={tagInput} />
        <label className="grid gap-2 font-bold">
          본문
          <textarea className="min-h-72 resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900" value={draft.body} maxLength={9000} onChange={(event) => onDraftChange({ ...draft, body: event.target.value })} placeholder="본문을 입력하세요." />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">{message || "본문은 최소 120자 이상 권장합니다."}</p>
          <button className="rounded-xl bg-zinc-950 px-5 py-3 font-black text-white dark:bg-white dark:text-zinc-950" type="submit">
            글 저장
          </button>
        </div>
      </form>
    </section>
  );
}
