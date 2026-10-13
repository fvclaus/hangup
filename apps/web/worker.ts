// Custom Cloudflare Worker entry wrapping the OpenNext (Next.js) handler.
//
// OpenNext's Next `rewrites()` proxy FOLLOWS upstream redirects, which breaks the
// OAuth flow: the backend's 3xx responses (consent redirect to Google, the
// post-login redirect, logout) and their Set-Cookie headers must reach the
// browser, not be swallowed by the proxy. So we intercept `/api/*` here and
// proxy to the Cloud Run backend with `redirect: "manual"`, forwarding the 3xx +
// Set-Cookie verbatim. Everything else is served by the OpenNext worker.
//
// (Local `next dev`/`next start` doesn't use this entry; there the Node rewrite
// in next.config.mjs handles /api and already passes redirects through.)

// @ts-nocheck
import openNextWorker, {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "./.open-next/worker.js";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const origin = env.API_ORIGIN ?? "http://localhost:3001";
      const target = origin + url.pathname + url.search;

      // Drop Host so fetch sets it from the target (Cloud Run) URL.
      const headers = new Headers(request.headers);
      headers.delete("host");

      const hasBody = request.method !== "GET" && request.method !== "HEAD";

      return fetch(target, {
        method: request.method,
        headers,
        body: hasBody ? request.body : undefined,
        redirect: "manual",
        duplex: hasBody ? "half" : undefined,
      });
    }

    return openNextWorker.fetch(request, env, ctx);
  },
};
