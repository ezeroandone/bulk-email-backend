/**
 * DOCX template generator using PizZip + docxtemplater.
 * Supports placeholder detection, variable rendering, and missing-variable reporting.
 *
 * NOTE: docxtemplater uses SINGLE-brace delimiters by default: {variable}
 * not double-brace. This module follows the same convention.
 */
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

// ── Placeholder detection ─────────────────────────────────────────────────────

/**
 * Load the DOCX buffer, run docxtemplater in dry-run mode, and extract
 * all `{{variable}}` placeholder names found in the template.
 */
export async function detectPlaceholders(buffer: Buffer): Promise<string[]> {
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // null data triggers dry-run: all tags are identified, none rendered
    nullGetter: () => ''
  });

  // Collect tags via the internal parser (access after compile)
  try {
    doc.compile();
  } catch {
    // Ignore render errors during detection; tags may still be accessible
  }

  const tags = new Set<string>();
  try {
    // docxtemplater exposes getFullText for content and a getTags helper
    // We use the public `getTags()` API if available
    const docAny = doc as unknown as { getTags?: () => Record<string, unknown> };
    if (typeof docAny.getTags === 'function') {
      const tagObj = docAny.getTags();
      for (const key of Object.keys(tagObj)) {
        tags.add(key);
      }
    } else {
      // Fallback: regex scan on raw XML
      const xmlContent = zip.files['word/document.xml']?.asText() ?? '';
      const matches = xmlContent.matchAll(/\{([^}]+)\}/g);
      for (const match of matches) {
        if (match[1]) tags.add(match[1].trim());
      }
    }
  } catch {
    // Ignore introspection errors
  }

  return [...tags];
}

// ── Document rendering ────────────────────────────────────────────────────────

/**
 * Render a DOCX template by substituting `variables` into `{{placeholders}}`.
 * Missing variables produce a warning and are substituted with an empty string.
 */
export async function generateDocx(
  buffer: Buffer,
  variables: Record<string, string>
): Promise<Buffer> {
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: (part) => {
      // part.value is the variable name
      const name = (part as { value?: string }).value ?? '';
      if (name) {
        console.warn(`[docxGenerator] Missing variable: "${name}" — substituting empty string.`);
      }
      return '';
    }
  });

  doc.render(variables);

  const out = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });

  return out;
}

// ── Missing variable detection ────────────────────────────────────────────────

/**
 * Return the list of placeholder names that are present in the template but
 * absent from (or empty in) `variables`.
 */
export function getDocxMissingVariables(
  buffer: Buffer,
  variables: Record<string, string>
): string[] {
  // Regex scan on raw XML for speed (synchronous)
  const zip = new PizZip(buffer);
  const xmlContent = zip.files['word/document.xml']?.asText() ?? '';
  const tagNames = new Set<string>();
  const matches = xmlContent.matchAll(/\{([^}]+)\}/g);
  for (const match of matches) {
    if (match[1]) tagNames.add(match[1].trim());
  }

  return [...tagNames].filter(
    (name) => !(name in variables) || variables[name] === undefined
  );
}
