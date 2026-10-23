<script lang="ts">
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();

  const docSections = [
    { href: '/docs', label: 'Documentation Home', icon: 'home' },
    { href: '/docs/getting-started', label: 'Getting Started', icon: 'rocket_launch' },
    { href: '/docs/spreadsheets', label: 'Spreadsheets', icon: 'table_chart' },
    { href: '/docs/document-templates', label: 'Document Templates', icon: 'description' },
    { href: '/docs/variable-mapping', label: 'Variable Mapping', icon: 'data_object' },
    { href: '/docs/existing-documents', label: 'Existing Documents (ZIP)', icon: 'folder_zip' },
    { href: '/docs/email-campaigns', label: 'Email Campaigns', icon: 'campaign' },
    { href: '/docs/smtp', label: 'SMTP Setup', icon: 'mail' },
    { href: '/docs/credits', label: 'Credits', icon: 'monetization_on' },
    { href: '/docs/payments', label: 'Payments', icon: 'payments' },
    { href: '/docs/troubleshooting', label: 'Troubleshooting', icon: 'build' },
    { href: '/docs/api', label: 'API Reference', icon: 'api' },
    { href: '/docs/faq', label: 'Developer FAQ', icon: 'help' }
  ];

  let searchQuery = $state('');
  let sidebarOpen = $state(false);

  let filteredSections = $derived(
    searchQuery.trim() === ''
      ? docSections
      : docSections.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function closeSidebar() {
    sidebarOpen = false;
  }
</script>

<div class="min-h-screen bg-white">
  <!-- Top bar with hamburger for mobile -->
  <div class="sticky top-0 z-40 bg-white border-b border-neutral-200 flex items-center gap-3 px-4 h-14 md:hidden">
    <button
      onclick={toggleSidebar}
      class="p-2 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
      aria-label="Toggle docs sidebar"
      aria-expanded={sidebarOpen}
    >
      <span class="material-symbols-outlined">{sidebarOpen ? 'close' : 'menu'}</span>
    </button>
    <a href="/" class="flex items-center gap-1.5 text-brand-600 font-bold no-underline">
      <span class="material-symbols-outlined" style="font-size:1.25rem">mail</span>
      MergeMail Docs
    </a>
  </div>

  <div class="flex max-w-7xl mx-auto">
    <!-- Sidebar -->
    <aside
      class="
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-neutral-200 flex flex-col
        transition-transform duration-200
        md:sticky md:top-0 md:h-screen md:translate-x-0 md:z-auto
        {sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
      "
    >
      <!-- Sidebar header -->
      <div class="flex items-center gap-2 px-5 h-16 border-b border-neutral-200 flex-shrink-0">
        <a href="/" class="flex items-center gap-2 text-brand-600 font-bold no-underline">
          <span class="material-symbols-outlined" style="font-size:1.5rem">mail</span>
          MergeMail
        </a>
        <span class="text-neutral-400 text-sm ml-1">Docs</span>
        <button onclick={closeSidebar} class="ml-auto md:hidden p-1 rounded text-neutral-400 hover:text-neutral-700">
          <span class="material-symbols-outlined" style="font-size:1.25rem">close</span>
        </button>
      </div>

      <!-- Search -->
      <div class="px-4 py-3 border-b border-neutral-100 flex-shrink-0">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" style="font-size:1rem">search</span>
          <input
            type="search"
            bind:value={searchQuery}
            placeholder="Search docs…"
            class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-neutral-50"
          />
        </div>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 overflow-y-auto py-3 px-3">
        {#if filteredSections.length === 0}
          <p class="text-sm text-neutral-400 px-2 py-3">No results for "{searchQuery}"</p>
        {:else}
          {#each filteredSections as section}
            <a
              href={section.href}
              onclick={closeSidebar}
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors no-underline mb-0.5"
            >
              <span class="material-symbols-outlined text-neutral-400" style="font-size:1rem">{section.icon}</span>
              {section.label}
            </a>
          {/each}
        {/if}
      </nav>

      <!-- Back to app -->
      <div class="border-t border-neutral-200 p-4 flex-shrink-0">
        <a
          href="/dashboard"
          class="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 no-underline"
        >
          <span class="material-symbols-outlined" style="font-size:1rem">arrow_back</span>
          Back to Dashboard
        </a>
      </div>
    </aside>

    <!-- Overlay for mobile -->
    {#if sidebarOpen}
      <div
        class="fixed inset-0 z-40 bg-black/30 md:hidden"
        onclick={closeSidebar}
        role="presentation"
      ></div>
    {/if}

    <!-- Main content -->
    <main class="flex-1 min-w-0 px-4 sm:px-8 py-10 max-w-3xl">
      {@render children()}
    </main>
  </div>
</div>
