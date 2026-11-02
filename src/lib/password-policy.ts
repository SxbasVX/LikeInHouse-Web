// Panel password rules, shared by the users admin, "change my password" and the server-side checks.
export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push("al menos 8 caracteres");
  if (!/[A-Z]/.test(password)) issues.push("una mayúscula");
  if (!/[a-z]/.test(password)) issues.push("una minúscula");
  if (!/[0-9]/.test(password)) issues.push("un número");
  return issues;
}
