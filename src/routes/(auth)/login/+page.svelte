<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';

  const APP_NAME = 'MergeMail';

  let errorMessage = $state<string | null>(null);
  let loading = $state(false);

  // Surface any OAuth error passed back via query string
  $effect(() => {
    const error = page.url.searchParams.get('error');
    if (error === 'auth_failed') {
      errorMessage = 'Sign-in failed. Please try again.';
    } else if (error === 'oauth_init_failed') {
      errorMessage = 'Could not start Google sign-in. Please try again.';
    } else if (error) {
      errorMessage = decodeURIComponent(error);
    } else {
      errorMessage = null;
    }
  });
</script>

<svelte:head>
  <title>Sign in — {APP_NAME}</title>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
  />
</svelte:head>

<div class="login-root">
  <div class="login-card">
    <!-- Brand -->
    <div class="brand">
      <span class="material-symbols-outlined icon-xl" aria-hidden="true">mark_email_read</span>
      <span class="brand-name">{APP_NAME}</span>
    </div>

    <!-- Tagline -->
    <p class="tagline">Personalize. Generate. Send.</p>

    <h1 class="heading">Welcome</h1>
    <p class="sub-heading">Sign in to continue to your workspace.</p>

    <!-- Error banner -->
    {#if errorMessage}
      <div class="error-banner" role="alert">
        <span class="material-symbols-outlined icon-sm" aria-hidden="true">error</span>
        <span>{errorMessage}</span>
      </div>
    {/if}

    <!-- Google sign-in — POST to server action which initiates PKCE OAuth -->
    <form method="POST" action="?/google" use:enhance={() => { loading = true; return async ({ update }) => { await update(); loading = false; }; }}>
      <button type="submit" class="google-btn" disabled={loading}>
        {#if loading}
          <span class="material-symbols-outlined icon-sm spin" aria-hidden="true">progress_activity</span>
          <span>Connecting…</span>
        {:else}
          <!-- Google "G" logo -->
          <svg
            class="google-logo"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        {/if}
      </button>
    </form>

    <!-- Free credits callout -->
    <p class="credits-note">
      New to {APP_NAME}? You'll receive <strong>100 free credits</strong> on your first sign-in.
    </p>

    <!-- Back to public site -->
    <a href="/" class="back-link">
      <span class="material-symbols-outlined icon-sm" aria-hidden="true">arrow_back</span>
      Back to home
    </a>
  </div>
</div>

<style>
  .login-root {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-subtle, #f8fafc);
    padding: 1.5rem;
  }

  :global(.dark) .login-root {
    background: var(--color-bg-subtle, #0f172a);
  }

  .login-card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 1rem;
    box-shadow: 0 4px 24px rgb(0 0 0 / 0.08);
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  :global(.dark) .login-card {
    background: var(--color-surface, #1e293b);
    border-color: var(--color-border, #334155);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    color: var(--color-brand, #6366f1);
  }

  .icon-xl {
    font-size: 2rem;
  }

  .icon-sm {
    font-size: 1rem;
  }

  .brand-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text, #0f172a);
    letter-spacing: -0.02em;
  }

  :global(.dark) .brand-name {
    color: var(--color-text, #f1f5f9);
  }

  .tagline {
    font-size: 0.75rem;
    color: var(--color-text-muted, #64748b);
    margin: 0;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-weight: 500;
  }

  .heading {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text, #0f172a);
    margin: 0.5rem 0 0;
    text-align: center;
  }

  :global(.dark) .heading {
    color: var(--color-text, #f1f5f9);
  }

  .sub-heading {
    font-size: 0.875rem;
    color: var(--color-text-muted, #64748b);
    margin: 0;
    text-align: center;
  }

  .error-banner {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    width: 100%;
  }

  :global(.dark) .error-banner {
    background: #450a0a;
    color: #fca5a5;
  }

  .google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border-strong, #cbd5e1);
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #0f172a);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition:
      background 0.15s,
      border-color 0.15s,
      box-shadow 0.15s;
    margin-top: 0.5rem;
    font-family: inherit;
  }

  :global(.dark) .google-btn {
    background: var(--color-surface, #1e293b);
    color: var(--color-text, #f1f5f9);
    border-color: var(--color-border-strong, #475569);
  }

  .google-btn:hover {
    background: var(--color-bg-muted, #f1f5f9);
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.08);
  }

  :global(.dark) .google-btn:hover {
    background: var(--color-bg-muted, #334155);
  }

  .google-btn:focus-visible {
    outline: 2px solid var(--color-brand, #6366f1);
    outline-offset: 2px;
  }

  .google-logo {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  .credits-note {
    font-size: 0.875rem;
    color: var(--color-text-muted, #64748b);
    text-align: center;
    margin: 0;
    line-height: 1.5;
  }

  .credits-note strong {
    color: var(--color-text, #0f172a);
    font-weight: 600;
  }

  :global(.dark) .credits-note strong {
    color: var(--color-text, #f1f5f9);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: var(--color-text-muted, #64748b);
    text-decoration: none;
    margin-top: 0.25rem;
    transition: color 0.15s;
  }

  .back-link:hover {
    color: var(--color-text, #0f172a);
  }

  :global(.dark) .back-link:hover {
    color: var(--color-text, #f1f5f9);
  }

  form {
    width: 100%;
  }

  .google-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spin {
    animation: spin 0.8s linear infinite;
  }
</style>
