import { cleanText } from "../security";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));
}

export function estimateReadMinutes(body: string) {
  return Math.max(1, Math.ceil(body.replace(/\s+/g, "").length / 650));
}

export function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => cleanText(tag, 20))
    .filter(Boolean)
    .slice(0, 6);
}
