# Instrucciones del Proyecto

## Memoria Persistente
Al iniciar CADA conversacion, ANTES de responder al usuario, lee todos los archivos de memoria:
1. Lee `C:\Users\USUARIO\.claude\projects\c--Users-USUARIO-Documents-LikeInHouse-New-WebSite\memory\MEMORY.md`
2. Lee `C:\Users\USUARIO\.claude\projects\c--Users-USUARIO-Documents-LikeInHouse-New-WebSite\memory\progress.md`
3. Si la tarea lo requiere, lee tambien: `architecture.md`, `database.md`, `features.md`, `dev-setup.md` del mismo directorio

## Al Finalizar Cada Sesion
Antes de terminar, actualiza los archivos de memoria:
- Actualiza `progress.md` con lo trabajado, decisiones tomadas y pendientes
- Actualiza `MEMORY.md` si hubo cambios importantes en el estado del proyecto
- Crea nuevos archivos de memoria si se descubren patrones o decisiones importantes

## Idioma
Comunicarse siempre en espanol con el usuario.

## Proyecto
Plataforma integral de agencia de turismo (web publica + panel admin). Next.js 14 + TypeScript + tRPC + Prisma + PostgreSQL. Ver archivos de memoria para detalles completos.
