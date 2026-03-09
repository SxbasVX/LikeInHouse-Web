import DOMPurify from "isomorphic-dompurify";

/**
 * Server-side HTML sanitization.
 * Strips malicious scripts/attributes while keeping safe formatting tags.
 * Always call this BEFORE writing user-submitted HTML to the database.
 */

const ALLOWED_TAGS = [
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
];

const ALLOWED_ATTR = [
    "href", "target", "rel",       // links
    "src", "alt", "width", "height", // images
    "class",                        // styling (style attr removed: CSS injection risk)
];

export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOW_DATA_ATTR: false,
        // Force all links to open safely
        ADD_ATTR: ["target"],
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "textarea", "select"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    });
}

/**
 * Sanitize plain text fields (strip ALL HTML).
 * Use for fields that should never contain markup.
 */
export function sanitizePlainText(text: string): string {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
