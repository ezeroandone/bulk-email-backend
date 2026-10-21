<script lang="ts">
  import Toast from './Toast.svelte';
  import { toastStore } from '$lib/stores/toast';
</script>

<div class="toaster" aria-label="Notifications" role="region">
  {#each toastStore.toasts as toast (toast.id)}
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
