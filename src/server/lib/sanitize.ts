/**
 * Server-side HTML sanitization (no JSDOM dependency - Vercel serverless safe).
 * Strips malicious scripts/attributes while keeping safe formatting tags.
 * Always call this BEFORE writing user-submitted HTML to the database.
 */

const ALLOWED_TAGS = new Set([
    // Text formatting
    "p", "br", "b", "i", "u", "em", "strong", "s", "del", "sub", "sup", "mark",
    // Headings
    "h1", "h2", "h3", "h4", "h5", "h6",
    // Lists
    "ul", "ol", "li",
    // Links & Media
    "a", "img",
    // Structure
    "blockquote", "pre", "code", "hr", "div", "span",
    // Tables
    "table", "thead", "tbody", "tr", "th", "td",
]);

const ALLOWED_ATTR = new Set([
    "href", "target", "rel",       // links
    "src", "alt", "width", "height", // images
    "class",                        // styling (style attr removed: CSS injection risk)
]);

// Event handler attributes to always strip
const EVENT_HANDLER_RE = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;

// Match HTML tags (opening, closing, self-closing)
const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)?\/?>/g;

// Match individual attributes
const ATTR_RE = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;

function sanitizeTag(fullMatch: string, tagName: string, attrs: string | undefined): string {
    const tag = tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
        return "";
    }

    // Closing tag
    if (fullMatch.startsWith("</")) {
        return `</${tag}>`;
    }

    // Filter attributes
    let cleanAttrs = "";
    if (attrs) {
        const safeAttrs = attrs.replace(EVENT_HANDLER_RE, "");

        let match: RegExpExecArray | null;
        ATTR_RE.lastIndex = 0;
        while ((match = ATTR_RE.exec(safeAttrs)) !== null) {
            const attrName = match[1].toLowerCase();
            const attrValue = match[2] ?? match[3] ?? match[4] ?? "";

            if (!ALLOWED_ATTR.has(attrName)) continue;

            // Prevent javascript: protocol in href/src
            if ((attrName === "href" || attrName === "src") && /^\s*javascript\s*:/i.test(attrValue)) {
                continue;
            }

            cleanAttrs += ` ${attrName}="${attrValue.replace(/"/g, "&quot;")}"`;
        }
    }

    const selfClosing = fullMatch.trimEnd().endsWith("/>");
    return `<${tag}${cleanAttrs}${selfClosing ? " /" : ""}>`;
}

export function sanitizeHtml(html: string): string {
    // Strip dangerous tags AND their content
    let clean = html.replace(/<(script|style|iframe|object|embed|form|input|textarea|select)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
    clean = clean.replace(/<(script|style|iframe|object|embed|form|input|textarea|select)\b[^>]*\/?>/gi, "");

    // Process remaining tags
    return clean.replace(TAG_RE, sanitizeTag);
}

/**
 * Sanitize plain text fields (strip ALL HTML).
 * Use for fields that should never contain markup.
 */
export function sanitizePlainText(text: string): string {
    return text.replace(/<[^>]*>/g, "").trim();
}
