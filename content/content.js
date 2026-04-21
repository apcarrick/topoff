// ============================================
// Topoff — Content Script v3
//
// Changes:
//   - Auto-injects badges on page load (no click needed)
//   - Supports <select> dropdowns (disability, veteran, ethnicity)
//   - Retries after short delays for SPA/React pages that render late
//   - EEOC field detection rules added
// ============================================

const FIELD_RULES = [
  {
    profileKey: "linkedin",
    label: "LinkedIn URL",
    type: "input",
    keywords: [
      "linkedin", "linked-in", "linked_in", "li_url", "li-url", "li_profile",
      "linkedin_url", "linkedin-url", "linkedin_profile", "linkedin_link",
      "social_url", "social-url", "social_profile", "profile_url", "profile-url",
      "social link", "social media url",
    ],
  },
  {
    profileKey: "github",
    label: "GitHub URL",
    type: "input",
    keywords: [
      "github", "git-hub", "git_hub", "github_url", "github-url",
      "github_profile", "gh_url", "gh-url",
    ],
  },
  {
    profileKey: "portfolio",
    label: "Portfolio / Website",
    type: "input",
    keywords: [
      "portfolio", "personal_url", "personal-url", "personal site",
      "personal website", "website", "web_site", "web-site",
      "homepage", "home_page", "personal_link", "your website",
    ],
  },
  {
    profileKey: "workAuth",
    label: "Work Authorization",
    type: "input",
    keywords: [
      "work auth", "work_auth", "workauth", "authorized to work",
      "authorization", "visa", "sponsorship", "work visa",
      "eligible to work", "legally authorized", "right to work",
      "employment eligibility", "work permit",
    ],
  },
  {
    profileKey: "salary",
    label: "Desired Salary",
    type: "input",
    keywords: [
      "salary", "compensation", "comp", "expected pay", "desired salary",
      "salary expectation", "pay expectation", "salary requirement",
      "expected salary", "desired compensation", "total comp",
    ],
  },
  {
    profileKey: "pronouns",
    label: "Pronouns",
    type: "input",
    keywords: ["pronoun", "gender pronoun", "preferred pronoun"],
  },
  {
    profileKey: "phone",
    label: "Phone",
    type: "input",
    keywords: [
      "phone", "telephone", "mobile", "cell",
      "phone_number", "phone-number", "mobile_number",
    ],
  },

  // ── EEOC / Demographic dropdowns ──────────────────────────
  {
    profileKey: "disability",
    label: "Disability Status",
    type: "select",
    keywords: [
      "disability", "disabled", "ada", "disability status",
      "have a disability", "physical or mental",
    ],
  },
  {
    profileKey: "veteran",
    label: "Veteran Status",
    type: "select",
    keywords: [
      "veteran", "military", "protected veteran", "veteran status",
      "military status", "armed forces", "military service",
    ],
  },
  {
    profileKey: "ethnicity",
    label: "Ethnicity / Race",
    type: "select",
    keywords: [
      "ethnicity", "ethnic", "race", "racial", "ethnic group",
      "race/ethnicity", "race or ethnicity", "national origin",
    ],
  },
  {
    profileKey: "gender",
    label: "Gender",
    type: "select",
    keywords: [
      "gender", "sex", "gender identity", "male or female",
    ],
  },
];

// ============================================
// STATE
// ============================================
let currentProfile = {};
let injectedBadges = [];

// ============================================
// SIGNAL EXTRACTION
// ============================================
function getFieldSignals(el) {
  const parts = [];

  if (el.name)        parts.push(el.name);
  if (el.id)          parts.push(el.id);
  if (el.className)   parts.push(el.className);

  const placeholder = el.getAttribute("placeholder");
  if (placeholder) parts.push(placeholder);

  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) parts.push(ariaLabel);

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) parts.push(labelEl.textContent);
  }

  Array.from(el.attributes).forEach((attr) => {
    if (attr.name.startsWith("data-")) parts.push(attr.value);
  });

  if (el.id) {
    try {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) parts.push(label.textContent);
    } catch (e) {}
  }

  const parentLabel = el.closest("label");
  if (parentLabel) parts.push(parentLabel.textContent);

  let ancestor = el.parentElement;
  for (let i = 0; i < 4; i++) {
    if (!ancestor) break;
    const candidate = ancestor.querySelector(
      "label, [class*='label'], [class*='field-name'], [class*='form-label'], legend, [class*='field-label']"
    );
    if (candidate && candidate !== el && !candidate.contains(el)) {
      parts.push(candidate.textContent);
      break;
    }
    ancestor = ancestor.parentElement;
  }

  const prev = el.previousElementSibling;
  if (prev) parts.push(prev.textContent);

  return parts.join(" ").toLowerCase();
}

