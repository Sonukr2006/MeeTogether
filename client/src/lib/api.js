const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";
const AUTH_TOKEN_KEY = "meetogether_access_token";
const AUTH_CSRF_COOKIE_KEY = "mt_csrf_token";

let isRefreshingToken = false;
let refreshPromise = null;

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
        throw new Error("Token refresh failed");
      }

      if (data?.accessToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
        return data.accessToken;
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
  const storedToken =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  const { headers: optionHeaders = {}, method = "GET", ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    method,
    credentials: "include",
    headers: withCsrfHeader({
      "Content-Type": "application/json",
      ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
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
      } catch (refreshError) {
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
