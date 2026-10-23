<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  const subjects = [
    { value: 'general', label: 'General Enquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'sales', label: 'Sales' },
    { value: 'report_abuse', label: 'Report Abuse' }
  ];
</script>

<svelte:head>
  <title>Contact — MergeMail</title>
  <meta name="description" content="Contact the MergeMail team for support, sales, or general enquiries." />
  <meta property="og:title" content="Contact — MergeMail" />
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-16">
  <div class="text-center mb-10">
    <h1 class="text-4xl font-extrabold text-neutral-900 mb-3">Contact Us</h1>
    <p class="text-neutral-600">
      Have a question, problem, or feedback? We read every message.
    </p>
  </div>

  {#if form?.success}
    <div class="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
      <span class="material-symbols-outlined text-green-600 text-5xl block mb-4">check_circle</span>
      <h2 class="text-xl font-bold text-green-900 mb-2">Message sent!</h2>
      <p class="text-green-800 text-sm">
        Thank you for reaching out. We'll get back to you within one business day.
      </p>
    </div>
  {:else}
    {#if form?.error}
      <div class="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm flex items-start gap-2">
        <span class="material-symbols-outlined flex-shrink-0" style="font-size:1rem;margin-top:2px">error</span>
        {form.error}
      </div>
    {/if}

    <form method="POST" use:enhance class="space-y-5 bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1.5" for="contact-name">Full Name</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autocomplete="name"
          value={form?.name ?? ''}
          placeholder="Your name"
          class="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1.5" for="contact-email">Email Address</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autocomplete="email"
          value={form?.email ?? ''}
          placeholder="you@example.com"
          class="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1.5" for="contact-subject">Subject</label>
        <select
          id="contact-subject"
          name="subject"
          required
          class="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-white"
        >
          <option value="" disabled selected={!form?.subject}>Select a subject…</option>
          {#each subjects as s}
            <option value={s.value} selected={form?.subject === s.value}>{s.label}</option>
          {/each}
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1.5" for="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          placeholder="Describe your question or issue…"
          class="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm resize-y"
        >{form?.message ?? ''}</textarea>
      </div>

      <button
        type="submit"
        class="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors text-sm"
      >
        <span class="material-symbols-outlined" style="font-size:1rem">send</span>
        Send Message
      </button>
    </form>
  {/if}

  <div class="mt-8 text-center text-sm text-neutral-500">
    For urgent security issues, email <strong>security@mergemail.app</strong> directly.
  </div>
</div>
