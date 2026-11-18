
import { safeApiFetch } from "./client-api-helpers";

/**
 * Authenticated fetch helper.
 *
 * All API calls that need authentication should use this instead of
 * manually reading `localStorage.getItem("bearer_token")`.
 *
 * The `auth_session` httpOnly cookie is sent automatically when
 * `credentials: "include"` is set, which the server already validates
 * via `requireRole()` / `getAuthenticatedUser()` in `admin-auth.ts`.
 */

export function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const merged: RequestInit = {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init?.headers),
    },
  };

  return safeApiFetch(input, merged);
}


