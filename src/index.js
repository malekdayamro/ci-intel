export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Normalize trailing slash — serve index.html for root
    if (url.pathname === "/") {
      return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
    }

    // Serve static assets; fall back to index.html for SPA routes
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
    }

    return response;
  },
};
