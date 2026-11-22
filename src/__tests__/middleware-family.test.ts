import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import middleware from "../middleware";

const run = (url: string) => middleware(new NextRequest(url));

describe("middleware: web familiar", () => {
  it("reescribe las rutas del subdominio al árbol /familia sin cambiar la URL", async () => {
    const res = await run("https://familia.likeinhouseperu.com/es/tours");
    expect(res.headers.get("location")).toBeNull();
    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toBe("/familia/es/tours");
    // El idioma que detectó next-intl llega a la página reescrita.
    expect(res.headers.get("x-middleware-request-x-next-intl-locale")).toBe("es");
  });

  it("agrega el idioma cuando falta (redirige, no reescribe)", async () => {
    const res = await run("https://familia.likeinhouseperu.com/");
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/es");
  });

  it("limpia /familia de la URL dentro del subdominio", async () => {
    const res = await run("https://familia.likeinhouseperu.com/familia/es/faq");
    expect(new URL(res.headers.get("location")!).pathname).toBe("/es/faq");
  });

  it("no expone el panel en el subdominio familiar", async () => {
    const res = await run("https://familia.likeinhouseperu.com/admin");
    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toBe("/_not-found");
  });

  it("en el dominio general /familia manda al subdominio", async () => {
    const res = await run("https://likeinhouseperu.com/familia/es/tours?utm_source=ig");
    expect(res.status).toBe(308);
    const dest = new URL(res.headers.get("location")!);
    expect(dest.host).toBe("familia.likeinhouseperu.com");
    expect(dest.pathname).toBe("/es/tours");
    expect(dest.searchParams.get("utm_source")).toBe("ig");
  });

  it("la web general sigue igual", async () => {
    const res = await run("https://likeinhouseperu.com/es/tours");
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });
});

describe("middleware: host real en cabeceras", () => {
  // Detrás de un proxy (o con `next start`) nextUrl puede decir "localhost": manda la cabecera Host.
  const behindProxy = (path: string) =>
    middleware(new NextRequest(`http://localhost:3000${path}`, { headers: { host: "familia.localhost:3000" } }));

  it("detecta la web familiar por la cabecera Host", async () => {
    const res = await behindProxy("/es/tours");
    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toBe("/familia/es/tours");
  });

  it("las redirecciones conservan el subdominio", async () => {
    const res = await behindProxy("/");
    const dest = new URL(res.headers.get("location")!);
    expect(dest.host).toBe("familia.localhost:3000");
    expect(dest.pathname).toBe("/es");
  });

  it("el panel sigue bloqueado aunque nextUrl diga localhost", async () => {
    const res = await behindProxy("/admin");
    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toBe("/_not-found");
  });
});
