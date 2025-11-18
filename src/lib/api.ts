const RAW_API_URL = import.meta.env.VITE_API_URL;
export const API_URL = RAW_API_URL?.replace(/\/$/, "");

if (!API_URL) {
  throw new Error("VITE_API_URL is not defined");
}

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ApiRequestOptions = RequestInit & {
  body?: BodyInit | null;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, headers: initHeaders, ...rest } = options;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const headers = new Headers(initHeaders ?? undefined);
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    credentials: rest.credentials ?? "include",
    ...rest,
    body,
    headers,
  });

  if (!res.ok) {
    let msg = "Request failed";
    try {
      const err = await res.json();
      if (err?.message) msg = err.message;
    } catch {
      // ignore JSON errors
    }
    throw new Error(msg);
  }

  const payload = (await res.json()) as ApiResponse<T>;
  return payload.data;
}
