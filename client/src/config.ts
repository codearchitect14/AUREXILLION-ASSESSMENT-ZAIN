function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Public frontend URL from `VITE_APP_URL`, or the current origin in the browser. */
export const appUrl = normalizeUrl(
  import.meta.env.VITE_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173")
);
