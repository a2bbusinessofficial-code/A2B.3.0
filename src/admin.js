import { supabase } from './supabase.js';
import { UTM_LINKS } from './utm-links-config.js';

// ─────────────────────────────────────────
// State
// ─────────────────────────────────────────
let contactLeads = [];
let clinicLeads  = [];
const leadsMap   = new Map();

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
// UTM Analytics (links are hardcoded in utm-links-config.js)
// ─────────────────────────────────────────
async function loadUTM() {
  const el = $('section-utm');
  el.innerHTML = '<div class="loading">Loading UTM analytics…</div>';

  const { data: clicks } = await supabase
    .from('utm_clicks')
    .select('slug');

  const countBySlug = {};
  (clicks || []).forEach(c => {
    if (c.slug) countBySlug[c.slug] = (countBySlug[c.slug] || 0) + 1;
  });

  renderUTM(countBySlug);
}

function renderUTM(countBySlug) {
  const el    = $('section-utm');
  const links = Object.entries(UTM_LINKS);

  el.innerHTML = `
    <div class="section-header">
      <div class="section-title-row">
        <h2 class="section-title">UTM Analytics</h2>
        <span class="badge">${links.length} links</span>
      </div>
    </div>

    <div class="utm-card">
      ${links.length === 0
        ? '<div class="empty-state">No links configured. Add entries to utm-links-config.js and redeploy.</div>'
        : `<div class="table-wrap">
            <table class="data-table">
              <thead><tr>
                <th>Label</th><th>Short URL</th><th>Destination</th>
                <th>Source</th><th>Medium</th><th>Campaign</th>
                <th>Clicks</th><th></th>
              </tr></thead>
              <tbody>${links.map(([slug, link]) => utmLinkRow(slug, link, countBySlug[slug] || 0)).join('')}</tbody>
            </table>
          </div>`
      }
    </div>
  `;
}

function utmLinkRow(slug, link, clicks) {
  const shortUrl  = `https://a2b.services/a2b/${slug}`;
  const destShort = link.destination.length > 38
    ? link.destination.slice(0, 38) + '…'
    : link.destination;
  return `
    <tr>
      <td class="td-bold">${esc(link.label || slug)}</td>
      <td>
        <div class="utm-short-row">
          <code class="utm-code">${esc(shortUrl)}</code>
          <button class="btn-copy" onclick="copyUTM('${slug}')" title="Copy URL">⎘</button>
        </div>
      </td>
      <td class="td-muted" title="${esc(link.destination)}">${esc(destShort)}</td>
      <td class="td-muted">${esc(link.utm_source || '—')}</td>
      <td class="td-muted">${esc(link.utm_medium || '—')}</td>
      <td class="td-muted">${esc(link.utm_campaign || '—')}</td>
      <td><strong>${clicks}</strong></td>
      <td>
        <div class="action-row">
          <button class="btn-view" onclick="showUTMAnalytics('${slug}')">Analytics</button>
        </div>
      </td>
    </tr>`;
}

window.copyUTM = async slug => {
  const url = `https://a2b.services/a2b/${slug}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast('Copied to clipboard');
  } catch {
    prompt('Copy this URL:', url);
  }
};

window.showUTMAnalytics = async slug => {
  openModal('<div class="loading">Loading analytics…</div>');

  const link = UTM_LINKS[slug];

  const { data: clicks } = await supabase
    .from('utm_clicks')
    .select('*')
    .eq('slug', slug)
    .order('created_at', { ascending: false });

  const clickList = clicks || [];
  const shortUrl  = `https://a2b.services/a2b/${slug}`;

  const byDate = {};
  clickList.forEach(c => {
    const day = c.created_at.slice(0, 10);
    byDate[day] = (byDate[day] || 0) + 1;
  });

  openModal(`
    <div class="modal-header">
      <div>
        <span class="modal-source-tag">UTM Analytics</span>
        <h3 class="modal-name">${esc(link?.label || slug)}</h3>
        <code class="utm-code" style="margin-top:6px;display:inline-block">${esc(shortUrl)}</code>
      </div>
    </div>

    <div class="analytics-stats">
      <div class="stat-box">
        <div class="stat-num">${clickList.length}</div>
        <div class="stat-lbl">Total Clicks</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${Object.keys(byDate).length}</div>
        <div class="stat-lbl">Active Days</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${esc(link?.utm_source || '—')}</div>
        <div class="stat-lbl">Source</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${esc(link?.utm_medium || '—')}</div>
        <div class="stat-lbl">Medium</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${esc(link?.utm_campaign || '—')}</div>
        <div class="stat-lbl">Campaign</div>
      </div>
    </div>

    <div class="analytics-dest">
      <span class="td-muted">Destination →</span>
      <a href="${esc(link?.destination)}" target="_blank" class="table-link">${esc(link?.destination)}</a>
    </div>

    ${clickList.length === 0
      ? '<div class="empty-state" style="margin-top:24px">No clicks recorded yet.</div>'
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
