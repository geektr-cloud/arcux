import { z } from "zod";
import { type Equals, assert } from "tsafe";
import type { Memo } from "@server/db/schema";

// ── field definitions ─────────────────────────────────────────────────────────

const id = z.uuid();
const content = z.string();
const tags = z.array(z.string());
const pinned = z.boolean();
const archived = z.boolean();
const createdAt = z.string();
const updatedAt = z.string();

// ── base schema ───────────────────────────────────────────────────────────────

export const memo = z.object({ id, content, tags, pinned, archived, createdAt, updatedAt });
assert<Equals<z.infer<typeof memo>, Memo>>();
export type { Memo };

export const newItem = (): Memo => ({
  id: "",
  content: "",
  tags: [],
  pinned: false,
  archived: false,
  createdAt: "",
  updatedAt: "",
});

// ── api schemas ───────────────────────────────────────────────────────────────

export const create = {
  body: memo.omit({ id: true, createdAt: true, updatedAt: true }),
};

export const upsert = {
  body: memo.extend({ id: z.union([id, z.literal("")]).optional() }).omit({ createdAt: true, updatedAt: true }),
};
