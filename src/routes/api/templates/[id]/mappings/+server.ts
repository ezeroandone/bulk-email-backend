import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

// ── Schemas ───────────────────────────────────────────────────────────────────

const PdfFieldSchema = z.object({
  id: z.string().optional(),
  variable: z.string().min(1),
  x: z.number(),
  y: z.number(),
  fontSize: z.number().min(1).max(144),
  fontFamily: z.string().default('Helvetica'),
  color: z.string().regex(/^#[0-9a-fA-F]{3,6}$/, 'Invalid hex color').default('#000000'),
  alignment: z.enum(['left', 'center', 'right']).default('left'),
  pageIndex: z.number().int().min(0).default(0)
});

const DocxMappingSchema = z.object({
  placeholder: z.string().min(1),
  column: z.string().min(1)
});

const PutSchema = z.union([
  z.object({ fields: z.array(PdfFieldSchema) }),
  z.object({ mappings: z.array(DocxMappingSchema) })
]);

// ── GET ───────────────────────────────────────────────────────────────────────

export const GET: RequestHandler = async ({ locals, params }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Verify template ownership
  const { data: template } = await locals.supabase
    .from('document_templates')
    .select('id, format')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (!template) {
    return json({ success: false, error: 'Template not found.' }, { status: 404 });
  }

  const { data: fields, error } = await locals.supabase
    .from('document_template_fields')
    .select('id, variable, x, y, font_size, font_family, color, alignment, page_index')
    .eq('template_id', params.id)
    .order('page_index')
    .order('id');

  if (error) {
    return json({ success: false, error: 'Failed to load field definitions.' }, { status: 500 });
  }

  return json({ success: true, data: { fields: fields ?? [], format: template.format } });
};

// ── PUT ───────────────────────────────────────────────────────────────────────

export const PUT: RequestHandler = async ({ locals, params, request }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) {
    return json({
      success: false,
      error: 'Validation failed.',
      details: parsed.error.flatten().fieldErrors
    }, { status: 422 });
  }

  // Verify template ownership
  const { data: template } = await locals.supabase
    .from('document_templates')
    .select('id, format')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (!template) {
    return json({ success: false, error: 'Template not found.' }, { status: 404 });
  }

  // Delete existing field definitions
  await locals.supabase
    .from('document_template_fields')
    .delete()
    .eq('template_id', params.id);

  let insertRows: Record<string, unknown>[] = [];

  if ('fields' in parsed.data) {
    // PDF/Image field layout
    insertRows = parsed.data.fields.map((f) => ({
      template_id: params.id,
      variable: f.variable,
      x: f.x,
      y: f.y,
      font_size: f.fontSize,
      font_family: f.fontFamily,
      color: f.color,
      alignment: f.alignment,
      page_index: f.pageIndex
    }));
  } else {
    // DOCX placeholder mappings (reuse the table with special encoding)
    insertRows = parsed.data.mappings.map((m) => ({
      template_id: params.id,
      variable: m.placeholder,
      x: 0,
      y: 0,
      font_size: 12,
      font_family: m.column, // store dataset column name in font_family
      color: '#000000',
      alignment: 'left',
      page_index: 0
    }));
  }

  if (insertRows.length > 0) {
    const { error: insertError } = await locals.supabase
      .from('document_template_fields')
      .insert(insertRows);

    if (insertError) {
      return json({ success: false, error: 'Failed to save field definitions.' }, { status: 500 });
    }
  }

  // Update placeholder count / list on document_templates
  if ('fields' in parsed.data) {
    const uniqueVars = [...new Set(parsed.data.fields.map((f) => f.variable))];
    await locals.supabase
      .from('document_templates')
      .update({ placeholders: uniqueVars, updated_at: new Date().toISOString() })
      .eq('id', params.id);
  } else {
    const uniqueVars = parsed.data.mappings.map((m) => m.placeholder);
    await locals.supabase
      .from('document_templates')
      .update({ placeholders: uniqueVars, updated_at: new Date().toISOString() })
      .eq('id', params.id);
  }

  return json({ success: true });
};
