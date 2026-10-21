export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

function createToastStore() {
  let toasts = $state<ToastItem[]>([]);

  function addToast(
    message: string,
    type: ToastItem['type'] = 'info',
    duration = 4000
  ): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    toasts = [...toasts, { id, message, type, duration }];
    return id;
  }

  function removeToast(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
  }

  return {
    get toasts() {
      return toasts;
    },
    addToast,
    removeToast
  };
}

export const toastStore = createToastStore();
export const { addToast } = toastStore;
