<script lang="ts">
  import Badge from './Badge.svelte';
  import type { BadgeProps } from './Badge.svelte';

  export interface StatusBadgeProps {
    status: string;
  }

  let { status }: StatusBadgeProps = $props();

  interface StatusConfig {
    variant: BadgeProps['variant'];
    label: string;
  }

  const statusMap: Record<string, StatusConfig> = {
    queued:    { variant: 'neutral',  label: 'Queued' },
    claimed:   { variant: 'info',     label: 'Processing' },
    sending:   { variant: 'info',     label: 'Sending' },
    accepted:  { variant: 'success',  label: 'Accepted' },
    failed:    { variant: 'error',    label: 'Failed' },
    retrying:  { variant: 'warning',  label: 'Retrying' },
    cancelled: { variant: 'neutral',  label: 'Cancelled' },
    uncertain: { variant: 'warning',  label: 'Uncertain' }
  };

  let config = $derived(statusMap[status] ?? { variant: 'neutral' as const, label: status });
</script>

<Badge variant={config.variant}>{config.label}</Badge>
