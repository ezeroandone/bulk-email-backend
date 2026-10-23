<script lang="ts">
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();

  let mobileMenuOpen = $state(false);

  const navLinks = [
    { href: '/features', label: 'Features' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/docs', label: 'Docs' },
    { href: '/login', label: 'Login' }
  ];

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

<div class="min-h-screen bg-white flex flex-col">
  <!-- Navbar -->
  <nav class="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <a href="/" class="flex items-center gap-2 text-brand-600 font-bold text-xl no-underline">
          <span class="material-symbols-outlined text-brand-600" style="font-size:1.75rem">mail</span>
          <span>MergeMail</span>
        </a>

        <!-- Desktop nav -->
        <div class="hidden md:flex items-center gap-1">
          {#each navLinks as link}
            {#if link.label === 'Login'}
              <a
                href={link.href}
                class="ml-4 px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors no-underline"
              >
                {link.label}
              </a>
            {:else}
              <a
                href={link.href}
                class="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors no-underline"
              >
                {link.label}
              </a>
            {/if}
          {/each}
        </div>

        <!-- Mobile hamburger -->
        <button
          class="md:hidden p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          onclick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span class="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    {#if mobileMenuOpen}
      <div class="md:hidden border-t border-neutral-200 bg-white px-4 pb-4">
        <div class="flex flex-col gap-1 pt-2">
          {#each navLinks as link}
            <a
              href={link.href}
              onclick={closeMobileMenu}
              class="px-3 py-2 text-sm text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors no-underline {link.label === 'Login' ? 'mt-2 bg-brand-600 text-white hover:bg-brand-700 text-center' : ''}"
            >
              {link.label}
            </a>
          {/each}
        </div>
      </div>
    {/if}
  </nav>

  <!-- Page content -->
  <main class="flex-1">
    {@render children()}
  </main>

  <!-- Footer -->
  <footer class="bg-neutral-900 text-neutral-300 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="md:col-span-1">
          <div class="flex items-center gap-2 text-white font-bold text-lg mb-3">
            <span class="material-symbols-outlined" style="font-size:1.5rem">mail</span>
            <span>MergeMail</span>
          </div>
          <p class="text-sm text-neutral-400 leading-relaxed">
            Personalized bulk email and document generation for teams that value their time.
          </p>
        </div>

        <!-- Product links -->
        <div>
          <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h3>
          <ul class="space-y-2">
            {#each [['Features', '/features'], ['How It Works', '/how-it-works'], ['Pricing', '/pricing'], ['Use Cases', '/use-cases'], ['Docs', '/docs']] as [label, href]}
              <li>
                <a {href} class="text-sm text-neutral-400 hover:text-white transition-colors no-underline">{label}</a>
              </li>
            {/each}
          </ul>
        </div>

        <!-- Legal links -->
        <div>
          <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h3>
          <ul class="space-y-2">
            {#each [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Acceptable Use', '/acceptable-use'], ['FAQ', '/faq']] as [label, href]}
              <li>
                <a {href} class="text-sm text-neutral-400 hover:text-white transition-colors no-underline">{label}</a>
              </li>
            {/each}
          </ul>
        </div>

        <!-- Company links -->
        <div>
          <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h3>
          <ul class="space-y-2">
            {#each [['Contact', '/contact'], ['Login', '/login']] as [label, href]}
              <li>
                <a {href} class="text-sm text-neutral-400 hover:text-white transition-colors no-underline">{label}</a>
              </li>
            {/each}
          </ul>
        </div>
      </div>

      <div class="border-t border-neutral-700 mt-10 pt-6 text-sm text-neutral-500 text-center">
        © 2024 MergeMail. All rights reserved.
      </div>
    </div>
  </footer>
</div>
