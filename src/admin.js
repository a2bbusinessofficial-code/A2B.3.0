import { supabase } from './supabase.js';

// ─────────────────────────────────────────
// State
// ─────────────────────────────────────────
let contactLeads = [];
let clinicLeads  = [];
let utmLinks     = [];
const leadsMap   = new Map();
const utmMap     = new Map();

const $ = id => document.getElementById(id);

// ─────────────────────────────────────────
// Boot — Supabase Auth drives everything
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // React to every auth event: login, logout, token refresh, tab restore
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) showDashboard(session.user);
    else               showLogin();
  });

  // Restore existing session on page load
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) showLogin();
  });

  $('login-form').addEventListener('submit', handleLogin);
  $('modal-overlay').addEventListener('click', e => {
    if (e.target === $('modal-overlay')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
});

// ─────────────────────────────────────────
// Auth
// ─────────────────────────────────────────
function showLogin() {
  $('login-screen').style.display = 'flex';
  $('dashboard').style.display    = 'none';
}

function showDashboard(user) {
  $('login-screen').style.display = 'none';
  $('dashboard').style.display    = 'flex';
  $('admin-username').textContent = user.email;
  navigateTo('contact-leads');
}

async function handleLogin(e) {
  e.preventDefault();
  const btn      = $('login-btn');
  const errEl    = $('login-error');
  const email    = $('login-email').value.trim();
  const password = $('login-password').value;

  btn.disabled      = true;
  btn.textContent   = 'Signing in…';
  errEl.textContent = '';

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    errEl.textContent = 'Invalid email or password.';
    btn.disabled      = false;
    btn.textContent   = 'Sign In';
    return;
  }
  // onAuthStateChange fires and calls showDashboard() automatically
}

window.adminLogout = async () => {
  await supabase.auth.signOut();
  // onAuthStateChange fires and calls showLogin() automatically
};

// ─────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────
window.navigateTo = async (section) => {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navItem = document.querySelector(`[data-section="${section}"]`);
  if (navItem) navItem.classList.add('active');

  document.querySelectorAll('.section').forEach(el => el.style.display = 'none');
  const sectionEl = $(`section-${section}`);
  if (sectionEl) sectionEl.style.display = 'block';

  switch (section) {
    case 'contact-leads': await loadContactLeads(); break;
    case 'clinic-leads':  await loadClinicLeads();  break;
    case 'utm':           await loadUTM();           break;
  }
};

// ─────────────────────────────────────────
// Contact Leads
// ─────────────────────────────────────────
async function loadContactLeads() {
  const el = $('section-contact-leads');
  el.innerHTML = '<div class="loading">Loading submissions…</div>';

  const { data } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('source', 'contact_form')
    .order('created_at', { ascending: false });

  contactLeads = data || [];
  contactLeads.forEach(l => leadsMap.set(l.id, l));
  renderContactLeads(contactLeads);
}

function renderContactLeads(leads) {
  const el = $('section-contact-leads');
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title-row">
        <h2 class="section-title">Contact Leads</h2>
        <span class="badge">${contactLeads.length}</span>
      </div>
      <input class="search-input" placeholder="Search name, email, company…"
             oninput="filterContactLeads(this.value)" />
    </div>
    ${leads.length === 0
      ? '<div class="empty-state">No contact form submissions yet.</div>'
      : `<div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Date</th><th>Name</th><th>Company</th>
              <th>Email</th><th>Service</th><th>Budget</th><th></th>
            </tr></thead>
            <tbody id="contact-leads-tbody">
              ${leads.map(contactLeadRow).join('')}
            </tbody>
          </table>
        </div>`
    }
  `;
}

function contactLeadRow(l) {
  const d    = l.data || {};
  const date = fmtDate(l.created_at);
  return `
    <tr>
      <td class="td-muted">${date}</td>
      <td class="td-bold">${esc(d.first_name || '')} ${esc(d.last_name || '')}</td>
      <td>${esc(d.company_name || '—')}</td>
      <td>${esc(d.email || '—')}</td>
      <td><span class="tag">${esc(d.service || '—')}</span></td>
      <td>${esc(d.budget || '—')}</td>
      <td><button class="btn-view" onclick="showLeadDetail('${l.id}')">View</button></td>
    </tr>`;
}

window.filterContactLeads = q => {
  q = q.toLowerCase();
  const rows = contactLeads.filter(l => {
    const d = l.data || {};
    return [d.first_name, d.last_name, d.email, d.company_name, d.service]
      .some(v => (v || '').toLowerCase().includes(q));
  });
  const tbody = $('contact-leads-tbody');
  if (tbody) tbody.innerHTML = rows.map(contactLeadRow).join('');
};

// ─────────────────────────────────────────
// Clinic Leads
// ─────────────────────────────────────────
async function loadClinicLeads() {
  const el = $('section-clinic-leads');
  el.innerHTML = '<div class="loading">Loading submissions…</div>';

  const { data } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('source', 'clinic_fit_check')
    .order('created_at', { ascending: false });

  clinicLeads = data || [];
  clinicLeads.forEach(l => leadsMap.set(l.id, l));
  renderClinicLeads(clinicLeads);
}

function renderClinicLeads(leads) {
  const el = $('section-clinic-leads');
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title-row">
        <h2 class="section-title">Clinic Leads</h2>
        <span class="badge">${clinicLeads.length}</span>
      </div>
      <input class="search-input" placeholder="Search name, email, website…"
             oninput="filterClinicLeads(this.value)" />
    </div>
    ${leads.length === 0
      ? '<div class="empty-state">No clinic form submissions yet.</div>'
      : `<div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Date</th><th>Contact</th><th>Website</th>
              <th>Email</th><th>Target Service</th><th>Lead Volume</th><th></th>
            </tr></thead>
            <tbody id="clinic-leads-tbody">
              ${leads.map(clinicLeadRow).join('')}
            </tbody>
          </table>
        </div>`
    }
  `;
}

