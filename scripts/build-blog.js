import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toHtml(text) {
  text = text.replace(/""/g, '“').replace(/""/g, '”').trim();
  const lines = text.split('\n');
  const out = [];
  let buf = [];
  let i = 0;

  const flush = () => {
    if (buf.length) { out.push('<p>' + buf.join(' ') + '</p>'); buf = []; }
  };

  while (i < lines.length) {
    const t = lines[i].trim();

    if (!t) { flush(); i++; continue; }

    if (/^-{15,}$/.test(t)) { flush(); out.push('<hr class="post-hr">'); i++; continue; }

    if (/^(MY STORY|GUIDE):?\s*$/i.test(t)) {
      flush();
      out.push('<h2 class="blog-section-tag">' + t.replace(/:$/, '') + '</h2>');
      i++; continue;
    }

    if (t.startsWith('• ') || t.startsWith('* ')) {
      flush();
      const items = [];
      while (i < lines.length) {
        const lt = lines[i].trim();
        if (lt.startsWith('• ') || lt.startsWith('* ')) {
          items.push('<li>' + lt.slice(2) + '</li>');
          i++;
        } else break;
      }
      out.push('<ul>' + items.join('') + '</ul>');
      continue;
    }

    buf.push(t);
    i++;
  }
  flush();
  return out.join('\n');
}

