"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { passwordIssues } from "@/lib/password-policy";

export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const issues = next ? passwordIssues(next) : [];
  const mismatch = confirm.length > 0 && confirm !== next;

  const close = (value: boolean) => {
    if (saving) return;
    if (!value) { setCurrent(""); setNext(""); setConfirm(""); setError(null); }
    onOpenChange(value);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    // Signs out every other device; this one stays logged in.
    const { error: failure } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
    setSaving(false);
    if (failure) {
      setError(failure.code === "INVALID_PASSWORD" ? "La contraseña actual no es correcta." : failure.message ?? "No se pudo cambiar la contraseña.");
      return;
    }
    toast({ title: "Contraseña actualizada", description: "Se cerró tu sesión en los demás dispositivos." });
    close(false);
  }

  return <Dialog open={open} onOpenChange={close}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Cambiar mi contraseña</DialogTitle>
        <DialogDescription>Al guardarla se cerrará tu sesión en los demás dispositivos.</DialogDescription></DialogHeader>
      <form id="change-password" onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="current-password">Contraseña actual</Label>
          <Input id="current-password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label htmlFor="new-password">Nueva contraseña</Label>
          <Input id="new-password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-invalid={issues.length > 0} aria-describedby="new-password-hint" required />
          <p id="new-password-hint" className={issues.length ? "text-xs text-amber-700" : "text-xs text-muted-foreground"}>
            {issues.length ? `Falta: ${issues.join(", ")}.` : "Mínimo 8 caracteres, con mayúscula, minúscula y número."}</p></div>
        <div className="space-y-1.5"><Label htmlFor="confirm-password">Repite la nueva contraseña</Label>
          <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={mismatch} required />
          {mismatch && <p className="text-xs text-amber-700">No coincide con la nueva contraseña.</p>}</div>
        {error && <p role="alert" className="rounded-md bg-red-50 p-2.5 text-sm text-red-800">{error}</p>}
      </form>
      <DialogFooter>
        <Button variant="ghost" onClick={() => close(false)} disabled={saving}>Cancelar</Button>
        <Button type="submit" form="change-password" disabled={saving || !current || issues.length > 0 || !next || confirm !== next}>
          {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Guardar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
