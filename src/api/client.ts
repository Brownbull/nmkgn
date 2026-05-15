export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:18080';

export function endpoint(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export async function responseError(response: Response, fallback: string): Promise<Error> {
  let detail = fallback;
  try {
    const body: unknown = await response.json();
    if (
      typeof body === 'object'
      && body !== null
      && 'detail' in body
      && typeof body.detail === 'string'
    ) {
      detail = body.detail;
    }
  } catch {
    // Keep the fallback when the server returns a non-JSON error.
  }
  return new Error(detail);
}
