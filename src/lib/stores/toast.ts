// Toast store using a plain writable-style approach so it works both
// inside Svelte components and in module scope (no $state at top level).

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

type Subscriber = (toasts: ToastItem[]) => void;

function createToastStore() {
  let toasts: ToastItem[] = [];
  const subscribers = new Set<Subscriber>();

  function notify() {
    subscribers.forEach((fn) => fn(toasts));
  }

  function subscribe(fn: Subscriber): () => void {
    subscribers.add(fn);
    fn(toasts);
    return () => subscribers.delete(fn);
  }

  function addToast(
    message: string,
    type: ToastItem['type'] = 'info',
    duration = 4000
  ): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    toasts = [...toasts, { id, message, type, duration }];
    notify();
    return id;
  }

  function removeToast(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }

  return { subscribe, addToast, removeToast };
}

export const toastStore = createToastStore();
export const addToast = toastStore.addToast.bind(toastStore);
