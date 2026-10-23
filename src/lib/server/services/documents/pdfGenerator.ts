/**
 * PDF generation helpers using pdf-lib.
 *
 * Supports:
 *  - Filling text fields on existing PDFs
 *  - Converting browser Y coordinates to PDF coordinate space
 *  - Creating PDFs from an image background with text overlays
 *
 * Image format support (via sharp for non-native formats):
 *  - PNG, JPEG  — embedded directly by pdf-lib
 *  - WebP, GIF, TIFF, BMP — converted to PNG via sharp before embedding
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';

// ── Image MIME / extension helpers ────────────────────────────────────────────

/** All image formats accepted for template backgrounds. */
export type ImageFormat = 'png' | 'jpeg' | 'jpg' | 'webp' | 'gif' | 'tiff' | 'tif' | 'bmp';

/** Normalize an image format string to the canonical pdf-lib embed type. */
export async function normalizeToPngOrJpeg(
  imageBuffer: Buffer,
  format: ImageFormat
): Promise<{ buffer: Buffer; type: 'png' | 'jpeg' }> {
  const fmt = format.toLowerCase() as ImageFormat;
  if (fmt === 'png') return { buffer: imageBuffer, type: 'png' };
  if (fmt === 'jpeg' || fmt === 'jpg') return { buffer: imageBuffer, type: 'jpeg' };
  // WebP, GIF, TIFF, BMP — convert to PNG via sharp
  const converted = await sharp(imageBuffer).png().toBuffer();
  return { buffer: converted, type: 'png' };
}

/**
 * Detect image format from a Buffer's magic bytes.
 * Returns a canonical format string or null if not recognized.
 */
export function detectImageFormat(buffer: Buffer): ImageFormat | null {
  if (buffer.length < 4) return null;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'gif';
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length > 11 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'webp';
  // TIFF: 49 49 2A 00 (LE) or 4D 4D 00 2A (BE)
  if ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
      (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)) return 'tiff';
  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return 'bmp';
  return null;
}

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
 * Accepts PNG, JPEG, WebP, GIF, TIFF, BMP — non-native formats are
 * automatically converted to PNG via sharp before embedding.
 *
 * @param imageBuffer   Raw image data
 * @param imageType     Format of the image ('png'|'jpeg'|'jpg'|'webp'|'gif'|'tiff'|'tif'|'bmp')
 * @param pageSize      Desired page dimensions in PDF points
 * @param fields        Text fields to overlay
 * @param variables     Variable values
 */
export async function generateFromImage(
  imageBuffer: Buffer,
  imageType: ImageFormat,
  pageSize: { width: number; height: number },
  fields: PdfFieldDef[],
  variables: Record<string, string>
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([pageSize.width, pageSize.height]);

  // Normalize to PNG or JPEG (pdf-lib only natively embeds these two)
  const { buffer: normalizedBuffer, type: embedType } = await normalizeToPngOrJpeg(imageBuffer, imageType);

  // Embed the image
  const embeddedImage =
    embedType === 'png'
      ? await pdfDoc.embedPng(normalizedBuffer)
      : await pdfDoc.embedJpg(normalizedBuffer);

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
