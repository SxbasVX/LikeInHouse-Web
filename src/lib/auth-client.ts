"use client";

import { createAuthClient } from "better-auth/react";

// Same-origin: the panel host serves /api/auth itself (admin subdomain, previews, localhost).
export const authClient = createAuthClient();

export async function signOutToLogin() {
  await authClient.signOut().catch(() => undefined);
  window.location.href = "/admin/login";
}
