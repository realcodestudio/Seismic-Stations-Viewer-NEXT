// Cloudflare Pages Function: serves the Mapbox token at runtime so it never
// lands in the repo or in the static bundle. Set it with
//   npx wrangler pages secret put MAPBOX_TOKEN --project-name <project>
// Local dev has no Pages runtime, so .env.local's NEXT_PUBLIC_MAPBOX_TOKEN
// short-circuits this call on the client side.
type PagesContext = {
  request: Request;
  env: { MAPBOX_TOKEN?: string };
};

export const onRequestGet = async ({ request, env }: PagesContext): Promise<Response> => {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') {
    return new Response(null, { status: 403 });
  }
  if (!env.MAPBOX_TOKEN) {
    return new Response(null, { status: 503 });
  }
  return new Response(env.MAPBOX_TOKEN, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'private, max-age=3600',
    },
  });
};
