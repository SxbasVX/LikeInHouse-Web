/**
 * Convierte errores de tRPC (incluidos los de validación Zod, que llegan como
 * un JSON con la lista de issues dentro de `message`) en texto legible.
 */

export interface TrpcErrorIssue {
  path: string;
  message: string;
}

export interface ParsedTrpcError {
  message: string;
  issues: TrpcErrorIssue[];
}

const FALLBACK_MESSAGE = "Ocurrió un error inesperado. Intenta de nuevo.";

function cleanIssueMessage(message: string): string {
  return message.includes("NaN") ? "Falta completar un número válido" : message;
}

function rawMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

export function parseTrpcError(error: unknown): ParsedTrpcError {
  const message = rawMessage(error).trim();
  if (!message) return { message: FALLBACK_MESSAGE, issues: [] };

  if (message.startsWith("[") || message.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(message);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const issues = list
        .filter(
          (issue): issue is { message: string; path?: unknown } =>
            !!issue && typeof issue === "object" && typeof (issue as { message?: unknown }).message === "string",
        )
        .map((issue) => ({
          path: Array.isArray(issue.path) ? issue.path.join(" > ") : "",
          message: cleanIssueMessage(issue.message),
        }));
      if (issues.length > 0) {
        return { message: "Revisa los datos ingresados.", issues };
      }
      return { message: FALLBACK_MESSAGE, issues: [] };
    } catch {
      // No era JSON: se muestra el mensaje tal cual.
    }
  }

  return { message, issues: [] };
}

/** Texto plano para el `description` de un toast. */
export function formatTrpcError(error: unknown): string {
  const { message, issues } = parseTrpcError(error);
  if (issues.length === 0) return message;
  return issues
    .map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message))
    .join(" · ");
}
