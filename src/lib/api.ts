const API_URL = import.meta.env.VITE_API_URL;

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
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
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

