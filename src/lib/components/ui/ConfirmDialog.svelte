<script lang="ts">
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';

  export interface ConfirmDialogProps {
    open?: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
  }

  let {
    open = $bindable(false),
    title = 'Confirm',
    message = 'Are you sure?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    onConfirm,
    onCancel
  }: ConfirmDialogProps = $props();

  let loading = $state(false);

  async function handleConfirm() {
    if (!onConfirm) {
      open = false;
      return;
    }
    loading = true;
    try {
      await onConfirm();
      open = false;
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    onCancel?.();
    open = false;
  }
</script>

<Modal bind:open {title} size="sm">
  {#snippet children()}
    <p class="confirm-message">{message}</p>
  {/snippet}

  {#snippet footer()}
    <Button variant="ghost" onclick={handleCancel} disabled={loading}>
      {cancelLabel}
    </Button>
    <Button
      variant={danger ? 'danger' : 'primary'}
      onclick={handleConfirm}
      {loading}
    >
      {confirmLabel}
    </Button>
  {/snippet}
</Modal>

<style>
  .confirm-message {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.6;
  }
</style>
