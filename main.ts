import { serveFile } from "https://deno.land/std@0.208.0/http/file_server.ts";

// Resolve index.html next to this file, whatever directory the app starts in.
const INDEX_PATH = decodeURIComponent(new URL("./index.html", import.meta.url).pathname);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  "Access-Control-Allow-Headers": "*",
};

// Sites allowed to ask for TURN credentials (the GitHub Pages copy and any deno.dev copy).
const TURN_ORIGINS = [/^https:\/\/catsthegoat\.github\.io$/, /^https:\/\/[a-z0-9-.]+\.deno\.(dev|net)$/, /^http:\/\/localhost(:\d+)?$/];

// bare-server is only loaded when /bare/ is used, so if it fails on this
// runtime it can't take down the rest of the site (pages + TURN).
let barePromise: Promise<any> | null = null;
const getBare = () => {
  if (!barePromise) {
    barePromise = import("https://esm.sh/@tomphttp/bare-server-node@2.0.2")
      .then((m) => m.createBareServer("/bare/"))
      .catch((e) => { barePromise = null; throw e; });
  }
  return barePromise;
};

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  // TURN credentials for video calls. The Cloudflare secret stays on the server
  // (set CF_TURN_KEY_ID and CF_TURN_API_TOKEN in the Deno Deploy env settings).
  if (url.pathname === "/api/turn") {
    const origin = req.headers.get("Origin") || "";
    const allowed = !origin || TURN_ORIGINS.some((re) => re.test(origin)) || origin === url.origin;
    const headers = { ...CORS, "Access-Control-Allow-Origin": origin || "*", "Content-Type": "application/json", "Cache-Control": "no-store" };
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (!allowed) return json({ error: "origin not allowed" }, 403);
    const keyId = Deno.env.get("CF_TURN_KEY_ID");
    const token = Deno.env.get("CF_TURN_API_TOKEN");
    if (!keyId || !token) return json({ error: "TURN not configured" }, 503);
    try {
      const res = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ttl: 86400 }),
      });
      if (!res.ok) return json({ error: `TURN upstream ${res.status}` }, 502);
      return json(await res.json());
    } catch (e) {
      return json({ error: `TURN error: ${e}` }, 502);
    }
  }

  // Bare server handles /bare/* — this is what the proxy client talks to
  if (url.pathname.startsWith("/bare/")) {
    try {
      const bare = await getBare();
      const res = await bare.handleRequest(req);
      const headers = new Headers(res.headers);
      Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    } catch (e) {
      return new Response(`Bare error: ${e}`, { status: 500, headers: CORS });
    }
  }

  // Serve index.html for everything else
  try {
    return await serveFile(req, INDEX_PATH);
  } catch {
    return new Response("Not found", { status: 404 });
  }
};

// Deno Deploy hooks into Deno.serve and picks the port itself; locally it uses PORT or 8000.
Deno.serve({ port: Number(Deno.env.get("PORT") ?? 8000) }, handler);
