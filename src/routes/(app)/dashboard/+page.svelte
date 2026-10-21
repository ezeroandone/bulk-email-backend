<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>Dashboard — MergeMail</title>
</svelte:head>

<section>
  <h2>Welcome{data.session?.user?.user_metadata?.name ? `, ${data.session.user.user_metadata.name}` : ''}</h2>
</section>
