<script lang="ts">
  export interface ToastProps {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onDismiss?: (id: string) => void;
  }

  let {
    id,
    message,
    type = 'info',
    duration = 4000,
    onDismiss
  }: ToastProps = $props();

  const iconMap: Record<string, string> = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  let visible = $state(true);
  let progress = $state(100);

  $effect(() => {
    if (duration <= 0) return;

    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      progress -= step;
      if (progress <= 0) {
        clearInterval(timer);
        dismiss();
      }
    }, interval);

    return () => clearInterval(timer);
  });

  function dismiss() {
    visible = false;
    setTimeout(() => onDismiss?.(id), 200);
  }
</script>

{#if visible}
  <div class="toast toast-{type}" role="alert" aria-live="polite">
    <span class="toast-icon material-symbols-outlined" aria-hidden="true">{iconMap[type]}</span>
    <span class="toast-message">{message}</span>
    <button type="button" class="toast-close" onclick={dismiss} aria-label="Dismiss notification">
      <span class="material-symbols-outlined" aria-hidden="true">close</span>
    </button>
    {#if duration > 0}
      <div class="toast-progress" style="width: {progress}%"></div>
    {/if}
  </div>
{/if}

<style>
  .toast {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    min-width: 18rem;
    max-width: 24rem;
    overflow: hidden;
    animation: toast-in 0.2s ease-out;
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateX(100%); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .toast-message {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }

  .toast-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .toast-success .toast-icon { color: var(--color-success); }
  .toast-error   .toast-icon { color: var(--color-error); }
  .toast-warning .toast-icon { color: var(--color-warning); }
  .toast-info    .toast-icon { color: var(--color-info); }

  .toast-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--transition-fast);
  }

  .toast-close:hover {
    background: var(--color-bg-muted);
  }

  .toast-close .material-symbols-outlined {
    font-size: 1rem;
  }

  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    border-radius: 0 2px 0 0;
    transition: width 50ms linear;
  }

  .toast-success .toast-progress { background: var(--color-success); }
  .toast-error   .toast-progress { background: var(--color-error); }
  .toast-warning .toast-progress { background: var(--color-warning); }
  .toast-info    .toast-progress { background: var(--color-info); }
</style>
