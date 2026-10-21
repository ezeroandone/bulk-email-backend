import { writable } from 'svelte/store';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  /** Auto-dismiss after this many milliseconds. 0 = no auto-dismiss. */
  durationMs: number;
}

let _nextId = 0;
function nextId(): string {
  return String(++_nextId);
}

function createNotificationStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function add(
    type: NotificationType,
    title: string,
    message?: string,
    durationMs = 4000
  ): string {
    const id = nextId();
    const toast: Toast = { id, type, title, message, durationMs };

    update((toasts) => [...toasts, toast]);

    if (durationMs > 0) {
      setTimeout(() => dismiss(id), durationMs);
    }

    return id;
  }

  function dismiss(id: string): void {
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  function clear(): void {
    update(() => []);
  }

  return {
    subscribe,
    dismiss,
    clear,
    success: (title: string, message?: string, durationMs?: number) =>
      add('success', title, message, durationMs),
    error: (title: string, message?: string, durationMs?: number) =>
      add('error', title, message, durationMs ?? 6000),
    warning: (title: string, message?: string, durationMs?: number) =>
      add('warning', title, message, durationMs),
    info: (title: string, message?: string, durationMs?: number) =>
      add('info', title, message, durationMs)
  };
}

export const notifications = createNotificationStore();
