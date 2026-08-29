import { writable } from "svelte/store";

// Lightweight in-app feedback layer (Phase 9 juice). Any city action that
// does something worth acknowledging pushes a toast; they stack, then
// auto-expire. This is the first slice of the notifications plan
// (roadmap §Notifications) — the notification-center drawer + PWA push
// come later.

export type ToastKind = "info" | "reward" | "level" | "story" | "warn";

export interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
  emoji: string;
}

const DEFAULT_TTL_MS = 3200;
const LEVEL_TTL_MS = 5000;
const MAX_VISIBLE = 4;

export const toasts = writable<Toast[]>([]);

let nextId = 1;

export function pushToast(text: string, kind: ToastKind = "info", emoji = ""): void {
  const id = nextId++;
  toasts.update((list) => [...list, { id, text, kind, emoji }].slice(-MAX_VISIBLE));
  const ttl = kind === "level" ? LEVEL_TTL_MS : DEFAULT_TTL_MS;
  setTimeout(() => dismissToast(id), ttl);
}

export function dismissToast(id: number): void {
  toasts.update((list) => list.filter((t) => t.id !== id));
}
