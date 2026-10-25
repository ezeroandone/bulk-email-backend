/**
 * POST /api/campaigns/dispatch-now
 * Thin authenticated proxy to the internal dispatcher.
 * Lets the campaign detail page trigger a dispatch batch without
 * exposing INTERNAL_WORKER_SECRET to the browser.
 */
import { json } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import { privateEnv } from '$lib/server/env';
import { PUBLIC_APP_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
  // Must be a logged-in user
  try {
    requireSession(locals);
  } catch {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secret = privateEnv.INTERNAL_WORKER_SECRET;
  if (!secret) {
    return json({ error: 'Dispatcher not configured (missing INTERNAL_WORKER_SECRET).' }, { status: 500 });
  }

  // Call the internal dispatcher on the same origin
  const baseUrl = PUBLIC_APP_URL ?? 'http://localhost:5173';
  const dispatchUrl = `${baseUrl}/api/internal/dispatch`;

  try {
    const res = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json'
      }
    });

    const body = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return json({ error: body.error ?? 'Dispatch failed.' }, { status: res.status });
    }

    return json(body);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: `Dispatch request failed: ${msg}` }, { status: 500 });
  }
};
