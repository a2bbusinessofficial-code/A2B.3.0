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
 * Navbar background on scroll — adds `.scrolled` class.
 */
function initNavScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 60) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
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

// ===== Initialize everything =====
document.addEventListener('DOMContentLoaded', () => {
  initWordAnimation();
  initMobileMenu();
  initNavScroll();
  initEntranceAnimations();
});
