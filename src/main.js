
/* ==============================================
   A2B — Main JavaScript
   Hero word animation, mobile menu, scroll effects
   ============================================== */

/**
 * Animated word cycling in the hero heading.
 * Cycles through: Businesses → Operations → Teams → Workflows → Enterprises
 * with a smooth fade-up / fade-out transition.
 */
function initWordAnimation() {
  const words = document.querySelectorAll('.hero-word');
  if (!words.length) return;

  let current = 0;
  const total = words.length;
  const holdDuration = 2400;       // ms each word stays visible
  const transitionDuration = 550;  // ms for the CSS transition

  setInterval(() => {
    const prev = current;
    const next = (current + 1) % total;

    // Exit current word (slides up + fades out)
    words[prev].classList.remove('active');
    words[prev].classList.add('exit');

    // After the exit transition, bring in the next word
    setTimeout(() => {
      words[prev].classList.remove('exit');
      words[next].classList.add('active');
    }, transitionDuration);

    current = next;
  }, holdDuration + transitionDuration);
}

/**
 * Mobile hamburger menu toggle.
 */
function initMobileMenu() {
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('active');
    navLinks.classList.toggle('mobile-open');
    document.body.classList.toggle('no-scroll', isOpen);
    // Collapse all sub-menus when closing the hamburger
    if (!isOpen) {
      navLinks.querySelectorAll('.nav-dropdown-wrapper').forEach(w => w.classList.remove('open'));
    }
  });

  // Close menu when a nav link is clicked (but not dropdown toggle buttons on mobile)
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (link.classList.contains('nav-dropdown-btn') && window.innerWidth <= 768) return;
      hamburger.classList.remove('active');
      navLinks.classList.remove('mobile-open');
      document.body.classList.remove('no-scroll');
    });
  });

  // Desktop: click navigates to section page; mobile: toggle dropdown
  navLinks.querySelectorAll('.nav-dropdown-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth > 768) {
        const wrapper = btn.closest('.nav-dropdown-wrapper');
        if (wrapper?.id === 'servicesDropdown') window.location.href = '/services/';
        else if (wrapper?.id === 'resourcesDropdown') window.location.href = '/blog';
        return;
      }
      const wrapper = btn.closest('.nav-dropdown-wrapper');
      if (!wrapper) return;
      navLinks.querySelectorAll('.nav-dropdown-wrapper').forEach(w => {
        if (w !== wrapper) w.classList.remove('open');
      });
      wrapper.classList.toggle('open');
    });
  });
}

/**
 * Resources dropdown dynamic content — scoped to #resourcesDropdown.
 */
function initDropdowns() {
  const wrapper = document.getElementById('resourcesDropdown');
  if (!wrapper) return;

  const links = wrapper.querySelectorAll('.mega-link');
  const titleEl = wrapper.querySelector('.mega-title');
  const descEl = wrapper.querySelector('.mega-desc');

  if (!links.length || !titleEl || !descEl) return;

  const defaultTitle = titleEl.textContent;
  const defaultDesc = descEl.textContent;

  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const title = link.getAttribute('data-title');
      const desc = link.getAttribute('data-desc');
      if (title) titleEl.textContent = title;
      if (desc) descEl.textContent = desc;
    });
  });

  const megaMenuLeft = wrapper.querySelector('.mega-menu-left');
  if (megaMenuLeft) {
    megaMenuLeft.addEventListener('mouseleave', () => {
      titleEl.textContent = defaultTitle;
      descEl.textContent = defaultDesc;
    });
  }
}

/**
 * Services dropdown — category list with dynamic subcategory panel.
 */
function initServiceDropdown() {
  const wrapper = document.getElementById('servicesDropdown');
  if (!wrapper) return;

  const svcLinks = wrapper.querySelectorAll('.svc-link');
  const titleEl  = wrapper.querySelector('.svc-mega-title');
  const descEl   = wrapper.querySelector('.svc-mega-desc');
  const subList  = wrapper.querySelector('.svc-sub-list');

  if (!svcLinks.length || !titleEl) return;

  const defaultTitle = titleEl.textContent;
  const defaultDesc  = descEl ? descEl.textContent : '';

  svcLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      if (link.dataset.title) titleEl.textContent = link.dataset.title;
      if (descEl && link.dataset.desc) descEl.textContent = link.dataset.desc;
      if (subList && link.dataset.subs) {
        const items = link.dataset.subs.split(',');
        subList.innerHTML = items.map(s =>
          `<li class="svc-sub-item"><span class="svc-sub-dot"></span>${s.trim()}</li>`
        ).join('');
        subList.style.display = '';
      }
    });
  });

  const svcLeft = wrapper.querySelector('.svc-mega-left');
  if (svcLeft) {
    svcLeft.addEventListener('mouseleave', () => {
      titleEl.textContent = defaultTitle;
      if (descEl) descEl.textContent = defaultDesc;
      if (subList) subList.style.display = 'none';
    });
  }
}

