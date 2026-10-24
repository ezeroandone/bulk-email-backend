/**
 * GET /api/campaigns/[id]/report — CSV with per-recipient delivery details
 */
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export const GET: RequestHandler = async ({ locals, params }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = params;

  // Verify ownership
  const { data: campaign } = await locals.supabase
    .from('campaigns')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!campaign) {
    return new Response('Campaign not found', { status: 404 });
  }

  // Load recipients + delivery job info
  const { data: recipients } = await locals.supabase
    .from('campaign_recipients')
    .select('id, email, status, delivery_jobs(attempt_count, last_error, updated_at)')
    .eq('campaign_id', id)
    .order('id', { ascending: true });

  const rows = recipients ?? [];

  const headers = ['Email', 'Status', 'Attempts', 'Last Error', 'Last Attempt'];
  const lines: string[] = [headers.map(escapeCsv).join(',')];

  for (const r of rows) {
    const job = (r as { delivery_jobs?: { attempt_count?: number; last_error?: string | null; updated_at?: string } | null }).delivery_jobs;
    const cells = [
      escapeCsv(r.email as string),
      escapeCsv(r.status as string),
      escapeCsv(String(job?.attempt_count ?? 0)),
      escapeCsv(job?.last_error ?? ''),
      escapeCsv(job?.updated_at ? new Date(job.updated_at).toISOString() : '')
    ];
    lines.push(cells.join(','));
  }

  const csv = lines.join('\r\n');
  const filename = `campaign-${id}-report.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store'
    }
  });
};
