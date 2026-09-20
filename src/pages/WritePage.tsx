import { type ChangeEvent, type DragEvent, type FormEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, Heading2, Heading3, ImageIcon, Italic, Link, List, ListOrdered, Minus, Plus, Quote, Save, Strikethrough, Trash2, Underline, Upload, Video } from "lucide-react";
import { FormInput } from "../components/FormInput";
import type { Category, PostDraft, PostMedia } from "../types";
import { richHtmlForEditor, richTextLength, serializeEditorHtml } from "../utils/richText";

const BODY_MAX_LENGTH = 30_000;
const MAX_IMAGE_FILES = 50;
const MAX_VIDEO_FILES = 30;
const MAX_IMAGE_SOURCE_BYTES = 40 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const IMAGE_MAX_EDGE = 1600;
const IMAGE_WEBP_QUALITY = 0.82;

type WritePageProps = {
  categories: Category[];
  draft: PostDraft;
  message: string;
  onDraftChange: (draft: PostDraft) => void;
  onSaveDraft: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  setTagInput: (tags: string) => void;
  submitLabel?: string;
  tagInput: string;
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
    reader.readAsDataURL(blob);
  });
}

function imageToWebp(file: File): Promise<{ src: string; name: string }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("이미지를 변환할 수 없습니다."));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        async (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("이미지를 WebP로 변환할 수 없습니다."));
            return;
          }

          const src = await blobToDataUrl(blob);
          const name = `${file.name.replace(/\.[^.]+$/, "") || "image"}.webp`;
          resolve({ src, name });
        },
        "image/webp",
        IMAGE_WEBP_QUALITY,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 읽을 수 없습니다."));
    };
    image.src = objectUrl;
  });
}

async function fileToMedia(file: File): Promise<PostMedia> {
  const id = `${Date.now().toString(36)}-${crypto.randomUUID()}`;

  if (file.type.startsWith("image/")) {
    const image = await imageToWebp(file);
    return { id, type: "image", src: image.src, name: image.name };
  }

  return {
    id,
    type: "video",
    src: await blobToDataUrl(file),
    name: file.name,
  };
}

