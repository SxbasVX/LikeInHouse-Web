import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { sendCrmLead } from "../crm";

describe("sendCrmLead", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("CRM_LEADS_URL", "https://crm.example.com/api_publica.php?action=lead_create");
    vi.stubEnv("CRM_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("envía la llave en X-Api-Key y omite campos vacíos", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    const result = await sendCrmLead({ nombre: "Ana", telefono: "+51 999 888 777", correo: "", adultos: 2 });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://crm.example.com/api_publica.php?action=lead_create");
    expect(init.method).toBe("POST");
    expect(init.headers["X-Api-Key"]).toBe("test-key");
    expect(JSON.parse(init.body)).toEqual({ nombre: "Ana", telefono: "+51 999 888 777", adultos: 2 });
  });

  it("no llama al CRM si falta configuración", async () => {
    vi.stubEnv("CRM_API_KEY", "");
    expect(await sendCrmLead({ nombre: "Ana" })).toMatchObject({ ok: false, disabled: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no lanza si el CRM responde error o está caído, y devuelve el motivo", async () => {
    fetchMock.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));
    expect(await sendCrmLead({ nombre: "Ana" })).toEqual({ ok: false, error: "HTTP 401: Unauthorized" });

    fetchMock.mockResolvedValueOnce(new Response('{"ok":false,"msg":"Falta el nombre"}', { status: 200 }));
    expect(await sendCrmLead({ nombre: "Ana" })).toEqual({ ok: false, error: "HTTP 200: Falta el nombre" });

    fetchMock.mockRejectedValueOnce(new Error("network down"));
    expect(await sendCrmLead({ nombre: "Ana" })).toEqual({ ok: false, error: "No se pudo conectar con el CRM" });
  });
});
