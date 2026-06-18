import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

class HttpError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    message: string,
  ) {
    super(message);
  }
}

export const ErrorHandler = (_err: Error, c: Context) => {
  if (!(_err instanceof HttpError)) {
    console.error(_err);
    _err = HttpErr(500, "Internal server error");
  }

  const err = _err as HttpError;
  return c.json(
    {
      status: err.status,
      error: err.message,
    },
    err.status,
  );
};

export const HttpErr = (status: ContentfulStatusCode, message: string) => new HttpError(status, message);
