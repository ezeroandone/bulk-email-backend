<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  // Package form state
  let showPackageForm = $state(false);
  let editingPackage = $state<{
    id?: string;
    name: string;
    credits: number;
    price_kobo: number;
    enabled: boolean;
    sort_order: number;
  } | null>(null);

  let defaultCredits = $state(parseInt(data.default_signup_credits ?? '0', 10));

  function openNewPackage() {
    editingPackage = { name: '', credits: 0, price_kobo: 0, enabled: true, sort_order: 0 };
    showPackageForm = true;
  }

  function openEditPackage(pkg: typeof data.packages[number]) {
    editingPackage = {
      id: pkg.id as string,
      name: pkg.name as string,
      credits: pkg.credits as number,
      price_kobo: pkg.price_kobo as number,
      enabled: pkg.enabled as boolean,
      sort_order: pkg.sort_order as number ?? 0
    };
    showPackageForm = true;
  }

  function closePackageForm() {
    showPackageForm = false;
    editingPackage = null;
  }

  function fmtNGN(kobo: number): string {
    return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
</script>

<svelte:head>
  <title>Pricing — Admin — MergeMail</title>
</svelte:head>

<div class="pricing-page">
  <div class="page-header">
    <h1 class="page-title">Pricing</h1>
    <button type="button" class="btn btn-primary" onclick={openNewPackage}>
      <span class="material-symbols-outlined" aria-hidden="true">add</span>
      Add Package
    </button>
  </div>

  {#if form?.error}
    <div class="alert alert-error" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">error</span>
      {form.error}
    </div>
  {/if}

  {#if form?.success}
    <div class="alert alert-success" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
      {#if form.action === 'upsertPackage'}Package saved.{/if}
      {#if form.action === 'togglePackage'}Package updated.{/if}
      {#if form.action === 'updateDefaultCredits'}Default credits updated.{/if}
    </div>
  {/if}

  <!-- Add / Edit Package modal -->
  {#if showPackageForm && editingPackage}
    <div class="modal-backdrop" onclick={closePackageForm} role="presentation"></div>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pkg-modal-title">
      <div class="modal-header">
        <h2 id="pkg-modal-title" class="modal-title">
          {editingPackage.id ? 'Edit Package' : 'Add Package'}
        </h2>
        <button type="button" class="modal-close" onclick={closePackageForm} aria-label="Close">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>
      <form method="POST" action="?/upsertPackage" use:enhance={{ result: ({ update }) => { closePackageForm(); update(); } }} class="modal-body">
        {#if editingPackage.id}
          <input type="hidden" name="id" value={editingPackage.id} />
        {/if}
        <div class="form-group">
          <label for="pkg-name" class="form-label">Name</label>
          <input id="pkg-name" type="text" name="name" class="form-input" bind:value={editingPackage.name} required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="pkg-credits" class="form-label">Credits</label>
            <input id="pkg-credits" type="number" name="credits" class="form-input" bind:value={editingPackage.credits} min="1" required />
          </div>
          <div class="form-group">
            <label for="pkg-price" class="form-label">Price (kobo)</label>
            <input id="pkg-price" type="number" name="price_kobo" class="form-input" bind:value={editingPackage.price_kobo} min="0" required />
            <p class="form-hint">= {fmtNGN(editingPackage.price_kobo)}</p>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="pkg-sort" class="form-label">Sort Order</label>
            <input id="pkg-sort" type="number" name="sort_order" class="form-input" bind:value={editingPackage.sort_order} />
          </div>
          <div class="form-group form-group--checkbox">
            <label class="checkbox-label">
              <input type="hidden" name="enabled" value={editingPackage.enabled ? 'true' : 'false'} />
              <input
                type="checkbox"
                checked={editingPackage.enabled}
                onchange={(e) => {
                  if (editingPackage) editingPackage.enabled = (e.currentTarget as HTMLInputElement).checked;
                }}
              />
              Enabled
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick={closePackageForm}>Cancel</button>
          <button type="submit" class="btn btn-primary">Save Package</button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Packages table -->
  <div class="card">
    <h2 class="card-title">
      <span class="material-symbols-outlined" aria-hidden="true">sell</span>
      Credit Packages
    </h2>
    {#if data.packages.length === 0}
      <div class="empty-state">
        <span class="material-symbols-outlined">sell</span>
        <p>No packages defined yet.</p>
      </div>
    {:else}
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Credits</th>
              <th scope="col">Price (₦)</th>
              <th scope="col">Sort</th>
              <th scope="col">Enabled</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.packages as pkg}
              <tr>
                <td class="pkg-name">{pkg.name}</td>
                <td>{(pkg.credits as number).toLocaleString()}</td>
                <td>{fmtNGN(pkg.price_kobo as number)}</td>
                <td>{pkg.sort_order ?? 0}</td>
                <td>
                  <form method="POST" action="?/togglePackage" use:enhance>
                    <input type="hidden" name="id" value={pkg.id} />
                    <input type="hidden" name="enabled" value={pkg.enabled ? 'false' : 'true'} />
                    <button
                      type="submit"
                      class="toggle-btn"
                      class:toggle-on={pkg.enabled}
                      class:toggle-off={!pkg.enabled}
                      aria-label={pkg.enabled ? 'Disable package' : 'Enable package'}
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">
                        {pkg.enabled ? 'toggle_on' : 'toggle_off'}
                      </span>
                    </button>
                  </form>
                </td>
                <td>
                  <button type="button" class="btn btn-ghost btn-sm" onclick={() => openEditPackage(pkg)}>
                    <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                    Edit
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Default signup credits -->
  <div class="card">
    <h2 class="card-title">
      <span class="material-symbols-outlined" aria-hidden="true">person_add</span>
      Default Signup Credits
    </h2>
    <p class="card-desc">Credits awarded to new users upon registration.</p>
    <form method="POST" action="?/updateDefaultCredits" use:enhance class="inline-form">
      <input
        type="number"
        name="value"
        class="form-input"
        bind:value={defaultCredits}
        min="0"
        required
        aria-label="Default signup credits"
      />
      <button type="submit" class="btn btn-primary">
        <span class="material-symbols-outlined" aria-hidden="true">save</span>
        Save
      </button>
    </form>
  </div>
</div>

<style>
  .pricing-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
  }

  .alert-error { background: var(--color-error-light); color: var(--color-error); }
  .alert-success { background: var(--color-success-light); color: var(--color-success); }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 100;
    backdrop-filter: blur(2px);
  }

  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 101;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    width: min(28rem, calc(100vw - 2rem));
    box-shadow: var(--shadow-lg);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-title { font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text); margin: 0; }

  .modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-md);
    cursor: pointer;
  }

  .modal-close:hover { background: var(--color-bg-muted); }

  .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }

  .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }

  /* Card */
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 1rem;
  }

  .card-title .material-symbols-outlined { font-size: 1.25rem; color: var(--color-text-muted); }
  .card-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: -0.5rem 0 1rem; }

  /* Form */
  .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
  .form-group--checkbox { justify-content: flex-end; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }

  .form-label { font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text); }
  .form-hint { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0; }

  .form-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .form-input:focus { border-color: var(--color-brand); }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
    cursor: pointer;
    padding-top: 1.5rem;
  }

  /* Inline form */
  .inline-form {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .inline-form .form-input { width: 10rem; }

  /* Table */
  .empty-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  .table-scroll { overflow-x: auto; }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .data-table th {
    padding: 0.5rem 0.75rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border);
  }

  .data-table td {
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .data-table tbody tr:last-child td { border-bottom: none; }
  .pkg-name { font-weight: 500; }

  .toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0;
  }

  .toggle-on .material-symbols-outlined { color: var(--color-success); font-size: 1.5rem; }
  .toggle-off .material-symbols-outlined { color: var(--color-text-muted); font-size: 1.5rem; }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    font-family: inherit;
    font-weight: 500;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
    white-space: nowrap;
  }

  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; }

  .btn-sm { padding: 0.3rem 0.625rem; font-size: var(--font-size-xs); }

  :not(.btn-sm).btn {
    padding: 0.5rem 1rem;
    font-size: var(--font-size-sm);
  }

  .btn-primary { background: var(--color-brand); color: var(--color-text-inverse); border-color: var(--color-brand); }
  .btn-primary:hover:not(:disabled) { background: var(--color-brand-hover); }

  .btn-ghost { background: transparent; color: var(--color-text-muted); border-color: transparent; }
  .btn-ghost:hover:not(:disabled) { background: var(--color-bg-muted); color: var(--color-text); }
</style>
