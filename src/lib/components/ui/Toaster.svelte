<script lang="ts">
  import { onDestroy } from 'svelte';
  import Toast from './Toast.svelte';
  import { toastStore, type ToastItem } from '$lib/stores/toast';

  // Subscribe to the store so the component re-renders when toasts change
  let toasts = $state<ToastItem[]>([]);
  const unsub = toastStore.subscribe((t) => { toasts = t; });
  onDestroy(unsub);
</script>

<div class="toaster" aria-label="Notifications" role="region">
  {#each toasts as toast (toast.id)}
    <Toast
      id={toast.id}
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      onDismiss={(id) => toastStore.removeToast(id)}
    />
  {/each}
</div>

<style>
  .toaster {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
  }

  .toaster :global(.toast) {
    pointer-events: all;
  }
</style>