// ============================================
// SCAN: find matching inputs AND selects
// ============================================
function scanForMatches() {
  const inputs = Array.from(
    document.querySelectorAll(
      'input[type="text"], input[type="url"], input[type="tel"], ' +
      'input[type="email"], input:not([type]), textarea'
    )
  ).filter((el) => !el.disabled && !el.readOnly && el.offsetParent !== null);

  const selects = Array.from(
    document.querySelectorAll("select")
  ).filter((el) => !el.disabled && el.offsetParent !== null);

  const matches = [];
  const seen = new Set();

  FIELD_RULES.forEach((rule) => {
    const pool = rule.type === "select" ? selects : inputs;

    pool.forEach((el) => {
      const key = `${el.name}|${el.id}|${rule.profileKey}`;
      if (seen.has(key)) return;

      const signals = getFieldSignals(el);
      const isMatch = rule.keywords.some((kw) => signals.includes(kw.toLowerCase()));

      if (isMatch) {
        seen.add(key);
        matches.push({ el, rule });
      }
    });
  });

  return matches;
}

// ============================================
// FILL: text input
// ============================================
function fillInput(input, value) {
  input.focus();
  input.value = value;
  ["input", "change"].forEach((t) =>
    input.dispatchEvent(new Event(t, { bubbles: true }))
  );
  input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));

  input.style.transition = "background 0.3s, outline 0.3s";
  input.style.background = "#022c22";
  input.style.outline = "1.5px solid #34d399";
  setTimeout(() => {
    input.style.background = "";
    input.style.outline = "";
  }, 1500);
}

// ============================================
// FILL: select dropdown
// Fuzzy-matches saved preference text against available options
// ============================================
function fillSelect(select, preferenceText) {
  if (!preferenceText) return false;

  const pref = preferenceText.toLowerCase();
  const options = Array.from(select.options);

  // Skip placeholder/empty options
  const candidates = options.filter((o) => o.value && o.value !== "");

  // Score each option by word overlap with the saved preference
  const prefWords = pref.split(/\s+/).filter((w) => w.length > 2);

  let bestOption = null;
  let bestScore = 0;

  candidates.forEach((opt) => {
    const optText = opt.text.toLowerCase();
    // Exact substring match wins immediately
    if (optText.includes(pref) || pref.includes(optText)) {
      bestOption = opt;
      bestScore = Infinity;
      return;
    }
    const score = prefWords.filter((w) => optText.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      bestOption = opt;
    }
  });

  if (bestOption && bestScore > 0) {
    select.value = bestOption.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    select.dispatchEvent(new Event("input",  { bubbles: true }));

    select.style.transition = "outline 0.3s";
    select.style.outline = "1.5px solid #34d399";
    setTimeout(() => { select.style.outline = ""; }, 1500);
    return true;
  }
  return false;
}

// ============================================
// FILL: route to correct handler by type
// ============================================
function fillField(el, rule, profile) {
  const value = profile[rule.profileKey];
  if (!value) return false;

  if (rule.type === "select") {
    return fillSelect(el, value);
  } else {
    fillInput(el, value);
    return true;
  }
}

// ============================================
// BADGE STYLESHEET
// ============================================
function ensureStylesheet() {
  if (document.getElementById("topoff-styles")) return;
  const style = document.createElement("style");
  style.id = "topoff-styles";
  style.textContent = `
    .topoff-wrapper { position: relative !important; }

    .topoff-badge {
      position: absolute;
      top: 50%; right: 6px;
      transform: translateY(-50%);
      z-index: 2147483647;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 7px 2px 5px;
      background: #0f1117;
      border: 1.5px solid #d63a2f;
      border-radius: 20px;
      color: #d63a2f;
      font-size: 11px;
      font-weight: 700;
      font-family: 'Segoe UI', system-ui, sans-serif;
      cursor: pointer;
      white-space: nowrap;
      line-height: 1.4;
      transition: background 0.15s, color 0.15s, box-shadow 0.15s;
      user-select: none;
      pointer-events: all;
    }

    .topoff-badge:hover {
      background: #d63a2f;
      color: #fff;
      box-shadow: 0 0 10px 2px rgba(214,58,47,0.3);
    }

    .topoff-badge.to-filled {
      border-color: #34d399;
      color: #34d399;
      background: #022c22;
    }

    .topoff-badge.to-empty {
      border-color: #6b7280;
      color: #6b7280;
    }

    .topoff-badge.to-empty:hover {
      background: #1a1d27;
      box-shadow: none;
    }

    .topoff-tooltip {
      position: absolute;
      bottom: calc(100% + 7px);
      right: 0;
      background: #1a1d27;
      border: 1px solid #2a2d3a;
      border-radius: 8px;
      color: #e8eaf0;
      font-size: 11px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      padding: 8px 11px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 2147483647;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .topoff-badge:hover .topoff-tooltip { opacity: 1; }
    .to-tt-label { display: block; color: #6b7280; font-size: 10px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
    .to-tt-value { display: block; color: #d63a2f; font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
    .to-tt-empty { color: #6b7280; font-style: italic; }
    .to-tt-hint  { display: block; color: #4b5563; font-size: 10px; margin-top: 4px; }
  `;
  document.head.appendChild(style);
}

