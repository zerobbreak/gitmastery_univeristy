const base = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function apiUrl(path: string): string {
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}

export async function fetchWithAuth(
  path: string,
  getToken: () => Promise<string | null>,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getToken();
  if (!token) {
    throw new Error("Not signed in");
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(apiUrl(path), { ...init, headers });
}
