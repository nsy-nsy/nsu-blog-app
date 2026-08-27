import { Tag } from "lucide-react";
import { ASSET_BASE } from "../config";
import type { Post } from "../types";
import { formatDate } from "../utils/blog";

const mediaTokenPattern = /\[\[media:([^\]]+)\]\]/g;

function resolveMediaSrc(src: string) {
  return src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("http") ? src : `${ASSET_BASE}${src}`;
}

function renderInline(text: string) {
  const inlinePattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|~~[^~]+~~|\[mark\][\s\S]+?\[\/mark\]|\[size=(?:sm|base|lg|xl)\][\s\S]+?\[\/size\]|\[font=(?:sans|serif|mono)\][\s\S]+?\[\/font\]|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(inlinePattern).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("__") && part.endsWith("__")) return <span key={index} className="underline underline-offset-4">{part.slice(2, -2)}</span>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith("~~") && part.endsWith("~~")) return <span key={index} className="line-through opacity-75">{part.slice(2, -2)}</span>;
    if (part.startsWith("[mark]") && part.endsWith("[/mark]")) return <mark key={index} className="rounded bg-emerald-100 px-1 text-zinc-950 dark:bg-emerald-400/25 dark:text-white">{part.slice(6, -7)}</mark>;

    const sizeMatch = part.match(/^\[size=(sm|base|lg|xl)\]([\s\S]+)\[\/size\]$/);
    if (sizeMatch) {
      const sizeClass = { sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl" }[sizeMatch[1]];
      return <span key={index} className={sizeClass}>{sizeMatch[2]}</span>;
    }

    const fontMatch = part.match(/^\[font=(sans|serif|mono)\]([\s\S]+)\[\/font\]$/);
    if (fontMatch) {
      const fontClass = { sans: "font-sans", serif: "font-serif", mono: "font-mono" }[fontMatch[1]];
      return <span key={index} className={fontClass}>{fontMatch[2]}</span>;
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a key={index} className="font-bold text-emerald-700 underline underline-offset-4 dark:text-emerald-300" href={linkMatch[2]} target="_blank" rel="noreferrer">
          {linkMatch[1]}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function BodyText({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const alignMatch = trimmed.match(/^\[align=(left|center|right)\]\n?([\s\S]+)\n?\[\/align\]$/);
  if (alignMatch) {
    const alignClass = { left: "text-left", center: "text-center", right: "text-right" }[alignMatch[1]];
    return <div className={`my-6 ${alignClass}`}>{renderInline(alignMatch[2])}</div>;
  }

  return (
    <div className="space-y-5">
      {trimmed.split(/\n{2,}/).map((block, index) => {
        const line = block.trim();
        if (line.startsWith("# ")) return <h2 key={index} className="pt-4 text-2xl font-black leading-tight md:text-3xl">{renderInline(line.slice(2))}</h2>;
        if (line.startsWith("## ")) return <h3 key={index} className="pt-3 text-xl font-black leading-tight md:text-2xl">{renderInline(line.slice(3))}</h3>;
        if (line.startsWith("> ")) return <blockquote key={index} className="border-l-4 border-emerald-500 bg-emerald-50 px-5 py-4 text-zinc-700 dark:bg-emerald-950/30 dark:text-zinc-200">{renderInline(line.slice(2))}</blockquote>;
        if (line === "---") return <hr key={index} className="border-zinc-200 dark:border-zinc-800" />;
        if (line.split("\n").every((item) => item.startsWith("- "))) {
          return <ul key={index} className="list-disc space-y-2 pl-5">{line.split("\n").map((item) => <li key={item}>{renderInline(item.slice(2))}</li>)}</ul>;
        }
        if (line.split("\n").every((item) => /^\d+\. /.test(item))) {
          return <ol key={index} className="list-decimal space-y-2 pl-5">{line.split("\n").map((item) => <li key={item}>{renderInline(item.replace(/^\d+\. /, ""))}</li>)}</ol>;
        }
        return <p key={index} className="whitespace-pre-wrap">{renderInline(line)}</p>;
      })}
    </div>
  );
}

function BodyMedia({ post, mediaId, index }: { post: Post; mediaId: string; index: number }) {
  const item = post.media?.find((media) => media.id === mediaId);
  if (!item) return null;

  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {item.type === "image" ? (
        <img className="w-full object-cover" src={resolveMediaSrc(item.src)} alt={item.name || `${post.title} 사진 ${index + 1}`} loading={index > 1 ? "lazy" : "eager"} />
      ) : (
        <video className="w-full bg-black" src={resolveMediaSrc(item.src)} controls preload="metadata" />
      )}
      <figcaption className="px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">{item.name}</figcaption>
    </figure>
  );
}

function RenderBody({ post }: { post: Post }) {
  const segments = post.body.split(mediaTokenPattern);
  return (
    <div className="mt-10 text-[15.5px] leading-8 text-zinc-850 dark:text-zinc-100 md:text-base">
      {segments.map((segment, index) => (index % 2 === 1 ? <BodyMedia key={`${segment}-${index}`} post={post} mediaId={segment} index={index} /> : <BodyText key={index} text={segment} />))}
    </div>
  );
}

export function DetailPage({ isLoggedIn, onBack, onDelete, post }: { isLoggedIn: boolean; onBack: () => void; onDelete: (id: string) => void; post?: Post }) {
  if (!post) {
    return (
      <section className="mx-auto grid max-w-7xl grid-cols-12 px-5 py-14 md:px-8">
        <div className="col-span-12 rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-zinc-600 dark:text-zinc-300">선택한 글이 없습니다.</p>
          <button className="mt-5 rounded-xl bg-zinc-950 px-5 py-3 font-black text-white dark:bg-white dark:text-zinc-950" type="button" onClick={onBack}>
            글목록으로
          </button>
        </div>
      </section>
    );
  }

  const isUserPost = !post.id.includes("-");

  return (
    <article className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-16">
      <button className="mb-8 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100" type="button" onClick={onBack}>
        ← 글목록
      </button>

      <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">{post.category}</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">{post.title}</h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-300">{post.excerpt}</p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-500">
          <span>
            <em className="font-serif italic">by</em> <strong className="text-zinc-800 dark:text-zinc-200">세웅</strong>
          </span>
          <span className="inline-flex gap-4">
            <span>{formatDate(post.createdAt)}</span>
            <span>{post.readMinutes}분 읽기</span>
          </span>
        </div>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <Tag size={12} /> {tag}
          </span>
        ))}
      </div>

      {post.images && post.images.length > 0 && (
        <div className="mt-10 grid gap-4">
          {post.images.map((image, index) => (
            <figure key={image} className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <img className="w-full object-cover" src={resolveMediaSrc(image)} alt={`${post.title} 사진 ${index + 1}`} loading={index > 1 ? "lazy" : "eager"} />
            </figure>
          ))}
        </div>
      )}

      {post.media && post.media.length > 0 && !post.body.match(mediaTokenPattern) && (
        <div className="mt-10 grid gap-4">
          {post.media.map((item, index) => (
            <figure key={item.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              {item.type === "image" ? (
                <img className="w-full object-cover" src={resolveMediaSrc(item.src)} alt={item.name || `${post.title} 사진 ${index + 1}`} loading={index > 1 ? "lazy" : "eager"} />
              ) : (
                <video className="w-full bg-black" src={resolveMediaSrc(item.src)} controls preload="metadata" />
              )}
            </figure>
          ))}
        </div>
      )}

      <RenderBody post={post} />

      <footer className="mt-12 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Search intent</p>
        <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{post.searchIntent}</p>
        {isLoggedIn && isUserPost && (
          <button
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300"
            type="button"
            onClick={() => {
              onDelete(post.id);
              onBack();
            }}
          >
            삭제
          </button>
        )}
      </footer>
    </article>
  );
}
