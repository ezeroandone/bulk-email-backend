/**
 * PDF generation helpers using pdf-lib.
 *
 * Supports:
 *  - Filling text fields on existing PDFs
 *  - Converting browser Y coordinates to PDF coordinate space
 *  - Creating PDFs from an image background with text overlays
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PdfFieldDef {
  id: string;
  /** Variable name to look up in the variables map */
  variable: string;
  /** X position in PDF points from the left edge */
  x: number;
  /** Y position in PDF points from the bottom edge (PDF coordinate space) */
  y: number;
  fontSize: number;
  fontFamily: string;
  /** Hex color string, e.g. "#1a1a2e" */
  color: string;
  alignment: 'left' | 'center' | 'right';
  /** Zero-based page index */
  pageIndex: number;
}

// ── Coordinate conversion ─────────────────────────────────────────────────────

/**
 * Convert a Y coordinate from browser/canvas space (origin top-left, down is positive)
 * to PDF coordinate space (origin bottom-left, up is positive).
 *
 * @param browserY      Y in browser pixels from the top of the page
 * @param pageHeightPx  Rendered page height in pixels
 * @param pageHeightPt  Actual page height in PDF points
 */
export function convertBrowserToPdfCoords(
  browserY: number,
  pageHeightPx: number,
  pageHeightPt: number
): number {
  // Flip Y axis and scale from pixels to points
  const scale = pageHeightPt / pageHeightPx;
  return (pageHeightPx - browserY) * scale;
}

// ── Hex color → pdf-lib RGB ───────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace(/^#/, '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return {
    r: ((num >> 16) & 0xff) / 255,
    g: ((num >> 8) & 0xff) / 255,
    b: (num & 0xff) / 255
  };
}

// ── Field drawing helper ──────────────────────────────────────────────────────

async function drawFields(
  pdfDoc: PDFDocument,
  fields: PdfFieldDef[],
  variables: Record<string, string>
): Promise<void> {
  // Embed Helvetica (always available in pdf-lib without external files)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();

  for (const field of fields) {
    const page = pages[field.pageIndex];
    if (!page) continue;

    const text = variables[field.variable] ?? '';
    const { width: pageWidth } = page.getSize();
    const { r, g, b } = hexToRgb(field.color || '#000000');

    // Choose bold vs regular based on fontFamily hint
    const font = field.fontFamily?.toLowerCase().includes('bold') ? helveticaBold : helvetica;

    // Calculate x position based on alignment
    let drawX = field.x;
    if (field.alignment === 'center' || field.alignment === 'right') {
      const textWidth = font.widthOfTextAtSize(text, field.fontSize);
      if (field.alignment === 'center') {
        drawX = field.x - textWidth / 2;
      } else {
        drawX = field.x - textWidth;
      }
    }

    // Clamp to page bounds
    drawX = Math.max(0, Math.min(drawX, pageWidth));

    page.drawText(text, {
      x: drawX,
      y: field.y,
      size: field.fontSize,
      font,
      color: rgb(r, g, b)
    });
  }
}

// ── PDF template fill ─────────────────────────────────────────────────────────

/**
 * Load an existing PDF, overlay text fields at defined positions, and return
 * the modified PDF as a Buffer.
 */
export async function generateFromPdfTemplate(
  pdfBuffer: Buffer,
  fields: PdfFieldDef[],
  variables: Record<string, string>
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  await drawFields(pdfDoc, fields, variables);
  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

// ── Image-background PDF ──────────────────────────────────────────────────────

/**
 * Create a single-page PDF with an image as the background, then draw text
 * fields on top.
 *
 * @param imageBuffer   PNG or JPEG image data
 * @param imageType     'png' or 'jpeg'
 * @param pageSize      Desired page dimensions in PDF points
 * @param fields        Text fields to overlay
 * @param variables     Variable values
 */
export async function generateFromImage(
  imageBuffer: Buffer,
  imageType: 'png' | 'jpeg',
  pageSize: { width: number; height: number },
  fields: PdfFieldDef[],
  variables: Record<string, string>
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([pageSize.width, pageSize.height]);

  // Embed the image
  const embeddedImage =
    imageType === 'png'
      ? await pdfDoc.embedPng(imageBuffer)
      : await pdfDoc.embedJpg(imageBuffer);

  // Draw image as full-page background
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: pageSize.width,
    height: pageSize.height
  });

  // Overlay text fields
  await drawFields(pdfDoc, fields, variables);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
