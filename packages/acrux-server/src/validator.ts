import { zValidator as zv } from "@hono/zod-validator";
import z from "zod";

export const paramId = zv("param", z.object({ id: z.uuid() }));

export const paramIdOrName = zv("param", z.object({ idOrName: z.union([z.uuid(), z.string().nonempty()]) }));
