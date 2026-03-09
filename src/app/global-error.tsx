"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    fontFamily: "system-ui, sans-serif",
                    padding: "2rem",
                    textAlign: "center",
                }}>
                    <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                        Algo salió mal
                    </h2>
                    <p style={{ color: "#666", marginBottom: "1.5rem" }}>
                        Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: "0.75rem 1.5rem",
                            backgroundColor: "#000",
                            color: "#fff",
                            border: "none",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                        }}
                    >
                        Intentar de nuevo
                    </button>
                </div>
            </body>
        </html>
    );
}
