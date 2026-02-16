/**
 * Template Tag Processing
 * 
 * Handles {title}, {url}, {excerpt} and other template tags
 * Matches wp-to-buffer-pro tag syntax
 */

// =============================================================================
// TYPES
// =============================================================================

export interface TemplateContext {
  title?: string;
  url?: string;
  excerpt?: string;
  content?: string;
  author?: string;
  sitename?: string;
  date?: string;
  time?: string;
  hashtags?: string;
  
  // Custom fields
  [key: string]: string | undefined;
}

// =============================================================================
// TAG DEFINITIONS
// =============================================================================

const TAG_PATTERN = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

/**
 * Built-in tag processors
 */
const BUILT_IN_TAGS: Record<string, (ctx: TemplateContext) => string> = {
  title: (ctx) => ctx.title || '',
  url: (ctx) => ctx.url || '',
  excerpt: (ctx) => ctx.excerpt || truncate(ctx.content || '', 100),
  content: (ctx) => ctx.content || '',
  author: (ctx) => ctx.author || '',
  sitename: (ctx) => ctx.sitename || '',
  
  // Dynamic date/time
  date: () => new Date().toISOString().split('T')[0],
  time: () => new Date().toTimeString().split(' ')[0].slice(0, 5),
  datetime: () => new Date().toISOString(),
  
  // Date parts
  year: () => new Date().getFullYear().toString(),
  month: () => (new Date().getMonth() + 1).toString().padStart(2, '0'),
  day: () => new Date().getDate().toString().padStart(2, '0'),
  
  // Day names
  dayname: () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
  dayname_short: () => new Date().toLocaleDateString('en-US', { weekday: 'short' }),
  
  // Month names
  monthname: () => new Date().toLocaleDateString('en-US', { month: 'long' }),
  monthname_short: () => new Date().toLocaleDateString('en-US', { month: 'short' }),
  
  // Hashtags (auto-generated from title/content)
  hashtags: (ctx) => ctx.hashtags || generateHashtags(ctx.title || ctx.content || ''),
};

// =============================================================================
// PROCESSING
// =============================================================================

/**
 * Process a template string with the given context
 */
export function processTemplate(template: string, context: TemplateContext): string {
  return template.replace(TAG_PATTERN, (match, tagName) => {
    const tag = tagName.toLowerCase();
    
    // Check built-in tags first
    if (BUILT_IN_TAGS[tag]) {
      return BUILT_IN_TAGS[tag](context);
    }
    
    // Check custom context values
    if (context[tag] !== undefined) {
      return context[tag] || '';
    }
    
    // Unknown tag - leave as-is
    return match;
  });
}

/**
 * Extract all tags from a template
 */
export function extractTags(template: string): string[] {
  const tags: string[] = [];
  let match;
  
  while ((match = TAG_PATTERN.exec(template)) !== null) {
    if (!tags.includes(match[1].toLowerCase())) {
      tags.push(match[1].toLowerCase());
    }
  }
  
  // Reset regex state
  TAG_PATTERN.lastIndex = 0;
  
  return tags;
}

/**
 * Validate a template (check for unknown tags)
 */
export function validateTemplate(template: string): { valid: boolean; unknownTags: string[] } {
  const tags = extractTags(template);
  const knownTags = Object.keys(BUILT_IN_TAGS);
  const unknownTags = tags.filter(t => !knownTags.includes(t));
  
  return {
    valid: unknownTags.length === 0,
    unknownTags
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Truncate string to max length
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) {
    return str;
  }
  return str.slice(0, maxLen - 1) + '…';
}

/**
 * Generate hashtags from text
 */
function generateHashtags(text: string, maxTags: number = 3): string {
  // Extract significant words (4+ chars, no common words)
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
    'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'being',
    'this', 'that', 'with', 'they', 'from', 'will', 'would', 'there',
    'their', 'what', 'about', 'which', 'when', 'make', 'like', 'just',
    'over', 'such', 'into', 'other', 'than', 'then', 'them', 'these',
    'some', 'could', 'very', 'your', 'more', 'also'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !stopWords.has(w));
  
  // Get unique words, prioritize by length
  const unique = [...new Set(words)]
    .sort((a, b) => b.length - a.length)
    .slice(0, maxTags);
  
  return unique.map(w => `#${w}`).join(' ');
}

/**
 * Get list of available template tags with descriptions
 */
export function getAvailableTags(): Record<string, string> {
  return {
    '{title}': 'Content title',
    '{url}': 'Content URL',
    '{excerpt}': 'Short excerpt (first 100 chars)',
    '{content}': 'Full content',
    '{author}': 'Author name',
    '{sitename}': 'Site name',
    '{date}': 'Current date (YYYY-MM-DD)',
    '{time}': 'Current time (HH:MM)',
    '{datetime}': 'Current date and time (ISO)',
    '{year}': 'Current year',
    '{month}': 'Current month (01-12)',
    '{day}': 'Current day (01-31)',
    '{dayname}': 'Day name (Monday)',
    '{dayname_short}': 'Day name short (Mon)',
    '{monthname}': 'Month name (January)',
    '{monthname_short}': 'Month name short (Jan)',
    '{hashtags}': 'Auto-generated hashtags'
  };
}
