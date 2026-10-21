import { json } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import { importSpreadsheet } from '$lib/server/services/spreadsheets';
import type { RequestHandler } from './$types';

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ success: false, error: 'Invalid form data.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return json({ success: false, error: 'No file provided.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return json({ success: false, error: 'File exceeds the 50 MB size limit.' }, { status: 413 });
  }

  const name = file.name.toLowerCase();
  const mimeType = file.type || 'application/octet-stream';

  if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
    return json(
      { success: false, error: 'Only .xlsx and .csv files are supported.' },
      { status: 415 }
    );
  }

  const sheetIndexRaw = formData.get('sheetIndex');
  const sheetIndex = sheetIndexRaw ? Math.max(0, Number(sheetIndexRaw)) : 0;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await importSpreadsheet(buffer, mimeType, sheetIndex);

    return json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to parse file.';
    return json({ success: false, error: message }, { status: 422 });
  }
};
