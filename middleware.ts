// middleware.ts — Vercel Edge Middleware (runs before routing, on the CDN edge)
// Intercepts bot/crawler requests to /product/:id and transparently proxies them
// to /api/product/:id (pre-rendered HTML + JSON-LD).
// Real users return undefined → vercel.json /(.*) → /index.html → SPA loads normally.

const BOT_PATTERN =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|Mediapartners-Google|bingbot|Slurp|DuckDuckBot|YandexBot|Baiduspider|facebookexternalhit|LinkedInBot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Slackbot/i;

export default async function middleware(
  request: Request
): Promise<Response | void> {
  const url = new URL(request.url);

  // Only intercept /product/<id> — exactly one path segment, no sub-paths
  const match = url.pathname.match(/^\/product\/([^/]+)$/);
  if (!match) return;

  const ua = request.headers.get("user-agent") ?? "";
  if (!BOT_PATTERN.test(ua)) return;

  const [, id] = match;

  try {
    // Proxy the request to the pre-rendering serverless function.
    // redirect: "manual" prevents fetch() from following a 302 and accidentally
    // returning index.html to the bot if the API has an error.
    const apiResponse = await fetch(`${url.origin}/api/product/${id}`, {
      redirect: "manual",
    });

    if (!apiResponse.ok) {
      // API error → fall through to SPA (better than serving broken HTML)
      return;
    }

    return new Response(await apiResponse.text(), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
        "Vary": "User-Agent",
        "X-Prerendered": "1",
      },
    });
  } catch {
    // Network error → fall through to SPA
    return;
  }
}

// Limit middleware execution to product pages only (performance optimisation).
// If Vercel ignores this for non-Next.js, the path check above is the fallback.
export const config = {
  matcher: "/product/:path*",
};
