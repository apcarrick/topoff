// Topoff — Popup Script v3

const PROFILE_KEYS = [
  "linkedin", "github", "portfolio", "workAuth",
  "salary", "pronouns", "phone",
  "disability", "veteran", "ethnicity", "gender",
];

document.addEventListener("DOMContentLoaded", async () => {
  await loadProfile();
  await runPageScan();
});

// ── Load profile from storage into form ──
async function loadProfile() {
  const saved = await browser.storage.local.get(PROFILE_KEYS);
  PROFILE_KEYS.forEach((key) => {
    const el = document.getElementById(key);
    if (!el || !saved[key]) return;
    el.value = saved[key];
  });
  return saved;
}

// ── Scan page for matched fields ──
async function runPageScan() {
  const statusEl  = document.getElementById("statusBar");
  const statusTxt = document.getElementById("statusText");
  const actionRow = document.getElementById("actionRow");
  const fieldList = document.getElementById("fieldList");

  fieldList.innerHTML = "";
  actionRow.style.display = "none";

  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const response = await browser.tabs.sendMessage(tabs[0].id, { action: "scanFields" });

    if (!response || response.count === 0) {
      statusTxt.textContent = "No matching fields found on this page.";
      statusEl.className = "status-bar";
      return;
    }

    const profile = await browser.storage.local.get(PROFILE_KEYS);

    statusTxt.textContent = `Found ${response.count} fillable field${response.count !== 1 ? "s" : ""} on this page.`;
    statusEl.className = "status-bar found";

    response.fields.forEach(({ key, label }) => {
      const value = profile[key] || "";
      const pill = document.createElement("div");
      pill.className = "field-pill " + (value ? "has-value" : "no-value");

      const labelEl = document.createElement("span");
      labelEl.className = "pill-label";
      labelEl.textContent = label;

      const valueEl = document.createElement("span");
      valueEl.className = "pill-value " + (value ? "set" : "empty");
      valueEl.textContent = value ? truncate(value, 22) : "not set";

      pill.appendChild(labelEl);
      pill.appendChild(valueEl);
      fieldList.appendChild(pill);
    });

    actionRow.style.display = "flex";
  } catch (err) {
    statusTxt.textContent = "Navigate to a job application page first.";
    statusEl.className = "status-bar";
  }
}

// ── Refresh Badges button ──
document.getElementById("injectBtn").addEventListener("click", async () => {
  const profile = await browser.storage.local.get(PROFILE_KEYS);
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const response = await browser.tabs.sendMessage(tabs[0].id, {
      action: "injectBadges",
      profile,
    });
    const statusTxt = document.getElementById("statusText");
    const statusEl  = document.getElementById("statusBar");
    if (response?.injected > 0) {
      statusTxt.textContent = `⛽ Badges refreshed on ${response.injected} field${response.injected !== 1 ? "s" : ""}.`;
      statusEl.className = "status-bar found";
    }
  } catch (err) {}
});

// ── Fill All button ──
document.getElementById("fillAllBtn").addEventListener("click", async () => {
  const profile = await browser.storage.local.get(PROFILE_KEYS);
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const response = await browser.tabs.sendMessage(tabs[0].id, {
      action: "fillAll",
      profile,
    });
    const statusTxt = document.getElementById("statusText");
    const statusEl  = document.getElementById("statusBar");
    if (response?.filled > 0) {
      statusTxt.textContent = `✓ Filled ${response.filled} field${response.filled !== 1 ? "s" : ""}.`;
      statusEl.className = "status-bar filled";
    } else {
      statusTxt.textContent = "Nothing filled — check your profile below.";
    }
  } catch (err) {}
});

// ── Save Profile ──
document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {};
  PROFILE_KEYS.forEach((key) => {
    const el = document.getElementById(key);
    data[key] = el ? el.value.trim() : "";
  });
  await browser.storage.local.set(data);

  const statusEl = document.getElementById("saveStatus");
  statusEl.textContent = "✓ Profile saved!";
  setTimeout(() => { statusEl.textContent = ""; }, 2000);

  await runPageScan();
});

// ── Util ──
function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}
