import { desc } from "drizzle-orm";
import { db, schema } from "@server/db";
import { createCrudRoutes } from "@acrux/server";
import * as memoSchema from "./schema";

export const memoRoutes = createCrudRoutes({
  db,
  table: schema.memos,
  create: memoSchema.create.body,
  upsert: memoSchema.upsert.body,
  notFound: "Memo not found",
  orderBy: (t) => [desc(t.pinned), desc(t.createdAt)],
});
