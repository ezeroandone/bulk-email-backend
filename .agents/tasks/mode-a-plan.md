# Implementation Plan — Mode A "Attach Existing File Per Recipient"

## Pre-exploration findings

- **ZIP library**: `jszip@3.10.1` is already in `dependencies` — no new package needed.
- **`[id]` folder already exists** under `src/routes/api/campaigns/[id]/` with `cancel`, `pause`, `resume`, `start`, and `report` sub-routes. New sub-routes (`files`, `match`, `activate`) follow the same pattern.
- **`requireSession` pattern**: Import from `$lib/server/auth/session`, wrap in try/catch returning 401 on redirect throw.
- **Dispatch bugs confirmed**: `file_matches` query uses column `recipient_id` (wrong — table has `campaign_recipient_id`) and bucket `campaign-documents` (wrong — real bucket is `documents`).
- **`start` endpoint already exists** and sets status=queued + re-enqueues jobs with status in `['queued','paused']`. The activate endpoint can reuse this exact logic, just adding a `file_matches` count validation guard.
- **Draft status for delivery_jobs**: The `start` endpoint re-enqueues jobs in status `'queued'` or `'paused'`. For Mode A, jobs need to be created with status `'draft'` (not yet enqueued) so dispatch cannot claim them until activation. The `activate` endpoint will update jobs from `draft`→`queued` and enqueue them.
- **`dataset_rows` uses column `data`** (not `row_data`). `campaign_recipients` uses `variables` for the row data map. The match API must read from `campaign_recipients.variables` (the column that holds per-row key-value pairs).
- **`canNext()` bug**: step 4 returns `mode === 'C' || templateId !== ''`, so Mode A can never advance. Fix: `mode === 'A' ? selectedFiles.length > 0 : templateId !== ''`.
- **Draft persistence**: `DraftState` interface must be extended to include `selectedFileNames` (string[]) for display restoration; actual `File` objects cannot be JSON-serialised so they are re-required on reload (standard browser behaviour).

---

## Implementation Plan

- [ ] 1. **Fix dispatch server bugs in `src/routes/api/internal/dispatch/+server.ts`**

  Two one-line fixes in the Mode A block of `processJob()`:
  - Change `.eq('recipient_id', recipientId)` → `.eq('campaign_recipient_id', recipientId)`.
  - Change `.from('campaign-documents')` → `.from('documents')`.
  - Fix `attachment.filename` fallback: `file_matches` has no `filename` column; derive the filename from `document_assets.name` by joining through `document_asset_id`. Update the select to: `.select('document_assets(name, storage_path, mime_type)')` with a join, OR do a second query for the asset. Simpler: join inline.

  Files: `src/routes/api/internal/dispatch/+server.ts`

  Verify: `npm run check` — TypeScript reports no new errors in this file.

---

- [ ] 2. **Modify POST `/api/campaigns` to create Mode A campaigns as `'draft'`**

  In `src/routes/api/campaigns/+server.ts`, in the campaign insert section (step 6):
  - Change the `status` value: `status: d.mode === 'A' ? 'draft' : 'queued'`
  - Change the `delivery_jobs` insert (step 8): `status: d.mode === 'A' ? 'draft' : 'queued'`
  - For Mode A, skip the `pgmq_send_batch` call (step 9) since jobs are draft and must not be enqueued yet. Wrap the enqueue block: `if (d.mode !== 'A') { ... pgmq_send_batch ... }`.

  Files: `src/routes/api/campaigns/+server.ts`

  Verify: `npm run check` — no errors.

---

- [ ] 3. **Create file upload API — `src/routes/api/campaigns/[id]/files/+server.ts`**

  POST handler:
  - Authenticate with `requireSession`.
  - Verify campaign ownership: query `campaigns` table with `id` and `user_id`, confirm mode === 'A' and status === 'draft'.
  - Parse `request.formData()`.
  - For each entry that is a `File`:
    - If `file.type === 'application/zip'` or filename ends `.zip`: use JSZip to load the buffer and iterate `zip.files`, extract each non-directory file as an `ArrayBuffer`.
    - For non-ZIP files: use the file directly.
    - Determine MIME type for each extracted file. Map GIF → `image/gif` (note: bucket does not allow `image/gif`; reject GIF/TIFF at this layer with a clear error listing unsupported file). Allowed: `application/pdf`, `image/png`, `image/jpeg`, `image/webp`, DOCX/XLSX types.
    - Upload to Supabase admin storage bucket `documents` at path `{user_id}/{campaign_id}/{filename}` using `admin.storage.from('documents').upload(path, buffer, { contentType, upsert: true })`.
    - Insert `document_assets` row: `{ user_id, workspace_id: null, name: filename, storage_path: path, file_size: buffer.byteLength, mime_type, metadata: { campaign_id } }`.
  - Collect all inserted asset rows.
  - Return `{ success: true, data: { assets: [{ id, name, file_size, mime_type }] } }`.
  - On error: return `{ success: false, error: '...' }` with appropriate status.

  Use `createSupabaseAdminClient` for storage upload (bypasses RLS). Use `locals.supabase` for ownership checks (respects RLS). Use admin client for `document_assets` insert too, since the user is verified by ownership check.

  Files: `src/routes/api/campaigns/[id]/files/+server.ts` (create new)

  Verify: `npm run check` — no TypeScript errors in new file.

