import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.208.0/http/file_server.ts";

// bare-server-deno — handles the raw HTTP tunneling for the proxy
import { createBareServer } from "https://esm.sh/@tomphttp/bare-server-node@2.0.2";

const bare = createBareServer("/bare/");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  "Access-Control-Allow-Headers": "*",
};

serve(async (req: Request) => {
  const url = new URL(req.url);

  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  // Bare server handles /bare/* — this is what the proxy client talks to
  if (url.pathname.startsWith("/bare/")) {
    try {
      // bare-server-node expects a Node-style IncomingMessage,
      // so we use the fetch-compatible wrapper built into bare-server-deno
      const res = await bare.handleRequest(req);
      // Add CORS to bare responses so the iframe can reach it
      const headers = new Headers(res.headers);
      Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    } catch (e) {
      return new Response(`Bare error: ${e}`, { status: 500, headers: CORS });
    }
  }

  // Serve index.html for everything else
  try {
    return await serveFile(req, "./index.html");
  } catch {
    return new Response("Not found", { status: 404 });
  }
}, { port: 8000 });

console.log("🚀 Pioneers Rooms running on http://localhost:8000");
