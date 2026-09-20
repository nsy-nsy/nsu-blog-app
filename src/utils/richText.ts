import type { PostMedia } from "../types";

export const RICH_TEXT_MARKER = "<!--nsu-rich-text-->";
export const MEDIA_TOKEN_PATTERN = /\[\[media:([^\]]+)\]\]/g;

const ALLOWED_TAGS = new Set(["P", "DIV", "BR", "H2", "H3", "STRONG", "B", "EM", "I", "U", "S", "BLOCKQUOTE", "UL", "OL", "LI", "A", "HR", "MARK", "SPAN"]);

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function legacyInline(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<u>$1</u>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function legacyBlockToHtml(block: string) {
  const value = block.trim();
  if (!value) return "";
  if (value.startsWith("# ")) return `<h2>${legacyInline(value.slice(2))}</h2>`;
  if (value.startsWith("## ")) return `<h3>${legacyInline(value.slice(3))}</h3>`;
  if (value.startsWith("> ")) return `<blockquote>${legacyInline(value.slice(2))}</blockquote>`;
  if (value === "---") return "<hr>";
  if (value.split("\n").every((line) => line.startsWith("- "))) {
    return `<ul>${value.split("\n").map((line) => `<li>${legacyInline(line.slice(2))}</li>`).join("")}</ul>`;
  }
  if (value.split("\n").every((line) => /^\d+\. /.test(line))) {
    return `<ol>${value.split("\n").map((line) => `<li>${legacyInline(line.replace(/^\d+\. /, ""))}</li>`).join("")}</ol>`;
  }

  const align = value.match(/^\[align=(left|center|right)\]\n?([\s\S]+)\n?\[\/align\]$/);
  if (align) return `<p style="text-align:${align[1]}">${legacyInline(align[2]).replace(/\n/g, "<br>")}</p>`;
  return `<p>${legacyInline(value).replace(/\n/g, "<br>")}</p>`;
}

export function bodyToRichHtml(body: string) {
  if (body.startsWith(RICH_TEXT_MARKER)) return body.slice(RICH_TEXT_MARKER.length);
  return body
    .split(MEDIA_TOKEN_PATTERN)
    .map((segment, index) => (index % 2 === 1 ? `[[media:${segment}]]` : segment.split(/\n{2,}/).map(legacyBlockToHtml).join("")))
    .join("");
}

function safeUrl(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function sanitizeRichHtml(value: string) {
  const documentValue = new DOMParser().parseFromString(`<div>${value}</div>`, "text/html");
  const root = documentValue.body.firstElementChild as HTMLElement;

  Array.from(root.querySelectorAll("*")).forEach((element) => {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    const originalHref = element.getAttribute("href") ?? "";
    const textAlign = (element as HTMLElement).style.textAlign;
    Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
    if (["left", "center", "right"].includes(textAlign)) (element as HTMLElement).style.textAlign = textAlign;

    if (element.tagName === "A") {
      const href = originalHref ? safeUrl(originalHref) : "";
      if (href) {
        element.setAttribute("href", href);
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
      } else {
        element.removeAttribute("href");
      }
    }
  });

  return root.innerHTML;
}

export function serializeEditorHtml(editor: HTMLElement) {
  const clone = editor.cloneNode(true) as HTMLElement;
  clone.querySelectorAll<HTMLElement>("[data-media-id]").forEach((element) => {
    element.replaceWith(document.createTextNode(`[[media:${element.dataset.mediaId ?? ""}]]`));
  });
  return `${RICH_TEXT_MARKER}${sanitizeRichHtml(clone.innerHTML)}`;
}

export function richHtmlForEditor(body: string, media: PostMedia[]) {
  const html = sanitizeRichHtml(bodyToRichHtml(body));
  return html.replace(MEDIA_TOKEN_PATTERN, (_token, mediaId: string) => {
    const item = media.find((candidate) => candidate.id === mediaId);
    if (!item) return "";
    const source = escapeHtml(item.src);
    const name = escapeHtml(item.name || (item.type === "image" ? "사진" : "동영상"));
    const preview = item.type === "image" ? `<img src="${source}" alt="${name}">` : `<video src="${source}" controls preload="metadata"></video>`;
    return `<figure class="editor-media" contenteditable="false" data-media-id="${escapeHtml(item.id)}">${preview}<figcaption>${name}</figcaption></figure><p><br></p>`;
  });
}

export function richTextLength(body: string) {
  const html = bodyToRichHtml(body).replace(MEDIA_TOKEN_PATTERN, "");
  const documentValue = new DOMParser().parseFromString(html, "text/html");
  return (documentValue.body.textContent ?? "").trim().length;
}
