import { Hono } from "hono";
import { eq, desc, type SQL, type InferSelectModel } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";
import { HttpErr } from "./http-errors";
import { paramId } from "./validator";

/**
 * CRUD 工厂可作用的表：必须带 `id` 主键列。
 */
export type CrudTable = SQLiteTable & { id: SQLiteColumn };

/**
 * createCrudRoutes 的配置项。
 * - `create` / `upsert` 为 zod body 校验器，来源于 `core/<entity>/schema.ts`。
 * - `orderBy` 默认按 id 升序（≈ UUIDv7 创建顺序）。
 * - `db` 由调用方注入，工厂本身不 import `@server/db`，便于独立打包。
 */
export interface CrudOptions<TTable extends CrudTable, TCreate extends object, TUpsert extends { id?: string }> {
  db: DrizzleD1Database<Record<string, unknown>>;
  table: TTable;
  create: ZodType<TCreate>;
  upsert: ZodType<TUpsert>;
  /** 404 文案，默认 "Not found"。 */
  notFound?: string;
  /** 列表排序，默认 `asc(id)`。返回单个或多个 SQL 排序表达式。 */
  orderBy?: (table: TTable) => SQL | SQL[];
}

/**
 * 生成标准 6-endpoint CRUD 路由，前端 `useSortedCollection` 的服务端镜像。
 *
 * `GET /` · `GET /:id` · `POST /` (create) · `PUT /` (upsert) · `PUT /:id` (update) · `DELETE /:id`
 */
export const createCrudRoutes = <TTable extends CrudTable, TCreate extends object, TUpsert extends { id?: string }>(
  opts: CrudOptions<TTable, TCreate, TUpsert>,
) => {
  type Row = InferSelectModel<TTable>;

  const { db, create, upsert } = opts;
  // The query builders blow up on the precise table generic; narrow to the base
  // SQLiteTable here and re-apply Row at the return boundary.
  const table = opts.table as SQLiteTable & { id: SQLiteColumn };
  const notFound = opts.notFound ?? "Not found";
  const orderBy = (opts.orderBy ?? ((t) => desc(t.id))) as (t: SQLiteTable & { id: SQLiteColumn }) => SQL | SQL[];
  const toOrderBy = (): SQL[] => {
    const r = orderBy(table);
    return Array.isArray(r) ? r : [r];
  };

  const findById = async (id: string): Promise<Row | undefined> => {
    const [row] = await db.select().from(table).where(eq(table.id, id));
    return row as Row | undefined;
  };

  return new Hono()
    .get("/", async (c) => {
      const items = await db.select().from(table).orderBy(...toOrderBy());
      return c.json(items as Row[]);
    })
    .get("/:id", paramId, async (c) => {
      const row = await findById(c.req.valid("param").id);
      if (!row) throw HttpErr(404, notFound);
      return c.json(row);
    })
    .post("/", zValidator("json", create), async (c) => {
      const [row] = await db
        .insert(table)
        .values(c.req.valid("json"))
        .returning();
      return c.json(row as Row);
    })
    .put("/", zValidator("json", upsert), async (c) => {
      const { id, ...data } = c.req.valid("json");
      if (id) {
        if (!(await findById(id))) throw HttpErr(404, notFound);
        const [row] = await db.update(table).set(data).where(eq(table.id, id)).returning();
        return c.json(row as Row);
      }
      const [row] = await db.insert(table).values(data).returning();
      return c.json(row as Row);
    })
    .put("/:id", paramId, zValidator("json", create), async (c) => {
      const { id } = c.req.valid("param");
      if (!(await findById(id))) throw HttpErr(404, notFound);
      const [row] = await db.update(table).set(c.req.valid("json")).where(eq(table.id, id)).returning();
      return c.json(row as Row);
    })
    .delete("/:id", paramId, async (c) => {
      const { id } = c.req.valid("param");
      if (!(await findById(id))) throw HttpErr(404, notFound);
      const [row] = await db.delete(table).where(eq(table.id, id)).returning();
      return c.json(row as Row);
    });
};