function clinicLeadRow(l) {
  const d    = l.data || {};
  const date = fmtDate(l.created_at);
  return `
    <tr>
      <td class="td-muted">${date}</td>
      <td>
        <span class="td-bold">${esc(d.contact_name || '—')}</span>
        ${d.contact_role ? `<br><small class="td-muted">${esc(d.contact_role)}</small>` : ''}
      </td>
      <td><a href="${esc(d.website || '#')}" target="_blank" class="table-link">${esc(d.website || '—')}</a></td>
      <td>${esc(d.email || '—')}</td>
      <td><span class="tag">${esc(d.target_service || '—')}</span></td>
      <td>${esc(d.contact_volume || '—')}</td>
      <td><button class="btn-view" onclick="showLeadDetail('${l.id}')">View</button></td>
    </tr>`;
}

window.filterClinicLeads = q => {
  q = q.toLowerCase();
  const rows = clinicLeads.filter(l => {
    const d = l.data || {};
    return [d.contact_name, d.email, d.website, d.target_service]
      .some(v => (v || '').toLowerCase().includes(q));
  });
  const tbody = $('clinic-leads-tbody');
  if (tbody) tbody.innerHTML = rows.map(clinicLeadRow).join('');
};

// ─────────────────────────────────────────
// Lead Detail Modal
// ─────────────────────────────────────────
window.showLeadDetail = id => {
  const l = leadsMap.get(id);
  if (!l) return;
  const d         = l.data || {};
  const isContact = l.source === 'contact_form';
  const name      = isContact ? `${d.first_name || ''} ${d.last_name || ''}`.trim() : (d.contact_name || '');

  const fields = isContact ? [
    ['First Name', d.first_name],
    ['Last Name', d.last_name],
    ['Email', d.email],
    ['Phone', d.phone],
    ['Company', d.company_name],
    ['Website', d.website],
    ['Company Size', d.company_size],
    ['Revenue', d.company_revenue],
    ['Title', d.title],
    ['Service Interested', d.service],
    ['Budget', d.budget],
    ['Referral', d.referral],
    ['Message', d.message],
  ] : [
    ['Contact Name', d.contact_name],
    ['Role', d.contact_role],
    ['Email', d.email],
    ['Phone', d.phone],
    ['Clinic Website', d.website],
    ['Has Old Leads', d.has_old_leads],
    ['Lead Volume', d.contact_volume],
    ['Contact Storage', d.contact_storage],
    ['Target Service', d.target_service],
  ];

  openModal(`
    <div class="modal-header">
      <div>
        <span class="modal-source-tag">${isContact ? 'Contact Lead' : 'Clinic Lead'}</span>
        <h3 class="modal-name">${esc(name || '—')}</h3>
      </div>
      <span class="td-muted" style="font-size:0.78rem;white-space:nowrap">${new Date(l.created_at).toLocaleString('en-IN')}</span>
    </div>
    <div class="detail-grid">
      ${fields.filter(([, v]) => v).map(([k, v]) => `
        <div class="detail-item ${k === 'Message' ? 'detail-full' : ''}">
          <div class="detail-label">${k}</div>
          <div class="detail-value">${esc(String(v))}</div>
        </div>
      `).join('')}
    </div>
  `);
};

// ─────────────────────────────────────────
// UTM Manager
// ─────────────────────────────────────────
async function loadUTM() {
  const el = $('section-utm');
  el.innerHTML = '<div class="loading">Loading UTM links…</div>';

  const { data } = await supabase
    .from('utm_links')
    .select('*')
    .order('created_at', { ascending: false });

  utmLinks = data || [];
  utmLinks.forEach(l => utmMap.set(l.id, l));
  renderUTM();
}

