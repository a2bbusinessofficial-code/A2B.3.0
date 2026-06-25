import { supabase } from './supabase.js';
import { UTM_LINKS } from './utm-links-config.js';

async function handleRedirect() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const slug  = parts[1];

  if (!slug) { window.location.replace('/'); return; }

  const link = UTM_LINKS[slug];
  if (!link) { window.location.replace('/'); return; }

  let dest;
  try {
    dest = new URL(link.destination);
  } catch {
    window.location.replace('/');
    return;
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

  // Fire-and-forget — redirect does not wait for Supabase
  logClick(slug);
  window.location.replace(dest.toString());
}

function logClick(slug) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/utm_clicks`;
  const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // keepalive: true ensures the request survives page navigation
  fetch(url, {
    method:    'POST',
    keepalive: true,
    headers: {
      'Content-Type':  'application/json',
      'apikey':        key,
      'Authorization': `Bearer ${key}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify({
      slug,
      referrer:   document.referrer || null,
      user_agent: navigator.userAgent,
    }),
  }).catch(() => {});
}

handleRedirect();