function wrapElement(el) {
  if (el.parentElement?.classList.contains("topoff-wrapper")) {
    return el.parentElement;
  }
  const wrapper = document.createElement("div");
  wrapper.className = "topoff-wrapper";
  const computed = window.getComputedStyle(el);
  wrapper.style.display = computed.display === "inline" ? "inline-block" : computed.display;
  wrapper.style.width = "100%";
  el.parentElement.insertBefore(wrapper, el);
  wrapper.appendChild(el);
  return wrapper;
}

function createBadge(el, rule, profile) {
  const value = profile[rule.profileKey] || "";
  const hasValue = !!value;

  const badge = document.createElement("div");
  badge.className = "topoff-badge" + (hasValue ? "" : " to-empty");

  const bolt = document.createElement("span");
  bolt.textContent = "⛽";
  bolt.style.fontSize = "10px";

  const labelEl = document.createElement("span");
  labelEl.textContent = rule.label;

  const tooltip = document.createElement("div");
  tooltip.className = "topoff-tooltip";

  const ttLabel = document.createElement("span");
  ttLabel.className = "to-tt-label";
  ttLabel.textContent = rule.label;

  const ttValue = document.createElement("span");
  ttValue.className = hasValue ? "to-tt-value" : "to-tt-empty";
  ttValue.textContent = hasValue ? value : "No value saved yet";

  const ttHint = document.createElement("span");
  ttHint.className = "to-tt-hint";
  ttHint.textContent = hasValue ? "Click to fill this field" : "Open Topoff toolbar icon to add";

  tooltip.appendChild(ttLabel);
  tooltip.appendChild(ttValue);
  tooltip.appendChild(ttHint);
  badge.appendChild(bolt);
  badge.appendChild(labelEl);
  badge.appendChild(tooltip);

  badge.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasValue) return;

    const success = fillField(el, rule, profile);
    if (success) {
      badge.classList.add("to-filled");
      bolt.textContent = "✓";
      labelEl.textContent = "Filled!";
      ttHint.textContent = "Done!";
      setTimeout(() => {
        badge.classList.remove("to-filled");
        bolt.textContent = "⛽";
        labelEl.textContent = rule.label;
        ttHint.textContent = "Click to fill this field";
      }, 2000);
    }
  });

  return badge;
}

// ============================================
// INJECT & CLEAR
// ============================================
function injectBadges(profile) {
  clearBadges();
  ensureStylesheet();
  const matches = scanForMatches();
  matches.forEach(({ el, rule }) => {
    const wrapper = wrapElement(el);
    const badge = createBadge(el, rule, profile);
    wrapper.appendChild(badge);
    injectedBadges.push({ badgeEl: badge, el, rule, wrapper });
  });
  return matches.length;
}

function clearBadges() {
  injectedBadges.forEach(({ badgeEl, el, wrapper }) => {
    badgeEl.remove();
    if (wrapper && wrapper.parentElement && el.parentElement === wrapper) {
      wrapper.parentElement.insertBefore(el, wrapper);
      wrapper.remove();
    }
  });
  injectedBadges = [];
}

// ============================================
// AUTO-INJECT ON PAGE LOAD
// Loads profile from storage and injects badges automatically.
// Retries after delays for SPA pages that render fields late.
// ============================================
const PROFILE_KEYS = [
  "linkedin", "github", "portfolio", "workAuth",
  "salary", "pronouns", "phone",
  "disability", "veteran", "ethnicity", "gender",
];

async function autoInject() {
  try {
    const profile = await browser.storage.local.get(PROFILE_KEYS);
    const hasAnyValue = PROFILE_KEYS.some((k) => profile[k]);
    if (!hasAnyValue) return; // nothing saved yet, don't clutter the page
    currentProfile = profile;
    injectBadges(profile);
  } catch (e) {}
}

// Run immediately, then retry for late-rendering SPAs
autoInject();
setTimeout(autoInject, 1500);
setTimeout(autoInject, 4000);

// ============================================
// MESSAGE LISTENER (from popup)
// ============================================
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "scanFields") {
    const matches = scanForMatches();
    const fields = matches.map(({ rule }) => ({ key: rule.profileKey, label: rule.label }));
    sendResponse({ count: matches.length, fields });
    return true;
  }

  if (message.action === "injectBadges") {
    currentProfile = message.profile || {};
    const count = injectBadges(currentProfile);
    sendResponse({ injected: count });
    return true;
  }

  if (message.action === "fillAll") {
    currentProfile = message.profile || {};
    const matches = scanForMatches();
    let filled = 0;
    matches.forEach(({ el, rule }) => {
      if (fillField(el, rule, currentProfile)) filled++;
    });
    sendResponse({ filled });
    return true;
  }

  if (message.action === "clearBadges") {
    clearBadges();
    sendResponse({ ok: true });
    return true;
  }
});
