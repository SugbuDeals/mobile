/**
 * Text formatting and highlighting utilities
 */

export interface TextPart {
  text: string;
  style: Record<string, unknown>;
}

export interface HighlightConfig {
  highlightColor?: string;
  highlightBackground?: string;
  boldColor?: string;
}

/**
 * Extract highlights from text using common patterns
 */
export function extractHighlights(
  text: string,
  highlightTerms?: string[]
): Array<{ start: number; end: number }> {
  const highlights: Array<{ start: number; end: number }> = [];

  // Common highlight patterns
  const patterns = [
    /\*\*([^*]+)\*\*/g, // **bold**
    /\*([^*]+)\*/g, // *italic*
    /`([^`]+)`/g, // `code`
    /"([^"]+)"/g, // "quoted"
    /'([^']+)'/g, // 'quoted'
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      highlights.push({
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  });

  // Custom highlight terms
  if (highlightTerms) {
    highlightTerms.forEach((term) => {
      const regex = new RegExp(term, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    });
  }

  return highlights;
}

/**
 * Process text with highlights
 */
export function processTextWithHighlights(
  text: string,
  highlightTerms?: string[],
  config?: HighlightConfig
): TextPart[] {
  const highlights = extractHighlights(text, highlightTerms);
  const finalParts: TextPart[] = [];

  // Sort and merge overlapping highlights
  highlights.sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  highlights.forEach((hl) => {
    const last = merged[merged.length - 1];
    if (last && hl.start <= last.end) {
      last.end = Math.max(last.end, hl.end);
    } else {
      merged.push({ ...hl });
    }
  });

  // Build final parts with highlights
  let currentIndex = 0;
  merged.forEach((hl) => {
    if (hl.start > currentIndex) {
      finalParts.push({
        text: text.substring(currentIndex, hl.start),
        style: {
          color: config?.boldColor || "#1F2937",
          fontWeight: "400",
        },
      });
    }
    finalParts.push({
      text: text.substring(hl.start, hl.end),
      style: {
        color: config?.highlightColor || "#277874",
        fontWeight: "700",
        backgroundColor: config?.highlightBackground || "#E0F2F1",
      },
    });
    currentIndex = hl.end;
  });

  if (currentIndex < text.length) {
    finalParts.push({
      text: text.substring(currentIndex),
      style: {
        color: config?.boldColor || "#1F2937",
        fontWeight: "400",
      },
    });
  }

  return finalParts.length > 0
    ? finalParts
    : [
        {
          text,
          style: {
            color: config?.boldColor || "#1F2937",
            fontWeight: "400",
          },
        },
      ];
}

/**
 * Extract primary product from text
 */
export function extractPrimaryProduct(text: string | null | undefined): string | null {
  if (!text) return null;
  const patterns = [
    /I\s*recommend\s*the\s*([^,\.]+?)(?:,|\.|$)/i,
    /Primary\s*product\s*is\s*([^,\.]+?)(?:,|\.|$)/i,
    /best\s*deals\s*(?:on|for)\s*([^,\.]+?)(?:,|\.|$)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

