(function () {
  var CONSENT_KEY = "a2b_cookie_consent";
  var TWO_WEEKS   = 14 * 24 * 60 * 60 * 1000;
  var GA_ID       = "G-Z3ML7DV9EG";

  function saveConsent(value) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ value: value, ts: Date.now() }));
  }

  function getConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data.value === "accepted") return "accepted";
      if (data.value === "rejected" && (Date.now() - data.ts) < TWO_WEEKS) return "rejected";
      localStorage.removeItem(CONSENT_KEY);
      return null;
    } catch (e) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }
  }

  function loadGA() {
    var s = document.createElement("script");
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    s.async = true;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_ID);
  }

  function showBanner() {
    if (document.getElementById("a2b-cookie-banner")) return;

    var card = document.createElement("div");
    card.id = "a2b-cookie-banner";
    card.style.cssText =
      "position:fixed;bottom:32px;left:24px;z-index:99999;" +
      "width:320px;max-width:calc(100vw - 48px);" +
      "background:#111111;" +
      "border:1px solid rgba(255,255,255,0.08);" +
      "border-radius:0;" +
      "box-shadow:0 24px 60px rgba(0,0,0,0.6);" +
      "padding:28px 28px;" +
      "font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;" +
      "opacity:0;transform:scale(0.88) translateY(12px);" +
      "transition:opacity 0.22s ease,transform 0.22s cubic-bezier(0.16,1,0.3,1);";

    card.innerHTML =
      "<div style=\"font-size:15px;font-weight:600;color:#ffffff;letter-spacing:0.2px;margin-bottom:12px;\">Quick question</div>" +
      "<div style=\"font-size:13px;color:rgba(255,255,255,0.55);line-height:1.7;margin-bottom:22px;\">" +
        "We use basic analytics to see what's working. No ad tracking, no data selling, no third-party tracking. " +
        "<a href=\"/cookies\" style=\"color:#00DF81;border-bottom:1px solid rgba(0, 223, 129,0.35);padding-bottom:1px;text-decoration:none;\">Cookie Policy</a>" +
      "</div>" +
      "<div style=\"display:flex;gap:10px;\">" +
        "<button id=\"a2b-cookie-reject\" style=\"flex:1;background:transparent;" +
          "border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.4);" +
          "padding:11px 12px;border-radius:0;cursor:pointer!important;font-size:12px;" +
          "font-family:Inter,sans-serif;font-weight:500;letter-spacing:0.2px;\">No thanks</button>" +
        "<button id=\"a2b-cookie-accept\" style=\"flex:2;background:#00DF81;border:none;color:#000000;" +
          "padding:11px 12px;border-radius:0;cursor:pointer!important;font-size:12px;" +
          "font-family:Inter,sans-serif;font-weight:600;letter-spacing:0.2px;\">I'll help out</button>" +
      "</div>";

    document.body.appendChild(card);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        card.style.opacity = "1";
        card.style.transform = "scale(1) translateY(0)";
      });
    });

    function dismiss(cb) {
      card.style.opacity = "0";
      card.style.transform = "scale(0.88) translateY(12px)";
      setTimeout(function () { card.remove(); if (cb) cb(); }, 220);
    }

    document.getElementById("a2b-cookie-accept").onclick = function () {
      saveConsent("accepted");
      dismiss(loadGA);
    };
    document.getElementById("a2b-cookie-reject").onclick = function () {
      saveConsent("rejected");
      dismiss();
    };
  }

  var consent = getConsent();
  if (consent === "accepted") {
    loadGA();
  } else if (!consent) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", showBanner);
    } else {
      showBanner();
    }
  }
})();
