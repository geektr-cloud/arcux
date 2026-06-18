import type { ClientResponse } from "hono/client";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const useResponse = <Dto, Out = Dto>(
  response: Promise<ClientResponse<Dto, ContentfulStatusCode, "json">>,
  transform: (dto: Dto) => Out = (dto: Dto) => dto as unknown as Out,
) => {
  return response.then((r) => r.json()).then(transform);
};

export const useHonoApi = <Dto, Out = Dto, Arg extends unknown[] = unknown[]>(
  api: (...args: Arg) => Promise<ClientResponse<Dto, ContentfulStatusCode, "json">>,
  transform: (dto: Dto) => Out = (dto: Dto) => dto as unknown as Out,
) => {
  return (...args: Parameters<typeof api>) => useResponse(api(...args), transform);
};