---

- [ ] 4. **Create file matching API — `src/routes/api/campaigns/[id]/match/+server.ts`**

  POST handler — accepts JSON body `{ match_column: string }`:
  - Authenticate with `requireSession`.
  - Verify campaign ownership + mode === 'A'.
  - Load all `campaign_recipients` for this campaign: `id`, `variables` (JSONB).
  - Load all `document_assets` where `metadata->>'campaign_id' = campaignId` using `.filter('metadata->>campaign_id', 'eq', campaignId)`.
  - Build match map: for each asset, `key = asset.name.replace(/\.[^.]+$/, '').trim().toLowerCase()`.
  - For each recipient, `recipientKey = (variables[match_column] ?? '').toString().trim().toLowerCase()`. Find asset where `key === recipientKey`.
  - Build upsert array for matched pairs: `{ campaign_id, campaign_recipient_id: recipient.id, document_asset_id: asset.id, match_method: 'filename', confidence: 1.0, is_confirmed: true, is_excluded: false }`.
  - Upsert into `file_matches` with `onConflict: 'campaign_id,campaign_recipient_id'` (unique constraint assumed on this pair).
  - Compute unmatched files: asset names with no matched recipient.
  - Return `{ success: true, data: { total_assets, matched, unmatched, unmatched_files: string[] } }`.

  Files: `src/routes/api/campaigns/[id]/match/+server.ts` (create new)

  Verify: `npm run check` — no TypeScript errors.

---

- [ ] 5. **Create campaign activation API — `src/routes/api/campaigns/[id]/activate/+server.ts`**

  POST handler:
  - Authenticate with `requireSession`.
  - Load campaign: verify ownership, mode === 'A', status === 'draft'.
  - Count `file_matches` for this campaign (`is_excluded = false`). If count === 0, return 422 with `{ error: 'No file matches found. Upload and match files first.' }`.
  - Update campaign: `status = 'queued'`.
  - Update `delivery_jobs` for this campaign: `status = 'queued'` where `status = 'draft'`.
  - Enqueue jobs via `pgmq_send_batch` (same pattern as `start` endpoint and campaigns POST).
  - Return `{ success: true }`.

  Files: `src/routes/api/campaigns/[id]/activate/+server.ts` (create new)

  Verify: `npm run check` — no TypeScript errors.

---

- [ ] 6. **Update wizard step 4 — file upload dropzone for Mode A**

  In `src/routes/(app)/dashboard/campaigns/new/+page.svelte`:

  Add state variables (after existing `$state` declarations):
  ```typescript
  let selectedFiles = $state<File[]>([]);
  let matchColumn = $state('');
  ```

  Fix `canNext()` step 4:
  - Change `case 4: return mode === 'C' || templateId !== '';`
  - To: `case 4: return mode === 'A' ? selectedFiles.length > 0 : templateId !== '';`

  Replace the Mode A content in Step 4's `{#if mode === 'A'}` block:
  - Remove the static info text.
  - Add a file dropzone `<div>` that:
    - Shows a dashed border drop area with upload icon and "Drag & drop files here, or click to browse" text.
    - Handles `dragover` (preventDefault, add visual highlight), `dragleave`, `drop` (extract `event.dataTransfer.files`, merge with `selectedFiles` deduplicating by name).
    - Has a hidden `<input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.tif,.tiff,.zip">` triggered by clicking the drop area.
    - On file input `change`, merge new files with existing `selectedFiles` (deduplicate by name).
  - Below the dropzone, show a file list: for each file in `selectedFiles`, show filename + formatted size + a remove (×) button that splices the file out of `selectedFiles`.
  - Show total count badge: "N file(s) selected".

  Files: `src/routes/(app)/dashboard/campaigns/new/+page.svelte`

  Verify: `npm run check` — no Svelte/TS errors.

---

