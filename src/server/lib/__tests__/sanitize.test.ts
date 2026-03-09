import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizePlainText } from "../sanitize";

describe("sanitizeHtml", () => {
    it("should allow basic formatting tags", () => {
        const input = "<p>Hello <strong>world</strong></p>";
        expect(sanitizeHtml(input)).toBe(input);
    });

    it("should strip script tags", () => {
        const input = '<p>Hello</p><script>alert("xss")</script>';
        expect(sanitizeHtml(input)).toBe("<p>Hello</p>");
    });

    it("should strip event handler attributes", () => {
        const input = '<img src="test.jpg" onerror="alert(1)">';
        const result = sanitizeHtml(input);
        expect(result).not.toContain("onerror");
    });

    it("should allow safe links with href", () => {
        const input = '<a href="https://example.com">Link</a>';
        expect(sanitizeHtml(input)).toContain('href="https://example.com"');
    });

    it("should strip iframe tags", () => {
        const input = '<iframe src="https://evil.com"></iframe>';
        expect(sanitizeHtml(input)).toBe("");
    });

    it("should strip style tags", () => {
        const input = "<style>body { display: none; }</style><p>Text</p>";
        expect(sanitizeHtml(input)).toBe("<p>Text</p>");
    });

    it("should strip javascript: protocol in links", () => {
        const input = '<a href="javascript:alert(1)">Click</a>';
        const result = sanitizeHtml(input);
        expect(result).not.toContain("javascript:");
    });

    it("should allow table elements", () => {
        const input = "<table><tr><td>Cell</td></tr></table>";
        expect(sanitizeHtml(input)).toContain("<table>");
        expect(sanitizeHtml(input)).toContain("<td>Cell</td>");
    });

    it("should handle empty string", () => {
        expect(sanitizeHtml("")).toBe("");
    });

    it("should strip form elements", () => {
        const input = '<form action="/steal"><input type="text"></form>';
        const result = sanitizeHtml(input);
        expect(result).not.toContain("<form");
        expect(result).not.toContain("<input");
    });
});

describe("sanitizePlainText", () => {
    it("should strip ALL HTML tags", () => {
        const input = "<p>Hello <strong>world</strong></p>";
        expect(sanitizePlainText(input)).toBe("Hello world");
    });

    it("should strip script tags and content", () => {
        const input = 'Hello<script>alert("xss")</script>World';
        expect(sanitizePlainText(input)).toBe("HelloWorld");
    });
});
