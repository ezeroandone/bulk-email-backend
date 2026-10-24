import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import { generateDocx } from '$lib/server/services/documents/docxGenerator';
import {
  generateFromPdfTemplate,
  generateFromImage,
  detectImageFormat
} from '$lib/server/services/documents/pdfGenerator';
import type { PdfFieldDef, ImageFormat } from '$lib/server/services/documents/pdfGenerator';
import type { RequestHandler } from './$types';

/** Image format extensions that map to the image branch. */
const IMAGE_FORMATS = new Set(['png', 'jpeg', 'jpg', 'webp', 'gif', 'tiff', 'tif', 'bmp']);

const PreviewSchema = z.object({
  variables: z.record(z.string(), z.string())
});

export const POST: RequestHandler = async ({ locals, params, request }) => {
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

  const parsed = PreviewSchema.safeParse(body);
  if (!parsed.success) {
    return json({
      success: false,
      error: 'Validation failed.',
      details: parsed.error.flatten().fieldErrors
    }, { status: 422 });
  }

  // Fetch template
  const { data: template, error: tplError } = await locals.supabase
    .from('document_templates')
    .select('id, type, storage_path')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (tplError || !template) {
    return json({ success: false, error: 'Template not found.' }, { status: 404 });
  }

  // Fetch field mappings
  const { data: fieldRows } = await locals.supabase
    .from('document_template_fields')
    .select('id, variable, x, y, font_size, font_family, color, alignment, page_index')
    .eq('template_id', params.id);

  // Download the template file from storage
  const { data: fileData, error: dlError } = await locals.supabase.storage
    .from('documents')
    .download(template.storage_path);

  if (dlError || !fileData) {
    return json({ success: false, error: 'Could not load template file.' }, { status: 500 });
  }

  const fileBuffer = Buffer.from(await fileData.arrayBuffer());
  const { variables } = parsed.data;

  let resultBuffer: Buffer;
  let mimeType: string;

  try {
    if (template.type === 'docx') {
      resultBuffer = await generateDocx(fileBuffer, variables);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (template.type === 'pdf') {
      const fields: PdfFieldDef[] = (fieldRows ?? []).map((f: {
        id: string;
        variable: string;
        x: number;
        y: number;
        font_size: number;
        font_family: string;
        color: string;
        alignment: string;
        page_index: number;
      }) => ({
        id: f.id,
        variable: f.variable,
        x: f.x,
        y: f.y,
        fontSize: f.font_size,
        fontFamily: f.font_family,
        color: f.color,
        alignment: f.alignment as PdfFieldDef['alignment'],
        pageIndex: f.page_index
      }));
      resultBuffer = await generateFromPdfTemplate(fileBuffer, fields, variables);
      mimeType = 'application/pdf';
    } else if (template.type === 'image') {
      const fields: PdfFieldDef[] = (fieldRows ?? []).map((f: {
        id: string;
        variable: string;
        x: number;
        y: number;
        font_size: number;
        font_family: string;
        color: string;
        alignment: string;
        page_index: number;
      }) => ({
        id: f.id,
        variable: f.variable,
        x: f.x,
        y: f.y,
        fontSize: f.font_size,
        fontFamily: f.font_family,
        color: f.color,
        alignment: f.alignment as PdfFieldDef['alignment'],
        pageIndex: f.page_index
      }));
      // Use the stored format, or auto-detect from magic bytes as fallback
      const imageType: ImageFormat = (detectImageFormat(fileBuffer) ?? 'png') as ImageFormat;
      resultBuffer = await generateFromImage(
        fileBuffer,
        imageType,
        { width: 595.28, height: 841.89 }, // A4 in points
        fields,
        variables
      );
      mimeType = 'application/pdf';
    } else {
      return json({ success: false, error: `Unsupported template type: ${template.type}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return json({ success: false, error: message }, { status: 500 });
  }

  const base64 = resultBuffer.toString('base64');
  return json({ success: true, data: { base64, mimeType } });
};