export function WritePage({ categories, draft, message, onDraftChange, onSaveDraft, onSubmit, saving, setTagInput, submitLabel = "글 저장", tagInput }: WritePageProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastSyncedBodyRef = useRef("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mediaMessage, setMediaMessage] = useState("");
  const media = draft.media ?? [];
  const imageCount = media.filter((item) => item.type === "image").length;
  const videoCount = media.filter((item) => item.type === "video").length;
  const bodyLength = richTextLength(draft.body);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || draft.body === lastSyncedBodyRef.current) return;
    editor.innerHTML = richHtmlForEditor(draft.body, media);
    lastSyncedBodyRef.current = draft.body;
  }, [draft.body, media]);

  function updateBodyFromEditor() {
    const editor = editorRef.current;
    if (!editor) return;
    const body = serializeEditorHtml(editor);
    lastSyncedBodyRef.current = body;
    onDraftChange({ ...draft, body });
  }

  function rememberSelection() {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!selection?.rangeCount || !editor?.contains(selection.anchorNode)) return;
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    if (savedRangeRef.current && editor.contains(savedRangeRef.current.commonAncestorContainer)) {
      selection?.addRange(savedRangeRef.current);
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection?.addRange(range);
  }

  function runCommand(command: string, value?: string) {
    restoreSelection();
    document.execCommand(command, false, value);
    rememberSelection();
    updateBodyFromEditor();
  }

  function handleToolMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  function addLink() {
    const href = window.prompt("연결할 주소를 입력하세요.", "https://");
    if (!href) return;
    runCommand("createLink", href);
  }

  function insertMediaIntoBody(item: PostMedia) {
    const editor = editorRef.current;
    if (!editor) return;
    restoreSelection();
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = richHtmlForEditor(`[[media:${item.id}]]`, [item]);
    const fragment = document.createDocumentFragment();
    let lastNode: ChildNode | null = null;
    while (wrapper.firstChild) {
      lastNode = fragment.appendChild(wrapper.firstChild);
    }
    if (range) {
      range.deleteContents();
      range.insertNode(fragment);
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    } else {
      editor.appendChild(fragment);
    }
    rememberSelection();
    updateBodyFromEditor();
    setMediaMessage(`${item.name}을 본문 위치에 넣었습니다.`);
  }

  async function addFiles(files: FileList | File[]) {
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    if (selected.length === 0) {
      setMediaMessage("이미지 또는 동영상 파일만 추가할 수 있습니다.");
      return;
    }

    let remainingImages = MAX_IMAGE_FILES - imageCount;
    let remainingVideos = MAX_VIDEO_FILES - videoCount;

    if (remainingImages <= 0 && remainingVideos <= 0) {
      setMediaMessage(`사진은 최대 ${MAX_IMAGE_FILES}개, 동영상은 최대 ${MAX_VIDEO_FILES}개까지 추가할 수 있습니다.`);
      return;
    }

    const accepted: File[] = [];
    let skippedByCount = 0;
    let skippedBySize = 0;

    selected.forEach((file) => {
      if (file.type.startsWith("image/") && file.size > MAX_IMAGE_SOURCE_BYTES) {
        skippedBySize += 1;
        return;
      }

      if (file.type.startsWith("video/") && file.size > MAX_VIDEO_BYTES) {
        skippedBySize += 1;
        return;
      }

      if (file.type.startsWith("video/")) {
        if (remainingVideos <= 0) {
          skippedByCount += 1;
          return;
        }

        remainingVideos -= 1;
        accepted.push(file);
        return;
      }

      if (remainingImages <= 0) {
        skippedByCount += 1;
        return;
      }

      remainingImages -= 1;
      accepted.push(file);
    });

    if (accepted.length === 0) {
      setMediaMessage(skippedBySize > 0 ? "사진 원본은 파일당 40MB, 동영상은 파일당 25MB까지 추가할 수 있습니다." : `사진은 최대 ${MAX_IMAGE_FILES}개, 동영상은 최대 ${MAX_VIDEO_FILES}개까지 추가할 수 있습니다.`);
      return;
    }

    setMediaMessage("파일을 가볍게 변환하는 중입니다.");
    try {
      const nextMedia = await Promise.all(accepted.map(fileToMedia));
      onDraftChange({ ...draft, media: [...media, ...nextMedia] });
      setMediaMessage(skippedByCount > 0 || skippedBySize > 0 ? "일부 파일은 개수 또는 용량 제한 때문에 제외되었습니다. 사진은 WebP로 변환되었습니다." : "사진은 WebP로 변환되어 추가되었습니다.");
    } catch {
      setMediaMessage("일부 파일을 변환하지 못했습니다. 다른 파일로 다시 시도해주세요.");
    }
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
    editorRef.current?.querySelector(`[data-media-id="${CSS.escape(id)}"]`)?.remove();
    onDraftChange({ ...draft, media: media.filter((item) => item.id !== id) });
    window.requestAnimationFrame(updateBodyFromEditor);
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
        <div className="grid gap-2">
          <div className="flex items-end justify-between gap-3">
            <span className="font-bold">본문</span>
            <span className={`text-xs font-bold ${bodyLength > BODY_MAX_LENGTH ? "text-red-600" : "text-zinc-500 dark:text-zinc-400"}`}>
              {bodyLength.toLocaleString()} / {BODY_MAX_LENGTH.toLocaleString()}자
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="sticky top-20 z-10 flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-white/95 p-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
              <button className="editor-tool px-3" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("formatBlock", "p")} title="본문으로 바꾸기">
                본문
              </button>
              <button className="editor-tool px-3" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("formatBlock", "h2")} title="큰 제목으로 바꾸기">
                <Heading2 size={16} /> 큰 제목
              </button>
              <button className="editor-tool px-3" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("formatBlock", "h3")} title="소제목으로 바꾸기">
                <Heading3 size={16} /> 소제목
              </button>
              <span className="editor-divider" />
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("bold")} title="굵게"><Bold size={16} /></button>
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("italic")} title="기울임"><Italic size={16} /></button>
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("underline")} title="밑줄"><Underline size={16} /></button>
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("strikeThrough")} title="취소선"><Strikethrough size={16} /></button>
              <span className="editor-divider" />
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("formatBlock", "blockquote")} title="인용문"><Quote size={16} /></button>
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("insertUnorderedList")} title="글머리 목록"><List size={16} /></button>
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("insertOrderedList")} title="번호 목록"><ListOrdered size={16} /></button>
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("insertHorizontalRule")} title="구분선"><Minus size={16} /></button>
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={addLink} title="링크"><Link size={16} /></button>
              <span className="editor-divider" />
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("justifyLeft")} title="왼쪽 정렬"><AlignLeft size={16} /></button>
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("justifyCenter")} title="가운데 정렬"><AlignCenter size={16} /></button>
              <button className="editor-tool" type="button" onMouseDown={handleToolMouseDown} onClick={() => runCommand("justifyRight")} title="오른쪽 정렬"><AlignRight size={16} /></button>
            </div>
            <div
              ref={editorRef}
              className="rich-editor min-h-[34rem] px-5 py-5 text-base leading-8 outline-none md:px-7 md:py-6"
              contentEditable
              role="textbox"
              aria-label="게시글 본문"
              aria-multiline="true"
              data-placeholder="본문을 입력하세요. 제목이나 소제목을 선택하면 작성 화면에서도 실제 크기로 표시됩니다."
              onBlur={rememberSelection}
              onInput={() => {
                rememberSelection();
                updateBodyFromEditor();
              }}
              onKeyUp={rememberSelection}
              onMouseUp={rememberSelection}
              onPaste={(event) => {
                event.preventDefault();
                document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
              }}
              suppressContentEditableWarning
            />
          </div>
        </div>

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
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                사진 {imageCount}/{MAX_IMAGE_FILES} · 동영상 {videoCount}/{MAX_VIDEO_FILES}
              </span>
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
          <p className="text-xs font-bold leading-6 text-zinc-500 dark:text-zinc-400">
            사진은 자동으로 WebP로 압축됩니다. 동영상은 WebM 또는 압축된 MP4를 올리면 가장 빠르게 로드됩니다.
          </p>

          <input ref={imageInputRef} className="hidden" type="file" accept="image/*" multiple onChange={handleInputChange} />
          <input ref={videoInputRef} className="hidden" type="file" accept="video/webm,video/mp4,video/*" multiple onChange={handleInputChange} />

          {media.length > 0 && (
            <div className="grid grid-cols-12 gap-3">
              {media.map((item) => (
                <figure key={item.id} className="col-span-12 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:col-span-6">
                  {item.type === "image" ? <img className="aspect-video w-full object-cover" src={item.src} alt={item.name} loading="lazy" /> : <video className="aspect-video w-full object-cover" src={item.src} controls preload="metadata" />}
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
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 font-black text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" type="button" onClick={onSaveDraft} disabled={saving}>
              <Save size={17} /> 임시저장
            </button>
            <button className="rounded-xl bg-zinc-950 px-5 py-3 font-black text-white disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-zinc-950" type="submit" disabled={saving || bodyLength > BODY_MAX_LENGTH}>
              {saving ? "저장 중..." : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
