/**
 * ZIP archive extractor with security guards:
 *  - Path traversal rejection
 *  - ZIP bomb protection (max uncompressed bytes)
 *  - Extension allow-list
 *  - Filename sanitization
 *
 * Default allowed document extensions (used by campaign Mode A):
 *  .pdf, .docx, .png, .jpg, .jpeg, .webp, .gif, .tiff, .tif
 */

/** Default set of extensions accepted for per-recipient document uploads. */
export const DEFAULT_DOCUMENT_EXTS = [
  '.pdf',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.tiff',
  '.tif'
];
import JSZip from 'jszip';
import path from 'path';

export interface ExtractedFile {
  /** Sanitized, safe filename (basename only) */
  name: string;
  /** Original path inside the archive */
  originalPath: string;
  /** Uncompressed file content */
  buffer: Buffer;
}

export interface ZipExtractOptions {
  /** Maximum number of files to extract */
  maxFiles: number;
  /** Maximum total uncompressed bytes (ZIP bomb guard) */
  maxTotalBytes: number;
  /** Allowed file extensions, e.g. ['.pdf', '.docx'] – must start with '.' */
  allowedExts: string[];
}

/**
 * Sanitize a filename: take basename only, replace unsafe characters.
 */
function sanitizeFilename(raw: string): string {
  const base = path.basename(raw); // strip any directory prefix
  // Replace characters that are not alphanumeric, dot, dash, or underscore
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Extract files from a ZIP buffer, applying all security checks.
 */
export async function extractZip(
  buffer: Buffer,
  opts: ZipExtractOptions
): Promise<ExtractedFile[]> {
  const zip = await JSZip.loadAsync(buffer);

  const results: ExtractedFile[] = [];
  let totalBytes = 0;
  let fileCount = 0;

  for (const [relativePath, entry] of Object.entries(zip.files)) {
    // Skip directory entries
    if (entry.dir) continue;

    // Guard: path traversal — reject any entry containing '..'
    if (relativePath.includes('..')) {
      continue;
    }

    // Guard: max file count
    if (fileCount >= opts.maxFiles) {
      break;
    }

    // Check extension allow-list
    const ext = path.extname(relativePath).toLowerCase();
    if (opts.allowedExts.length > 0 && !opts.allowedExts.includes(ext)) {
      continue;
    }

    // Decompress and check total byte budget
    const content = await entry.async('nodebuffer');
    totalBytes += content.length;

    if (totalBytes > opts.maxTotalBytes) {
      throw new Error(
        `ZIP extraction aborted: total uncompressed size exceeds ${opts.maxTotalBytes} bytes (possible ZIP bomb).`
      );
    }

    results.push({
      name: sanitizeFilename(relativePath),
      originalPath: relativePath,
      buffer: content
    });

    fileCount++;
  }

  return results;
}