/**
 * Navbar background on scroll and dynamic color adapting based on section background.
 */
function initNavScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        // Scrolled styling
        if (window.scrollY > 60) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }

        // Dynamic light/dark mode adapting
        const lightSections = document.querySelectorAll('.home-stats-section, .home-svc-section, .home-cs-section, .home-testimonials-section, .cbr-light-section, .about-hero-light, .about-content, .about-mission-section, .about-vision-section, .about-cta-section');
        let isOverLightSection = false;
        const checkY = 40; // check color roughly halfway down the navbar

        lightSections.forEach(sec => {
          const rect = sec.getBoundingClientRect();
          if (rect.top <= checkY && rect.bottom >= checkY) {
            isOverLightSection = true;
          }
        });

        if (isOverLightSection) {
          navbar.classList.add('light-mode');
        } else {
          navbar.classList.remove('light-mode');
        }

        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  // Trigger once on load to set initial state
  onScroll();
}

/**
 * Smooth entrance — ensures animations play when page is ready.
 */
function initEntranceAnimations() {
  // Small delay to ensure fonts are loaded before animations start
  document.fonts.ready.then(() => {
    document.body.classList.add('fonts-loaded');
  });
}

/**
 * Dark theme tab switching — shows/hides content cards.
 */
function initDarkTabs() {
  const tabsContainer = document.getElementById('darkTabs');
  if (!tabsContainer) return;

  const tabs = tabsContainer.querySelectorAll('.dark-tab');
  const cards = document.querySelectorAll('.dark-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active card
      cards.forEach(card => {
        card.classList.remove('active');
        if (card.dataset.card === target) {
          card.classList.add('active');
        }
      });
    });
  });
}

/**
 * Process Accordion — toggles the process cards in the white section.
 */
function initProcessAccordion() {
  const items = document.querySelectorAll('.process-item');
  if (!items.length) return;

  items.forEach(item => {
    const header = item.querySelector('.process-item-header');
    header.addEventListener('click', () => {
      const isExpanded = item.classList.contains('expanded');
      
      // Close all items
      items.forEach(i => i.classList.remove('expanded'));
      
      // Open the clicked one if it wasn't already open
      if (!isExpanded) {
        item.classList.add('expanded');
      }
    });
  });
}

/**
 * Case Study Filtering
 */
function initCaseStudyFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.cs-row-card');

  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      // Show/Hide cards based on filter
      cards.forEach(card => {
        if (filterValue === 'all') {
          card.classList.remove('hidden');
        } else {
          const industry = card.getAttribute('data-industry');
          if (industry === filterValue) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        }
      });
    });
  });
}

