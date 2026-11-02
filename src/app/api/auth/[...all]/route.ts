import { toNextJsHandler } from "better-auth/next-js";
import { betterAuthServer } from "@/server/lib/auth";

export const { GET, POST } = toNextJsHandler(betterAuthServer);