- [ ] 7. **Update wizard step 5 — match configuration for Mode A**

  Still in `+page.svelte`, replace the Mode A content in Step 5's `{#if mode === 'A'}` block:

  Fix `canNext()` step 5:
  - Change `case 5: return true;`
  - To: `case 5: return mode !== 'A' || matchColumn !== '';`

  Add match column picker:
  - `<label>` + `<select>` bound to `matchColumn`, listing `datasetColumns` options with a blank default "Select column to match filenames against…".

  Add client-side preview table (computed from `selectedFiles` and `previewRecipients`):
  - Derive `previewMatches`: for each file in `selectedFiles`, compute `fileKey = file.name.replace(/\.[^.]+$/, '').trim().toLowerCase()`. For each preview row in `previewRecipients`, check if `(row[matchColumn] ?? '').toString().trim().toLowerCase() === fileKey`. Collect matched/unmatched.
  - Render a `<table>` with columns: Filename | Match column value | Status (✓ matched / ✗ unmatched in red).
  - Show a summary line: "X of Y files matched in preview".

  Also update `DraftState` interface and `saveDraft`/`loadDraft` to persist `matchColumn` (string).

  Files: `src/routes/(app)/dashboard/campaigns/new/+page.svelte`

  Verify: `npm run check` — no errors.

---

- [ ] 8. **Update launch flow for Mode A**

  Still in `+page.svelte`:

  Add state for multi-step launch progress:
  ```typescript
  let launchProgress = $state<{ step: string; status: 'pending' | 'running' | 'done' | 'error' }[]>([]);
  let unmatchedWarning = $state<{ count: number; files: string[] } | null>(null);
  let unmatchedConfirmed = $state(false);
  let launchCampaignId = $state<string | null>(null);
  ```

  Replace the `launch()` function with a Mode A-aware version:

  For `mode === 'A'`:
  1. Set `launchProgress` to initial steps array: `['Creating campaign', 'Uploading files', 'Matching files', 'Activating campaign']` all `pending`.
  2. **Step 1 — Create campaign**: POST `/api/campaigns` with `file_match_config: { match_column: matchColumn }` and collect `campaign_id`. Update progress[0] to `done`. On error → `error`.
  3. **Step 2 — Upload files**: POST `/api/campaigns/{id}/files` as `FormData` with all `selectedFiles` appended. Update progress[1] to `done`. On error → `error`.
  4. **Step 3 — Match files**: POST `/api/campaigns/{id}/match` with `{ match_column: matchColumn }`. Collect `unmatched` count and `unmatched_files`. Update progress[2] to `done`.
  5. **If unmatched > 0**: set `unmatchedWarning = { count, files }`, set `launching = false`, pause. The UI shows the warning and a "Continue anyway" / "Go back" choice. On "Continue anyway": set `unmatchedConfirmed = true`, `launching = true`, proceed to step 4. On "Go back": reset relevant state and return to step 4.
  6. **Step 4 — Activate**: POST `/api/campaigns/{id}/activate`. Update progress[3] to `done`.
  7. On complete success: `clearDraft()`, `goto(\`/dashboard/campaigns/${id}\`)`.

  For `mode !== 'A'`: existing launch logic unchanged (single POST + redirect).

  Update Step 10 UI to show `launchProgress` steps with status icons when `mode === 'A'`, and the `unmatchedWarning` confirmation UI when present.

  Files: `src/routes/(app)/dashboard/campaigns/new/+page.svelte`

  Verify: `npm run check` — no errors. Manual test: complete wizard with Mode A selected, verify progress steps render.

---

- [ ] 9. **Extend `DraftState` for Mode A fields**

  Update the `DraftState` interface in `+page.svelte` to add:
  ```typescript
  matchColumn: string;
  selectedFileNames: string[]; // for display only; File objects cannot be serialised
  ```
  Update `saveDraft()` to write these fields. Update `loadDraft()` to restore `matchColumn` from draft (and display a note about re-selecting files since `File` objects cannot be persisted). This is already handled by the standard browser file input pattern.

  Files: `src/routes/(app)/dashboard/campaigns/new/+page.svelte`

  Verify: `npm run check` — no errors.

---

## Summary of decisions

| Decision | Rationale |
|---|---|
| Mode A campaigns created as `'draft'` status | Prevents dispatch from claiming jobs before files are matched |
| `delivery_jobs` also created as `'draft'` for Mode A | Dispatch `claim_delivery_jobs` RPC filters on `status='queued'`; draft jobs are invisible to it |
| ZIP extraction via `jszip` (already installed) | No new dependency; synchronous API works in the Vercel serverless context |
| GIF/TIFF rejected at upload API | Bucket MIME allowlist does not include these; clear error message beats silent failure |
| `metadata.campaign_id` on `document_assets` | No `campaign_id` FK on the table; metadata JSONB is the existing extension point |
| Upsert on `file_matches` with `campaign_id,campaign_recipient_id` | Re-running match after swapping files should update, not duplicate |
| Unmatched warning confirmed before activate | User may intentionally not have files for all recipients (e.g. some rows get email only); give them the choice |
| Activate endpoint validates file_matches count > 0 | Guard against activating a campaign that never had files uploaded |