// ===== Testimonial: independent video carousel (left) + written carousel (right) =====
function initTestimonialCarousels() {
  // ── Video panel ──
  const vpanel = document.getElementById('tVideoPanel');
  if (vpanel) {
    const track   = vpanel.querySelector('.t-vp-track');
    const cards   = Array.from(vpanel.querySelectorAll('.t-vp-card'));
    const dotsEl  = vpanel.querySelector('.t-dots');
    const prevBtn = vpanel.querySelector('.t-prev');
    const nextBtn = vpanel.querySelector('.t-next');
    const total   = cards.length;
    let page      = 0;

    if (dotsEl) {
      dotsEl.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = 't-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goVP(i));
        dotsEl.appendChild(dot);
      }
    }

    function goVP(p) {
      page = Math.max(0, Math.min(p, total - 1));
      track.style.transform = `translateX(-${page * 100}%)`;
      dotsEl && dotsEl.querySelectorAll('.t-dot').forEach((d, i) =>
        d.classList.toggle('active', i === page));
      if (prevBtn) prevBtn.disabled = page === 0;
      if (nextBtn) nextBtn.disabled = page >= total - 1;
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goVP(page - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goVP(page + 1));
    goVP(0);

    // Play button logic
    cards.forEach(card => {
      const video   = card.querySelector('.t-cv-video');
      const playBtn = card.querySelector('.t-play-btn');
      if (!video || !playBtn) return;
      playBtn.addEventListener('click', () => {
        video.play();
        playBtn.classList.add('playing');
      });
      video.addEventListener('pause', () => playBtn.classList.remove('playing'));
      video.addEventListener('ended', () => playBtn.classList.remove('playing'));
    });
  }

  // ── Written panel ──
  const wpanel = document.getElementById('tWrittenPanel');
  if (wpanel) {
    const track   = wpanel.querySelector('.t-wp-track');
    const cards   = Array.from(wpanel.querySelectorAll('.t-wp-card'));
    const dotsEl  = wpanel.querySelector('.t-wp-dots');
    const prevBtn = wpanel.querySelector('.t-wp-prev');
    const nextBtn = wpanel.querySelector('.t-wp-next');
    const total   = cards.length;
    let page      = 0;

    if (dotsEl) {
      dotsEl.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = 't-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goWP(i));
        dotsEl.appendChild(dot);
      }
    }

    function goWP(p) {
      page = Math.max(0, Math.min(p, total - 1));
      track.style.transform = `translateX(-${page * 100}%)`;
      dotsEl && dotsEl.querySelectorAll('.t-dot').forEach((d, i) =>
        d.classList.toggle('active', i === page));
      if (prevBtn) prevBtn.disabled = page === 0;
      if (nextBtn) nextBtn.disabled = page >= total - 1;
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goWP(page - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goWP(page + 1));
    goWP(0);
  }
}

/**
 * Contact form — saves to Supabase and sends email via Web3Forms simultaneously.
 */
async function initContactForm() {
  const form = document.getElementById('contactFormV2');
  if (!form) return;

  const { supabase } = await import('./supabase.js');
  const submitBtn = document.getElementById('contactSubmitBtn');
  const labelEl = submitBtn.querySelector('.btn-label');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    labelEl.textContent = 'Sending…';
    submitBtn.disabled = true;

    // Build a readable subject line for the email
    const subject = `New Contact: ${data.first_name} ${data.last_name} — ${data.company_name}`;

    // 1. Save to Supabase — success is gated on this
    const { error: dbError } = await supabase
      .from('form_submissions')
      .insert({ source: 'contact_form', data });

    if (dbError) {
      console.error('Supabase error:', dbError);
      labelEl.textContent = 'Error — try again';
      submitBtn.disabled = false;
      return;
    }

    // 2. Fire Web3Forms in the background (non-blocking)
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
        subject,
        from_name: `${data.first_name} ${data.last_name}`,
        ...data,
      }),
    }).catch(err => console.error('Web3Forms error:', err));

    labelEl.textContent = 'Sent!';
    form.reset();
    setTimeout(() => {
      labelEl.textContent = "Let's Talk";
      submitBtn.disabled = false;
    }, 3000);
  });
}

/**
 * Clinic Fit Check Form — saves to Supabase and sends email via Web3Forms.
 */
async function initClinicFitCheckForm() {
  const form = document.getElementById('clinicFitCheckForm');
  if (!form) return;

  const { supabase } = await import('./supabase.js');
  const submitBtn = document.getElementById('clinicFitCheckBtn');
  const labelEl = submitBtn.querySelector('.btn-label');
  const successEl = document.getElementById('clinicFitCheckSuccess');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    labelEl.textContent = 'Sending…';
    submitBtn.disabled = true;

    const subject = `Clinic Fit Check: ${data.contact_name} — ${data.website}`;

    const { error: dbError } = await supabase
      .from('form_submissions')
      .insert({ source: 'clinic_fit_check', data });

    if (dbError) {
      console.error('Supabase error:', dbError);
      labelEl.textContent = 'Error — try again';
      submitBtn.disabled = false;
      return;
    }

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
        subject,
        from_name: data.contact_name,
        ...data,
      }),
    }).catch(err => console.error('Web3Forms error:', err));

    form.style.display = 'none';
    successEl.style.display = 'block';
  });
}

/**
 * Custom dropdowns for the Clinic fit-check form (replaces native <select>).
 * The chosen value is written into a hidden input so the existing submit
 * handler picks it up via FormData. Required selects are validated here,
 * before the main submit handler runs.
 */
