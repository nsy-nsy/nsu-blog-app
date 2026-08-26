import { type ChangeEvent, type DragEvent, type FormEvent, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, Heading1, Heading2, ImageIcon, Italic, Link, List, ListOrdered, Minus, Plus, Quote, Strikethrough, Trash2, Type, Underline, Upload, Video } from "lucide-react";
import { FormInput } from "../components/FormInput";
import type { Category, PostDraft, PostMedia } from "../types";

const BODY_MAX_LENGTH = 30_000;
const MAX_MEDIA_FILES = 12;
const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

type WritePageProps = {
  categories: Category[];
  draft: PostDraft;
  message: string;
  onDraftChange: (draft: PostDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setTagInput: (tags: string) => void;
  tagInput: string;
};

function fileToMedia(file: File): Promise<PostMedia> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `${Date.now().toString(36)}-${crypto.randomUUID()}`,
        type: file.type.startsWith("video/") ? "video" : "image",
        src: String(reader.result),
        name: file.name,
      });
    };
    reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
    reader.readAsDataURL(file);
  });
}

export function WritePage({ categories, draft, message, onDraftChange, onSubmit, setTagInput, tagInput }: WritePageProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mediaMessage, setMediaMessage] = useState("");
  const media = draft.media ?? [];

  function updateBody(body: string) {
    onDraftChange({ ...draft, body });
  }

  function insertAtCursor(value: string) {
    const textarea = bodyRef.current;
    const start = textarea?.selectionStart ?? draft.body.length;
    const end = textarea?.selectionEnd ?? draft.body.length;
    const nextBody = `${draft.body.slice(0, start)}${value}${draft.body.slice(end)}`;
    updateBody(nextBody);

    window.requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = start + value.length;
      textarea?.setSelectionRange(cursor, cursor);
    });
  }

  function wrapSelection(before: string, after = before, fallback = "텍스트") {
    const textarea = bodyRef.current;
    const start = textarea?.selectionStart ?? draft.body.length;
    const end = textarea?.selectionEnd ?? draft.body.length;
    const selected = draft.body.slice(start, end) || fallback;
    const nextValue = `${before}${selected}${after}`;
    const nextBody = `${draft.body.slice(0, start)}${nextValue}${draft.body.slice(end)}`;
    updateBody(nextBody);

    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function insertLine(prefix: string, fallback = "내용을 입력하세요") {
    const needsBreak = draft.body && !draft.body.endsWith("\n") ? "\n" : "";
    insertAtCursor(`${needsBreak}${prefix}${fallback}\n`);
  }

  function insertMediaIntoBody(item: PostMedia) {
    insertAtCursor(`\n\n[[media:${item.id}]]\n\n`);
    setMediaMessage(`${item.name}을 본문 위치에 넣었습니다.`);
  }

  async function addFiles(files: FileList | File[]) {
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    if (selected.length === 0) {
      setMediaMessage("이미지 또는 동영상 파일만 추가할 수 있습니다.");
      return;
    }

    const slots = MAX_MEDIA_FILES - media.length;
    if (slots <= 0) {
      setMediaMessage(`미디어는 최대 ${MAX_MEDIA_FILES}개까지 추가할 수 있습니다.`);
      return;
    }

    const accepted = selected.slice(0, slots).filter((file) => file.size <= MAX_MEDIA_BYTES);
    if (accepted.length === 0) {
      setMediaMessage("파일당 최대 25MB까지 추가할 수 있습니다.");
      return;
    }

    const nextMedia = await Promise.all(accepted.map(fileToMedia));
    onDraftChange({ ...draft, media: [...media, ...nextMedia] });
    setMediaMessage(selected.length > accepted.length ? "일부 파일은 개수 또는 용량 제한 때문에 제외되었습니다." : "");
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void addFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.classList.remove("border-emerald-500");
    void addFiles(event.dataTransfer.files);
  }

  function removeMedia(id: string) {
    onDraftChange({ ...draft, media: media.filter((item) => item.id !== id) });
  }

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-5 py-10 md:px-8 md:py-14">
      <div className="col-span-12 md:col-span-4">
        <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">Write</p>
        <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">글쓰기</h1>
        <p className="mt-5 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
          리뷰, 일상 기록, 생활 정보처럼 직접 경험한 내용을 작성해보세요. 긴 글과 여러 미디어를 함께 정리할 수 있습니다.
        </p>
      </div>

      <form className="col-span-12 grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 md:col-span-8" onSubmit={onSubmit}>
        <FormInput label="제목" maxLength={90} onChange={(value) => onDraftChange({ ...draft, title: value })} placeholder="예: 로아 셀라 하이킹 스니커즈 리뷰" value={draft.title} />
        <div className="relative grid gap-2 font-bold">
          <span>카테고리</span>
          <button
            className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left outline-none transition dark:bg-zinc-900 ${
              categoryOpen ? "border-emerald-700 ring-2 ring-emerald-500/20 dark:border-emerald-400" : "border-zinc-300 dark:border-zinc-700"
            }`}
            type="button"
            onClick={() => setCategoryOpen((open) => !open)}
            aria-expanded={categoryOpen}
          >
            <span>{draft.category}</span>
            <ChevronDown className={`mr-2 transition-transform duration-200 ${categoryOpen ? "rotate-180 text-emerald-500" : "text-zinc-500"}`} size={18} />
          </button>
          {categoryOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/50">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`block w-full px-4 py-3 text-left text-sm font-black transition ${
                    draft.category === category ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                  type="button"
                  onClick={() => {
                    onDraftChange({ ...draft, category });
                    setCategoryOpen(false);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
        <FormInput label="요약" maxLength={220} onChange={(value) => onDraftChange({ ...draft, excerpt: value })} placeholder="글목록에 보일 짧은 설명" value={draft.excerpt} />
        <FormInput label="태그" maxLength={120} onChange={setTagInput} placeholder="예: ROA, 로아셀라, 리뷰" value={tagInput} />
        <label className="grid gap-2 font-bold">
          본문
          <div className="sticky top-20 z-10 grid gap-2 rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
            <div className="flex flex-wrap items-center gap-1">
              <button className="editor-tool" type="button" onClick={() => insertLine("# ", "큰 제목")} title="큰 제목">
                <Heading1 size={16} />
              </button>
              <button className="editor-tool" type="button" onClick={() => insertLine("## ", "소제목")} title="소제목">
                <Heading2 size={16} />
              </button>
              <button className="editor-tool" type="button" onClick={() => wrapSelection("**", "**")} title="굵게">
                <Bold size={16} />
              </button>
              <button className="editor-tool" type="button" onClick={() => wrapSelection("*", "*")} title="기울임">
                <Italic size={16} />
              </button>
              <button className="editor-tool" type="button" onClick={() => wrapSelection("__", "__")} title="밑줄">
                <Underline size={16} />
              </button>
              <button className="editor-tool" type="button" onClick={() => wrapSelection("~~", "~~")} title="취소선">
                <Strikethrough size={16} />
              </button>
              <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
              <button className="editor-tool" type="button" onClick={() => insertLine("> ", "인용문")} title="인용문">
                <Quote size={16} />
              </button>
              <button className="editor-tool" type="button" onClick={() => insertLine("- ", "목록")} title="목록">
                <List size={16} />
              </button>
              <button className="editor-tool" type="button" onClick={() => insertLine("1. ", "번호 목록")} title="번호 목록">
                <ListOrdered size={16} />
              </button>
              <button className="editor-tool" type="button" onClick={() => insertAtCursor("\n---\n")} title="구분선">
                <Minus size={16} />
              </button>
              <button className="editor-tool" type="button" onClick={() => wrapSelection("[", "](https://)", "링크 텍스트")} title="링크">
                <Link size={16} />
              </button>
              <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
              <button className="editor-tool" type="button" onClick={() => wrapSelection("[align=left]\n", "\n[/align]")} title="왼쪽 정렬">
                <AlignLeft size={16} />
              </button>
              <button className="editor-tool" type="button" onClick={() => wrapSelection("[align=center]\n", "\n[/align]")} title="가운데 정렬">
                <AlignCenter size={16} />
              </button>
              <button className="editor-tool" type="button" onClick={() => wrapSelection("[align=right]\n", "\n[/align]")} title="오른쪽 정렬">
                <AlignRight size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900" onChange={(event) => event.target.value && wrapSelection(`[font=${event.target.value}]`, "[/font]")} defaultValue="">
                <option value="">폰트</option>
                <option value="sans">기본고딕</option>
                <option value="serif">명조</option>
                <option value="mono">코드체</option>
              </select>
              <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900" onChange={(event) => event.target.value && wrapSelection(`[size=${event.target.value}]`, "[/size]")} defaultValue="">
                <option value="">글자크기</option>
                <option value="sm">작게</option>
                <option value="base">기본</option>
                <option value="lg">크게</option>
                <option value="xl">아주 크게</option>
              </select>
              <button className="editor-tool px-3" type="button" onClick={() => wrapSelection("[mark]", "[/mark]")} title="강조">
                <Type size={16} />
                강조
              </button>
            </div>
          </div>
          <textarea
            ref={bodyRef}
            className="min-h-[34rem] resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 leading-8 outline-none focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-900"
            value={draft.body}
            maxLength={BODY_MAX_LENGTH}
            onChange={(event) => updateBody(event.target.value)}
            placeholder="본문을 입력하세요."
          />
        </label>

        <div
          className="grid gap-4 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-4 transition dark:border-zinc-700 dark:bg-zinc-900/50"
          onDragEnter={(event) => {
            event.preventDefault();
            event.currentTarget.classList.add("border-emerald-500");
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => event.currentTarget.classList.remove("border-emerald-500")}
          onDrop={handleDrop}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-black">
              <Upload size={18} />
              미디어
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-black dark:border-zinc-700 dark:bg-zinc-950" type="button" onClick={() => imageInputRef.current?.click()}>
                <Plus size={16} />
                <ImageIcon size={16} />
                사진 추가
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-black dark:border-zinc-700 dark:bg-zinc-950" type="button" onClick={() => videoInputRef.current?.click()}>
                <Plus size={16} />
                <Video size={16} />
                동영상 추가
              </button>
            </div>
          </div>

          <input ref={imageInputRef} className="hidden" type="file" accept="image/*" multiple onChange={handleInputChange} />
          <input ref={videoInputRef} className="hidden" type="file" accept="video/*" multiple onChange={handleInputChange} />

          {media.length > 0 && (
            <div className="grid grid-cols-12 gap-3">
              {media.map((item) => (
                <figure key={item.id} className="col-span-12 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:col-span-6">
                  {item.type === "image" ? <img className="aspect-video w-full object-cover" src={item.src} alt={item.name} /> : <video className="aspect-video w-full object-cover" src={item.src} controls />}
                  <figcaption className="flex items-center justify-between gap-3 px-3 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    <span className="truncate">{item.name}</span>
                    <span className="inline-flex items-center gap-1">
                      <button className="rounded-full px-2 py-1 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40" type="button" onClick={() => insertMediaIntoBody(item)}>
                        본문에 넣기
                      </button>
                      <button className="rounded-full p-1 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40" type="button" onClick={() => removeMedia(item.id)} aria-label={`${item.name} 삭제`}>
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          {mediaMessage && <p className="text-sm font-bold text-red-600 dark:text-red-400">{mediaMessage}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">{message || `본문은 최소 120자 이상, 최대 ${BODY_MAX_LENGTH.toLocaleString()}자까지 작성할 수 있습니다.`}</p>
          <button className="rounded-xl bg-zinc-950 px-5 py-3 font-black text-white dark:bg-white dark:text-zinc-950" type="submit">
            글 저장
          </button>
        </div>
      </form>
    </section>
  );
}