function generatePage(post) {
  const contentHtml = toHtml(post.content);
  const dateStr = formatDate(post.date);
  const hasDoc = !!post.pdf;

  const imgTag = post.image
    ? `<img src="${post.image}" alt="${esc(post.title)}" style="width:100%;height:480px;object-fit:cover;object-position:center;border-radius:4px;margin-bottom:24px;">`
    : '';

  const docSection = hasDoc
    ? `<div style="background:#f5f5f3;border-radius:6px;padding:18px 22px;margin-bottom:40px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;">
        <div>
          <p style="font-size:0.68rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.35);margin-bottom:5px;">Attached Resource</p>
          <p style="font-size:0.9rem;font-weight:600;color:#0a0a0a;margin:0;">View or download the full document</p>
        </div>
        <a href="${post.pdf}" target="_blank" rel="noopener" class="btn-arrow" style="flex-shrink:0;">
          <span class="btn-label">Open Document</span>
          <span class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
        </a>
      </div>`
    : '';

  const pdfBanner = hasDoc
    ? `<section style="background:#ffffff;padding:40px 0;border-top:1px solid rgba(0,0,0,0.06);">
        <div style="max-width:var(--container-max);margin:0 auto;padding:0 var(--container-padding);display:flex;align-items:center;justify-content:space-between;gap:40px;flex-wrap:wrap;">
          <div>
            <p style="font-size:0.7rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:8px;">Attached Document</p>
            <p style="font-size:1.1rem;font-weight:500;color:#111;margin:0;">This post includes a downloadable PDF.</p>
          </div>
          <a href="${post.pdf}" target="_blank" rel="noopener" class="btn-arrow">
            <span class="btn-label">View / Download PDF</span>
            <span class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
          </a>
        </div>
      </section>`
    : '';

  const pdfMetaLink = hasDoc
    ? ` &nbsp;&middot;&nbsp; <a href="${post.pdf}" target="_blank" rel="noopener" style="color:#00c853;text-decoration:underline;">View PDF &rarr;</a>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${esc(post.description)}" />
  <meta property="og:title" content="${esc(post.title)} | A2B Blog" />
  <meta property="og:description" content="${esc(post.description)}" />
  <meta property="og:image" content="${post.image}" />
  <meta property="og:type" content="article" />
  <meta property="article:published_time" content="${post.date}" />
  <meta property="article:author" content="${esc(post.author)}" />
  <title>${esc(post.title)} | A2B Blog</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/src/style.css" />
  <style>
    .blog-post-body { font-size:1.05rem; line-height:1.85; color:#222222; }
    .blog-post-body h1,.blog-post-body h2,.blog-post-body h3,.blog-post-body h4 { font-family:Inter,sans-serif; font-weight:700; color:#0a0a0a; line-height:1.2; letter-spacing:-0.3px; margin-top:2.4em; margin-bottom:0.6em; }
    .blog-post-body h1 { font-size:2rem; }
    .blog-post-body h2 { font-size:1.55rem; }
    .blog-post-body h3 { font-size:1.25rem; }
    .blog-post-body h4 { font-size:1.05rem; }
    .blog-post-body p  { margin-bottom:1.55em; }
    .blog-post-body img { width:100%; border-radius:8px; margin:2em 0; display:block; }
    .blog-post-body blockquote { border-left:3px solid #00c853; padding:4px 0 4px 20px; margin:2em 0; color:rgba(0,0,0,0.6); font-style:italic; }
    .blog-post-body ul,.blog-post-body ol { padding-left:1.5em; margin-bottom:1.55em; }
    .blog-post-body li { margin-bottom:0.5em; }
    .blog-post-body strong { color:#0a0a0a; font-weight:600; }
    .blog-post-body a { color:#00c853; text-decoration:underline; text-underline-offset:3px; }
    .blog-post-body hr,.blog-post-body .post-hr { border:none; border-top:1px solid rgba(0,0,0,0.08); margin:2.5em 0; }
    .blog-post-body table { width:100%; border-collapse:collapse; margin-bottom:1.55em; font-size:0.95rem; }
    .blog-post-body th { text-align:left; font-weight:600; color:#0a0a0a; padding:10px 14px; border-bottom:2px solid rgba(0,0,0,0.1); }
    .blog-post-body td { padding:10px 14px; border-bottom:1px solid rgba(0,0,0,0.06); }
    .blog-section-tag { font-size:0.7rem !important; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:rgba(0,0,0,0.35) !important; margin-top:2.5em !important; margin-bottom:0.5em !important; }
    .post-sidebar-card { border-radius:12px; padding:28px; }
    .post-cta-btn { display:flex; align-items:center; justify-content:space-between; width:100%; box-sizing:border-box; background:#0a0a0a; color:#fff; font-family:Inter,sans-serif; font-size:0.9rem; font-weight:500; padding:14px 20px; border:none; border-radius:6px; text-decoration:none; cursor:pointer; margin-top:20px; transition:background 0.2s ease; }
    .post-cta-btn:hover { opacity:0.9; }
    .post-hr { border:none; border-top:1px solid rgba(0,0,0,0.08); margin:2.5em 0; }
    /* Fix sticky: overflow-x:hidden on html/body breaks position:sticky.
       clip behaves identically visually but does NOT create a scroll container. */
    html, body { overflow-x: clip !important; }
    /* Force navbar visible on white-background page */
    #navbar .nav-container { background:rgba(255,255,255,0.97) !important; border-bottom:1px solid rgba(0,0,0,0.07) !important; backdrop-filter:blur(20px) !important; -webkit-backdrop-filter:blur(20px) !important; }
    #navbar .nav-logo-img { filter:invert(1) !important; }
    #navbar .nav-logo-text { color:#0a0a0a !important; }
    #navbar .nav-link { color:#0a0a0a !important; }
    #navbar .nav-slash { color:rgba(0,0,0,0.25) !important; }
    @media (max-width:900px) {
      .post-layout { grid-template-columns:1fr !important; }
      .post-sidebar { position:static !important; align-self:auto !important; }
      .post-header-pad { padding:48px 24px 36px !important; }
      .post-body-pad { padding:0 24px 80px !important; }
    }
  </style>
  <script async src="https://plausible.io/js/pa-0lcm4EUVXsjASg9rf6RN1.js"></script>
  <script>window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init();</script>
  <script src="/analytics.js"></script>
</head>
<body>
<div id="app">

<nav class="navbar" id="navbar">
  <div class="nav-container">
    <a href="/" class="nav-logo" aria-label="A2B Home">
      <img src="/assets/logos/a2blogowhite.png" alt="A2B Logo" class="nav-logo-img" width="42" height="42" />
      <span class="nav-logo-text">A2B</span>
    </a>
    <div class="nav-links" id="navLinks">
      <a href="/" class="nav-link">Home <span class="nav-slash"></span></a>
      <a href="/labs" class="nav-link">Labs <span class="nav-slash"></span></a>
      <a href="/service" class="nav-link">Service <span class="nav-slash"></span></a>
      <a href="/case-studies" class="nav-link">Case Study <span class="nav-slash"></span></a>
      <div class="nav-dropdown-wrapper" id="resourcesDropdown">
        <button class="nav-link nav-dropdown-btn active">Resources <span class="nav-slash"></span></button>
        <div class="nav-dropdown-menu mega-menu">
          <div class="mega-menu-left">
            <div class="mega-menu-label"><svg width="12" height="12" viewBox="0 0 44 44" fill="var(--accent)" xmlns="http://www.w3.org/2000/svg"><polygon points="22,1 43,11 43,33 22,43 1,33 1,11"/></svg> RESOURCES</div>
            <div class="mega-links">
              <a href="/blog" class="mega-link" data-title="Field notes &amp; Breakdowns" data-desc="Read our latest articles on agentic workflows, enterprise AI strategy, and building autonomous systems.">Blog</a>
              <a href="/youtube" class="mega-link" data-title="Walkthroughs &amp; Live Builds" data-desc="Watch our engineers build live, break down complex AI agents, and give product deep-dives on our channel.">YouTube</a>
            </div>
          </div>
          <div class="mega-menu-right">
            <div class="mega-content">
              <h3 class="mega-title">&ldquo;We partner with brands to move the world through tech, design and strategy.&rdquo;</h3>
              <p class="mega-desc">Dive into our field notes, video walkthroughs, and frameworks on AI-native operations to build a smarter future.</p>
            </div>
            <a href="/contact" class="btn-arrow mega-contact-btn"><span class="btn-label">Contact Us</span><span class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span></a>
          </div>
        </div>
      </div>
      <a href="/about" class="nav-link">About <span class="nav-slash"></span></a>
    </div>
    <a href="/contact" class="btn-arrow nav-cta" id="navCta"><span class="btn-label">Contact</span><span class="btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span></a>
    <button class="nav-hamburger" id="navHamburger" aria-label="Toggle Menu"><span></span><span></span><span></span></button>
  </div>
</nav>

<main style="background:#ffffff;min-height:100vh;">

  <section>
    <div style="max-width:var(--container-max);margin:0 auto;padding:130px var(--container-padding) 56px;" class="post-header-pad">
      <a href="/blog" style="display:inline-flex;align-items:center;gap:6px;font-size:0.85rem;color:rgba(0,0,0,0.4);text-decoration:none;margin-bottom:44px;letter-spacing:0.1px;transition:color 0.2s;" onmouseover="this.style.color='#0a0a0a'" onmouseout="this.style.color='rgba(0,0,0,0.4)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Blog
      </a>
      <h1 style="font-family:Inter,sans-serif;font-size:clamp(2rem,4vw,3.2rem);font-weight:800;line-height:1.12;color:#0a0a0a;letter-spacing:-0.5px;margin-bottom:20px;">${esc(post.title)}</h1>
      <p style="font-size:1.1rem;color:rgba(0,0,0,0.55);line-height:1.65;max-width:680px;margin-bottom:28px;">${esc(post.description)}</p>
      <div style="display:flex;align-items:center;gap:14px;font-size:0.85rem;color:rgba(0,0,0,0.45);flex-wrap:wrap;margin-bottom:40px;">
        <span>${esc(post.author)}</span>
        <span style="width:3px;height:3px;border-radius:50%;background:rgba(0,0,0,0.3);flex-shrink:0;"></span>
        <span>${dateStr}</span>
        ${pdfMetaLink}
      </div>
      <div style="height:1px;background:rgba(0,0,0,0.08);"></div>
    </div>
  </section>

  <section>
    <div style="max-width:var(--container-max);margin:0 auto;padding:56px var(--container-padding) 120px;display:grid;grid-template-columns:1fr 340px;gap:60px;" class="post-layout post-body-pad">

      <article>
        ${imgTag}
        ${docSection}
        <div class="blog-post-body">${contentHtml}</div>
      </article>

      <aside class="post-sidebar" style="align-self:start;position:sticky;top:100px;">
        <div style="display:flex;flex-direction:column;gap:16px;">

          <div class="post-sidebar-card" style="background:#f9f9f8;border:1px solid rgba(0,0,0,0.07);">
            <p style="font-size:0.68rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(0,0,0,0.35);margin-bottom:14px;">Published</p>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div>
                <p style="font-size:0.72rem;color:rgba(0,0,0,0.4);margin-bottom:3px;">Author</p>
                <p style="font-size:0.9rem;font-weight:600;color:#0a0a0a;margin:0;">${esc(post.author)}</p>
              </div>
              <div style="height:1px;background:rgba(0,0,0,0.06);"></div>
              <div>
                <p style="font-size:0.72rem;color:rgba(0,0,0,0.4);margin-bottom:3px;">Date</p>
                <p style="font-size:0.9rem;font-weight:600;color:#0a0a0a;margin:0;">${dateStr}</p>
              </div>
            </div>
          </div>

          <div class="post-sidebar-card" style="background:#0a0a0a;">
            <p style="font-size:0.68rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:12px;">Work With Us</p>
            <h4 style="font-family:Inter,sans-serif;font-size:1rem;font-weight:700;color:#ffffff;margin-bottom:8px;line-height:1.3;">Have a project in mind?</h4>
            <p style="font-size:0.82rem;color:rgba(255,255,255,0.45);line-height:1.65;margin-bottom:0;">Let&rsquo;s bring your ideas to life &mdash; get in touch or book a free call with our team.</p>
            <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
              <a href="/contact" class="post-cta-btn" style="background:rgba(255,255,255,0.08);color:#ffffff;margin-top:0;">
                Get in Touch
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="/contact" class="post-cta-btn" style="background:#00c853;color:#000000;margin-top:0;">
                Book a Meeting
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </a>
            </div>
          </div>

        </div>
      </aside>
    </div>
  </section>

  ${pdfBanner}

  <section class="cs-ai-native-cta">
    <div class="cs-under-the-hood-container">
      <div class="cs-ai-native-box">
        <div aria-hidden="true" style="position:absolute;top:50%;right:80px;transform:translateY(-50%);width:300px;height:300px;background:#ffffff;opacity:0.95;-webkit-mask:url('/assets/logos/a2blogowhite.png') center/contain no-repeat;mask:url('/assets/logos/a2blogowhite.png') center/contain no-repeat;pointer-events:none;user-select:none;z-index:0;"></div>
        <h2>Enjoyed<br>this post?</h2>
        <p>Explore more field notes and breakdowns from the A2B engineering team.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;">
          <a href="/blog" class="btn-arrow"><span class="btn-label">Back to Blog</span><span class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span></a>
          <a href="/contact" class="btn-arrow"><span class="btn-label">Contact Us</span><span class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span></a>
        </div>
      </div>
    </div>
  </section>

</main>

<footer class="site-footer" id="footer">
  <div class="footer-container"><div class="footer-inner">
    <div class="footer-top-right"><div class="footer-socials">
      <a href="https://www.linkedin.com/company/a2bai" target="_blank" rel="noopener" class="social-link"><i class="fab fa-linkedin-in"></i></a>
      <a href="https://www.instagram.com/a2bai.tech" target="_blank" rel="noopener" class="social-link"><i class="fab fa-instagram"></i></a>
      <a href="https://www.youtube.com/channel/UCOr8E2dKBEP6wZI3j19tlaw" target="_blank" rel="noopener" class="social-link"><i class="fab fa-youtube"></i></a>
    </div></div>
    <div class="footer-content">
      <div class="footer-cta">
        <div class="footer-logo-hex"><img src="/assets/logos/a2blogowhite.png" alt="A2B Logo" /></div>
        <h2 class="footer-title">A2B AI Technologies&trade;</h2>
        <p class="footer-desc">An elite AI agency helping you build a smarter future through Agentic Coding, AI Workflows, and Enterprise Automation.</p>
        <a href="/contact" class="btn-arrow footer-btn"><span class="btn-label">Free consultancy</span><div class="btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div></a>
      </div>
      <div class="footer-right">
        <div class="footer-links-wrapper">
          <div class="footer-link-col"><h4 class="footer-col-title">Resources</h4><a href="/case-studies">Case Studies</a><a href="/blog">Blog</a><a href="/faq">FAQ</a></div>
          <div class="footer-link-col"><h4 class="footer-col-title">Pages</h4><a href="/">Home</a><a href="/labs">Labs</a><a href="/service">Services</a></div>
          <div class="footer-link-col"><h4 class="footer-col-title">Company</h4><a href="/about">About</a><a href="/contact">Contact Us</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/cookies">Cookie Policy</a></div>
        </div>
        <div class="footer-contact-info">
          <a href="mailto:info@a2b.services" class="footer-email">info@a2b.services</a>
          <p class="footer-location">Trivandrum &middot; Kerala &middot; India</p>
        </div>
      </div>
    </div>
    <div class="footer-bottom"><div class="footer-copyright">&copy;2026 A2B AI Technologies</div></div>
  </div></div>
</footer>

</div>
<script type="module" src="/src/main.js"></script>
</body>
</html>`;
}

