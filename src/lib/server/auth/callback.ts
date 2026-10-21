import type { SupabaseClient } from '@supabase/supabase-js';

export interface InitializeNewUserResult {
  isNew: boolean;
}

/**
 * Idempotently set up a new user's records on first sign-in.
 *
 * Steps (only executed when the profile does not already exist):
 *  1. INSERT into `profiles`
 *  2. INSERT into `workspaces`
 *  3. Call RPC `award_initial_credits`
 *  4. INSERT into `workspace_members`
 *
 * Returns `{ isNew: true }` when the profile was just created,
 * `{ isNew: false }` when it already existed.
 */
export async function initializeNewUser(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  fullName: string | null
): Promise<InitializeNewUserResult> {
  // ── 1. Check for existing profile (idempotency guard) ─────────────
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (existing) {
    return { isNew: false };
  }

  // ── 2. Create profile ─────────────────────────────────────────────
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    email,
    full_name: fullName ?? null
  });

  if (profileError) {
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  // ── 3. Create workspace ───────────────────────────────────────────
  const workspaceName = fullName ? `${fullName}'s Workspace` : 'My Workspace';

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({ owner_id: userId, name: workspaceName })
    .select('id')
    .single();

  if (workspaceError || !workspace) {
    throw new Error(`Failed to create workspace: ${workspaceError?.message}`);
  }

  // ── 4. Award initial credits via RPC ──────────────────────────────
  const { error: rpcError } = await supabase.rpc('award_initial_credits', {
    p_user_id: userId,
    p_amount: 100,
    p_description: `signup:${userId}`
  });

  if (rpcError) {
    // Non-fatal: log but don't abort — user can still use the app.
    console.error('[initializeNewUser] award_initial_credits RPC error:', rpcError.message);
  }

  // ── 5. Add user as owner of their workspace ───────────────────────
  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'owner'
  });

  if (memberError) {
    console.error('[initializeNewUser] workspace_members insert error:', memberError.message);
  }

  return { isNew: true };
}