function renderUTM() {
  const el = $('section-utm');
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title-row">
        <h2 class="section-title">UTM Manager</h2>
        <span class="badge">${utmLinks.length} links</span>
      </div>
    </div>

    <div class="utm-layout">

      <!-- ── Create form ── -->
      <div class="utm-card">
        <h3 class="card-title">Create Link</h3>
        <form id="utm-form" onsubmit="submitUTMForm(event)">
          <div class="form-row">
            <label class="form-label">Label <span class="form-hint">(internal name)</span></label>
            <input id="utm-label" class="form-input" placeholder="e.g. Instagram June Story" required />
          </div>
          <div class="form-row">
            <label class="form-label">Slug <span class="form-hint">(a–z, 0–9, hyphens only)</span></label>
            <div class="slug-wrap">
              <span class="slug-prefix">a2b.services/a2b/</span>
              <input id="utm-slug" class="form-input slug-input"
                     placeholder="ig-jun26" pattern="[a-z0-9\\-]+" required />
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">Destination URL</label>
            <input id="utm-dest" class="form-input" type="url"
                   placeholder="https://a2b.services/contact" required />
          </div>
          <div class="form-2col">
            <div class="form-row">
              <label class="form-label">Source</label>
              <input id="utm-source" class="form-input" placeholder="instagram" />
            </div>
            <div class="form-row">
              <label class="form-label">Medium</label>
              <input id="utm-medium" class="form-input" placeholder="story" />
            </div>
            <div class="form-row">
              <label class="form-label">Campaign</label>
              <input id="utm-campaign" class="form-input" placeholder="june-promo" />
            </div>
            <div class="form-row">
              <label class="form-label">Content <span class="form-hint">(optional)</span></label>
              <input id="utm-content" class="form-input" placeholder="cta-button" />
            </div>
          </div>
          <div id="utm-preview-wrap" style="display:none" class="form-row">
            <label class="form-label">Full destination URL preview</label>
            <div id="utm-preview" class="utm-preview-box"></div>
          </div>
          <div id="utm-form-error" class="form-error"></div>
          <div class="utm-form-actions">
            <button type="button" class="btn-secondary" onclick="previewUTM()">Preview</button>
            <button type="submit" class="btn-primary" id="utm-submit-btn">Create Link</button>
          </div>
        </form>
      </div>

      <!-- ── Links table ── -->
      <div class="utm-card">
        <h3 class="card-title">All Links</h3>
        ${utmLinks.length === 0
          ? '<div class="empty-state">No links yet. Create your first link above.</div>'
          : `<div class="table-wrap">
              <table class="data-table">
                <thead><tr>
                  <th>Label</th><th>Short URL</th><th>Destination</th>
                  <th>Clicks</th><th>Created</th><th></th>
                </tr></thead>
                <tbody>${utmLinks.map(utmLinkRow).join('')}</tbody>
              </table>
            </div>`
        }
      </div>
    </div>
  `;

  // Live preview update
  ['utm-slug','utm-dest','utm-source','utm-medium','utm-campaign','utm-content'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      if ($('utm-preview-wrap').style.display !== 'none') previewUTM();
    });
  });
}

function utmLinkRow(link) {
  const shortUrl  = `https://a2b.services/a2b/${link.slug}`;
  const date      = fmtDate(link.created_at);
  const destShort = link.destination.length > 38
    ? link.destination.slice(0, 38) + '…'
    : link.destination;
  return `
    <tr>
      <td class="td-bold">${esc(link.label || link.slug)}</td>
      <td>
        <div class="utm-short-row">
          <code class="utm-code">${esc(shortUrl)}</code>
          <button class="btn-copy" onclick="copyUTM('${link.id}')" title="Copy URL">⎘</button>
        </div>
      </td>
      <td class="td-muted" title="${esc(link.destination)}">${esc(destShort)}</td>
      <td><strong>${link.total_clicks || 0}</strong></td>
      <td class="td-muted">${date}</td>
      <td>
        <div class="action-row">
          <button class="btn-view" onclick="showUTMAnalytics('${link.id}')">Analytics</button>
          <button class="btn-danger" onclick="deleteUTMLink('${link.id}')">Delete</button>
        </div>
      </td>
    </tr>`;
}

window.previewUTM = () => {
  const dest     = $('utm-dest')?.value.trim();
  const slug     = $('utm-slug')?.value.trim();
  const previewEl = $('utm-preview');
  if (!dest || !slug || !previewEl) return;

  try {
    const url = new URL(dest);
    const params = { source: 'utm-source', medium: 'utm-medium', campaign: 'utm-campaign', content: 'utm-content' };
    Object.entries(params).forEach(([k, id]) => {
      const v = $(id)?.value.trim();
      if (v) url.searchParams.set(`utm_${k}`, v);
    });
    previewEl.textContent = url.toString();
    $('utm-preview-wrap').style.display = 'block';
  } catch {
    previewEl.textContent = 'Invalid destination URL.';
    $('utm-preview-wrap').style.display = 'block';
  }
};

