import { supabase } from './supabase.js';

async function handleRedirect() {
  // Extract slug from path: /a2b/my-slug → "my-slug"
  const parts = window.location.pathname.split('/').filter(Boolean);
  const slug  = parts[1]; // parts[0] = 'a2b', parts[1] = slug

  if (!slug) {
    window.location.replace('/');
    return;
  }

  const { data: link, error } = await supabase
    .from('utm_links')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !link) {
    // Unknown slug — send to homepage
    window.location.replace('/');
    return;
  }

  // Log click in background (don't block redirect)
  logClick(link);

  // Build final destination URL with UTM params appended
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

  window.location.replace(dest.toString());
}

async function logClick(link) {
  try {
    // Insert click record
    await supabase.from('utm_clicks').insert({
      link_id:    link.id,
      referrer:   document.referrer || null,
      user_agent: navigator.userAgent,
    });

    // Increment total_clicks counter
    await supabase
      .from('utm_links')
      .update({ total_clicks: (link.total_clicks || 0) + 1 })
      .eq('id', link.id);
  } catch {
    // Silently ignore — redirect already happened
  }
}

handleRedirect();
