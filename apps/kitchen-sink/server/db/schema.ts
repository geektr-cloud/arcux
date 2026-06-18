import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

// ISO-8601 timestamp from SQLite (e.g. 2026-06-16T07:44:08.123Z)
const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const memos = sqliteTable("Memo", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  title: text("title").notNull().default(""),
  content: text("content").notNull().default(""),
  link: text("link").notNull().default(""),
  metadata: text("metadata", { mode: "json" })
    .notNull()
    .default(sql`'null'`)
    .$type<unknown>(),
  tags: text("tags", { mode: "json" })
    .notNull()
    .default(sql`'[]'`)
    .$type<string[]>(),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: text("createdAt").notNull().default(now),
  updatedAt: text("updatedAt")
    .notNull()
    .default(now)
    .$onUpdate(() => now),
});

export type Memo = typeof memos.$inferSelect;
export type NewMemo = typeof memos.$inferInsert;
