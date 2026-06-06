import './style.css';

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
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('mobile-open');
      document.body.classList.remove('no-scroll');
    });
  });
}

/**
 * Navbar Dropdown dynamic content
 */
function initDropdowns() {
  const links = document.querySelectorAll('.mega-link');
  const titleEl = document.querySelector('.mega-title');
  const descEl = document.querySelector('.mega-desc');

  if (!links.length || !titleEl || !descEl) return;

  // Store the default content
  const defaultTitle = titleEl.textContent;
  const defaultDesc = descEl.textContent;

  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const title = link.getAttribute('data-title');
      const desc = link.getAttribute('data-desc');
      if (title) titleEl.textContent = title;
      if (desc) descEl.textContent = desc;
    });

    // Optionally revert to default when leaving the links container
    // or just leave the last hovered state active.
    // Leaving it active is usually smoother for mega menus.
  });
  
  const megaMenuLeft = document.querySelector('.mega-menu-left');
  if (megaMenuLeft) {
    megaMenuLeft.addEventListener('mouseleave', () => {
      titleEl.textContent = defaultTitle;
      descEl.textContent = defaultDesc;
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
        const lightSections = document.querySelectorAll('.how-we-work-section, .new-white-section');
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

// ===== Initialize everything =====
document.addEventListener('DOMContentLoaded', () => {
  initWordAnimation();
  initMobileMenu();
  initDropdowns();
  initNavScroll();
  initEntranceAnimations();
  initDarkTabs();
  initProcessAccordion();
});

