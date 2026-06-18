import { z } from "zod";

/** Validates that a string is parseable as JSON. Use for textarea-bound form fields. */
export const validJson = (message = "JSON 格式无效") =>
  z.string().refine(
    (s) => {
      try {
        JSON.parse(s);
        return true;
      } catch {
        return false;
      }
    },
    { message },
  );