window.submitUTMForm = async e => {
  e.preventDefault();
  const btn = $('utm-submit-btn');
  const err = $('utm-form-error');
  btn.disabled    = true;
  btn.textContent = 'Creating…';
  err.textContent = '';

  const payload = {
    label:        $('utm-label').value.trim(),
    slug:         $('utm-slug').value.trim().toLowerCase(),
    destination:  $('utm-dest').value.trim(),
    utm_source:   $('utm-source').value.trim()   || null,
    utm_medium:   $('utm-medium').value.trim()   || null,
    utm_campaign: $('utm-campaign').value.trim() || null,
    utm_content:  $('utm-content').value.trim()  || null,
    total_clicks: 0,
  };

  const { error } = await supabase.from('utm_links').insert(payload);

  btn.disabled    = false;
  btn.textContent = 'Create Link';

  if (error) {
    err.textContent = error.code === '23505'
      ? 'Slug already in use — try a different one.'
      : `Error: ${error.message}`;
    return;
  }

  await loadUTM();
};

window.copyUTM = async id => {
  const link = utmMap.get(id);
  if (!link) return;
  const url = `https://a2b.services/a2b/${link.slug}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast('Copied to clipboard');
  } catch {
    prompt('Copy this URL:', url);
  }
};

window.deleteUTMLink = async id => {
  const link = utmMap.get(id);
  if (!confirm(`Delete "${link?.label || link?.slug}"? This also removes all click data.`)) return;
  await supabase.from('utm_links').delete().eq('id', id);
  await loadUTM();
};

window.showUTMAnalytics = async id => {
  openModal('<div class="loading">Loading analytics…</div>');

  const link = utmMap.get(id);
  const { data: clicks } = await supabase
    .from('utm_clicks')
    .select('*')
    .eq('link_id', id)
    .order('created_at', { ascending: false });

  const clickList = clicks || [];
  const shortUrl  = `https://a2b.services/a2b/${link.slug}`;

  // Group by date
  const byDate = {};
  clickList.forEach(c => {
    const day = c.created_at.slice(0, 10);
    byDate[day] = (byDate[day] || 0) + 1;
  });

  openModal(`
    <div class="modal-header">
      <div>
        <span class="modal-source-tag">UTM Analytics</span>
        <h3 class="modal-name">${esc(link.label || link.slug)}</h3>
        <code class="utm-code" style="margin-top:6px;display:inline-block">${esc(shortUrl)}</code>
      </div>
    </div>

    <div class="analytics-stats">
      <div class="stat-box">
        <div class="stat-num">${link.total_clicks || 0}</div>
        <div class="stat-lbl">Total Clicks</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${Object.keys(byDate).length}</div>
        <div class="stat-lbl">Active Days</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${esc(link.utm_source || '—')}</div>
        <div class="stat-lbl">Source</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${esc(link.utm_medium || '—')}</div>
        <div class="stat-lbl">Medium</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${esc(link.utm_campaign || '—')}</div>
        <div class="stat-lbl">Campaign</div>
      </div>
    </div>

    <div class="analytics-dest">
      <span class="td-muted">Destination →</span>
      <a href="${esc(link.destination)}" target="_blank" class="table-link">${esc(link.destination)}</a>
    </div>

    ${clickList.length === 0
      ? '<div class="empty-state" style="margin-top:24px">No clicks recorded yet. Share the link to start tracking.</div>'
      : `
        <h4 class="analytics-sub-title">Clicks by Day</h4>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Clicks</th></tr></thead>
            <tbody>
              ${Object.entries(byDate)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([date, count]) => `
                  <tr>
                    <td>${new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
                    <td><strong>${count}</strong></td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <h4 class="analytics-sub-title" style="margin-top:20px">Recent Clicks (last 30)</h4>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Time</th><th>Referrer</th></tr></thead>
            <tbody>
              ${clickList.slice(0, 30).map(c => `
                <tr>
                  <td class="td-muted">${new Date(c.created_at).toLocaleString('en-IN')}</td>
                  <td>${esc(c.referrer || 'Direct')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`
    }
  `);
};

// ─────────────────────────────────────────
// Modal
// ─────────────────────────────────────────
function openModal(html) {
  $('modal-body').innerHTML = html;
  $('modal-overlay').style.display = 'flex';
}

window.closeModal = () => {
  $('modal-overlay').style.display = 'none';
};

// ─────────────────────────────────────────
// Toast
// ─────────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('toast-show'), 10);
  setTimeout(() => { t.classList.remove('toast-show'); setTimeout(() => t.remove(), 300); }, 2200);
}

// ─────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
