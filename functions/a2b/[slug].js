import { UTM_LINKS } from '../../src/utm-links-config.js';

export async function onRequest(context) {
  const { params, env, request } = context;
  const slug = params.slug;

  if (!slug) return Response.redirect('https://a2b.services/', 302);

  const link = UTM_LINKS[slug];
  if (!link) return Response.redirect('https://a2b.services/', 302);

  let dest;
  try {
    dest = new URL(link.destination);
  } catch {
    return Response.redirect('https://a2b.services/', 302);
  }

  const utmParams = {
    utm_source:   link.utm_source,
    utm_medium:   link.utm_medium,
    utm_campaign: link.utm_campaign,
    utm_content:  link.utm_content,
  };

  Object.entries(utmParams).forEach(([k, v]) => {
    if (v) dest.searchParams.set(k, v);
  });

  // Log click after response is sent — doesn't delay the redirect
  context.waitUntil(logClick(slug, request, env));

  return Response.redirect(dest.toString(), 302);
}

async function logClick(slug, request, env) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  await fetch(`${url}/rest/v1/utm_clicks`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        key,
      'Authorization': `Bearer ${key}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify({
      slug,
      referrer:   request.headers.get('referer') || null,
      user_agent: request.headers.get('user-agent') || null,
    }),
  });
}
