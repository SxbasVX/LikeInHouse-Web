import { parseTrpcError } from "@/lib/trpc-error";

/** Descripción de toast para errores tRPC: lista de campos cuando es un error de validación. */
export function TrpcErrorDescription({ error }: { error: unknown }) {
  const { message, issues } = parseTrpcError(error);
  if (issues.length === 0) return <>{message}</>;

  return (
    <div className="mt-2 max-h-[290px] overflow-y-auto pr-2">
      <p className="mb-2 text-sm font-semibold">Corrige los siguientes errores:</p>
      <ul className="list-disc space-y-2 pl-4">
        {issues.map((issue, i) => (
          <li key={i} className="text-xs">
            {issue.path && <span className="mb-0.5 block font-semibold opacity-70">{issue.path}</span>}
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
