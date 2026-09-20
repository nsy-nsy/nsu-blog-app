import type { Post, PostDraft } from "../types";

const DATABASE_NAME = "nsu-blog-local";
const DATABASE_VERSION = 1;
const STORE_NAME = "content";
const POSTS_KEY = "posts";
const DRAFT_KEY = "write-draft";

export type SavedDraft = {
  draft: PostDraft;
  tagInput: string;
  savedAt: string;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("이 브라우저에서는 대용량 저장소를 사용할 수 없습니다."));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("브라우저 저장소를 열지 못했습니다."));
  });
}

async function readValue<T>(key: string): Promise<T | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("저장된 내용을 불러오지 못했습니다."));
    transaction.oncomplete = () => database.close();
  });
}

async function writeValue<T>(key: string, value: T): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(value, key);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("브라우저 저장 공간이 부족합니다."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("저장이 중단되었습니다."));
    };
  });
}

async function deleteValue(key: string): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(key);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error ?? new Error("임시저장을 삭제하지 못했습니다."));
  });
}

export function readLocalPosts() {
  return readValue<Post[]>(POSTS_KEY);
}

export function writeLocalPosts(posts: Post[]) {
  return writeValue(POSTS_KEY, posts);
}

export function readSavedDraft() {
  return readValue<SavedDraft>(DRAFT_KEY);
}

export function writeSavedDraft(value: SavedDraft) {
  return writeValue(DRAFT_KEY, value);
}

export function deleteSavedDraft() {
  return deleteValue(DRAFT_KEY);
}
