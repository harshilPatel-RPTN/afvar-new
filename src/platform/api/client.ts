/**
 * One fetcher for every module's api.ts.
 *
 * With `NEXT_PUBLIC_API_BASE_URL` unset (the static-site phase) requests are
 * answered by the in-browser mock server in `src/mocks/api`, which mirrors the
 * FastAPI contracts. Setting the variable switches every module to the real
 * backend with no other change.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Parsed error body, e.g. `{ error: "quota_exceeded", resets_at }`. */
    public body: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.code = typeof body.error === "string" ? body.error : "unknown";
  }

  /**
   * Machine-readable error code from the body, e.g. "quota_exceeded". A plain
   * property (not a getter) so subclasses such as `CommunityApiError` can set
   * their own.
   */
  code: string;

  /** True when the failure looks like "backend offline" rather than a real error. */
  get isOffline() {
    return this.status === 0 || this.status === 502 || this.status === 504;
  }
}

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

let tokenProvider: () => string | null = () => null;

/** The auth module registers how to read the current session token. */
export function configureApiAuth(getToken: () => string | null) {
  tokenProvider = getToken;
}

export async function apiFetch<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const token = tokenProvider();

  if (!BASE_URL) {
    // Loaded lazily so mock data never ships in a build that talks to the real API.
    const { handleMockRequest } = await import("@/mocks/api");
    const response = await handleMockRequest({ method, path, body, token });
    if (response.status >= 400) {
      const errorBody = (response.body ?? {}) as Record<string, unknown>;
      throw new ApiError(response.status, String(errorBody.error ?? "request_failed"), errorBody);
    }
    return response.body as T;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "offline");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, String(data.error ?? response.statusText), data);
  }
  return data as T;
}

/** Resolve mock data after a short delay so loading states still render. */
export function mock<T>(data: T, delayMs = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}
