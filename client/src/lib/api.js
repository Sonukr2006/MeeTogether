const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const AUTH_CSRF_COOKIE_KEY = "mt_csrf_token";

// --- Memory-only token storage (Requirement 3.1, 3.2) ---
let accessToken = null;

// Migration cleanup: remove old localStorage keys on module load
if (typeof window !== "undefined") {
  localStorage.removeItem("meetogether_access_token");
  localStorage.removeItem("meetogether_current_user");
}

/**
 * Set the in-memory access token. Used by authSlice after login/signup/refresh.
 */
export function setAccessToken(token) {
  accessToken = token;
}

/**
 * Get the current in-memory access token.
 */
export function getAccessToken() {
  return accessToken;
}

/**
 * Clear the in-memory access token. Used on logout.
 */
export function clearAccessToken() {
  accessToken = null;
}

let isRefreshingToken = false;
let refreshPromise = null;

// --- Refresh retry cap (Requirement 3.5) ---
let refreshAttemptCount = 0;
const MAX_REFRESH_ATTEMPTS = 2;

function getCookieValue(name) {
  if (typeof document === "undefined") {
    return null;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function withCsrfHeader(headers = {}, method = "GET") {
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod === "GET" || normalizedMethod === "HEAD" || normalizedMethod === "OPTIONS") {
    return headers;
  }

  const csrfToken = getCookieValue(AUTH_CSRF_COOKIE_KEY);

  if (!csrfToken) {
    return headers;
  }

  return {
    ...headers,
    "X-CSRF-Token": csrfToken,
  };
}

async function refreshAccessToken() {
  if (isRefreshingToken) {
    return refreshPromise;
  }

  isRefreshingToken = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: withCsrfHeader({
          "Content-Type": "application/json",
        }, "POST"),
      });

      const contentType = response.headers.get("content-type");
      const data =
        contentType && contentType.includes("application/json")
          ? await response.json()
          : null;

      if (!response.ok) {
        refreshAttemptCount++;
        if (refreshAttemptCount >= MAX_REFRESH_ATTEMPTS) {
          refreshAttemptCount = 0;
          window.location.href = '/sign-in';
        }
        throw new Error("Token refresh failed");
      }

      if (data?.accessToken) {
        accessToken = data.accessToken;
        refreshAttemptCount = 0;
        return data.accessToken;
      }

      refreshAttemptCount++;
      if (refreshAttemptCount >= MAX_REFRESH_ATTEMPTS) {
        refreshAttemptCount = 0;
        window.location.href = '/sign-in';
      }
      throw new Error("No access token in refresh response");
    } finally {
      isRefreshingToken = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest(path, options = {}, isRetry = false) {
  const currentToken = accessToken;
  const { headers: optionHeaders = {}, method = "GET", ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    method,
    credentials: "include",
    headers: withCsrfHeader({
      "Content-Type": "application/json",
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      ...optionHeaders,
    }, method),
  });

  const contentType = response.headers.get("content-type");
  const data =
    contentType && contentType.includes("application/json")
      ? await response.json()
      : null;

  if (!response.ok) {
    // If 401 and not already retrying, attempt token refresh
    if (response.status === 401 && !isRetry && path !== "/auth/refresh" && path !== "/auth/logout") {
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry the original request with new token
          return apiRequest(path, options, true);
        }
      } catch {
        // Refresh failed, proceed with original error
      }
    }

    const message =
      data?.error?.message?.message ||
      data?.error?.message ||
      data?.message ||
      "Something went wrong";

    throw new Error(message);
  }

  return data;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function createUploadTarget(payload) {
  return apiRequest("/media/upload-target", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadFileToSignedUrl(uploadUrl, file) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Image upload failed.");
  }
}

export async function uploadFileToStorageTarget(target, file) {
  if (target.uploadStrategy === "supabase_signed_upload") {
    const formData = new FormData();
    formData.append("cacheControl", "31536000");
    formData.append("", file);

    const response = await fetch(target.uploadUrl, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Image upload failed.");
    }

    return;
  }

  await uploadFileToSignedUrl(target.uploadUrl, file);
}