const posts = [
  {
    slug: 'n8n-v2-0',
    title: "Just upgraded to n8n v2.0 pre-release. Here's what actually changed.",
    description: "Hands-on with n8n v2: instant saves, flatter UI, thicker connectors, and a major change to Execute Workflow — sub-workflow outputs now flow back into the parent. This fixes approval-path friction but can break fire-and-forget designs. Keep production on v1 until you fully test sub-workflow behavior.",
    author: 'Rahul V K',
    date: '2025-12-07',
    image: 'https://bfmoirwycojttdbitvir.supabase.co/storage/v1/object/public/blog-images/0.24177335967231017.webp',
    pdf: 'https://www.dropbox.com/scl/fi/fdusyvx4pfc0aaiopprb9/n8n_v2.pdf?rlkey=i30dfzwdys875n3huon6a1fww&st=6qes1cdg&dl=0',
    content: `Saw version 2 drop on GitHub and decided to spin up a test instance. Spent some time digging through it and honestly... three of my workflows broke immediately. Not writing this to hype anything, just sharing what I found so maybe you don't have to troubleshoot this yourself when you upgrade.

The saves are instant now. That one second pause from version one? Just gone. You hit save and it's done before you even lift your finger. They also flattened the UI... nodes lost their white outlines, connectors are thicker and pop out when you hover, and there are these circular loading animations on slow nodes. Takes about ten minutes to adjust, but after that you barely notice. The side panels and general layout are still the same, so you're not relearning anything.

Publishing works differently and honestly it feels like more clicks. The activate toggle is gone. Now you publish with a version name, which is nice in theory, but unpublishing means digging into settings and clicking through menus. What used to be one click is now three or four. I couldn't find a way to link specific versions to public URLs either... maybe that's coming in the official release, but right now it just feels incomplete.

Here's what actually broke my stuff. Execute Workflow nodes work completely differently now. In version one, when you triggered a sub workflow, it would run and finish, but the data you originally passed in would come back unchanged. The sub workflow did its thing in isolation. In version two, whatever data gets created or modified inside that sub workflow now flows back to your main workflow automatically. So if your main workflow is waiting on a sub workflow to process something, you'll actually get that processed data back instead of just your original input. This caught me off guard because I had workflows built around the old behavior where sub workflows were essentially fire and forget. But here's the thing... this actually fixes a real pain point I've had with approval workflows. Before, getting human input back from a sub workflow into the parent required setting up separate webhooks or checking databases. Now the sub workflow can just wait for someone to approve or reject something, and that response flows back naturally so the main workflow can continue based on what actually happened.

Should you upgrade? Not if you have complex Execute Workflow setups in production or can't afford downtime. Maybe if you want to test the new behavior in a safe environment. I'm keeping production on version one and rebuilding my logic in a test instance first. The instant saves are tempting, but I'd rather spend some time testing than wake up to broken automations. This is still pre release... things might change. If you're using sub workflows, budget real time to test before upgrading. That's it.`
  },
  {
    slug: 'learn-n8n-in-2026',
    title: "So you want to learn n8n... Read this first or you'll waste 3 months like I did.",
    description: "Three months wasted chasing AI agents before learning the basics. Here's the roadmap that actually works: start boring, build reliable, then go smart.",
    author: 'Rahul V K',
    date: '2025-12-11',
    image: 'https://bfmoirwycojttdbitvir.supabase.co/storage/v1/object/public/blog-images/0.33297743176819616.webp',
    pdf: 'https://www.dropbox.com/scl/fi/6udpdl5l73s8w56iwt8zx/learn_n8n.pdf?rlkey=j9v06e5ttsqqxz7l1xk1a55x9&st=uc3ru908&dl=0',
    content: `MY STORY:

I wasted 3 months learning n8n because I wanted to build cool stuff... and honestly, I thought I was smarter than everyone else. It was mid 2024 and I kept seeing these YouTube videos about AI agents that could supposedly do anything. I convinced myself I'd skip the boring basics and jump straight into building autonomous agents. My first agent took three weeks to build and worked perfectly for exactly two days. Then someone submitted a form with a weird character in their name and the entire thing exploded. Six hours of debugging later, I realized I could have prevented the whole mess if I had just understood how data actually flows through n8n.

The turning point came from the most unexpected place. My buddy who runs a small accounting firm asked if I could help automate some basic stuff... when a client emails an invoice, save it to Google Drive, update a spreadsheet, send a confirmation. I almost said no because it sounded boring as hell. No AI, no agents, just basic workflow automation. Took me two hours to build and it's been running for four months without a single issue. He pays me five hundred dollars a month to maintain it and I spend maybe ten minutes a week checking it. That's when it clicked... I had been chasing the wrong thing this entire time.

So I started over with a completely different approach. Phase one was forcing myself to learn the unglamorous stuff everyone skips... JSON, HTTP requests, webhooks, basic error handling. This phase is mind numbingly boring and that's exactly why most people skip it. But this boring foundation is where eighty percent of the actual value lives. Phase two was adding AI strategically to enhance workflows, not replace them. Phase three was finally building agents, but only after mastering everything before. The biggest mindset shift was spending thirty minutes with pen and paper before touching the computer... mapping out triggers, data flow, and everything that could go wrong.

When I talk to clients now, I never mention agents or AI unless they ask. Nobody cares about your tech stack. They care about getting time back, eliminating errors, and not paying someone for repetitive work. I have one client paying me twelve hundred dollars a month for automations that took eight hours total to build. Not a single one uses AI... just rock solid workflows that do their job every single day. Here's what nobody tells you though... around month three you're going to hit a wall where everything feels overwhelming and you'll question why you started. Push through that phase because on the other side, you start seeing patterns and realize most automations are just variations of the same fifteen nodes.

If you're starting from zero in 2025, learn from my mistakes. Don't touch AI for your first month. Build five simple workflows like form to spreadsheet stuff. Break them on purpose to learn error handling. Then add AI to enhance what you've built. Only build agents after you're comfortable with everything above. The boring foundation work separates people who build reliable systems from people who build demos that break in production.

GUIDE:

(Note: Next time I will post this in a more structured format.)

How I'd Learn AI Automation in 2026 (If I Had to Start Over)

It's easy to get caught up in the excitement of building sophisticated AI agents. The online world is full of them, and the immediate impulse is to jump in and start building the "cool" stuff as quickly as possible. When I first started, I brute-forced my way through the learning process, thinking the goal was to build AI agents as fast as I could. I now realize this is exactly the wrong approach. The fastest and most effective path to mastering advanced AI automation is to first master the "boring" fundamentals.

--------------------------------------------------------------------------------

1. Your First Step: Ignore AI Completely

The single most important piece of advice for anyone starting today is this: do not start with AI. Learn the fundamentals of classic automation and rule-based workflows before you even think about building an agent. Most beginners skip this part, but it's like trying to run before you can walk. You cannot build reliable agents if you don't understand how a basic workflow functions.

There are three distinct layers to automation. First, Workflows: rule-based, predictable systems. You know the inputs, you can map the variables, and the workflow runs the same way every time. Second, AI-assisted Workflows: the middle layer, where you take a predictable workflow and add intelligence. For example, using AI to score a support ticket's priority or personalize an email. Third, AI Agents: powerful systems that can make decisions, use tools, and adjust based on context. They are far more difficult to control and more likely to break.

The value of mastering basic workflows first cannot be overstated. Standard workflow automation alone can deliver 30% to 200% ROI in year one, with labor cost savings of 25% to 40%. In fact, about 50% of all work activities can be automated without using AI at all. Jumping straight to agents causes confusion, things break, and you want to quit.

--------------------------------------------------------------------------------

2. Expect an Emotional Rollercoaster

Learning automation isn't just a technical challenge; it's a psychological one. You're probably going to feel overwhelmed. Understanding the "transition curve" helps you map out this emotional journey and find the perspective to succeed when things get difficult.

• Phase 1 — Uninformed Optimism: You see the opportunity and you're excited to start.
• Phase 2 — Informed Pessimism: You begin to understand the true complexity. This is when you feel overwhelmed.
• Phase 3 — Crisis of Meaning: The critical decision point. You can either crash and burn or push through.
• Phase 4 — Informed Optimism: You've pushed through and are now building with confidence.

This cycle is not a one-time event. Knowing it exists is empowering. It helps you recognize that the struggle is a normal phase.

--------------------------------------------------------------------------------

3. Give the AI a Cheat Sheet

There's a lot of talk about "prompt engineering," but a far more important skill is context engineering. Large Language Models are simply predicting the next logical word. They don't know your business, your clients, or your internal processes. An AI is only as smart as the information you provide it.

A system prompt is like studying the night before an exam. Good context is like having a cheat sheet during the exam. The best results come from doing both. Stop expecting the model to guess what you want and start giving it the information it needs.

--------------------------------------------------------------------------------

4. Build Systems That Run While You Sleep

The true power of automation lies in building workflows that save time without you ever being involved. A "personal assistant" agent only takes action when you tell it to — low leverage. Compare that to a workflow triggered by a real-world event, like a new lead submitting a form. That system wakes up on its own and can run all day and all night. That is where you get scale.

To identify high-leverage opportunities, a process is worth automating if it is repetitive, time-consuming, error-prone, and scalable. If a process does not check at least two of those boxes, it's probably not worth automating yet.

--------------------------------------------------------------------------------

5. Sharpen Your Axe Before You Chop the Tree

The most common mistake is jumping directly into a builder tool, which leads to messy, fragile workflows that aren't modular or scalable. The most critical work happens before you drag a single node onto the canvas.

Before you build, think like a process engineer and ask: Who does what? When does it happen? What triggers this? Where's the data coming from? What do we do with the data? What is the final outcome we care about?

If you can't explain a process clearly on paper, you have no chance of automating it clearly. A small amount of planning upfront will save you a huge amount of time later.

--------------------------------------------------------------------------------

Mastering automation isn't about chasing the latest AI hype. It's about building a solid, foundational understanding of rule-based systems, thinking strategically about leverage, and planning with the discipline of an engineer. Build boring stuff that works first — you can make it cool later.`
  },
  {
    slug: 'debugging-a-workflow-that-had-zero-error-logs-and-lost-1200',
    title: 'Spent 6 hours debugging a workflow that had zero error logs and lost $1,200. Never again.',
    description: 'A real production failure story: a flawless workflow sending blank responses in production, no error logs, and a costly weekend. Here is what actually fixed it.',
    author: 'Rahul V K',
    date: '2026-01-02',
    image: 'https://bfmoirwycojttdbitvir.supabase.co/storage/v1/object/public/blog-images/0.423747097128918.webp',
    pdf: 'https://www.dropbox.com/scl/fi/2c5iimhiv34vmywwtpjmr/debug.pdf?rlkey=q9mjspv6hypnwielbgij912vl&st=1n6tr3au&dl=0',
    content: `MY STORY:

So this happened about 4 months ago. Built this beautiful n8n workflow for a client with AI agents, conditional logic, the whole thing. Tested it locally maybe 50 times. Perfect every single time. Deployed it on a Friday evening and went to sleep feeling pretty good about myself. Saturday morning, my phone rings. Client. "The system's sending blank responses." I'm half awake, trying to sound professional, telling him I'll check it out. I open my laptop... everything looks fine on my end. I run a manual test. Works perfectly. But in production? Still blank. Spent the next 6 hours trying to figure out what was happening. No logs. No error messages. Just... nothing. Turned out the frontend was sending one field as null instead of an empty string, and my workflow just... continued anyway. No validation. Just processed garbage and returned garbage. Cost the client about 500 dollars of lost orders that weekend. Cost me way more in trust.

That whole experience changed how I build things. The actual workflow logic... that's honestly the easy part. The part that feels good. The hard part is all the stuff nobody talks about in tutorials. Now I check everything at the entry point. Does this user exist in my database? Is the request coming from where it should? Is the data shaped right? If any answer is no, the workflow stops immediately. I log everything now... what came in, what decisions got made, what went out. All to Supabase, not n8n's internal storage. Because when something breaks at 2 AM, I don't want to trace through 47 nodes. I want to see exactly what payload caused the issue in a clean database table.

Error handling was huge too. Before, if a workflow broke, users would see a loading spinner forever. Now they get an actual error message. I get a notification. I have logs showing exactly where it failed. I return proper status codes... 200 for success, 404 for unauthorized, 500 for internal errors. And I test everything with a separate database first. I try to break it. Send weird data. Simulate failures. Only when it survives everything do I move it to production.

Here's the thing. The workflow you build locally... that's maybe 20 percent of what you actually need. The other 80 percent is security, validation, logging, and error handling. It's not exciting. It doesn't feel productive. But it's the difference between something that works on your machine and something that can survive in the wild. I still love building the logic part, the clever AI chains... that's the fun stuff. But I've learned to respect the boring stuff more. Because when a production workflow breaks, clients don't care how elegant your logic was. They just want to know why you didn't plan for this.

GUIDE:

Your Automation is Only 20% Done: 5 Production-Ready Secrets for n8n

You've done it. After hours of tinkering, connecting nodes, and testing logic, your n8n workflow finally runs successfully from start to finish. This is where most people stop, believing the work is done. The reality is that building the functional workflow is just the tip of the iceberg — about 20% of the total effort.

The real work, the hidden 80%, lies in transforming that functional prototype into a production-ready system. Whether you're building a complex AI agent or a deterministic workflow with code nodes and API calls, this framework applies to any automation you create.

--------------------------------------------------------------------------------

1. Embrace the 80/20 Rule: The Real Work Starts After it Works

The initial, creative process of building the core nodes of your workflow is a small fraction of the total effort required for a production system. The majority of the work involves making the system robust, secure, and transparent.

Adopting this mindset forces you to move beyond "Does it run?" to the far more critical question of "Can it run 10,000 times without failing?" It's the difference between a clever script and a dependable business asset.

--------------------------------------------------------------------------------

2. Think Like a Bouncer, Not Just a Builder

Before you consider the workflow's core logic, production-ready thinking begins with security and access control. Your webhook is the front door to your club. Before anyone gets in, you need a bouncer to check their ID. This means asking two questions before any processing begins.

Who is this user? A workflow that interacts with users needs a way to validate and authorize them. If they aren't on the list, they don't get in.

How do I block danger? Even if a user is legitimate, you need to ensure the request is coming from a trusted source. Securing the webhook with header authentication requires a "password for entry" before the workflow even triggers.

--------------------------------------------------------------------------------

3. Design Your Workflow to Fail Gracefully

In a production environment, failures are not just possible — they are expected. The key is to handle them intentionally so that the user is always informed and the system remains predictable.

Use the Webhook Response node to communicate status back to the front-end system. The three key response codes to use are: Status 200 for a successful response. Status 404 for an authorization error, telling the front end the user is not authenticated. Status 500 for an internal service error, communicating that the user was valid but a component inside the workflow failed.

This approach provides a clean, predictable experience for the user, even when things go wrong behind the scenes.

--------------------------------------------------------------------------------

4. Become a Chronicler: Log Every Key Event

A chronicler doesn't just write down the ending of a story; they document every chapter. Log the full narrative of each execution — not just for catching errors but for understanding the quality of its work.

Log three key stages: what information was received, what was the key decision made with that information, and what was the final action or response. This detailed chronicle makes debugging incredibly fast. When a run fails, you can immediately see which stage it failed at and why.

--------------------------------------------------------------------------------

5. Follow a Framework: Deconstruct, Analyze, and Mitigate

To move from a test workflow to a production system, replace random tinkering with a structured, repeatable framework.

First, deconstruct the system: break your automation down into its core components — the front-end interface, the API transport layer, and the core workflow logic. Second, analyze risks: for each component, list everything that could possibly go wrong. Third, implement mitigations: for every risk you listed, devise a specific solution. Add a database check for unknown users. Implement header authentication to secure the webhook. Create detailed logging for failures.

This methodical process transforms your workflow from a fragile script into a robust system.

--------------------------------------------------------------------------------

Moving a workflow into production requires a fundamental shift in identity. You are no longer just a builder of features; you become an architect of reliable, resilient systems. By embracing the "boring" 80% — security, error handling, logging, and risk mitigation — you ensure that what you build can stand on its own and deliver consistent value over the long term.`
  },
  {
    slug: 'built-50-automations-that-clients-never-used',
    title: "I built 50+ automations that clients never used, and honestly, it messed with my head for a while.",
    description: "A technically perfect $800 automation nobody used. The framework that changed everything: Look Left at what feeds your workflow, Look Right at what happens after it runs.",
    author: 'Rahul V K',
    date: '2025-12-09',
    image: 'https://bfmoirwycojttdbitvir.supabase.co/storage/v1/object/public/blog-images/0.5106112479765623.webp',
    pdf: 'https://www.dropbox.com/scl/fi/y0f35xejg4ygphj1qfs50/build_50_auto.pdf?rlkey=9l0w3ugn770w34h4qlnh2bunt&st=mdm6ul56&dl=0',
    content: `Last month I landed a project worth around $800 for an SMS automation. I was genuinely excited because the scope was clear, the client seemed really engaged during our calls, and I knew exactly how to build it. I spent about a week getting everything set up, staying up late some nights because I wanted to get it just right. Built it, tested it obsessively, deployed it. Everything worked perfectly. The client started using it immediately and I remember feeling that little rush of accomplishment. Finally. A project that landed well. Then three days later, complete silence. The automation was still running in the background, no errors in the logs, everything technically functional. But nobody was touching it anymore.

I waited a few days thinking maybe they were just busy, but the knot in my stomach kept growing. I reached out to the client after a week, trying to sound casual but honestly feeling a bit panicked. I asked if everything was working okay, if they needed any adjustments, if there were bugs I somehow missed during testing. They responded with something that I still think about regularly. "Yeah, it works fine. We're just not really using it." That was it. No technical issue, no complaint about the interface, no request for changes. Just complete indifference. I didn't know what to do with that response. The automation worked. That was supposed to be the hard part, right? So why didn't they care?

I couldn't let it go. That night I started going through my past projects, just scrolling through old invoices and deployment logs out of morbid curiosity. Maybe this was a one-off thing. It wasn't. Out of about 50 automations I had built over the past year, maybe half were actually being used regularly. The rest were like this one. Technically functional but practically abandoned. Some clients were still paying monthly server costs to keep them running even though nobody in their company had logged in for weeks. And the part that really got to me was that they all worked. There were no bugs, no crashes, no data loss. The code was solid. So what was I actually doing wrong?

A few weeks later I had a routine check-in call with a different client, someone whose automation was actually thriving. Their team had fully adopted it, they were seeing real results, and they kept asking me to add more features. I decided to just ask him directly. Why do you think your team actually uses this when other clients seem to forget about theirs after a few days? He didn't even have to think about it. He just said "Because it fits how we already work. Your automation didn't make us change our process. It just made our existing process faster." That sentence completely rewired something in my brain.

I had been building isolated tasks this whole time. Cool, functional, technically impressive isolated tasks. But I was never thinking about the actual messy, real-world process they were supposed to fit into.

Let me give you the clearest example of how badly I was missing this. I built an SMS automation that was supposed to personalize messages by using the lead's first name. I built the whole workflow, added all the logic for pulling the name from the database, tested it with sample data where I made up names like John and Emily, and it worked beautifully. Every test message came out perfectly personalized. Then a few days later I was just randomly checking the actual messages going out to real leads and they all said "Hi there, thanks for your interest in our product." Every single one. Generic. Impersonal.

I immediately went into panic mode. Checked every node, every variable, every data transformation step. Nothing was broken. Everything was working exactly as coded. Then it hit me. The issue wasn't in my automation at all. It was in the web form that was capturing leads before my automation even started. There was a name field, sure, but it was optional. Most people were just typing in their email and hitting submit. They were skipping the name entirely. So my beautiful personalization automation was working perfectly, dutifully pulling data from a database field that was almost always empty. The problem wasn't the code I wrote. It was that I never bothered to look at what was feeding data into my system in the first place.

That's when I started approaching projects differently. Now before I build anything, before I even open n8n or start dragging nodes around, I spend time mapping out what I call "look left" and "look right."

Look left means really understanding everything that happens before my automation triggers. Where is this data actually coming from? What format is it in? What fields are required versus optional? Is the marketing team's funnel actually set up to capture what I need?

Look right means understanding what happens after my automation finishes its job. Who actually receives this data? What do they need to do with it? What's the very next step in their day?

This sounds incredibly obvious when I type it out, embarrassingly obvious actually, but I genuinely wasn't doing it before. I was treating each automation like it existed in a perfect vacuum where data magically appeared in the right format and magically got used exactly how I imagined.

Here's what that shift looked like in practice. A client came to me and said they wanted a chatbot for their website. Old me would have just built a chatbot. New me asked: "What does your sales team actually need to know before they pick up the phone to call one of these leads?" The client paused and said: budget and location. Those two pieces of information determined whether a lead was worth pursuing immediately.

So instead of building a chatbot that had nice pleasant conversations and collected email addresses, I built one that specifically extracted budget and location during the natural flow of conversation. Then it automatically routed qualified leads to the CRM with those fields already filled in, and marked them as hot or warm based on what they said. Same technology, completely different outcome. The sales team actually started using it within days because it wasn't giving them more work. It was saving them the 10 minutes they used to spend on each call asking basic qualifying questions.

I also realized I was only building for binary outcomes. Qualified or not qualified. Yes or no. But that's not how actual business works. Most leads aren't a clear yes or no. They're interested but their boss needs to approve the budget first. They love the product but can't implement anything new for two months.

So I started building a third route. Yes leads go straight to the CRM for immediate follow up. No leads get discarded. But maybe leads — the ones who are genuinely interested but not ready right now — go into a re-engage database. Then a scheduled job runs every two weeks and sends a simple, non-pushy message: "Hey, we chatted a few weeks ago and you mentioned you might be interested later. Is now a better time?" The number of leads that convert from that follow-up is honestly surprising.

I'm not writing this to show off or act like I've figured everything out. I really haven't. But I wasted months of my life, and honestly a decent amount of my clients' money, building things that nobody used. The issue was that I was solving the wrong problem entirely. I was optimizing for technical functionality and clean code when I should have been optimizing for adoption and real-world fit. Start looking left to see what's actually feeding into your automation. Start looking right to see what really happens after it finishes. Build for the full messy real-world process, not just the clean middle step that's fun to code.`
  },
  {
    slug: 'i-wasted-6-months-building-automations-that-kept-breaking-here-s-what-actually-fixed-them',
    title: "I wasted 6 months building automations that kept breaking. Here's what actually fixed them.",
    description: "The pattern was always the same: works perfectly in testing, deploy to client, 3 days later it breaks. Here are the 10 data-handling techniques that actually fixed this.",
    author: 'Rahul V K',
    date: '2025-12-04',
    image: 'https://bfmoirwycojttdbitvir.supabase.co/storage/v1/object/public/blog-images/0.4632813759598703.webp',
    pdf: 'https://www.dropbox.com/scl/fi/rjg7we1t5xrgz1lc98w7v/6_month.pdf?rlkey=dmw3dgb1l7cgjf6w7iy2jk3l1&st=5hqubz7x&dl=0',
    content: `Started building n8n workflows last year. Felt smart for like... 2 weeks. Then everything started falling apart in production. The pattern was always the same: works perfectly in testing, deploy to client, 3 days later "Hey, it's not working anymore." I'd go back in, change one thing upstream, entire workflow breaks downstream. Spend 4 hours debugging, find the issue, fix it, break something else. Repeat.

The specific breaking points were always predictable in hindsight: renamed a node and 12 references died, API returned nested data and JSON parse failed silently, loop finished and lost all the original context data, switch node with 3 paths but only one path's data was accessible, hit rate limits testing edge cases over and over. The worst part? I thought I was just bad at this.

What actually changed was finding someone's workflow template that just... worked differently. Stable. Clean. Didn't explode when you touched it. Started reverse-engineering why, and turns out pros do 10 things differently with data handling.

Put "Edit Fields" nodes at key points as stable anchors so upstream changes don't cascade-break everything. Log execution ID, timestamp, and workflow name to a separate table which makes debugging 10x faster when something breaks at 3am. Always put a Code node after API or AI calls because responses are never as clean as the docs promise. Build complete data objects before loops or splits because trying to merge context back later is hell. Use .all to grab full datasets from previous nodes, especially before major transitions. Pin output data during testing, then edit the pinned data to simulate failures instead of hitting APIs 50 times. Use first() to access data from any pathway which fixes 90% of "undefined" errors after conditional nodes. Understand the "first live wire" principle where when multiple wires connect, only the first one's data is accessible by default. Use "Do Nothing" nodes as clean merge points to keep workflows readable. Use AI chat with docs to generate complex functions faster than documentation diving.

The difference was massive. Before, every small change meant a 2 hour debugging session. Now I make changes, map to anchor points, and keep moving. Before I'd test by running the entire workflow 30 times. Now I pin data, edit it, and test edge cases in 5 minutes. Before I had "undefined" errors everywhere after conditional logic. Now the first() function solves it immediately.

The workflow you see on screen is the easy part. The stability comes from the invisible structure underneath — anchor points, logs, proper data handling before every split. Once I understood that, everything clicked. Build the anchors first. Then build the logic. Your future self at 3am will thank you.`
  },
  {
    slug: 'built-a-system-that-does-500-in-the-time-i-used-to-do-5',
    title: "Spent 4 hours a day researching leads. Built a system that does 500 in the time I used to do 5.",
    description: "How I automated lead research with n8n, LinkedIn scraping, real-time company news, and Claude to write personalized cold emails at scale — without sacrificing response rates.",
    author: 'Rahul V K',
    date: '2026-01-04',
    image: 'https://bfmoirwycojttdbitvir.supabase.co/storage/v1/object/public/blog-images/0.9740702812356797.webp',
    pdf: 'https://www.dropbox.com/scl/fi/dho8u1a3xgdrpa05fnp5s/build_a_sy.pdf?rlkey=0b499agbt4dtjxv564p6wwi6l&st=ors3sf95&dl=0',
    content: `Three months ago I was spending four hours a day researching leads. Not writing emails... just reading LinkedIn profiles, scrolling through posts, and Googling companies to see if they raised funding or launched something new. I was doing maybe fifteen quality emails a day but my boss wanted two hundred. The math didn't work. So I started cutting corners with those templated emails where you just swap in the first name and company. My response rate dropped from eight percent to under one percent. Then one day a prospect replied saying I've never posted about hiring, did you even look at my profile? I hadn't. The VA I hired to personalize emails was just making stuff up. That response stuck with me because I remembered when I actually cared about this work.

I started thinking about what actually took so long. It wasn't the writing itself... it was the research. Reading through someone's last month of posts to find something relevant. Checking if their company just raised a round or launched a new product. That research was valuable but it was eating all my time. So I wondered... could I automate just that part and still write emails that sounded human? I'm not a developer but I know my way around no code tools. I started playing with n8n and some AI APIs.

Here's what I built. I feed the system a list of leads. It scrapes their last month of posts and searches the web for recent company news like funding announcements or product launches. Then Claude reads through all that research and writes three unique emails for each person. An opener that references something specific it found, a follow up if they don't respond, and a pivot email. It schedules them to send at eleven in the morning in their timezone. And if someone replies to the first email, the system automatically cancels the scheduled follow ups so I don't keep bothering them like a robot. The whole thing runs through Google Sheets. Just a spreadsheet that fills itself out while I do other work.

What surprised me most was how the emails turned out. They don't sound like AI wrote them. I think it's because Claude isn't working from a template... it's working from actual research about a specific person. So it finds real hooks. "Saw you're expanding into APAC based on your latest hire." "Read your post about switching to usage based pricing... curious how that's going." My response rate climbed back up to around seven or eight percent, right where it was when I did everything by hand. Except now I can process five hundred leads a day instead of fifteen.

Building it took about two weeks of trial and error with the prompts and figuring out how to rotate between multiple Gmail accounts so I wouldn't trash my sender reputation. The tech stack is n8n, Relevance AI for LinkedIn scraping, Perplexity for company news, and Claude for writing. Total cost is maybe two hundred dollars a month.

I'm not trying to sell anything here. I built this for myself because I was drowning. But if you're spending hours every day researching leads or sending templates that make you feel gross... you can probably build something similar for your use case. It's just using AI for what it's actually good at... reading a lot of text quickly and writing in a natural voice. The hard part is still the same. Picking the right people to email. Having something worth saying when they reply. But at least now when someone replies I'm not embarrassed about what I sent them.`
  }
];

posts.forEach(post => {
  const dir = resolve(root, 'blog', 'post', post.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), generatePage(post));
  console.log('Generated: /blog/post/' + post.slug + '/');
});

console.log('\nDone. ' + posts.length + ' blog pages generated.');
