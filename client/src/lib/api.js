const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";
const AUTH_TOKEN_KEY = "meetogether_access_token";

export async function apiRequest(path, options = {}) {
  const storedToken =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type");
  const data =
    contentType && contentType.includes("application/json")
      ? await response.json()
      : null;

  if (!response.ok) {
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