function initCbrSelects() {
  const selects = document.querySelectorAll('.cv2-select');
  if (!selects.length) return;

  // Portal a menu to <body> so it escapes any parent clip-path / stacking context.
  function openMenu(select) {
    const trigger = select.querySelector('.cv2-select-trigger');
    const menu    = select.querySelector('.cv2-select-menu');
    const rect    = trigger.getBoundingClientRect();

    select._portalMenu = menu;
    document.body.appendChild(menu);

    Object.assign(menu.style, {
      position:   'fixed',
      left:       rect.left + 'px',
      right:      'auto',
      width:      rect.width + 'px',
      top:        (rect.bottom + 6) + 'px',
      bottom:     'auto',
      opacity:    '1',
      visibility: 'visible',
      transform:  'translateY(0)',
      transition: 'none',
      zIndex:     '99999',
    });
  }

  function closeMenu(select) {
    const menu = select._portalMenu;
    if (!menu) return;
    select.appendChild(menu);  // return to original parent
    menu.style.cssText = '';
    select._portalMenu = null;
  }

  function syncPosition(select) {
    const menu = select._portalMenu;
    if (!menu) return;
    const trigger = select.querySelector('.cv2-select-trigger');
    const rect    = trigger.getBoundingClientRect();
    menu.style.left  = rect.left + 'px';
    menu.style.top   = (rect.bottom + 6) + 'px';
    menu.style.width = rect.width + 'px';
  }

  const closeAll = (except) => {
    selects.forEach(s => {
      if (s !== except) { s.classList.remove('open'); closeMenu(s); }
    });
  };

  selects.forEach(select => {
    const trigger = select.querySelector('.cv2-select-trigger');
    const valueEl = select.querySelector('.cv2-select-value');
    const input   = select.querySelector('input[type="hidden"]');
    const options = select.querySelectorAll('.cv2-select-option');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = select.classList.contains('open');
      closeAll(select);
      if (!wasOpen) {
        select.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        openMenu(select);
      } else {
        select.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    options.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        options.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        input.value = opt.dataset.value;
        valueEl.textContent = opt.textContent;
        valueEl.classList.remove('cv2-placeholder');
        select.classList.remove('open', 'invalid');
        closeMenu(select);
        trigger.setAttribute('aria-expanded', 'false');
      });
    });
  });

  const syncAll = () => selects.forEach(s => { if (s.classList.contains('open')) syncPosition(s); });
  window.addEventListener('scroll', syncAll, { passive: true });
  window.addEventListener('resize', syncAll);

  document.addEventListener('click', () => closeAll(null));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(null); });

  // Validate required custom selects before the form's main submit handler.
  const form = document.getElementById('clinicFitCheckForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      let firstInvalid = null;
      selects.forEach(select => {
        if (select.dataset.required !== 'true') return;
        const input = select.querySelector('input[type="hidden"]');
        if (!input.value) {
          select.classList.add('invalid');
          if (!firstInvalid) firstInvalid = select;
        }
      });
      if (firstInvalid) {
        e.preventDefault();
        e.stopImmediatePropagation();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
}

/**
 * Dormant Lead Recovery FAQ accordion.
 */
function initCbrFaq() {
  const items = document.querySelectorAll('.cbr-faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn = item.querySelector('.cbr-faq-question');
    if (btn) {
      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        items.forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    }
  });

  const seeMoreBtn = document.getElementById('faqSeeMoreBtn');
  if (seeMoreBtn) {
    seeMoreBtn.addEventListener('click', () => {
      const faqList = document.querySelector('.cbr-faq-list');
      if (faqList) {
        const isExpanded = faqList.classList.contains('faq-expanded');
        const label = seeMoreBtn.querySelector('.btn-label');
        const icon = seeMoreBtn.querySelector('.btn-icon svg');

        if (isExpanded) {
          faqList.classList.remove('faq-expanded');
          if (label) label.textContent = 'See more questions';
          if (icon) icon.innerHTML = '<path d="M6 9l6 6 6-6"/>';
          
          // Scroll back up slightly so the user doesn't lose context
          const faqSection = document.querySelector('.home-faq-section');
          if (faqSection) {
            const y = faqSection.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        } else {
          faqList.classList.add('faq-expanded');
          if (label) label.textContent = 'Show less';
          if (icon) icon.innerHTML = '<path d="M18 15l-6-6-6 6"/>';
        }
      }
    });
  }
}

/**
 * Free Consultancy — circular rotating-text button.
 * Peeks from the bottom-right corner; fully reveals on hover.
 * Clicking links to the contact page.
 */
function initFreeConsultationButton() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('contact') || path.includes('admin')) return;

  const circle = document.createElement('a');
  circle.href = '/contact';
  circle.className = 'fcb-circle';
  circle.setAttribute('aria-label', 'Book your free strategic call');

  // Unique ID so multiple pages don't clash on the same textPath
  const pathId = 'fcbTextPath';

  circle.innerHTML = `
    <svg class="fcb-ring" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id="${pathId}"
          d="M 100,100 m -72,0 a 72,72 0 1,1 144,0 a 72,72 0 1,1 -144,0"/>
      </defs>
      <text class="fcb-ring-text fcb-desktop-text">
        <textPath href="#${pathId}" textLength="440">
          FREE STRATEGIC CALL &bull; FREE STRATEGIC CALL &bull;
        </textPath>
      </text>
      <text class="fcb-ring-text fcb-mobile-text">
        <textPath href="#${pathId}" textLength="445">
          FREE STRATEGIC CALL &bull; 
        </textPath>
      </text>
    </svg>
    <span class="fcb-circle-inner" aria-hidden="true">
      <svg class="fcb-arrow-svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </span>
  `;

  document.body.appendChild(circle);
}


