import { Hono } from "hono";
import { env } from "cloudflare:workers";

import { memoRoutes } from "@server/core/memos/routes";
import { authRoutes } from "@server/core/auth/routes";
import { requireAuth } from "@server/middlewares/auth";
import { ErrorHandler } from "@acrux/server";

export const app = new Hono().use("/api/*", requireAuth).route("/api/auth", authRoutes).route("/api/memos", memoRoutes);

export type AppType = typeof app;

app.onError(ErrorHandler);
app.get("/*", () => env.ASSETS.fetch("http://localhost/index.html"));

export default app;
