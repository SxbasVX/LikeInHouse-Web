"use client";

import { useState, type ReactNode } from "react";
import { KeyRound, Loader2, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { signOutToLogin } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import type { RouterOutput } from "@/types";

export type CatalogAccessStatus = RouterOutput["catalogImport"]["status"];

// Every importer screen needs the private code on top of the DEVELOPER role.
export function CatalogAccessGate({ children }: { children: (status: CatalogAccessStatus) => ReactNode }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [secret, setSecret] = useState("");
  const status = trpc.catalogImport.status.useQuery(undefined, { retry: false });
  const access = trpc.catalogImport.access.useMutation({
    onSuccess: async () => { setSecret(""); await utils.catalogImport.status.invalidate(); },
    onError: (error) => { setSecret(""); toast({ title: "Acceso denegado", description: error.message, variant: "destructive" }); },
  });

  if (status.isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-64 w-full" /></div>;
  if (status.data) return <>{children(status.data)}</>;

  return <div className="flex min-h-[60vh] items-center justify-center">
    <form className="w-full max-w-sm space-y-5 rounded-2xl border bg-white p-6 shadow-sm" onSubmit={(e) => { e.preventDefault(); access.mutate({ secret }); }}>
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-brand-teal/10 p-3"><KeyRound className="h-5 w-5 text-brand-darkTeal" /></div>
        <div><h2 className="font-heading text-lg font-semibold text-brand-darkRed">Verificación adicional</h2>
          <p className="text-sm text-muted-foreground">Introduce el código privado del importador.</p></div>
      </div>
      <Input type="password" autoComplete="off" autoFocus aria-label="Código privado" placeholder="Código privado" value={secret} onChange={(e) => setSecret(e.target.value)} required maxLength={256} />
      <Button className="w-full" disabled={access.isPending || !secret}>{access.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando…</> : "Ingresar"}</Button>
      <button type="button" onClick={() => void signOutToLogin()} className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        Cerrar sesión y cambiar de cuenta</button>
    </form>
  </div>;
}

export function ClaudeStatusChip({ status }: { status: CatalogAccessStatus }) {
  const provider = status.providers[0];
  return provider
    ? <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-3 py-1 text-xs font-medium text-brand-darkTeal"><Sparkles className="h-3.5 w-3.5" />{provider.name} · {provider.model}</span>
    : <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-800">Falta configurar ANTHROPIC_API_KEY</span>;
}

// "Cerrar acceso" only forgets the private code; "Cerrar sesión" signs the account out of the panel.
export function CatalogLogoutButton() {
  const utils = trpc.useUtils();
  // reset (not invalidate): a failed refetch would otherwise keep the old "authorized" data on screen.
  const logout = trpc.catalogImport.logout.useMutation({ onSuccess: () => { utils.catalogImport.history.reset(); utils.catalogImport.preview.reset(); void utils.catalogImport.status.reset(); } });
  return <>
    <Button variant="ghost" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending} title="Vuelve a pedir el código privado"><KeyRound className="mr-1.5 h-4 w-4" />Cerrar acceso</Button>
    <Button variant="ghost" size="sm" onClick={() => void signOutToLogin()} title="Salir de esta cuenta"><LogOut className="mr-1.5 h-4 w-4" />Cerrar sesión</Button>
  </>;
}