async function initHeroAnimation() {
  const treesEl = document.getElementById('heroTrees');
  if (!treesEl) return;

  const [lottie, resp] = await Promise.all([
    import('lottie-web').then(m => m.default),
    fetch('/assets/hero/heroanime.json').then(r => r.json()),
  ]);

  const treesData = { ...resp, layers: resp.layers.filter(l => l.nm !== 'balon.png') };
  lottie.loadAnimation({ container: treesEl, renderer: 'svg', loop: true, autoplay: true, animationData: treesData });
}

/**
 * Footer accordion — collapses link columns on mobile.
 * Wraps each column's <a> links in a .footer-col-links div and
 * toggles max-height via the .open class on the column.
 */
function initFooterAccordion() {
  document.querySelectorAll('.footer-link-col').forEach(col => {
    const title = col.querySelector('.footer-col-title');
    const links = Array.from(col.querySelectorAll('a'));
    if (!title || !links.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'footer-col-links';
    links.forEach(a => wrap.appendChild(a));
    col.appendChild(wrap);

    title.addEventListener('click', () => {
      if (window.innerWidth > 768) return;
      col.classList.toggle('open');
    });
  });
}

/**
 * Team Section Hover Animation
 * Maps mouse position to determine whether to expand left or right.
 */
function initTeamHover() {
  const row = document.querySelector('.team-row');
  if (!row) return;

  const members = row.querySelectorAll('.team-member');
  if (!members.length) return;

  let activeClass = '';

  members.forEach((member, index) => {
    member.addEventListener('mouseenter', (e) => {
      if (window.innerWidth <= 768) return; // Disable on mobile
      
      const rect = row.getBoundingClientRect();
      const mouseX = e.clientX;
      const midpoint = rect.left + (rect.width / 2);
      
      const direction = mouseX < midpoint ? 'left' : 'right';
      const newClass = `has-expanded-${index + 1}-${direction}`;

      // Clean up previous classes
      if (activeClass) row.classList.remove(activeClass);
      members.forEach(m => m.classList.remove('is-expanded'));

      // Add new
      activeClass = newClass;
      row.classList.add(activeClass);
      member.classList.add('is-expanded');
    });
  });

  row.addEventListener('mouseleave', () => {
    if (activeClass) row.classList.remove(activeClass);
    activeClass = '';
    members.forEach(m => m.classList.remove('is-expanded'));
  });
}

// ===== Initialize everything =====
document.addEventListener('DOMContentLoaded', () => {
  initWordAnimation();
  initMobileMenu();
  initDropdowns();
  initServiceDropdown();
  initNavScroll();
  initEntranceAnimations();
  initDarkTabs();
  initProcessAccordion();
  initCaseStudyFilters();
  initTestimonialCarousels();
  initContactForm();
  initCbrSelects();
  initClinicFitCheckForm();
  initCbrFaq();
  initFreeConsultationButton();
  initHeroAnimation();
  initFooterAccordion();
  initTeamHover();
});


/* Scroll Progress Bar Initialization */
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const progressBar = document.createElement('div');
    progressBar.id = 'scrollProgressBar';
    navbar.appendChild(progressBar);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {

      const scrollPx = document.documentElement.scrollTop || document.body.scrollTop;
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (winHeightPx > 0) {
        const scrolled = (scrollPx / winHeightPx) * 100;
        progressBar.style.width = scrolled + '%';
      }
    
          ticking = false;
        });
        ticking = true;
      }
    });
  }
});
